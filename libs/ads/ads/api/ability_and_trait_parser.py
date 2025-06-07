import re
from typing import Any, Dict, List, Optional

from ads.api.distance_and_target_parser import parse_distance, parse_target
from ads.api.foundry import generate_id
from ads.api.power_roll_parser import parse_power_roll_block
from ads.api.string_format import title_case
from ads.model import (
    Ability,
    Effect,
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


TRAIT_NAMES = [
    "Accursed Rage",
    "Amorphous",
    "Aquavuken",
    "Arise",
    "Backstab",
    "Block",
    "Bonetrops",
    "Burrow",
    "Camouflage",
    "Charm",
    "Charger",
    "Chomp",
    "Climb",
    "Corruptive Phasing",
    "Crafty",
    "Creeper",
    "Cunning",
    "Curse Mark",
    "Cursed Transference",
    "Death Fumes",
    "Death Grasp",
    "Death Void",
    "Deflect",
    "Defiant Anger",
    "Destructive Path",
    "Determination",
    "Disorganized",
    "Earthwalk",
    "End Effect",
    "Endless Knight",
    "Enervating Horror",
    "Entangle",
    "Escort the Prisoners",
    "Fade",
    "Fickle and Free",
    "Flight",
    "Fortify",
    "Frenzy",
    "Gelatinous",
    "Glowing Recovery",
    "Gnaw",
    "Go for the Jugular",
    "Grappler",
    "Great Fortitude",
    "Hamstring Slice",
    "Hide While Observed",
    "Hold 'Em Down",
    "Hover",
    "Hunger",
    "Hunter",
    "Hypnosis",
    "I'm Your Enemy",
    "Im Your Enemy",
    "Imitate",
    "Imposer",
    "Incorporeal",
    "Inertial Shield",
    "Inspire",
    "Lash Out",
    "Like the Wind",
    "Living Labyrinth",
    "Magic Beacon",
    "Malice Emitter",
    "Motivate",
    "Mounted Charger",
    "Multilimb",
    "Mug",
    "Needlefoot",
    "Nimblestep",
    "Otherworldly Grace",
    "Overwhelm",
    "Pack Strong",
    "Pack Tactics",
    "Phantom Flow",
    "Pierce",
    "Possession",
    "Power Through",
    "Pouncer",
    "Primordial Strength",
    "Projectile",
    "Quick Thinking",
    "Rage",
    "Reach",
    "Ride Launcher",
    "Rivalry",
    "Rolling",
    "Saw You Coming",
    "Seismic Sense",
    "Shapeshifter",
    "Shared Crafty",
    "Shared Ferocity",
    "Shared Otherworldly Grace",
    "Shield Bash",
    "Shocking",
    "Shoot the Hostage",
    "Sidestep",
    "Skewer",
    "Slip Away",
    "Sneak",
    "Soft Underbelly",
    "Solo Monster",
    "Solo Turns",
    "Soul Chill",
    "Spark of Life",
    "Spellcast",
    "Stalk",
    "Stalwart Guardian",
    "Steal",
    "Sticky Sludge",
    "Stonewalker",
    "Strength",
    "Sunder",
    "Supernatural Insight",
    "Swarm",
    "Swim",
    "Taunt",
    "The Commander’s Watching",
    "Thick Hide",
    "Thicket and Thorns",
    "Toxin Burst",
    "Translation",
    "Unravel Will",
    "Unslaked Bloodthirst",
    "Vanish",
    "Venom",
    "Venomous Bite",
    "Volley",
    "Vukenstep",
    "Ward",
    "Water Weird",
    "Whispered Hex",
    "Wide Back",
]

TRAIT_NAME_PATTERN = f"(?P<traitName>{'|'.join([rf'{t}' for t in TRAIT_NAMES])})"

ABILITY_NAME_PATTERN = r"(?P<abilityName>[A-Za-z][A-Za-z!? ]+[A-Za-z!?])"
ABILITY_TYPE_PATTERN = r"[(](?P<type>(?:Free )?(?:Triggered Action|Maneuver|Villain Action ?[123]?|(?:Main )?Action))[)]"
OPTIONAL_POWER_ROLL_PATTERN = r"(?:2[Dd]1[0oO]\s*[+]\s*(?P<bonus>[-+]?[1-5])\s*)?"
OPTIONAL_COST_PATTERN = r"(?:(?P<maliceCost>[0-9]{0,2})\s?Malice|Signature)?"

ABILITY_HEADER_REGEX = re.compile(
    rf"^(?:{TRAIT_NAME_PATTERN}\s*$|{ABILITY_NAME_PATTERN}\s?{ABILITY_TYPE_PATTERN}\s?{OPTIONAL_POWER_ROLL_PATTERN}\s?{OPTIONAL_COST_PATTERN})\s?"
)


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


def parse_ability_block(ability_lines: List[str], monster_name: str) -> Ability:
    header_line = ability_lines[0].strip()
    header = parse_ability_header(header_line, monster_name)
    if not header:
        return Ability(
            header_raw=header_line, name="UNKNOWN", type="mainAction", keywords=[]
        )

    if header["type"] == "monsterTrait":
        effect_text = " ".join(ability_lines[1:])

        return Ability(
            name=header["name"],
            type=header["type"],
            keywords=[],
            prePowerRollEffect=Effect(text=effect_text),
            header_raw=header_line,
        )

    model = Ability(
        name=header["name"],
        type=header["type"],
        maliceCost=header["maliceCost"],
        powerRoll=parse_power_roll_block(header, ability_lines),
        keywords=[],
        distance=None,
        target=None,
        trigger=None,
        prePowerRollEffect=None,
        maliceEffect=None,
        postPowerRollEffect=None,
        header_raw=header_line,
    )

    pre_power_roll_effect_lines: List[str] = []
    post_power_roll_effect_lines: List[str] = []
    malice_effect_lines: List[str] = []
    power_roll_line_encountered = False
    final_effect_line_encountered = False
    final_malice_effect_line_encountered = False

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
        elif re.match(r"^[^1]{0,9}(?:11|12.16|17).", ability_line):
            power_roll_line_encountered = True
            final_effect_line_encountered = True
            final_malice_effect_line_encountered = True
        elif re.match(r"^[^1-9]{0,3}[1-9]\s*Malice.", ability_line):
            # This is a malice effect line, which is like a post-power-roll effect line but the effect costs
            # malice and the presence of the malice effect line doesn't preclude the existence of both types
            # of effect line.
            final_effect_line_encountered = True
            final_malice_effect_line_encountered = False
            malice_effect_lines.append(ability_line.strip())
        elif ability_line.startswith("Effect"):
            final_effect_line_encountered = False
            final_malice_effect_line_encountered = True
            effect_text = ability_line[len("Effect") :].strip()
            if power_roll_line_encountered:
                # We have already encountered a power roll line, so this is a post-power-roll effect.
                post_power_roll_effect_lines.append(effect_text)
            else:
                # We haven't encountered a power roll line yet, so this is a pre-power-roll effect.
                pre_power_roll_effect_lines.append(effect_text)
        elif malice_effect_lines:
            # We have already encountered a malice effect line, so we append the current line to the malice effect lines.
            malice_effect_lines.append(ability_line)
        elif pre_power_roll_effect_lines:
            # We have already encountered the pre-power-roll effect section and no other line signatures
            # matched this subsequent line, so we append the line to the effect line list.
            pre_power_roll_effect_lines.append(ability_line)
        elif post_power_roll_effect_lines:
            # We have already encountered the post-power-roll effect section and no other line signatures
            # matched this subsequent line, so we append the line to the effect line list.
            post_power_roll_effect_lines.append(ability_line)

        if final_malice_effect_line_encountered or index == len(ability_lines) - 2:
            # If we have already registered the final line of the current malice effect, or if we are at the last
            # line of the ability block as a whole, we commit the current malice effect to the model.
            if malice_effect_lines:
                model["maliceEffect"] = Effect(
                    text=" ".join(malice_effect_lines).replace("  ", " ").strip()
                )
                malice_effect_lines = []

        if final_effect_line_encountered or index == len(ability_lines) - 2:
            # If we have already registered the final line of the current effect, or if we are at the last
            # line of the ability block as a whole, we commit the current effect to the model.
            if pre_power_roll_effect_lines:
                # We have pre-power-roll effect lines, so we join them into a single effect description.
                model["prePowerRollEffect"] = Effect(
                    text=" ".join(pre_power_roll_effect_lines)
                    .replace("  ", " ")
                    .strip()
                )
                pre_power_roll_effect_lines = []
            elif post_power_roll_effect_lines:
                # We have post-power-roll effect lines, so we join them into a single effect description.
                model["postPowerRollEffect"] = Effect(
                    text=" ".join(post_power_roll_effect_lines)
                    .replace("  ", " ")
                    .strip()
                )
                post_power_roll_effect_lines = []

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
    ability_type = ABILITY_TYPE_MAP.get(type_key, "monsterTrait")

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

    name = (
        groups.get("traitName", "")
        if ability_type == "monsterTrait"
        else groups.get("abilityName")
    )

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


def split_ability_blocks(lines: list[str]) -> list[list[str]]:
    """Splits the text into ability blocks based on header detection—never merges separate headers."""
    blocks: list[list[str]] = []
    current_block: list[str] = []

    # Preprocess: flatten lines and strip
    flat_lines = [l.strip() for l in lines if l.strip()]

    for line in flat_lines:
        # Search for ability header pattern anywhere in the line
        header_found = False
        # for pat in ABILITY_HEADER_PATTERNS:
        # m = re.search(pat, line, re.IGNORECASE)
        m = ABILITY_HEADER_REGEX.match(line)
        if m:
            header_found = True
            # If current_block has content, flush it (it belongs to previous ability)
            if current_block:
                blocks.append(current_block)
            # If the header is not at the very start, split line
            if m.start() > 0:
                before = line[: m.start()].strip()  # type: ignore # noqa: F841
                after = line[m.start() :].strip()
                # Usually, anything before is junk or previous block content—ignore or flag
                # (If you want to print for review: print(f"Orphan pre-header content: '{before}'"))
                current_block = [after]
            else:
                current_block = [line]
            # break
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


def get_dict_without_none_values(input_dict: dict[str, Any]) -> dict[str, Any]:
    cleaned: dict[str, Any] = {}
    for key, value in input_dict.items():
        if isinstance(value, dict):
            nested = get_dict_without_none_values(value)  # type: ignore
            if nested:
                cleaned[key] = nested
        elif value is not None:
            cleaned[key] = value
    return cleaned


def get_foundry_item_model(actor_id: str, ability: Ability) -> dict[str, Any]:
    item_id = generate_id()

    item_model: dict[str, Any] = {
        "_id": item_id,
        "_key": f"!actors.items!{actor_id}.{item_id}",
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
            "maliceEffect": ability.get("maliceEffect", None),
            "postPowerRollEffect": ability.get("postPowerRollEffect", None),
        },
    }

    return get_dict_without_none_values(item_model)
