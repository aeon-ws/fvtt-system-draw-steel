import random
import re
import string
import unicodedata
from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional, Pattern, Tuple, TypedDict, Union

import yaml

# --- Type Definitions ---


# --- Shared types ---
class WeaknessData(TypedDict, total=False):
    acid: int
    cold: int
    corruption: int
    damage: int
    fire: int
    holy: int
    lightning: int
    poison: int
    psychic: int
    sonic: int


class ImmunityData(TypedDict, total=False):
    acid: int
    cold: int
    corruption: int
    damage: int
    fire: int
    holy: int
    lightning: int
    poison: int
    psychic: int
    sonic: int


class Characteristics(TypedDict):
    might: int
    agility: int
    reason: int
    intuition: int
    presence: int


class StaminaData(TypedDict, total=False):
    max: int
    perMinion: Optional[int]
    value: Optional[int]


# --- Ability effect and power roll types ---
class EffectData(TypedDict, total=False):
    text: str
    targets: str
    duration: Optional[Literal["endOfTargetTurn", "saveEnds", "endOfEncounter"]]
    slowed: bool
    weakened: bool
    frightened: bool
    bleeding: bool
    grabbed: bool
    taunted: bool
    restrained: bool
    weakness: Optional[Dict[str, int]]


class PotencyEffectData(TypedDict, total=False):
    targetCharacteristic: Literal["might", "agility", "reason", "intuition", "presence"]
    value: int
    effects: EffectData


class PowerRollTier(TypedDict, total=False):
    damage: Optional[int]
    effect: Optional[EffectData]
    potencyEffect: Optional[PotencyEffectData]


class PowerRoll(TypedDict, total=False):
    bonus: Optional[int]
    tier1: Optional[PowerRollTier]
    tier2: Optional[PowerRollTier]
    tier3: Optional[PowerRollTier]


class AbilityTargetData(TypedDict, total=False):
    filter: Optional[str]
    text: str
    count: Union[int, Literal["all"]]


class AbilityModel(TypedDict, total=False):
    name: str
    type: Literal[
        "mainAction",
        "triggeredAction",
        "freeTriggeredAction",
        "freeMainAction",
        "maneuver",
        "freeManeuver",
        "villainAction",
    ]
    maliceCost: Optional[int]
    powerRoll: Optional[PowerRoll]
    keywords: List[str]
    distance: Optional[str]
    target: Optional[AbilityTargetData]
    trigger: Optional[str]
    prePowerRollEffect: Optional[EffectData]
    postPowerRollEffect: Optional[EffectData]
    header_raw: str


class CharacteristicsData(TypedDict):
    might: int
    agility: int
    reason: int
    intuition: int
    presence: int


class AppliedCaptainEffects(TypedDict, total=False):
    temporaryStamina: Optional[int]


class DerivedCaptainBonuses(TypedDict, total=False):
    speed: Optional[int]
    meleeDistanceBonus: Optional[int]
    rangedDistanceBonus: Optional[int]
    strikeDamage: Optional[int]
    strikeEdge: Optional[int]


class MonsterModel(TypedDict, total=False):
    name: str
    level: int
    type: str
    role: Optional[str]
    header_text: str
    keywords: List[str]
    encounterValue: int
    stamina: int
    speed: int
    movementTypes: List[str]
    size: str
    stability: int
    freeStrikeDamage: int
    characteristics: CharacteristicsData
    weakness: Optional[Dict[str, int]]
    immunity: Optional[Dict[str, int]]
    derivedCaptainBonuses: Optional[DerivedCaptainBonuses]
    appliedCaptainEffects: Optional[AppliedCaptainEffects]
    items: List[AbilityModel]  # List of abilities/traits


@dataclass
class MonsterHeader:
    name: str
    level: int
    type: str
    role: Optional[str]
    header_source_line: str
    start_line_index: int
    end_line_index: int


@dataclass
class MonsterBlock:
    header: MonsterHeader
    source_lines: List[str]
    raw_text: str


# --- Constants and Whitelists ---

# --- Markers and Patterns ---
PAGE_LEFT_MARKER = re.compile(r"--- Page \d+ left ---", re.IGNORECASE)
PAGE_RIGHT_MARKER = re.compile(r"--- Page \d+ right ---", re.IGNORECASE)
PAGE_MARKER = re.compile(r"--- Page \d+ (left|right) ---", re.IGNORECASE)
FOOTER_PATTERNS = [
    r"The Delian Tomb.*MCDM Productions",
    r"delian tomb",
    r"mcdm productions",
]
FOOTER_RE = re.compile("|".join(FOOTER_PATTERNS), re.IGNORECASE)

# Add encounter/narrative delimiters here:
NOISE_HEADERS = {
    "ENCOUNTER D4",
    # Add others as needed (case-insensitive)
}

# Ability types as per your rules.
ABILITY_TYPE_MAP = {
    "action": "mainAction",
    "main action": "mainAction",
    "free action": "freeMainAction",
    "maneuver": "maneuver",
    "free maneuver": "freeManeuver",
    "triggered action": "triggeredAction",
    "free triggered action": "freeTriggeredAction",
    "villain action 1": "villainAction",
    "villain action 2": "villainAction",
    "villain action 3": "villainAction",
}

# Matches "Maneuver", "Action", "Triggered Action", "Villain Action", with or without "Free"
ABILITY_TYPE_PATTERN = r"[(](?P<type>(?:Free )?(?:Triggered Action|Maneuver|Villain Action ?[123]?|(?:Main )?Action))[)]\s*"

# Matches "2d10 + 2", "2D10 +2", etc. (OCR can garble spaces, so allow optional space)
OPTIONAL_POWER_ROLL_PATTERN = r"(?:2[Dd]1[0oO]\s*\+\s*(?P<bonus>[-+]?\d)\s*)?"

# Matches various dividers: anything that's not a letter/number, up to 2 chars, possibly multiple times
DIVIDER = r"[^A-Za-z0-9]{0,2}"

DAMAGE_TYPES = {
    "acid",
    "cold",
    "corruption",
    "damage",
    "fire",
    "holy",
    "lightning",
    "poison",
    "psychic",
    "sonic",
}
DAMAGE_TYPE_PATTERN = "|".join([rf"{r}" for r in DAMAGE_TYPES])

# Matches malice cost, e.g., "2 Malice" or "Signature"
OPTIONAL_COST_PATTERN = r"(?:(?:\s?.?\s?(?P<malice>1?\d)\s*Malice|Signature)\s*)?"

ABILITY_NAME_PATTERN = r"(?P<name>[A-Za-z][A-Za-z!? ]+[A-Za-z!?])\s*"

ABILITY_HEADER_REGEX = re.compile(
    rf"^{ABILITY_NAME_PATTERN}{ABILITY_TYPE_PATTERN}{OPTIONAL_POWER_ROLL_PATTERN}{OPTIONAL_COST_PATTERN}$"
)
# + 11 2 corruption damage A<0 restrained (save ends)

EFFECT_DURATION_PATTERN = r"(?:save ends|end of target turn|end of targets turn|end of target.?s turn|end of (?:the )?encounter|EoE|EoT|end of \w+ next turn|start of \w+ next turn)"
POWER_ROLL_EFFECT_KEYWORDS = rf"(?:prone(?:(?:and )?can[' ]?t stand)?|slowed|weakened|frightened|bleeding|grabbed|taunted|restrained|speed|shift\s?[1-9]?|move|push\s?[1-9]?|pull\s?[1-9]?|slide\s?[1-9]?|fly|hover|teleport\s?[1-9]?|stand up|recovery|immunity|weakness|temporary stamina|{EFFECT_DURATION_PATTERN})"
POWER_ROLL_RANGE_PATTERN = r"[^1l!]*(11|12.16|17[4]?[+]?).?\s*"
POWER_ROLL_DAMAGE_TYPE_PATTERN = rf"(?P<damageType>{DAMAGE_TYPE_PATTERN})?"
# DAMAGE_PATTERN = rf"(?:[^0-9]?(?P<damage>[1-9][0-9]?)\s*[^0-9]?{POWER_ROLL_DAMAGE_TYPE_PATTERN}[^0-9]?\s*damage;?\s*)?"
DAMAGE_PATTERN = rf"[^0-9]?(?P<damage>[1-9][0-9]?)\s*[^0-9]?{POWER_ROLL_DAMAGE_TYPE_PATTERN}[^0-9]?\s*damage;?\s*"

# POWER_ROLL_EFFECT_PATTERN = rf"(?:[^A-Za-z]*(?P<effectText>[A-Za-z0-9 ,.-]+{POWER_ROLL_EFFECT_KEYWORDS}[A-Za-z0-9 ,.-]*(?:[(](?P<effectDuration>{EFFECT_DURATION_PATTERN})?[)])?).*)?"
POWER_ROLL_EFFECT_PATTERN = rf"[^A-Za-z]*(?P<effectText>[A-Za-z0-9 ,.-]+{POWER_ROLL_EFFECT_KEYWORDS}[A-Za-z0-9 ,.-]*(?:[(](?P<effectDuration>{EFFECT_DURATION_PATTERN})?[)])?).*"
# POWER_ROLL_POTENCY_EFFECT_PATTERN = rf"(?:[^MARIPmarip]*(?P<potencyTargetCharacteristic>[MARIPmarip])<(?P<potencyValue>[0-6])[^A-Za-z0-9]*(?P<potencyEffectText>(?P<potencyEffect>[A-Za-z0-9 ,.-]+)\s*(?:[(](?P<potencyEffectDuration>{EFFECT_DURATION_PATTERN})[)])?))?"
POWER_ROLL_POTENCY_EFFECT_PATTERN = rf"[^MARIPmarip]*(?P<potencyTargetCharacteristic>[MARIPmarip])<(?P<potencyValue>[0-6])[^A-Za-z0-9]*(?P<potencyEffectText>(?P<potencyEffect>[A-Za-z0-9 ,.-]+)\s*(?:[(](?P<potencyEffectDuration>{EFFECT_DURATION_PATTERN})[)])?)"

POWER_ROLL_LINE_PATTERN = re.compile(
    rf"^{POWER_ROLL_RANGE_PATTERN}{DAMAGE_PATTERN}{POWER_ROLL_EFFECT_PATTERN}{POWER_ROLL_POTENCY_EFFECT_PATTERN}.*$",
    re.IGNORECASE,
)
POWER_ROLL_LINE_PATTERN_BY_TYPE = {
    "damage": re.compile(
        rf"^{POWER_ROLL_RANGE_PATTERN}{DAMAGE_PATTERN}.*$", re.IGNORECASE
    ),
    "effect": re.compile(
        rf"^{POWER_ROLL_RANGE_PATTERN}{POWER_ROLL_EFFECT_PATTERN}.*$", re.IGNORECASE
    ),
    "potencyEffect": re.compile(
        rf"^{POWER_ROLL_RANGE_PATTERN}{POWER_ROLL_POTENCY_EFFECT_PATTERN}.*$",
        re.IGNORECASE,
    ),
    "damageAndEffect": re.compile(
        rf"^{POWER_ROLL_RANGE_PATTERN}{DAMAGE_PATTERN}{POWER_ROLL_EFFECT_PATTERN}.*$",
        re.IGNORECASE,
    ),
    "damageAndPotencyEffect": re.compile(
        rf"^{POWER_ROLL_RANGE_PATTERN}{DAMAGE_PATTERN}{POWER_ROLL_POTENCY_EFFECT_PATTERN}.*$",
        re.IGNORECASE,
    ),
    "effectAndPotencyEffect": re.compile(
        rf"^{POWER_ROLL_RANGE_PATTERN}{POWER_ROLL_EFFECT_PATTERN}{POWER_ROLL_POTENCY_EFFECT_PATTERN}.*$",
        re.IGNORECASE,
    ),
    "all": re.compile(
        rf"^{POWER_ROLL_RANGE_PATTERN}{DAMAGE_PATTERN}{POWER_ROLL_EFFECT_PATTERN}{POWER_ROLL_POTENCY_EFFECT_PATTERN}.*$",
        re.IGNORECASE,
    ),
}

MONSTER_TYPE_WHITELIST = ["minion", "horde", "platoon", "elite", "leader", "solo"]
MONSTER_ROLE_WHITELIST = [
    "ambusher",
    "artillery",
    "brute",
    "controller",
    "defender",
    "harrier",
    "hexer",
    "mount",
    "support",
    "skirmisher",
]
MONSTER_TYPE_PATTERN = "|".join([rf"\b{t}\b" for t in MONSTER_TYPE_WHITELIST])
MONSTER_ROLE_PATTERN = "|".join([rf"\b{r}\b" for r in MONSTER_ROLE_WHITELIST])

MONSTER_KEYWORD_WHITELIST = set(
    [
        "Abyssal",
        "Accursed",
        "Animal",
        "Beast",
        "Construct",
        "Dragon",
        "Elemental",
        "Fey",
        "Giant",
        "Horror",
        "Humanoid",
        "Infernal",
        "Plant",
        "Swarm",
        "Undead",
        "Mystic Goblin",
        "Goblin",
        "Ruinborn",
        "Bugbear",
        "Werebeast",
        "Water Wolf",
        "Rival",
        "Arixx",
        "Human",
        "Dwarf",
        "Polder",
        "Ooze",
        "Angulotl",
        "Ankheg",
        "Basilisk",
        "Bredbeddle",
        "Chimera",
        "Demon",
        "Soulraker",
        "Devil",
        "Planar",
        "Draconian",
        "High Elf",
        "Shadow Elf",
        "Wode Elf",
        "Fire Giant",
        "Frost Giant",
        "Storm Giant",
        "Stone Giant",
        "Hill Giant",
        "Gnoll",
        "Griffon",
        "Hag",
        "Hobgoblin",
        "Worm",
        "Kobold",
        "Lightbender",
        "Lizardfolk",
        "Manticore",
        "Medusa",
        "Minotaur",
        "Ogre",
        "Orc",
        "Olothec",
        "Radenwight",
        "Shambling Mound",
        "Time Raider",
        "Troll",
        "Mummy",
        "Vampire",
        "Corporeal",
        "Incorporeal",
        "Multivok",
        "Valok",
        "Servok",
        "Voiceless Talker",
        "War Dog",
        "Wyvern",
        "Overmind",
        "Eyestalk",
    ]
)

# Regex for common OCR errors in "level"
MONSTER_LEVEL_PATTERN = (
    r"L[e3][vvu][e1il|1lt]+"  # Removed (?i) – will use re.IGNORECASE on compile
)

# Known OCR fixup map
NAME_FIXUPS = {
    "_BUGBEAR COMMANDER": "BUGBEAR COMMANDER",
    "MOoHLER": "MOHLER",
    "Lacsi": "LAESI",
    "BopporrF BUCKFEATHER": "BODDORFF BUCKFEATHER",
    "iImit Putty": "IMIT PUTTY",
    "Memoriat Ivy": "MEMORIAL IVY",
    "MVURKOR": "VURKOR",
    "WorRG": "WORG",
    # Add more as found
}

MINOR_WORDS = {"of", "the", "in", "on", "for", "and", "or", "to", "a"}

ABILITY_HEADER_PATTERNS = [
    # Main/Free Action
    r"\b(.+?)\s*\((?:Free\s*)?(?:Main\s*)?Action\).*",
    r"\b(.+?)\s*\((?:Free\s*)?Action\).*",
    # Maneuver
    r"\b(.+?)\s*\((?:Free\s*)?Maneuver\).*",
    # Triggered Action
    r"\b(.+?)\s*\((?:Free\s*)?Triggered Action\).*",
    # Villain Action
    r"\b(.+?)\s*\(Villain Action\s*\d+\).*",
    # Others as needed
]


def generate_id():
    # 16 char random hex
    return "".join(random.choices(string.ascii_letters + string.digits, k=16))


def is_noise_header(line: str) -> bool:
    return line.strip().upper() in (h.upper() for h in NOISE_HEADERS)


def normalize_keywords(keywords: List[str]) -> List[str]:
    fixed: list[str] = []
    for k in keywords:
        k = sanitize_name(k)
        if k.lower() == "human rival":
            fixed.extend(["Human", "Rival"])
        else:
            fixed.append(title_case(k))
    return fixed


def parse_keywords_and_ev(lines: list[str]) -> tuple[list[str], int]:
    """
    Extracts keywords (from before 'EV') and encounter value ('EV <number>').
    Handles glued 'EV' to keyword (e.g., 'Undead EV 3'), missing comma, etc.
    """
    for line in lines[:6]:
        m = re.search(r"\bEV\s*[:\-]?\s*([0-9Oo]+)", line, re.IGNORECASE)
        if m:
            encounter_value = int(m.group(1).replace("O", "0").replace("o", "0"))
            # Take everything before 'EV' as keywords
            left = line.split(m.group(0), 1)[0]
            # Split keywords by comma or just by space if only one
            candidates = [k.strip() for k in re.split(r"[,/]", left) if k.strip()]
            # Normalize and filter against whitelist
            normalized: list[str] = []
            for c in candidates:
                tc = title_case(sanitize_name(c))
                if tc in MONSTER_KEYWORD_WHITELIST:
                    normalized.append(tc)
                # Handle "Human Rival" as special case
                elif tc.lower() == "human rival":
                    normalized.extend(["Human", "Rival"])
                elif tc.lower() == "angutotl":
                    normalized.append("Angulotl")
                else:
                    print(f"UNKNOWN KEYWORD: {tc}")
            return normalized, encounter_value
    # Fallback: if not found
    raise ValueError(
        "Encounter Value (EV) not found in the provided lines. "
        "Ensure the first 6 lines contain 'EV <number>'"
    )


def title_case(any_case_value: str) -> str:
    words = any_case_value.split()
    result: list[str] = []
    for i, word in enumerate(words):
        word_as_lower_case = word.lower()
        if i == 0 or word_as_lower_case not in MINOR_WORDS:
            result.append(word.capitalize())
        else:
            result.append(word_as_lower_case)
    return " ".join(result)


def sanitize_name(raw_name: str) -> str:
    raw_name = re.sub(r"^[^A-Za-z0-9]+", "", raw_name)  # Strip leading non-alphanum
    raw_name = raw_name.strip()
    return NAME_FIXUPS.get(raw_name, raw_name)


def normalize_header_fields(header: MonsterHeader) -> MonsterHeader:
    name = title_case(sanitize_name(header.name))
    type_ = title_case(header.type)
    role = title_case(header.role) if header.role else None
    return MonsterHeader(
        name=name,
        level=header.level,
        type=type_,
        role=role,
        header_source_line=header.header_source_line,
        start_line_index=header.start_line_index,
        end_line_index=header.end_line_index,
    )


def normalize_string(raw_value: str) -> str:
    # Unicode normalize, replace curly quotes, collapse whitespace
    normalized_value = unicodedata.normalize("NFKC", raw_value)
    apostrophe_normalized_value = re.sub(
        r"[‘’“”´`]", "'", normalized_value
    )  # curly/smart quotes to ascii
    blankspace_and_apostrophe_normalized_value = re.sub(
        r"\s+", " ", apostrophe_normalized_value
    )
    return blankspace_and_apostrophe_normalized_value.strip()


def ocr_level_to_int(lvl_str: str) -> Optional[int]:
    # Extract integer, correcting O/0 confusion
    lvl_str = lvl_str.replace("O", "0")
    m = re.search(r"(\d+)", lvl_str)
    if m:
        return int(m.group(1))
    return None


# --- Header Regex Builder ---


def get_header_regex() -> Pattern[str]:
    type_join = "|".join(MONSTER_TYPE_WHITELIST)
    role_join = "|".join(MONSTER_ROLE_WHITELIST)
    level_variants = r"(LEVEL|LEVE1|LEVEI|LEVET|LEVELT|LEvEL|LeveL|Levet|Leve1|LeveI)"
    # Accept nearly anything for name, until we hit LEVEL variant (non-greedy)
    header_pattern = (
        r"^\W*"  # Leading junk/punct
        r"(?P<name>.+?)"  # Name, as loose as possible
        r"\W*"
        r"{lvl}"  # LEVEL (or variant)
        r"\W*"
        r"(?P<level>\d+)"  # The number
        r"\W*"
        r"(?P<type>{type})"  # Type, required
        r"(?:\W*(?P<role>{role}))?"  # Optional role
        r"\W*[_l]?\W*$"  # Allow trailing "_", "l", or other junk
    ).format(lvl=level_variants, type=type_join, role=role_join)
    return re.compile(header_pattern, re.IGNORECASE)


def fix_ocr_name(name: str) -> str:
    # Fix known common OCR errors, expand as needed
    fixes = {
        "GoBun": "Goblin",
        "GoBLIN": "Goblin",
        "GOBUN": "GOBLIN",
        # add more as you find them!
    }
    for bad, good in fixes.items():
        if bad in name:
            return name.replace(bad, good)
    return name


# --- Candidate Line Finding ---


def get_header_candidates(lines: List[str]) -> List[Tuple[int, str]]:
    candidates: List[Tuple[int, str]] = []
    for line_index, line in enumerate(lines):
        normalized_line = normalize_string(line)
        # Must contain an OCR'd LEVEL, a known type, and a number close to LEVEL (avoid prose)
        if (
            re.search(r"L[EV1I]{2,4}", normalized_line, re.IGNORECASE)
            and re.search(r"\d", normalized_line)
            and any(
                t in normalized_line.upper()
                for t in [t.upper() for t in MONSTER_TYPE_WHITELIST]
            )
            and not re.search(r"malice", normalized_line, re.IGNORECASE)
        ):
            candidates.append((line_index, normalized_line))
    return candidates


# --- Header Parsing Core ---


def parse_header_line(source_line: str) -> Optional[Dict[str, Any]]:
    header_regex = get_header_regex()
    header_matches = header_regex.search(source_line)
    if not header_matches:
        return None
    header_group_matches = header_matches.groupdict()
    name = fix_ocr_name(header_group_matches.get("name", "").strip(" |:-"))
    type = header_group_matches.get("type")
    role = header_group_matches.get("role")
    level = ocr_level_to_int(header_group_matches.get("level", ""))
    # Filter per rules: if type is solo/leader, role must not be present
    if type and type.lower() in {"solo", "leader"}:
        role = None
    # Role must be last or nearly last (not followed by extra tokens except punctuation)
    # (This is already enforced by regex $ anchor and trailing junk)
    return dict(name=name, type=type, role=role, level=level)


# --- Main Header Detection Function ---


def get_monster_headers_from_source_lines(
    source_lines: List[str],
) -> List[MonsterHeader]:
    monster_headers: List[MonsterHeader] = []
    monster_header_candidates = get_header_candidates(source_lines)
    for source_line_index, source_line in monster_header_candidates:
        parsed_line = parse_header_line(source_line)
        if (
            parsed_line
            and parsed_line["name"]
            and parsed_line["type"]
            and parsed_line["level"] is not None
        ):
            monster_header = MonsterHeader(
                name=parsed_line["name"],
                level=parsed_line["level"],
                type=str(parsed_line["type"]).capitalize(),
                role=str(
                    (parsed_line["role"]).capitalize() if parsed_line["role"] else None
                ),
                header_source_line=source_line,
                start_line_index=source_line_index,
                end_line_index=source_line_index,  # may be adjusted for multi-line headers in future
            )
            monster_headers.append(monster_header)

    monster_headers = [normalize_header_fields(h) for h in monster_headers]

    return monster_headers


def parse_keywords_and_ev_row(block_lines: List[str]) -> Tuple[List[str], int]:
    keywords, encounter_value = parse_keywords_and_ev(block_lines)
    keywords = normalize_keywords(keywords)
    return keywords, encounter_value


def parse_stamina(lines: List[str]) -> int:
    for line in lines:
        m = re.search(r"\bStamina\s+([0-9O]+)", line, re.IGNORECASE)
        if m:
            value = m.group(1).replace("O", "0")
            return int(value)
    raise ValueError("Stamina not found in the provided lines.")


def parse_speed_and_movement_types(
    source_lines: List[str],
) -> tuple[int, List[str]]:
    for source_line in source_lines:
        speed_and_movement_type_matches = re.search(
            r"\bSpeed\s+([0-9O]+)\s*(?:\(([^)]+)\))?", source_line, re.IGNORECASE
        )
        if speed_and_movement_type_matches:
            speed = speed_and_movement_type_matches.group(1).replace("O", "0")
            movement_types = (
                [
                    x.strip().lower()
                    for x in speed_and_movement_type_matches.group(2).split(",")
                ]
                if speed_and_movement_type_matches.group(2)
                else ["walk"]
            )
            return int(speed), movement_types
    raise ValueError(
        f"Speed and/or movement types not found in the provided lines: {source_lines}"
    )


def parse_size_and_stability(
    source_lines: List[str],
) -> tuple[str, int]:
    for source_line in source_lines:
        size_and_stability_matches = re.search(
            r"\bSize\s+(\w+)\s*/\s*Stability\s*([0-9O]+)", source_line, re.IGNORECASE
        )
        if size_and_stability_matches:
            size = size_and_stability_matches.group(1)
            stability = int(size_and_stability_matches.group(2).replace("O", "0"))
            return size, stability
    raise ValueError(
        f"Size and/or stability not found in the provided lines: {source_lines}"
    )


def parse_free_strike(source_lines: List[str]) -> int:
    for source_line in source_lines:
        free_strike_matches = re.search(
            r"\bFree Strike\s*([0-9O]+)", source_line, re.IGNORECASE
        )
        if free_strike_matches:
            free_strike = free_strike_matches.group(1).replace("O", "0")
            return int(free_strike)
    raise ValueError(f"Free Strike not found in the provided lines: {source_lines}")


def get_characteristic_value(characteristics: list[tuple[str, str]], name: str) -> int:
    for name, value in characteristics:
        if name.lower() == name.lower():
            return int(str(value).upper().replace("O", "0"))

    raise ValueError(
        f"Characteristic '{name}' not found in the provided characteristics dict: {characteristics}"
    )


def parse_characteristics(source_lines: List[str]) -> CharacteristicsData:
    for source_line in source_lines:
        characteristic_matches = re.findall(
            r"(Might|Agility|Reason|Intuition|Presence)\s*([+\-]?[0-9O]+)",
            source_line,
            re.IGNORECASE,
        )
        if characteristic_matches and len(characteristic_matches) == 5:
            return CharacteristicsData(
                {
                    "might": get_characteristic_value(characteristic_matches, "might"),
                    "agility": get_characteristic_value(
                        characteristic_matches, "agility"
                    ),
                    "reason": get_characteristic_value(
                        characteristic_matches, "reason"
                    ),
                    "intuition": get_characteristic_value(
                        characteristic_matches, "intuition"
                    ),
                    "presence": get_characteristic_value(
                        characteristic_matches, "presence"
                    ),
                }
            )

    raise ValueError(f"Characteristics not found in the provided lines: {source_lines}")


def parse_with_captain(
    source_lines: list[str],
) -> tuple[AppliedCaptainEffects | None, DerivedCaptainBonuses | None]:
    """
    Returns a dict with the derived captain bonus or effect from the 'With Captain' line.
    Handles all known variants, including 'temporary stamina'.
    """
    captain_bonus_map = {
        "speed": "speed",
        "ranged distance": "rangedDistanceBonus",
        "melee distance": "meleeDistanceBonus",
        "strike damage": "strikeDamage",
        "strike edge": "strikeEdge",
        "edge on strikes": "edgeOnStrikes",
    }
    stat_and_metadata_section_end_index = next(
        (
            line_index
            for line_index, source_line in enumerate(source_lines)
            if all(
                source_line_element in source_line.lower()
                for source_line_element in [
                    "might",
                    "agility",
                    "reason",
                    "intuition",
                    "presence",
                ]
            )
        ),
        len(source_lines),
    )
    for source_line in source_lines[: stat_and_metadata_section_end_index + 1]:
        m = re.search(r"with captain\s*(.+)", source_line, re.IGNORECASE)
        if m:
            rest = m.group(1).strip().lower()
            # Check for "temporary stamina" in any order
            temp_stam = re.search(
                r"(\d+)\s+temporary stamina|temporary stamina\s+(\d+)",
                rest,
                re.IGNORECASE,
            )
            if temp_stam:
                value = int(temp_stam.group(1) or temp_stam.group(2))
                return (
                    AppliedCaptainEffects({"temporaryStamina": value}),
                    None,
                )
            # Try all other bonus types
            for key, field_name in captain_bonus_map.items():
                if key in rest:
                    mval = re.search(r"([+\-]?\d+)", rest)
                    if mval:
                        derivedCaptainBonuses: DerivedCaptainBonuses = {}
                        derivedCaptainBonuses[field_name] = int(mval.group(1))
                        return (None, derivedCaptainBonuses)

    raise ValueError(f"Captain bonuses not found in the provided lines: {source_lines}")


def find_last_stat_index(source_lines: list[str]) -> int:
    for source_line_index, source_line in enumerate(source_lines):
        # Look for a line containing all 5 characteristic names (order doesn’t matter)
        characteristic_fields = ["might", "agility", "reason", "intuition", "presence"]
        characteristics_line_found = all(
            characteristic_field in source_line.lower()
            for characteristic_field in characteristic_fields
        )
        if characteristics_line_found:
            return source_line_index
    return len(source_lines)  # fallback: parse all


def normalize_weakness_immunity_type(s: str) -> str:
    # Replace all O/o/0 with 0, then map to canonical name
    cleaned = s.strip().lower().replace("o", "0").replace("O", "0")
    # Known types, mapping zero-variants to canonical
    mapping = {
        "acid": "acid",
        "cold": "cold",
        "c0rrupti0n": "corruption",
        "corruption": "corruption",
        "damage": "damage",
        "fire": "fire",
        "h0ly": "holy",
        "holy": "holy",
        "lightning": "lightning",
        "p0is0n": "poison",
        "poison": "poison",
        "psychic": "psychic",
        "s0nic": "sonic",
        "sonic": "sonic",
    }
    return mapping.get(cleaned, cleaned)


def parse_weakness_immunity(
    source_lines: list[str],
) -> tuple[dict[str, int] | None, dict[str, int] | None]:
    stat_end_index = find_last_stat_index(source_lines)
    source_lines = source_lines[
        : stat_end_index + 1
    ]  # Only parse the metadata/stat section
    weakness: dict[str, int] = {}
    immunity: dict[str, int] = {}
    for source_line in source_lines:
        source_line = source_line.replace("O", "0").replace("o", "0")
        for field in re.finditer(
            r"(Immunity|Weakness)\s+([^/|]+)", source_line, re.IGNORECASE
        ):
            label = field.group(1).lower()
            entries = field.group(2)
            for entry in entries.split(","):
                entry = entry.strip()
                tokens = entry.split()
                if len(tokens) == 2:
                    damage_type, immunity_or_weakness_value = tokens
                else:
                    continue
                normalized_damage_type = normalize_weakness_immunity_type(damage_type)
                if normalized_damage_type in DAMAGE_TYPES:
                    try:
                        if label == "immunity":
                            immunity[normalized_damage_type] = int(
                                immunity_or_weakness_value
                            )
                        else:
                            weakness[normalized_damage_type] = int(
                                immunity_or_weakness_value
                            )
                    except Exception:
                        continue
                else:
                    print(
                        f"Unknown Weakness/Immunity type: {damage_type!r} normalized as {normalized_damage_type!r} in entry: {entry!r}"
                    )
    return (weakness or None, immunity or None)


def find_characteristics_line(lines):
    for i, line in enumerate(lines):
        if re.search(r"Might\s*[-+0-9O]+", line, re.IGNORECASE) and re.search(
            r"Agility\s*[-+0-9O]+", line, re.IGNORECASE
        ):
            return i
    # Extra diagnostic:
    print("[ERROR] Primary characteristics line not found in block. Lines were:")
    for idx, l in enumerate(lines):
        print(f"{idx:02}: {l.strip()}")
    raise ValueError("Primary characteristics line not found in block!")


def get_monster_model_from_block(monster_block: MonsterBlock) -> MonsterModel:
    monster_model: MonsterModel = {
        "name": monster_block.header.name,
        "level": monster_block.header.level,
        "type": monster_block.header.type,
        "role": monster_block.header.role,
        "header_text": monster_block.header.header_source_line,
        "keywords": [],  # Fill from parse_monster_row2
        "encounterValue": 0,
        "stamina": 0,
        "speed": 0,
        "movementTypes": [],
        "size": "",
        "stability": 0,
        "freeStrikeDamage": parse_free_strike(monster_block.source_lines),
        "characteristics": parse_characteristics(monster_block.source_lines),
        "weakness": None,
        "immunity": None,
        "derivedCaptainBonuses": None,
        "appliedCaptainEffects": None,
        "items": [],
    }

    monster_model["keywords"], monster_model["encounterValue"] = (
        parse_keywords_and_ev_row(monster_block.source_lines)
    )
    monster_model["stamina"] = parse_stamina(monster_block.source_lines)
    monster_model["speed"], monster_model["movementTypes"] = (
        parse_speed_and_movement_types(monster_block.source_lines)
    )
    monster_model["size"], monster_model["stability"] = parse_size_and_stability(
        monster_block.source_lines
    )

    # Optional fields:
    monster_model["weakness"], monster_model["immunity"] = parse_weakness_immunity(
        monster_block.source_lines
    )
    if monster_block.header.type.lower() == "minion":
        captain_result = parse_with_captain(monster_block.source_lines)
        if captain_result:
            monster_model["appliedCaptainEffects"] = captain_result[0]
            monster_model["derivedCaptainBonuses"] = captain_result[1]

    # Find characteristic line
    characteristics_line_index = find_characteristics_line(monster_block.source_lines)
    first_ability_source_lines = monster_block.source_lines[
        characteristics_line_index + 1 :
    ]
    ability_blocks = split_ability_blocks(first_ability_source_lines)
    # print(f"--- Found {len(ability_blocks)} ability blocks.")
    for ability_block in ability_blocks:
        if not ability_block:
            print(
                f"[WARN] [{monster_block.header.name}]: Empty ability block found, skipping."
            )
            continue
        parsed_ability = parse_ability_block(ability_block, monster_block.header.name)
        monster_model["items"].append(parsed_ability)

    # print(monster_model)
    return monster_model


def group_source_lines_into_monsters_blocks(
    source_lines: List[str], headers: List[MonsterHeader]
) -> List[MonsterBlock]:
    blocks: List[MonsterBlock] = []
    header_indices = [h.start_line_index for h in headers]
    num_lines = len(source_lines)
    header_line_set = set(header_indices)
    for i, header in enumerate(headers):
        start = header.start_line_index + 1
        end = num_lines
        j = start
        while j < num_lines:
            # 1. Next detected monster header
            if j in header_line_set and j != header.start_line_index:
                end = j
                break
            # 2. New page (always stop at next left marker)
            if PAGE_LEFT_MARKER.match(source_lines[j]):
                end = j
                break
            # 3. Explicit noise header (e.g., ENCOUNTER D4)
            if is_noise_header(source_lines[j]):
                end = j
                break
            j += 1

        # Remove footers and all page/column markers from output
        block_lines = [
            source_line
            for source_line in source_lines[start:end]
            if not FOOTER_RE.search(source_line) and not PAGE_MARKER.match(source_line)
        ]
        raw_text = "".join(block_lines)
        blocks.append(
            MonsterBlock(header=header, source_lines=block_lines, raw_text=raw_text)
        )
    return blocks


def join_broken_headers(lines: List[str]) -> List[str]:
    """Joins lines where an ability header is broken across two lines."""
    joined = []
    buffer = ""
    for line in lines:
        test = buffer + " " + line if buffer else line
        if any(re.search(pat, test, re.IGNORECASE) for pat in ABILITY_HEADER_PATTERNS):
            joined.append(test.strip())
            buffer = ""
        elif any(
            re.search(pat, line, re.IGNORECASE) for pat in ABILITY_HEADER_PATTERNS
        ):
            joined.append(line.strip())
            buffer = ""
        else:
            if buffer:
                buffer += " " + line.strip()
            else:
                buffer = line.strip()
    if buffer:
        joined.append(buffer)
    return joined


def find_ability_headers(source_lines: List[str]) -> List[Tuple[int, str]]:
    """Return (idx, header_line) for every ability header."""
    headers = []
    for idx, line in enumerate(source_lines):
        if any(re.search(pat, line, re.IGNORECASE) for pat in ABILITY_HEADER_PATTERNS):
            headers.append((idx, line))
    return headers


def split_ability_blocks(lines: list[str]) -> list[list[str]]:
    """Splits the text into ability blocks based on header detection—never merges separate headers."""
    blocks = []
    current_block = []

    # Preprocess: flatten lines and strip
    flat_lines = [l.strip() for l in lines if l.strip()]

    for line in flat_lines:
        # Search for ability header pattern anywhere in the line
        header_found = False
        for pat in ABILITY_HEADER_PATTERNS:
            m = re.search(pat, line, re.IGNORECASE)
            if m:
                header_found = True
                # If current_block has content, flush it (it belongs to previous ability)
                if current_block:
                    blocks.append(current_block)
                # If the header is not at the very start, split line
                if m.start() > 0:
                    before = line[: m.start()].strip()
                    after = line[m.start() :].strip()
                    # Usually, anything before is junk or previous block content—ignore or flag
                    # (If you want to print for review: print(f"Orphan pre-header content: '{before}'"))
                    current_block = [after]
                else:
                    current_block = [line]
                break
        if not header_found:
            # Not a header, so add to current block
            if current_block:
                current_block.append(line)
            else:
                # Junk before first header—flag for review
                print(f"[DEBUG] Ignoring orphaned non-header line: '{line}'")
    # Flush last block
    if current_block:
        blocks.append(current_block)
    return blocks


def parse_effect_data(effect_source_line: str) -> EffectData:
    # text: str
    # targets: str
    # duration: Optional[Literal["endOfTargetTurn", "saveEnds", "endOfEncounter"]]
    # slowed: bool
    # weakened: bool
    # frightened: bool
    # bleeding: bool
    # grabbed: bool
    # taunted: bool
    # restrained: bool
    # weakness: Optional[Dict[str, int]]
    return EffectData()


def parse_distance_and_target_row(source_line: str) -> Optional[Tuple[str, str]]:
    return None


def parse_power_roll_block(
    header: dict[str, Any], ability_lines: List[str]
) -> PowerRoll | None:
    powerRollBonus: int | None = header["powerRollBonus"]
    if powerRollBonus is None:
        return None

    power_roll_lines: List[str] = []

    for line in ability_lines:
        line = line.strip()
        if re.match(r"^[^1l!]{0,9}([1l!]{2}|[1l!]2.16|[1l!]7).", line):
            power_roll_lines.append(line)

    if not power_roll_lines:
        print(
            f"  [WARN] [{header['name']}]: No power roll lines found in ability block: {ability_lines}"
        )
        return None
    if len(power_roll_lines) < 3:
        print(
            f"  [WARN] [{header['name']}]: Less than 3 power roll lines found: {power_roll_lines}"
            f"\n   Normalized as: {ability_lines}"
        )
        return None

    return PowerRoll(
        bonus=powerRollBonus,
        tier1=parse_power_roll_line(power_roll_lines.pop(0)),
        tier2=parse_power_roll_line(power_roll_lines.pop(0)),
        tier3=parse_power_roll_line(power_roll_lines.pop(0)),
    )


def parse_power_roll_line(power_roll_line: str) -> PowerRollTier | None:
    normalized = (
        re.sub("[^A-Za-z0-9!() <+-]", " ", power_roll_line)
        .replace("  ", " ")
        .replace("  ", " ")
        .replace("Zdamage", "7 damage")
        .replace("S5Sdamage", "5 damage")
        .replace("Sdamage", "5 damage")
        .replace("Scorruption", "5 corruption")
        .replace("iIdamage", "1 damage")
        .replace("Ms2", "M<2 ")
        .replace("<O", "<0 ")
        .strip()
    )

    print(f"  - [{normalized}]")
    hasDamage = False
    hasEffect = False
    hasPotencyEffect = False
    match = POWER_ROLL_LINE_PATTERN_BY_TYPE["all"].match(normalized)
    if match:
        print("      Matched by 'all' pattern")
        hasDamage = True
        hasEffect = True
        hasPotencyEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["damageAndPotencyEffect"].match(
            normalized
        )
        if match:
            print("      Matched by 'damageAndPotencyEffect' pattern")
            hasDamage = True
            hasPotencyEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["damageAndEffect"].match(normalized)
        if match:
            print("      Matched by 'damageAndEffect' pattern")
            hasDamage = True
            hasEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["damage"].match(normalized)
        if match:
            print("      Matched by 'damage' pattern")
            hasDamage = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["effectAndPotencyEffect"].match(
            normalized
        )
        if match:
            print("      Matched by 'effectAndPotencyEffect' pattern")
            hasEffect = True
            hasPotencyEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["potencyEffect"].match(normalized)
        if match:
            print("      Matched by 'potencyEffect' pattern")
            hasPotencyEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["effect"].match(normalized)
        if match:
            print("      Matched by 'effect' pattern")
            hasEffect = True
    if not match:
        print("      [WARN] Could not match line.")
        return None

    groups = match.groupdict()
    print(f"      Captured: {groups}")

    return PowerRollTier(
        damage=int(groups["damage"]) if hasDamage else None,
        effect=EffectData(text=groups["effectText"].strip()) if hasEffect else None,
        potencyEffect=parse_potency_effect(
            groups["potencyTargetCharacteristic"],
            groups["potencyValue"],
            groups["potencyEffectText"],
        )
        if hasPotencyEffect
        else None,
    )


def parse_potency_effect(
    target_characteristic: Optional[str],
    value: Optional[str],
    effect_text: Optional[str],
) -> PotencyEffectData | None:
    if target_characteristic is None or value is None or effect_text is None:
        return None
    try:
        value_as_int = int(value)
    except ValueError:
        print(f"  [WARN] Invalid potency value: {value}")
        return None
    return PotencyEffectData(
        targetCharacteristic=map_initial_to_characteristic_name(target_characteristic),
        value=value_as_int,
        effects=EffectData(text=(effect_text.strip() if effect_text else "")),
    )


def map_initial_to_characteristic_name(
    initial: str,
) -> Literal["might", "agility", "reason", "intuition", "presence"]:
    initial = initial.strip().lower()
    if initial == "m":
        return "might"
    elif initial == "a":
        return "agility"
    elif initial == "r":
        return "reason"
    elif initial == "i":
        return "intuition"
    elif initial == "p":
        return "presence"
    raise ValueError(f"Unknown characteristic initial: {initial}")


def safe_get(list: list[Any], index: int, default: Any):
    try:
        return list[index]
    except Exception:
        return default


def parse_ability_block(ability_lines: List[str], monster_name: str) -> AbilityModel:
    header_line = ability_lines[0].strip()
    header = parse_ability_header(header_line, monster_name)
    if not header:
        return AbilityModel(
            header_raw=header_line, name="UNKNOWN", type="mainAction", keywords=[]
        )
    # "header_raw"

    # keywords = parse_ability_keywords(ability_lines)
    # powerRoll = parse_power_roll(ability_lines)

    model: AbilityModel = {
        "name": header["name"],
        "type": header["type"],
        "maliceCost": header["maliceCost"],
        "powerRoll": parse_power_roll_block(header, ability_lines),
        "keywords": [],
        "distance": None,
        "target": None,
        "trigger": None,
        "prePowerRollEffect": None,
        "postPowerRollEffect": None,
        "header_raw": header_line,
    }

    for i, line in enumerate(ability_lines[1:]):
        line = line.strip()
        if line.startswith("Keywords"):
            keywords = [
                w.strip()
                for w in line[len("Keywords") :].replace(",", " ").split()
                if w
            ]
            model["keywords"] = keywords
        elif line.startswith("Distance"):
            model["distance"] = line
        elif line.startswith("Target"):
            model["target"] = {"filter": None, "text": line, "count": 1}
        elif line.startswith("Trigger"):
            model["trigger"] = line[len("Trigger") :].strip()

    return model


def parse_ability_header(
    header_line: str, monster_name: str
) -> Optional[Dict[str, Any]]:
    """Parse ability header, returning name, type, maliceCost, powerRoll bonus. Warn on partial match."""
    normalized = (
        re.sub("[^A-Za-z0-9!() +-]", "", header_line).replace("  ", " ").strip()
    )

    match = ABILITY_HEADER_REGEX.match(normalized)
    if not match:
        print(
            f"[WARN] [{monster_name}]: Could not parse ability header: '{header_line}'\n   Normalized as: {repr(normalized)}"
        )
        print("Unicode: ", " ".join(str(ord(c)) for c in normalized))
        return None
    else:
        print(f"[{normalized}]")

    groups = match.groupdict()

    # Determine ability type
    type_raw = groups.get("type") or ""
    type_key = type_raw.strip().lower()
    type_key = type_key.replace("  ", " ")
    ability_type = ABILITY_TYPE_MAP.get(type_key, "unknown")

    # Villain actions sometimes come as "Villain Action 1", etc.
    if "villain action" in type_key:
        ability_type = "villainAction"

    # Malice cost: "Signature" is 0, otherwise integer.
    if groups.get("malice") is not None:
        malice_cost = int(groups["malice"])
    elif "signature" in normalized.lower():
        malice_cost = None
    else:
        malice_cost = None

    # Power roll bonus
    power_roll_bonus = None
    if groups.get("bonus"):
        try:
            power_roll_bonus = int(groups["bonus"])
        except Exception:
            print(
                f"[WARN] Could not parse power roll bonus: '{groups['bonus']}' in header '{header_line}'"
            )
            power_roll_bonus = None

    ability_header: dict[str, Any] = {
        "name": groups.get("name", "").strip(),
        "type": ability_type,
        "maliceCost": malice_cost,
        "powerRollBonus": power_roll_bonus,
        "header_raw": header_line.strip(),
    }
    # print(ability_header)
    return ability_header


def parse_ability_effect_and_power_roll(
    lines: List[str],
) -> Dict[str, Optional[str | List[str]]]:
    """
    Parses effect and power roll sections from an ability block.

    Returns dict with:
        - prePowerRollEffect: str | None
        - powerRollLines: List[str] | None
        - postPowerRollEffect: str | None
    """
    # Skip header line if present
    i = 1 if len(lines) > 1 else 0
    n = len(lines)
    pre_effect = None
    post_effect = None
    power_roll_lines: List[str] = []

    while i < n:
        s = lines[i].strip()
        if not s:
            i += 1
            continue
        # Detect "Effect"
        if s.lower().startswith("effect"):
            effect_text = s[len("effect") :].strip(": .-")
            if not power_roll_lines:
                pre_effect = effect_text
            else:
                post_effect = effect_text
            i += 1
            continue
        # Detect power roll lines
        if re.match(r"^[^1l!]{0,6}([1l!]{2}|[1l!]2.16|[1l!]7).", s):
            print(f"Power roll line found s: {s}")
            while i < n:
                s2 = lines[i].strip()
                if not s2:
                    i += 1
                    continue
                if re.match(r"^[^1l!]{0,9}([1l!]{2}|[1l!]2.16|[1l!]7).", s2):
                    print(f"Power roll line found s2: {s2}")
                    power_roll_lines.append(s2)
                    i += 1
                else:
                    print(f"Power roll lines NOT matched: {s} | {s2}")
                    break
            continue
        i += 1

    # If no power roll lines found, treat any Effect as postPowerRollEffect
    result: Dict[str, Optional[str | List[str]]] = {}
    if power_roll_lines:
        result["prePowerRollEffect"] = pre_effect
        result["powerRollLines"] = power_roll_lines
        result["postPowerRollEffect"] = post_effect
    else:
        result["prePowerRollEffect"] = None
        result["powerRollLines"] = None
        result["postPowerRollEffect"] = pre_effect or post_effect

    return result


def get_monster_foundry_actor_model(
    monster_model: dict[str, Any],
) -> dict[str, Any]:
    # Prepare fields
    is_minion = monster_model["type"].lower() == "minion"
    block_id = generate_id()
    width = 1
    try:
        # Handle sizes like "1S", "2", "3" (token width/height)
        if (
            str(monster_model.get("size", "")).startswith("1")
            or str(monster_model.get("size", "")).isdigit()
        ):
            width = int(str(monster_model["size"])[0])
    except Exception:
        width = 1

    monster_foundry_actor_model: dict[str, Any] = {
        "_id": block_id,
        "_key": f"!actors!{block_id}",
        "name": monster_model["name"],
        "type": "minion" if is_minion else "enemy",
        "img": "icons/svg/mystery-man.svg",
        "prototypeToken": {
            "name": monster_model["name"],
            "displayName": 50,
            "displayBars": 50,
            "bar1": {"attribute": "stamina"},
            "bar2": {"attribute": None},
            "disposition": -1,
            "actorLink": False,
            "width": width,
            "height": width,
            "lockRotation": True,
            "texture": {"img": "icons/svg/mystery-man.svg"},
        },
        "system": {
            "name": monster_model["name"],
            "keywords": monster_model.get("keywords", []),
            "level": monster_model["level"],
            "type": monster_model["type"].title(),
            "role": monster_model.get("role") or "",
            "encounterValue": monster_model.get("encounterValue", 0),
            "characteristics": monster_model.get("characteristics", {}),
            "stamina": (
                {
                    "max": monster_model["stamina"],
                    "perMinion": monster_model["stamina"],
                    "value": monster_model["stamina"],
                }
                if is_minion
                else {
                    "max": monster_model["stamina"],
                    "value": monster_model["stamina"],
                }
            ),
            "combat": {
                "size": monster_model.get("size"),
                "speed": monster_model.get("speed"),
                "movementTypes": monster_model.get("movementTypes", []),
                "stability": monster_model.get("stability"),
                "freeStrikeDamage": monster_model.get("freeStrikeDamage"),
            },
        },
        "items": [],
    }
    # Add optionals (immunity/weakness)
    for field in (
        "immunity",
        "weakness",
        "derivedCaptainBonuses",
        "appliedCaptainEffects",
    ):
        if monster_model.get(field):
            monster_foundry_actor_model["system"][field] = monster_model[field]
    return monster_foundry_actor_model


def export_yaml(monster_foundry_actor_models: list[dict[str, Any]]):
    for monster_foundry_actor_model in monster_foundry_actor_models:
        file_name = (
            f"{str(monster_foundry_actor_model['name']).replace(' ', '-').lower()}.yml"
        )
        file_path = (
            f"c:/_/aeon/fvtt-system-draw-steel/packs/_source/monsters/{file_name}"
        )
        with open(file_path, "w", encoding="utf-8") as file:
            yaml.safe_dump(
                monster_foundry_actor_model,
                file,
                sort_keys=False,
                allow_unicode=True,
                default_flow_style=False,
            )


def deduplicate_monsters(monster_foundry_actor_models: list[dict[str, Any]]):
    seen_monster_names = set[str]()
    unique_monster_models: list[dict[str, Any]] = []
    for monster_model in monster_foundry_actor_models:
        monster_name = str(monster_model["name"]).lower()
        if monster_name not in seen_monster_names:
            seen_monster_names.add(monster_name)
            unique_monster_models.append(monster_model)
        # else:
        #     print(f"Duplicate found, dropping: [{monster_name}]")
    return unique_monster_models


# --- Example Usage ---

if __name__ == "__main__":
    with open(
        "c:/_/aeon/fvtt-system-draw-steel/scripts/pdf-parser/full_combined_ocr.txt",
        encoding="utf-8",
    ) as source_file:
        source_lines = source_file.readlines()

    monster_headers = get_monster_headers_from_source_lines(source_lines)
    monster_blocks = group_source_lines_into_monsters_blocks(
        source_lines, monster_headers
    )

    monster_foundry_actor_models: list[dict[str, Any]] = []
    for monster_block in monster_blocks:
        # if monster_block.header.name in [
        #     # "Mystic Queen Bargnot",
        #     # "Goblin Warrior",
        #     "Werewolf",
        #     # "Goblin Spinecleaver",
        # ]:
        monster_model = get_monster_model_from_block(monster_block)
        monster_foundry_actor_model = get_monster_foundry_actor_model(monster_model)
        monster_foundry_actor_models.append(monster_foundry_actor_model)

    export_yaml(deduplicate_monsters(monster_foundry_actor_models))
