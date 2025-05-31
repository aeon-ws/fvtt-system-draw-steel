import random
import re
from typing import Any, Dict, List

import pdfplumber

# PDF_FILE = "Delian Tomb Encounters Book pages 5-6.pdf"
PDF_FILE = (
    "c:/_/aeon/fvtt-system-draw-steel/Draw Steel - Delian Tomb - Monsters - 2025-04.pdf"
)

KEYWORD_WHITELIST = {
    "abyssal",
    "accursed",
    "animal",
    "beast",
    "construct",
    "dragon",
    "elemental",
    "fey",
    "giant",
    "horror",
    "humanoid",
    "infernal",
    "plant",
    "swarm",
    "undead",
    "mystic goblin",
    "goblin",
    "ruinborn",
    "bugbear",
    "werebeast",
    "water wolf",
    "rival",
    "arixx",
    "human",
    "dwarf",
    "polder",
    "ooze",
    "angulotl",
    "ankheg",
    "basilisk",
    "bredbeddle",
    "chimera",
    "demon",
    "soulraker",
    "devil",
    "planar",
    "draconian",
    "high elf",
    "shadow elf",
    "wode elf",
    "fire giant",
    "frost giant",
    "storm giant",
    "stone giant",
    "hill giant",
    "gnoll",
    "griffon",
    "hag",
    "hobgoblin",
    "worm",
    "kobold",
    "lightbender",
    "lizardfolk",
    "manticore",
    "medusa",
    "minotaur",
    "ogre",
    "olothec",
    "radenwight",
    "shambling mound",
    "time raider",
    "troll",
    "mummy",
    "vampire",
    "corporeal",
    "incorporeal",
    "multivok",
    "valok",
    "servok",
    "voiceless talker",
    "war dog",
    "wyvern",
    "overmind",
    "eyestalk",
}
# All in lowercase for comparison


def extract_keywords_and_ev(line: str) -> tuple[List[str], int]:
    import re

    ev_match = re.search(r"EV\s*(\d+)", line)
    if not ev_match:
        raise ValueError("No encounter value (EV) found.")
    pre_ev = line[: ev_match.start()].strip()
    pre_ev_lc = pre_ev.lower()

    # Special handling for "human rival" error:
    if "human rival" in pre_ev_lc:
        pre_ev_lc = pre_ev_lc.replace("human rival", "human,rival")

    # Try to match whole keywords in whitelist, longest keywords first to catch multi-word
    sorted_keywords = sorted(KEYWORD_WHITELIST, key=lambda k: -len(k))
    found = []
    used = set()
    rest = pre_ev_lc
    while rest:
        matched = False
        for k in sorted_keywords:
            if k in used:
                continue
            pat = r"\b" + re.escape(k) + r"\b"
            m = re.search(pat, rest)
            if m:
                found.append(k)
                used.add(k)
                # Remove this keyword from rest to prevent duplicate matches
                rest = rest[: m.start()] + " " * (m.end() - m.start()) + rest[m.end() :]
                matched = True
                break
        if not matched:
            break

    # Title-case all keywords for output
    keywords = [w.title() for w in found]
    return keywords, int(ev_match.group(1))


def generate_id() -> str:
    return "".join(random.choices("0123456789abcdef", k=16))


def normalize(s: str) -> str:
    # Normalize dashes and unicode numerals
    import unicodedata

    s = s.replace("−", "-").replace("–", "-").replace("—", "-").replace("＋", "+")
    return "".join(
        ch if ch.isascii() else unicodedata.normalize("NFKD", ch) for ch in s
    )


def size_to_int(size_str: str) -> int:
    m = re.match(r"(\d+)", size_str)
    return int(m.group(1)) if m else 1


def extract_stat_blocks(text: str) -> List[List[str]]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    # Identify all lines with LEVEL <number> (header)
    header_re = re.compile(r"LEVEL\s+\d+", re.IGNORECASE)
    header_indices = [i for i, line in enumerate(lines) if header_re.search(line)]
    blocks = []
    for idx, start in enumerate(header_indices):
        end = header_indices[idx + 1] if idx + 1 < len(header_indices) else len(lines)
        blocks.append(lines[start:end])
    return blocks


def parse_stat_block_fuzzy(lines: List[str]) -> Dict[str, Any]:
    import re

    def normalize(s: str) -> str:
        import unicodedata

        s = s.replace("−", "-").replace("–", "-").replace("—", "-").replace("＋", "+")
        return "".join(
            ch if ch.isascii() else unicodedata.normalize("NFKD", ch) for ch in s
        )

    def size_to_int(size_str: str) -> int:
        m = re.match(r"(\d+)", size_str)
        return int(m.group(1)) if m else 1

    # 1. Find header line
    header_line = None
    for line in lines:
        m = re.search(
            r"([A-Z][A-Za-z0-9 .'\-]+) LEVEL (\d+) ([A-Z]+)(?: ([A-Z]+))?", line
        )
        if m:
            header_line = line
            break
    if not header_line:
        raise ValueError(f"No header found in block: {lines[:5]}")
    # Remove prefix junk before header, if any
    m = re.search(r"([A-Z][A-Za-z0-9 .'\-]+ LEVEL \d+ [A-Z]+( [A-Z]+)?)", header_line)
    header_line = m.group(1).strip() if m else header_line.strip()
    # Parse header as before, with leader/solo logic
    m = re.match(
        r"^([A-Z][A-Za-z0-9 .'\-]+) LEVEL (\d+) ([A-Z]+) ([A-Z]+)$", header_line
    )
    if m:
        name, level, type_, role = m.groups()
        if type_.capitalize() in ("Leader", "Solo"):
            role = None
        else:
            role = role.capitalize()
        type_ = type_.capitalize()
    else:
        m = re.match(r"^([A-Z][A-Za-z0-9 .'\-]+) LEVEL (\d+) ([A-Z]+)$", header_line)
        if m:
            name, level, type_ = m.groups()
            type_ = type_.capitalize()
            role = None
            if type_ not in ("Leader", "Solo"):
                raise ValueError(
                    f"Header missing role, but type is {type_}: {header_line}"
                )
        else:
            raise ValueError(f"Could not match header: {header_line}")
    name = name.title()
    level = int(level)

    # 2. Find keywords and EV in first 5 lines using strict logic
    encounter_value = None
    keywords = None
    for line in lines[:5]:
        try:
            keywords, encounter_value = extract_keywords_and_ev(line)
            break
        except ValueError:
            continue
    if not keywords or encounter_value is None:
        raise ValueError("Keywords/EV not found.")

    # 3. Parse all critical stats anywhere in the block
    stamina = None
    combat = {
        "size": None,
        "stability": None,
        "speed": None,
        "movementTypes": None,
        "freeStrikeDamage": None,
    }
    characteristics = {}
    immunity = None
    weakness = None
    derivedCaptainBonuses = None
    appliedCaptainEffects = None

    # Parse characteristics from a line containing all 5
    for line in lines:
        nline = normalize(line)
        if all(
            label in nline
            for label in ["Might", "Agility", "Reason", "Intuition", "Presence"]
        ):
            numbers = re.findall(
                r"(?:Might|Agility|Reason|Intuition|Presence)\s*([+-]?\d+)", nline
            )
            if len(numbers) == 5:
                keys = ["might", "agility", "reason", "intuition", "presence"]
                characteristics = {k: int(v) for k, v in zip(keys, numbers)}
            break

    # Parse stamina, size, stability, speed, free strike, immunity, weakness
    for line in lines:
        nline = normalize(line)
        # Stamina
        if stamina is None:
            m = re.search(r"Stamina\s+(\d+)", nline)
            if m:
                stamina = {"max": int(m.group(1)), "value": int(m.group(1))}
        # Size/Stability (in any order)
        if combat["size"] is None:
            m = re.search(r"Size\s*([^\s/]+)", nline)
            if m:
                combat["size"] = m.group(1)
        if combat["stability"] is None:
            m = re.search(r"Stability\s*(\d+)", nline)
            if m:
                combat["stability"] = int(m.group(1))
        # Speed
        if combat["speed"] is None:
            m = re.search(r"Speed\s*(\d+)", nline)
            if m:
                combat["speed"] = int(m.group(1))
                combat["movementTypes"] = ["walk"]
        # Free Strike
        if combat["freeStrikeDamage"] is None:
            m = re.search(r"Free Strike\s*(\d+)", nline)
            if m:
                combat["freeStrikeDamage"] = int(m.group(1))
        # Immunity
        if immunity is None and "Immunity" in nline:
            m = re.search(r"Immunity\s+([a-z0-9 ,]+)", nline, re.IGNORECASE)
            if m:
                immunity = {}
                entries = m.group(1).split(",")
                for entry in entries:
                    parts = entry.strip().split()
                    if len(parts) == 2:
                        immunity[parts[0]] = int(parts[1])
        # Weakness
        if weakness is None and "Weakness" in nline:
            m = re.search(r"Weakness\s+([a-z0-9 ,]+)", nline, re.IGNORECASE)
            if m:
                weakness = {}
                entries = m.group(1).split(",")
                for entry in entries:
                    parts = entry.strip().split()
                    if len(parts) == 2:
                        weakness[parts[0]] = int(parts[1])
        # Captain bonuses/effects
        if derivedCaptainBonuses is None and "derivedCaptainBonuses" in nline:
            m = re.search(r"derivedCaptainBonuses: (.+)", nline, re.IGNORECASE)
            if m:
                derivedCaptainBonuses = {}
                for pair in m.group(1).split(","):
                    k, v = pair.strip().split(" ")
                    derivedCaptainBonuses[k] = int(v)
        if appliedCaptainEffects is None and "appliedCaptainEffects" in nline:
            m = re.search(r"appliedCaptainEffects: (.+)", nline, re.IGNORECASE)
            if m:
                appliedCaptainEffects = {}
                for pair in m.group(1).split(","):
                    k, v = pair.strip().split(" ")
                    if k == "temporaryStamina":
                        appliedCaptainEffects[k] = int(v)
    # Validation for fatal fields
    missing = []
    if not name:
        missing.append("name")
    if not level:
        missing.append("level")
    if not type_:
        missing.append("type")
    if encounter_value is None:
        missing.append("encounter_value")
    if not keywords:
        missing.append("keywords")
    if not characteristics or len(characteristics) != 5:
        missing.append("characteristics")
    if stamina is None:
        missing.append("stamina")
    for f in ("size", "stability", "speed", "freeStrikeDamage"):
        if combat[f] is None:
            missing.append(f"combat.{f}")
    if missing:
        raise ValueError(f"Missing critical fields: {missing}")

    # Token width/height from size
    width = height = size_to_int(combat["size"])

    # Unique ID
    actor_id = generate_id()

    # Build system dict
    system: Dict[str, Any] = {
        "name": name,
        "keywords": keywords,
        "level": level,
        "type": type_,
        "role": role,
        "encounterValue": encounter_value,
        "characteristics": characteristics,
        "stamina": stamina,
        "combat": combat,
    }
    if immunity:
        system["immunity"] = immunity
    if weakness:
        system["weakness"] = weakness
    if derivedCaptainBonuses:
        system["derivedCaptainBonuses"] = derivedCaptainBonuses
    if appliedCaptainEffects:
        system["appliedCaptainEffects"] = appliedCaptainEffects

    yaml_entry: Dict[str, Any] = {
        "_id": actor_id,
        "_key": f"!actors!{actor_id}",
        "name": name,
        "type": type_.lower(),
        "img": "icons/svg/mystery-man.svg",
        "prototypeToken": {
            "name": name,
            "displayName": 50,
            "displayBars": 50,
            "bar1": {"attribute": "stamina"},
            "bar2": {"attribute": None},
            "disposition": -1,
            "actorLink": False,
            "width": width,
            "height": height,
            "lockRotation": True,
            "texture": {"img": "icons/svg/mystery-man.svg"},
        },
        "system": system,
        "items": [],
    }
    return yaml_entry


# Main driver (replace your main())
def main():
    import yaml

    with pdfplumber.open(PDF_FILE) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    blocks = extract_stat_blocks(text)
    for block_lines in blocks:
        try:
            monster = parse_stat_block_fuzzy(block_lines)
            fname = re.sub(r"[^a-z0-9]+", "-", monster["name"].strip().lower()) + ".yml"
            with open(
                f"c:/_/aeon/fvtt-system-draw-steel/packs/_source/monsters/{fname}",
                "w",
                encoding="utf-8",
            ) as f:
                yaml.dump(monster, f, allow_unicode=True, sort_keys=False)
            print(f"Wrote {fname}")
        except Exception as e:
            print(f"Parse error: {e}")
            print("Block header:", block_lines[0])


if __name__ == "__main__":
    main()
