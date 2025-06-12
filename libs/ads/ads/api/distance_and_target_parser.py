import re

from ads.model import (
    Cube,
    Distance,
    Line,
    Target,
)

MELEE_DISTANCE_PATTERN = r"Melee\s*(?P<meleeDistance>\d\d?)"
RANGED_DISTANCE_PATTERN = r"Ranged\s*(?P<rangedDistance>\d\d?)"
DISTANCE_PATTERN_BY_TYPE = {
    "self": re.compile(r"^.*Self.*$", re.IGNORECASE),
    "meleeAndRanged": re.compile(
        rf"^.*{MELEE_DISTANCE_PATTERN}.*{RANGED_DISTANCE_PATTERN}.*$", re.IGNORECASE
    ),
    "melee": re.compile(rf"^.*{MELEE_DISTANCE_PATTERN}.*$", re.IGNORECASE),
    "ranged": re.compile(rf"^.*{RANGED_DISTANCE_PATTERN}.*$", re.IGNORECASE),
    "burst": re.compile(r"^[^0-9]*(?P<burstSize>\d\d?)\s*burst.*$", re.IGNORECASE),
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

    normalized = (
        distance_and_target_line.split("Target")[-1]
        .replace("  ", " ")
        .replace("  ", " ")
        .strip()
    )
    normalized = re.sub(
        r"\s*in the (?:area|aura|burst|cube|line|square)\s*", "", normalized
    )
    normalized = re.sub(r"[Oo]ne\s", r"1 ", normalized)
    normalized = re.sub(r"[Tt]wo\s", r"2 ", normalized)
    normalized = re.sub(r"[Tt]hree\s", r"3 ", normalized)
    normalized = re.sub(r"[Ff]our\s", r"4 ", normalized)
    normalized = re.sub(r"[Ff]ive\s", r"5 ", normalized)

    target = Target(text=normalized)

    if re.search("special", normalized, re.IGNORECASE):
        target["special"] = True
    if re.search("self", normalized, re.IGNORECASE):
        target["self"] = True
    if re.search(r"ally|allies", normalized, re.IGNORECASE):
        target["ally"] = True
    if re.search(r"creature[s]?", normalized, re.IGNORECASE):
        target["ally"] = True
        target["self"] = True
        target["enemy"] = True
    if re.search(r"enemy|enemies", normalized, re.IGNORECASE):
        target["enemy"] = True
    if re.search(r"hero(?:es|s)?", normalized, re.IGNORECASE):
        target["ally"] = True
        target["self"] = True
    if re.search(r"object[s]?", normalized, re.IGNORECASE):
        target["object"] = True

    if re.search(r"(?:all|each|every)/s", normalized, re.IGNORECASE):
        target["count"] = "all"
    else:
        match = re.search(
            r"(?P<countInteger>[1|2|3|4|5])|(?P<countWord>one|two|three|four|five)",
            normalized,
            re.IGNORECASE,
        )
        match_groups = match.groupdict() if match else {}

        if match_groups.get("countInteger"):
            target["count"] = int(match_groups["countInteger"])
        elif match_groups.get("countWord"):
            number_by_word = {
                "one": 1,
                "two": 2,
                "three": 3,
                "four": 4,
                "five": 5,
            }
            target["count"] = number_by_word[match_groups["countWord"].lower()]

    return target
