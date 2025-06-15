import re
from typing import Any, List, Optional

from typing_extensions import Literal

from ads.model import (
    Effect,
    PotencyEffect,
    PowerRoll,
    PowerRollTier,
)

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

EFFECT_DURATION_PATTERN = r"(?:save ends|end of target turn|end of targets turn|end of target.?s turn|end of (?:the )?encounter|EoE|EoT|end of \w+ next turn|start of \w+ next turn)"
POWER_ROLL_NUMERICAL_EFFECT_KEYWORD_PATTERN = (
    r"shift|move|push|pull|slide|fly|teleport|immunity|weakness"
)
POWER_ROLL_EFFECT_KEYWORDS = rf"(?:prone(?:(?:and )?can[' ]?t stand)?|rage|slowed|weakened|frightened|bleeding|grabbed|taunted|restrained|speed|shift\s?[1-9]?|move|push\s?[1-9]?|pull\s?[1-9]?|slide\s?[1-9]?|fly|hover|teleport\s?[1-9]?|stand up|recovery|immunity|weakness|temporary stamina|{EFFECT_DURATION_PATTERN})"
POWER_ROLL_RANGE_PATTERN = r"[^1l!]*(11|12.16|17[4]?[+]?).?\s*"
POWER_ROLL_DAMAGE_TYPE_PATTERN = rf"(?P<damageType>{DAMAGE_TYPE_PATTERN})?"
DAMAGE_PATTERN = rf"[^0-9]?(?P<damage>[1-9][0-9]?)\s*[^0-9]?{POWER_ROLL_DAMAGE_TYPE_PATTERN}[^0-9]?\s*damage;?\s*"
POWER_ROLL_EFFECT_PATTERN = rf"[^A-Za-z0-9]*(?P<effectText>[A-Za-z0-9 ,.-]+{POWER_ROLL_EFFECT_KEYWORDS}[A-Za-z0-9 ,.-]*(?:[(](?P<effectDuration>{EFFECT_DURATION_PATTERN})?[)])?).*"
POWER_ROLL_POTENCY_EFFECT_PATTERN = rf"[^MARIPmarip]*(?P<potencyTargetCharacteristic>[MARIPmarip])\s?<\s?(?P<potencyValue>[0-6])[^A-Za-z0-9]*(?P<potencyEffectText>(?P<potencyEffect>[A-Za-z0-9;',. +-]+)\s*(?:[(](?P<potencyEffectDuration>{EFFECT_DURATION_PATTERN})[)])?)"

POWER_ROLL_LINE_PATTERN_BY_TYPE = {
    "noEffect": re.compile(
        rf"^{POWER_ROLL_RANGE_PATTERN}(?P<effectText>No effect).*$", re.IGNORECASE
    ),
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


def parse_power_roll_block(
    header: dict[str, Any], ability_lines: List[str]
) -> PowerRoll | None:
    powerRollBonus: int | None = header["powerRollBonus"]
    current_power_roll_tier: int = 0
    power_roll_lines_by_tier: dict[str, list[str]] = {
        "tier1": [],
        "tier2": [],
        "tier3": [],
    }

    for line in ability_lines:
        line = line.strip()

        if re.match(r"^[^1]{0,9}(11|12.16|17).", line):
            current_power_roll_tier += 1
            power_roll_lines_by_tier[f"tier{current_power_roll_tier}"].append(line)
        elif (
            line.startswith("Effect") or (re.match(r"^[^1-9]{0,3}[1-9]\s*Malice", line))
        ) and current_power_roll_tier > 0:
            # If we encounter an Effect line, it means we have reached the end of the power roll lines.
            break
        elif current_power_roll_tier > 0:
            # If we are in a power roll tier but encounter a line that doesn't match the expected pattern,
            # we assume it is part of the current power roll tier.
            power_roll_lines_by_tier[f"tier{current_power_roll_tier}"].append(line)

    if not any(
        [
            len(power_roll_lines) > 0
            for power_roll_lines in power_roll_lines_by_tier.values()
        ]
    ):
        if powerRollBonus is not None:
            print(
                f"  *** [WARN] [{header['name']}]: Ability has a power roll bonus yet no power roll lines found in ability block: {ability_lines}"
            )
        return None
    if not all(
        [
            len(power_roll_lines) > 0
            for power_roll_lines in power_roll_lines_by_tier.values()
        ]
    ):
        raise ValueError(
            f"  *** [ERROR] [{
                header['name']
            }]: Expected precisely 3 power roll lines, but found {
                len(
                    [
                        power_roll_lines
                        for power_roll_lines in power_roll_lines_by_tier.values()
                        if len(power_roll_lines) > 0
                    ]
                )
            }: {power_roll_lines_by_tier}"
        )

    return PowerRoll(
        bonus=powerRollBonus or None,
        tier1=parse_power_roll_tier_lines(" ".join(power_roll_lines_by_tier["tier1"])),
        tier2=parse_power_roll_tier_lines(" ".join(power_roll_lines_by_tier["tier2"])),
        tier3=parse_power_roll_tier_lines(" ".join(power_roll_lines_by_tier["tier3"])),
    )


def parse_power_roll_tier_lines(power_roll_line: str) -> PowerRollTier:
    normalized = re.sub("[^A-Za-z0-9();' <+-]", " ", power_roll_line)
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
        rf"Z(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage;?)", "7 ", normalized
    )
    normalized = re.sub(
        rf"G(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage;?)", "6 ", normalized
    )
    normalized = re.sub(
        rf"S(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage;?)", "5 ", normalized
    )
    normalized = re.sub(
        rf"(Ji|JQ)(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage;?)", "10 ", normalized
    )
    normalized = re.sub(
        rf"JL(?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage;?)", "11 ", normalized
    )
    normalized = re.sub(
        rf"[Ii](?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage;?)", "1 ", normalized
    )
    normalized = re.sub(
        rf"[Oo](?=\s?(?:{DAMAGE_TYPE_PATTERN})?\s?damage;?)", "0 ", normalized
    )
    normalized = re.sub(
        rf"([1-5]?[0-9])((?:{DAMAGE_TYPE_PATTERN})?\s?damage;?)", r"\1 \2 ", normalized
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
        match = POWER_ROLL_LINE_PATTERN_BY_TYPE["noEffect"].match(normalized)
        if match:
            # print("      Matched by 'noEffect' pattern")
            hasEffect = True
            hasDamage = False
            hasPotencyEffect = False
    if not match:
        raise ValueError(
            f"Could not match power roll line: '{power_roll_line}'\n"
            f"Normalized as: '{normalized}'"
        )

    groups = match.groupdict()
    # print(f"      Captured: {groups}")

    return PowerRollTier(
        damage=int(groups["damage"]) if hasDamage else None,
        damageType=groups.get("damageType", None) if hasDamage else None,
        effect=Effect(text=groups["effectText"].strip()) if hasEffect else None,
        potencyEffect=parse_potency_effect(
            groups["potencyTargetCharacteristic"],
            groups["potencyValue"],
            groups["potencyEffectText"],
        )
        if hasPotencyEffect
        else None,
    )
