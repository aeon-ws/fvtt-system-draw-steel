import re
import unicodedata
from typing import Any, Dict, List, Optional, Pattern, Tuple

import yaml

from ads.api.ability_and_trait_parser import (
    get_foundry_item_model,
    parse_ability_block,
    split_ability_blocks,
)
from ads.api.foundry import generate_id
from ads.api.power_roll_parser import DAMAGE_TYPES
from ads.api.string_format import sanitize_name, title_case
from ads.model import (
    AppliedCaptainEffects,
    Characteristics,
    DerivedCaptainBonuses,
    ImmunityOrWeakness,
    Monster,
    MonsterBlock,
    MonsterHeader,
)

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
    "MALICE FEATURES",
    # Add others as needed (case-insensitive)
}

# Matches various dividers: anything that's not a letter/number, up to 2 chars, possibly multiple times
DIVIDER = r"[^A-Za-z0-9]{0,2}"

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


def is_noise_header(line: str) -> bool:
    normalized_line = line.strip().upper()
    return any(h.upper() in normalized_line for h in NOISE_HEADERS)


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


def normalize_header_fields(header: MonsterHeader) -> MonsterHeader:
    name = title_case(sanitize_name(header["name"]))
    type_ = title_case(header["type"])
    role = title_case(header.get("role", ""))
    return MonsterHeader(
        name=name,
        level=header["level"],
        type=type_,
        role=role,
        header_source_line=header["header_source_line"],
        start_line_index=header["start_line_index"],
        end_line_index=header["end_line_index"],
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


def parse_characteristics(source_line: str) -> Characteristics | None:
    normalized = (
        re.sub(
            "(?: [0Oo]+|[0Oo]+ |[0Oo]+$)",
            " 0 ",
            re.sub("[^A-Za-z0-9 +-]", "", source_line),
        )
        .replace("od ", " 0")
        .replace("+", " ")
        .replace("  ", " ")
        .replace("  ", " ")
        .strip()
    )

    pattern = re.compile(
        # Might-2 Agility+2 Reas0n+0 Intuiti0n+0 Presence -2
        r"Might\s*(?P<might>-?[0-9])\s*Agility\s*(?P<agility>-?[0-9])\s*Reason\s*(?P<reason>-?[0-9])\s*Intuition\s*(?P<intuition>-?[0-9])\s*Presence\s*(?P<presence>-?[0-9])",
        re.IGNORECASE,
    )

    match = pattern.match(normalized)
    if match:
        characteristics = match.groupdict()
        return Characteristics(
            {
                "might": int(characteristics["might"].replace("O", "0")),
                "agility": int(characteristics["agility"].replace("O", "0")),
                "reason": int(characteristics["reason"].replace("O", "0")),
                "intuition": int(characteristics["intuition"].replace("O", "0")),
                "presence": int(characteristics["presence"].replace("O", "0")),
            }
        )

    return None


def parse_with_captain(
    source_lines: list[str], stat_and_metadata_section_end_index: int
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


def get_characteristics_and_line_index(
    source_lines: list[str],
) -> tuple[Characteristics, int]:
    for source_line_index, source_line in enumerate(source_lines):
        characteristics = parse_characteristics(source_line)
        if characteristics:
            # Found a line with characteristics, so return its index.
            return (characteristics, source_line_index)

    print("[ERROR] Primary characteristics line not found in block. Lines were:")
    for index, source_line in enumerate(source_lines):
        print(f"{index:02}: {source_line.strip()}")
    raise ValueError("Primary characteristics line not found in block!")


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


def parse_immunity_and_weakness(
    source_lines: list[str], characteristics_line_index: int
) -> tuple[ImmunityOrWeakness | None, ImmunityOrWeakness | None]:
    source_lines = source_lines[: characteristics_line_index + 1]
    weakness: ImmunityOrWeakness = {}
    immunity: ImmunityOrWeakness = {}
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


def get_monster_model_from_block(monster_block: MonsterBlock) -> Monster:
    source_lines = monster_block["source_lines"]
    monster_header = monster_block["header"]
    characteristics, characteristics_line_index = get_characteristics_and_line_index(
        source_lines
    )

    monster_model: Monster = {
        "name": monster_header["name"],
        "level": monster_header["level"],
        "type": monster_header["type"],
        "role": monster_header.get("role", None),
        "header_text": monster_header["header_source_line"],
        "keywords": [],
        "encounterValue": 0,
        "stamina": 0,
        "speed": 0,
        "movementTypes": [],
        "size": "",
        "stability": 0,
        "freeStrikeDamage": parse_free_strike(source_lines),
        "characteristics": characteristics,
        "weakness": None,
        "immunity": None,
        "derivedCaptainBonuses": None,
        "appliedCaptainEffects": None,
        "abilities": [],
        "traits": [],
    }

    monster_model["keywords"], monster_model["encounterValue"] = (
        parse_keywords_and_ev_row(source_lines)
    )
    monster_model["stamina"] = parse_stamina(source_lines)
    monster_model["speed"], monster_model["movementTypes"] = (
        parse_speed_and_movement_types(source_lines)
    )
    monster_model["size"], monster_model["stability"] = parse_size_and_stability(
        source_lines
    )

    # Optional fields:
    monster_model["weakness"], monster_model["immunity"] = parse_immunity_and_weakness(
        source_lines, characteristics_line_index
    )
    if monster_header["type"].lower() == "minion":
        captain_result = parse_with_captain(source_lines, characteristics_line_index)
        if captain_result:
            monster_model["appliedCaptainEffects"] = captain_result[0]
            monster_model["derivedCaptainBonuses"] = captain_result[1]

    first_ability_source_lines = source_lines[characteristics_line_index + 1 :]
    ability_blocks = split_ability_blocks(first_ability_source_lines)
    for ability_block in ability_blocks:
        if not ability_block:
            print(
                f"[WARN] [{monster_header['name']}]: Empty ability block found, skipping."
            )
            continue
        parsed_ability = parse_ability_block(ability_block, monster_header["name"])
        monster_model["abilities"].append(parsed_ability)

    return monster_model


def group_source_lines_into_monsters_blocks(
    source_lines: List[str], headers: List[MonsterHeader]
) -> List[MonsterBlock]:
    blocks: List[MonsterBlock] = []
    header_indices = [header["start_line_index"] for header in headers]
    num_lines = len(source_lines)
    header_line_set = set(header_indices)
    for i, header in enumerate(headers):
        start = header["start_line_index"] + 1
        end = num_lines
        j = start
        while j < num_lines:
            # 1. Next detected monster header
            if j in header_line_set and j != header["start_line_index"]:
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


def get_monster_foundry_actor_model(
    monster_model: Monster,
) -> dict[str, Any]:
    # Prepare fields
    is_minion = monster_model["type"].lower() == "minion"
    actor_id = generate_id()
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
        "_id": actor_id,
        "_key": f"!actors!{actor_id}",
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

    for ability in monster_model.get("abilities", []):
        monster_foundry_actor_model["items"].append(get_foundry_item_model(ability))

    # Add optionals (immunity/weakness)
    for field_name in (
        "immunity",
        "weakness",
        "derivedCaptainBonuses",
        "appliedCaptainEffects",
    ):
        field_value = monster_model.get(field_name, None)
        if field_value:
            monster_foundry_actor_model["system"][field_name] = field_value

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


def export_monsters(ocr_file_path: str, yaml_folder_path: str) -> None:
    with open(
        ocr_file_path,
        encoding="utf-8",
    ) as source_file:
        source_lines = source_file.readlines()

    pre_sanitized_source_lines: list[str] = []
    for line in source_lines:
        pre_sanitized_line = (
            line.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
        )
        pre_sanitized_line = re.sub(
            r"[^A-Za-z0-9/'\"\[\]()<!?.,; +-]", " ", pre_sanitized_line
        )
        pre_sanitized_line = re.sub(r"\s+", " ", pre_sanitized_line)
        pre_sanitized_source_lines.append(pre_sanitized_line.strip())

    # for trait_name in TRAIT_NAMES:
    #     print(f"[{trait_name}]")
    #     for line in pre_sanitized_source_lines:
    #         if re.match(rf"{trait_name}", line, re.IGNORECASE):
    #             print(f"  - {line.strip()}")
    # return

    monster_headers = get_monster_headers_from_source_lines(pre_sanitized_source_lines)
    monster_blocks = group_source_lines_into_monsters_blocks(
        pre_sanitized_source_lines, monster_headers
    )

    monster_foundry_actor_models: list[dict[str, Any]] = []
    for monster_block in monster_blocks:
        # if monster_block["header"]["name"] in [
        #     #     # "Mystic Queen Bargnot",
        #     # "Dwarf Trapper",
        #     # "Werewolf",
        #     "Goblin Spinecleaver",
        # ]:
        monster_model = get_monster_model_from_block(monster_block)
        monster_foundry_actor_model = get_monster_foundry_actor_model(monster_model)
        monster_foundry_actor_models.append(monster_foundry_actor_model)

    export_yaml(deduplicate_monsters(monster_foundry_actor_models))
