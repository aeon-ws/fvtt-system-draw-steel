import re
from typing import Any, Dict, List, Literal, Optional, Tuple

from ads.api.foundry import generate_id
from ads.api.string_format import title_case
from ads.model import (
    Ability,
    Cube,
    Distance,
    Effect,
    Line,
    PotencyEffect,
    PowerRoll,
    PowerRollTier,
    Target,
)

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

ABILITY_NAME_PATTERN = r"(?P<name>[A-Za-z][A-Za-z!? ]+[A-Za-z!?])"
ABILITY_TYPE_PATTERN = r"[(](?P<type>(?:Free )?(?:Triggered Action|Maneuver|Villain Action ?[123]?|(?:Main )?Action))[)]"
OPTIONAL_POWER_ROLL_PATTERN = r"(?:2[Dd]1[0oO]\s*[+]\s*(?P<bonus>[-+]?[1-5])\s*)?"
OPTIONAL_COST_PATTERN = r"(?:(?P<maliceCost>[0-9]{0,2})\s?Malice|Signature)?"

ABILITY_HEADER_REGEX = re.compile(
    rf"^{ABILITY_NAME_PATTERN}\s?{ABILITY_TYPE_PATTERN}\s?{OPTIONAL_POWER_ROLL_PATTERN}\s?{OPTIONAL_COST_PATTERN}\s?"
)
# + 11 2 corruption damage A<0 restrained (save ends)

EFFECT_DURATION_PATTERN = r"(?:save ends|end of target turn|end of targets turn|end of target.?s turn|end of (?:the )?encounter|EoE|EoT|end of \w+ next turn|start of \w+ next turn)"
POWER_ROLL_NUMERICAL_EFFECT_KEYWORD_PATTERN = (
    r"shift|move|push|pull|slide|fly|teleport|immunity|weakness"
)
POWER_ROLL_EFFECT_KEYWORDS = rf"(?:prone(?:(?:and )?can[' ]?t stand)?|slowed|weakened|frightened|bleeding|grabbed|taunted|restrained|speed|shift\s?[1-9]?|move|push\s?[1-9]?|pull\s?[1-9]?|slide\s?[1-9]?|fly|hover|teleport\s?[1-9]?|stand up|recovery|immunity|weakness|temporary stamina|{EFFECT_DURATION_PATTERN})"
POWER_ROLL_RANGE_PATTERN = r"[^1l!]*(11|12.16|17[4]?[+]?).?\s*"
POWER_ROLL_DAMAGE_TYPE_PATTERN = rf"(?P<damageType>{DAMAGE_TYPE_PATTERN})?"
DAMAGE_PATTERN = rf"[^0-9]?(?P<damage>[1-9][0-9]?)\s*[^0-9]?{POWER_ROLL_DAMAGE_TYPE_PATTERN}[^0-9]?\s*damage;?\s*"
POWER_ROLL_EFFECT_PATTERN = rf"[^A-Za-z]*(?P<effectText>[A-Za-z0-9 ,.-]+{POWER_ROLL_EFFECT_KEYWORDS}[A-Za-z0-9 ,.-]*(?:[(](?P<effectDuration>{EFFECT_DURATION_PATTERN})?[)])?).*"
POWER_ROLL_POTENCY_EFFECT_PATTERN = rf"[^MARIPmarip]*(?P<potencyTargetCharacteristic>[MARIPmarip])\s?<\s?(?P<potencyValue>[0-6])[^A-Za-z0-9]*(?P<potencyEffectText>(?P<potencyEffect>[A-Za-z0-9 ,.-]+)\s*(?:[(](?P<potencyEffectDuration>{EFFECT_DURATION_PATTERN})[)])?)"

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

MELEE_DISTANCE_PATTERN = r"Melee\s*(?P<meleeDistance>\d\d?)"
RANGED_DISTANCE_PATTERN = r"Ranged\s*(?P<rangedDistance>\d\d?)"
DISTANCE_PATTERN_BY_TYPE = {
    "self": re.compile(r"^.*Self.*$", re.IGNORECASE),
    "meleeAndRanged": re.compile(
        rf"^.*{MELEE_DISTANCE_PATTERN}.*{RANGED_DISTANCE_PATTERN}.*$", re.IGNORECASE
    ),
    "melee": re.compile(rf"^.*{MELEE_DISTANCE_PATTERN}.*$", re.IGNORECASE),
    "ranged": re.compile(rf"^.*{RANGED_DISTANCE_PATTERN}.*$", re.IGNORECASE),
    "burst": re.compile(r"^.*(?P<burstSize>\d\d?)\s*burst.*$", re.IGNORECASE),
    "cube": re.compile(
        r"^.*(?P<cubeSize>\d\d?)\s*cube\s*within\s*(?P<cubeWithin>\d\d?).*$",
        re.IGNORECASE,
    ),
    "line": re.compile(
        r"^.*(?P<lineWidth>\d\d?)\s*x\s*(?P<lineLength>\d\d?)\s*line\s*within\s*(?P<lineWithin>\d\d?).*$",
        re.IGNORECASE,
    ),
}

TARGET_PATTERN = re.compile(
    r"(?P<self>self)?.*(?P<targetCount>(?:all|each|every|one|two|three|1|2|3))?.*(?:(?P<targetType>all(?:y|ies)|enem(?:y|ies)|creature[s]?|hero(?:es|s)|monster[s]?|target[s]?|object[s]?)\s*(?:or)?\s*)*.*$",
    re.IGNORECASE,
)


def join_broken_headers(source_lines: List[str]) -> List[str]:
    """Joins lines where an ability header is broken across two lines."""
    joined_header_line: list[str] = []
    buffer = ""
    for source_line in source_lines:
        test = buffer + " " + source_line if buffer else source_line
        if any(re.search(pat, test, re.IGNORECASE) for pat in ABILITY_HEADER_PATTERNS):
            joined_header_line.append(test.strip())
            buffer = ""
        elif any(
            re.search(pat, source_line, re.IGNORECASE)
            for pat in ABILITY_HEADER_PATTERNS
        ):
            joined_header_line.append(source_line.strip())
            buffer = ""
        else:
            if buffer:
                buffer += " " + source_line.strip()
            else:
                buffer = source_line.strip()
    if buffer:
        joined_header_line.append(buffer)
    return joined_header_line


def find_ability_headers(source_lines: list[str]) -> list[tuple[int, str]]:
    ability_headers: list[tuple[int, str]] = []
    for index, source_line in enumerate(source_lines):
        if any(
            re.search(pattern, source_line, re.IGNORECASE)
            for pattern in ABILITY_HEADER_PATTERNS
        ):
            ability_headers.append((index, source_line))
    return ability_headers


def split_ability_blocks(lines: list[str]) -> list[list[str]]:
    """Splits the text into ability blocks based on header detection—never merges separate headers."""
    blocks: list[list[str]] = []
    current_block: list[str] = []

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
                print(f"*** [DEBUG] Ignoring orphaned non-header line: '{line}'")
    # Flush last block
    if current_block:
        blocks.append(current_block)
    return blocks


def parse_effect_data(effect_source_line: str) -> Effect:
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
    return Effect()


def parse_distance_and_target_row(source_line: str) -> Optional[Tuple[str, str]]:
    return None


def parse_power_roll_block(
    header: dict[str, Any], ability_lines: List[str]
) -> PowerRoll | None:
    powerRollBonus: int | None = header["powerRollBonus"]
    if powerRollBonus is None:
        # If no power roll bonus is specified in the ability header, the ability doesn't involve a power
        # roll, so power roll to parse.
        return None

    power_roll_lines: List[str] = []

    for line in ability_lines:
        line = line.strip()
        if re.match(r"^[^1]{0,9}(11|12.16|17).", line):
            # This line looks like a power roll line, so we will parse it.
            power_roll_lines.append(line)

    if not power_roll_lines:
        print(
            f"  *** [WARN] [{header['name']}]: No power roll lines found in ability block: {ability_lines}"
        )
        return None
    if len(power_roll_lines) != 3:
        raise ValueError(
            f"  *** [ERROR] [{header['name']}]: Expected precisely 3 power roll lines, but found {len(power_roll_lines)}: {power_roll_lines}"
        )

    return PowerRoll(
        bonus=powerRollBonus,
        tier1=parse_power_roll_line(power_roll_lines.pop(0)),
        tier2=parse_power_roll_line(power_roll_lines.pop(0)),
        tier3=parse_power_roll_line(power_roll_lines.pop(0)),
    )


def parse_power_roll_line(power_roll_line: str) -> PowerRollTier:
    normalized = re.sub("[^A-Za-z0-9() <+-]", " ", power_roll_line)
    normalized = (
        normalized.replace("damase", "damage")
        .replace("a aken", "and weakened")
        .replace("corruptiond e", "corruption damage;")
        .replace("erabbed", "grabbed")
        .replace("Verticalsiide", "Vertical slide")
        .replace("coruption", "corruption")
        .replace("sorruption", "corruption")
        .replace("S5S", "5 ")
    )
    normalized = re.sub(
        rf"Z(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage)", "7 ", normalized
    )
    normalized = re.sub(
        rf"G(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage)", "6 ", normalized
    )
    normalized = re.sub(
        rf"S(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage)", "5 ", normalized
    )
    normalized = re.sub(
        rf"(Ji|JQ)(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage)", "10 ", normalized
    )
    normalized = re.sub(
        rf"(JL|JL)(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage)", "11 ", normalized
    )
    normalized = re.sub(
        rf"[Ii](?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage)", "1 ", normalized
    )
    normalized = re.sub(
        rf"[Oo](?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage)", "0 ", normalized
    )
    normalized = re.sub(
        rf"([1-5]?[0-9])((?:{DAMAGE_TYPE_PATTERN})?\s?damage)", r"\1 \2 ", normalized
    )
    normalized = re.sub(r"([MARIPmarip]).?(<).?([0-5])", r"\1\2\3", normalized)
    normalized = re.sub(r"([MARIPmarip])[^<]([0-5])", r"\1<\2", normalized)
    normalized = re.sub(r"[1l](<(?:[0-5]|[Oo]))", r"I\1", normalized)
    normalized = re.sub(r"([MARIPmarip]<)[Oo]", "0", normalized)
    normalized = re.sub(r"<.11", r"<11", normalized)
    normalized = re.sub(r"^[^1<]{0,9}(?=<11|17+|12-16)", "", normalized)
    normalized = re.sub(r"^[+]\s+(?=11)", "<", normalized)
    normalized = re.sub(
        rf"({POWER_ROLL_NUMERICAL_EFFECT_KEYWORD_PATTERN})\s?[Ii]", r"\1 1", normalized
    )
    normalized = re.sub(
        rf"({POWER_ROLL_NUMERICAL_EFFECT_KEYWORD_PATTERN})\s?[Ss]", r"\1 5", normalized
    )
    normalized = re.sub(
        rf"({POWER_ROLL_NUMERICAL_EFFECT_KEYWORD_PATTERN})\s?G", r"\1 6", normalized
    )
    normalized = re.sub(
        rf"({POWER_ROLL_NUMERICAL_EFFECT_KEYWORD_PATTERN})([1-9])", r"\1 \2", normalized
    )
    normalized = re.sub(r"nulls", r"pull 5", normalized)
    normalized = re.sub(r"[ ]{2,}", " ", normalized)
    normalized = re.sub(
        r"(3 corruption damage) 0 (weakened [(]save ends[)])", r"\1 I<0 \2", normalized
    )
    normalized = re.sub(r"<11 0prone", r"<11 I<0 prone", normalized)
    normalized = re.sub(r"(prone.*) As (bleeding)", r"\1 A<2 \2", normalized)
    normalized = re.sub("bleedi$", "bleeding (save ends)", normalized)
    normalized = normalized.replace("can t", "can't")
    normalized = (
        normalized.replace(
            "PsZlevitated forthe rest of the encounter", "P<3 levitated (EoE)"
        )
        .replace(
            "12 damage M<2 grabbed target has a bane on",
            "12 damage M<2 grabbed, target has a bane on escaping the grab",
        )
        .strip()
    )

    # print(f"  - [{normalized}]")
    hasDamage = False
    hasEffect = False
    hasPotencyEffect = False
    match = POWER_ROLL_LINE_PATTERN_BY_TYPE["all"].match(normalized)
    if match:
        # print("      Matched by 'all' pattern")
        hasDamage = True
        hasEffect = True
        hasPotencyEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["damageAndPotencyEffect"].match(
            normalized
        )
        if match:
            # print("      Matched by 'damageAndPotencyEffect' pattern")
            hasDamage = True
            hasPotencyEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["damageAndEffect"].match(normalized)
        if match:
            # print("      Matched by 'damageAndEffect' pattern")
            hasDamage = True
            hasEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["damage"].match(normalized)
        if match:
            # print("      Matched by 'damage' pattern")
            hasDamage = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["effectAndPotencyEffect"].match(
            normalized
        )
        if match:
            # print("      Matched by 'effectAndPotencyEffect' pattern")
            hasEffect = True
            hasPotencyEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["potencyEffect"].match(normalized)
        if match:
            # print("      Matched by 'potencyEffect' pattern")
            hasPotencyEffect = True
    if not match:
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["effect"].match(normalized)
        if match:
            # print("      Matched by 'effect' pattern")
            hasEffect = True
    if not match:
        raise ValueError(
            f"Could not match power roll line: '{power_roll_line}'\n"
            f"Normalized as: '{normalized}'"
        )

    groups = match.groupdict()
    # print(f"      Captured: {groups}")

    return PowerRollTier(
        damage=int(groups["damage"]) if hasDamage else None,
        effect=Effect(text=groups["effectText"].strip()) if hasEffect else None,
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
) -> PotencyEffect | None:
    if target_characteristic is None or value is None or effect_text is None:
        return None
    try:
        value_as_int = int(value)
    except ValueError:
        print(f"  *** [WARN] Invalid potency value: {value}")
        return None
    return PotencyEffect(
        targetCharacteristic=map_initial_to_characteristic_name(target_characteristic),
        value=value_as_int,
        effect=Effect(text=(effect_text.strip() if effect_text else "")),
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


def parse_distance(distance_and_target_line: str) -> Distance:
    distance_source = distance_and_target_line[len("Distance ") :].strip()
    if not distance_source:
        raise ValueError(f"Invalid distance line: '{distance_and_target_line}'")

    normalized = distance_source.replace("  ", " ").replace("  ", " ")

    # print(f"  - Distance: [{normalized}]")
    match = DISTANCE_PATTERN_BY_TYPE["self"].match(normalized)
    if match:
        # print("      Matched by 'self' pattern")
        return Distance(self=True)

    match = DISTANCE_PATTERN_BY_TYPE["meleeAndRanged"].match(normalized)
    if match:
        # print("      Matched by 'meleeAndRanged' pattern")
        return Distance(
            melee=int(match.group("meleeDistance")),
            ranged=int(match.group("rangedDistance")),
        )

    match = DISTANCE_PATTERN_BY_TYPE["melee"].match(normalized)
    if match:
        # print("      Matched by 'melee' pattern")
        return Distance(melee=int(match.group("meleeDistance")))

    match = DISTANCE_PATTERN_BY_TYPE["ranged"].match(normalized)
    if match:
        # print("      Matched by 'ranged' pattern")
        return Distance(ranged=int(match.group("rangedDistance")))

    match = DISTANCE_PATTERN_BY_TYPE["burst"].match(normalized)
    if match:
        # print("      Matched by 'burst' pattern")
        return Distance(burst=int(match.group("burstSize")))

    match = DISTANCE_PATTERN_BY_TYPE["cube"].match(normalized)
    if match:
        # print("      Matched by 'cube' pattern")
        return Distance(
            cube=Cube(
                size=int(match.group("cubeSize")), within=int(match.group("cubeWithin"))
            )
        )

    match = DISTANCE_PATTERN_BY_TYPE["line"].match(normalized)
    if match:
        # print("      Matched by 'line' pattern")
        return Distance(
            line=Line(
                width=int(match.group("lineWidth")),
                length=int(match.group("lineLength")),
                within=int(match.group("lineWithin")),
            )
        )

    if "special" in normalized.lower():
        return Distance(special=True)

    raise ValueError(
        f"Could not parse distance from line: '{distance_and_target_line}'\n"
        f"Normalized as: '{normalized}'"
    )


def parse_target(distance_and_target_line: str) -> Target | None:
    if "Target" not in distance_and_target_line:
        f"[WARN] Didn't find Target in same line as Distance, which is highly unusual (but not illegal, nor completely unheard of): '{distance_and_target_line}'"
        return None

    target_source = distance_and_target_line.split("Target")[-1].strip()
    normalized = target_source.replace("  ", " ").replace("  ", " ").strip()

    # print(f"  - Target: [{normalized}]")
    match = TARGET_PATTERN.match(normalized)
    if match:
        target = Target()

        if match.group("self") is not None:
            target["self"] = True

        target_count = match.group("targetCount")
        if target_count is not None:
            if target_count.lower() in ["all", "each", "every"]:
                target["count"] = "all"
            elif target_count.isdigit():
                target["count"] = int(target_count)
            elif target_count.lower() == "one":
                target["count"] = 1
            elif target_count.lower() == "two":
                target["count"] = 2
            elif target_count.lower() == "three":
                target["count"] = 3
            else:
                print(
                    f"[WARN] Could not convert target count '{target_count}' to integer in line: '{distance_and_target_line}'"
                )

        target["text"] = normalized
        # print(f"      Matched by 'target' pattern: {target}")

        return target

    if "special" in normalized.lower():
        return Target()

    raise ValueError(
        f"Could not parse target from line: '{distance_and_target_line}'\n"
        f"Normalized as: '{normalized}'"
    )


def parse_ability_block(ability_lines: List[str], monster_name: str) -> Ability:
    header_line = ability_lines[0].strip()
    header = parse_ability_header(header_line, monster_name)
    if not header:
        return Ability(
            header_raw=header_line, name="UNKNOWN", type="mainAction", keywords=[]
        )

    model: Ability = {
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

    for index, ability_line in enumerate(ability_lines[1:]):
        ability_line = ability_line.strip()
        if ability_line.startswith("Keywords"):
            keywords = [
                w.strip()
                for w in ability_line[len("Keywords") :].replace(",", " ").split()
                if w
            ]
            model["keywords"] = keywords
            # print(f"  - Keywords: {keywords}")
        elif ability_line.startswith("Distance"):
            # Compensation for a hard error in the source PDF: the post power roll effect is labeled
            # "Distance" instead of "Effect".
            if "The affected area is considered difficult terrain for" in ability_line:
                model["postPowerRollEffect"] = Effect(
                    text="The affected area is considered difficult terrain for the rest of the encounter."
                )
            # Compensation for a hard error in the source PDF: the post power roll effect is labeled
            # "Distance" instead of "Trigger".
            elif "The target uses a strike that targets the mastermind" in ability_line:
                model["trigger"] = (
                    f"{ability_line[len('Distance') :].strip()} {ability_lines[index + 1].strip()}"
                )
            else:
                model["distance"] = parse_distance(ability_line)

            model["target"] = parse_target(ability_line)
        elif ability_line.startswith("Target"):
            model["target"] = parse_target(ability_line)
        elif ability_line.startswith("Trigger"):
            model["trigger"] = ability_line[len("Trigger") :].strip()

    return model


def parse_ability_header(
    header_line: str, monster_name: str
) -> Optional[Dict[str, Any]]:
    """Parse ability header, returning name, type, maliceCost, powerRoll bonus. Warn on partial match."""
    normalized = (
        re.sub("[^A-Za-z0-9!() +-]", "", header_line)
        .replace("2 9 3 Malice", "2 3 Malice")
        .replace("2 0 5 Malice", "2 5 Malice")
        .replace("  ", " ")
        .strip()
    )

    match = ABILITY_HEADER_REGEX.match(normalized)
    if not match:
        print(
            f"*** [WARN] [{monster_name}]: Could not parse ability header: '{header_line}'\n   Normalized as: {repr(normalized)}"
        )
        return None
    # else:
    # print(f"[{normalized}]")

    groups = match.groupdict()

    # Determine ability type
    type_raw = groups.get("type") or ""
    type_key = type_raw.strip().lower()
    type_key = type_key.replace("  ", " ")
    ability_type = ABILITY_TYPE_MAP.get(type_key, "unknown")

    # Villain actions always come in threes and have an integer suffix in the range 1 - 3 that prescribes
    # the order in which the individual actions must be used.  The suffix isn't part of the type key nor
    # the unique name; however, it needs to be stored in the model and exported for later use in Foundry
    # both for display purposes as well as to preserve aforementioned sequence information.
    villain_action_ordinal: Optional[int] = None
    if "villain action" in type_key:
        ability_type = "villainAction"
        villain_action_ordinal = 1

    # Malice cost: "Signature" is 0, otherwise integer.
    if groups.get("maliceCost") is not None:
        malice_cost = int(groups["maliceCost"])
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
                f"*** [WARN] Could not parse power roll bonus: '{groups['bonus']}' in header '{header_line}'"
            )
            power_roll_bonus = None

    name = groups.get("name", "").strip()

    ability_header: dict[str, Any] = {
        "name": f"{name} ({title_case(type_key)})"
        if ability_type == "villainAction"
        else name,
        "type": ability_type,
        "villainActionOrdinal": villain_action_ordinal,
        "maliceCost": malice_cost,
        "powerRollBonus": power_roll_bonus,
        "header_raw": header_line.strip(),
    }
    # print(ability_header)
    return ability_header


def get_dict_without_none_values(input_dict: dict[str, Any]) -> dict[str, Any]:
    cleaned: dict[str, Any] = {}
    for key, value in input_dict.items():
        if isinstance(value, dict):
            nested = get_dict_without_none_values(value)
            if nested:
                cleaned[key] = nested
        elif value is not None:
            cleaned[key] = value
    return cleaned


def get_foundry_item_model(ability: Ability) -> dict[str, Any]:
    item_id = generate_id()

    item_model: dict[str, Any] = {
        "_id": item_id,
        "_key": f"!items!{item_id}",
        "name": ability["name"],
        "type": "monsterAbility",
        "img": "icons/svg/book.svg",
        "system": {
            "maliceCost": ability.get("maliceCost", None),
            "keywords": ability["keywords"],
            "type": ability["type"],
            "distance": ability.get("distance", None),
            "target": ability.get("target", None),
            "powerRoll": ability.get("powerRoll", None),
            "trigger": ability.get("trigger", None),
            "prePowerRollEffect": ability.get("prePowerRollEffect", None),
            "postPowerRollEffect": ability.get("postPowerRollEffect", None),
        },
    }

    return get_dict_without_none_values(item_model)
