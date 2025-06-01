import re
import uuid
from typing import Any, Dict, List

import yaml


def generate_id() -> str:
    return uuid.uuid4().hex[:16]


# These are your whitelist keyword definitions
KEYWORDS_WHITELIST = {
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
}


def extract_keywords(text: str) -> List[str]:
    # Look for keywords on the first few lines
    for line in text.splitlines()[:6]:
        for kw in sorted(KEYWORDS_WHITELIST, key=len, reverse=True):
            if kw in line:
                if kw == "Human Rival":
                    return ["Human", "Rival"]
                return [kw]
    return []


def parse_power_roll_tiers(block: str) -> Dict[str, Any]:
    tiers = {}
    for label, key in [("≤11", "tier1"), ("12-16", "tier2"), ("17+", "tier3")]:
        match = re.search(rf"{re.escape(label)}\s*(\d+)\s*damage", block)
        if match:
            tiers[key] = {"damage": int(match.group(1))}
    return tiers


def parse_monster_block(block_text: str) -> Dict[str, Any]:
    """
    Parse a monster stat block and return its structured data.
    """
    name, header = extract_monster_header(block_text)
    if not name:
        raise ValueError("Failed to extract monster header.")

    parsed_stats = extract_monster_stats(block_text)
    parsed_stats["name"] = name
    parsed_stats["keywords"] = extract_keywords(block_text)

    abilities = extract_abilities(block_text)
    items = []
    for ability in abilities:
        if ability["type"] == "enemyTrait":
            items.append(
                {
                    "_id": generate_id(),
                    "name": ability["name"],
                    "type": "enemyTrait",
                    "img": "icons/svg/aura.svg",
                    "system": {"name": ability["name"], "text": ability["text"]},
                }
            )
        else:
            item = {
                "_id": generate_id(),
                "name": ability["name"],
                "type": "ability",
                "img": "icons/svg/book.svg",
                "system": {
                    "name": ability["name"],
                    "description": ability["description"],
                    "keywords": ability["keywords"],
                    "type": ability["actionType"],
                    "maliceCost": ability["maliceCost"],
                    "distance": ability["distance"],
                    "target": ability["target"],
                    "powerRoll": {
                        "bonus": ability["powerRoll"]["bonus"],
                        "tier1": {"damage": ability["powerRoll"]["tier1"]["damage"]},
                        "tier2": {"damage": ability["powerRoll"]["tier2"]["damage"]},
                        "tier3": {"damage": ability["powerRoll"]["tier3"]["damage"]},
                    },
                },
            }

            if ability["postPowerRollEffect"]["text"]:
                item["system"]["postPowerRollEffect"] = {
                    "text": ability["postPowerRollEffect"]["text"]
                }

            items.append(item)

    actor_data = {
        "_id": generate_id(),
        "_key": f"!actors!{generate_id()}",
        "name": parsed_stats["name"],
        "type": parsed_stats["type"].lower(),
        "img": "icons/svg/mystery-man.svg",
        "prototypeToken": {
            "name": parsed_stats["name"],
            "displayName": 50,
            "displayBars": 50,
            "bar1": {"attribute": "stamina"},
            "bar2": {"attribute": None},
            "disposition": -1,
            "actorLink": False,
            "width": int(parsed_stats["combat"]["size"])
            if parsed_stats["combat"]["size"].isdigit()
            else 1,
            "height": int(parsed_stats["combat"]["size"])
            if parsed_stats["combat"]["size"].isdigit()
            else 1,
            "lockRotation": True,
            "texture": {"img": "icons/svg/mystery-man.svg"},
        },
        "system": {
            "name": parsed_stats["name"],
            "keywords": parsed_stats["keywords"],
            "level": parsed_stats["level"],
            "type": parsed_stats["type"],
            "role": parsed_stats.get("role", ""),
            "encounterValue": parsed_stats["encounterValue"],
            "characteristics": parsed_stats["characteristics"],
            "stamina": parsed_stats["stamina"],
            "combat": parsed_stats["combat"],
            **(
                {"immunity": parsed_stats["immunity"]}
                if "immunity" in parsed_stats
                else {}
            ),
            **(
                {"weakness": parsed_stats["weakness"]}
                if "weakness" in parsed_stats
                else {}
            ),
            **(
                {"derivedCaptainBonuses": parsed_stats["derivedCaptainBonuses"]}
                if "derivedCaptainBonuses" in parsed_stats
                else {}
            ),
            **(
                {"appliedCaptainEffects": parsed_stats["appliedCaptainEffects"]}
                if "appliedCaptainEffects" in parsed_stats
                else {}
            ),
        },
        "items": items,
    }

    return actor_data
