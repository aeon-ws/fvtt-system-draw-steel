import re
from pathlib import Path
from typing import Dict, List

# === CONFIGURATION ===
OCR_TEXT_PATH = "full_combined_ocr.txt"

# Valid types and roles for fuzzy matching/correction
VALID_TYPES = ["Minion", "Horde", "Platoon", "Elite", "Leader", "Solo"]
VALID_ROLES = [
    "Ambusher",
    "Artillery",
    "Brute",
    "Controller",
    "Defender",
    "Harrier",
    "Hexer",
    "Mount",
    "Support",
    "Skirmisher",
]
NAME_CORRECTIONS = {
    "Mvurkor": "Vurkor",
    "Of the River": "Flow of the River",
    "Queen Bargnot": "Mystic Queen Bargnot",
    "BopporrF BUCKFEATHER": "Boddorff Buckfeather",
}

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


# Prepare lowercase sets for correction
valid_types_lower = [v.lower() for v in VALID_TYPES]
valid_roles_lower = [v.lower() for v in VALID_ROLES]

# Acceptable OCR mangles for 'LEVEL'
LEVEL_PATTERNS = [
    "level",
    "leve1",
    "levei",
    "levet",
    "levelt",
    "levei",
    "leuel",
    "leuel",
    "leuel",
    "levei",
    "leuel",
    "leuel",
    "leve1",
    "levei",
]
LEVEL_REGEX = "|".join([re.escape(l) for l in LEVEL_PATTERNS])

# Fuzzy fixups for obvious OCR errors in type/role
FUZZY_TYPE_FIX = {
    "minton": "minion",
    "evite": "elite",
    "leuel": "level",
    "levei": "level",
    "leve1": "level",
    "levet": "level",
    "levelt": "level",
    "evuel": "elite",
    "evile": "elite",
}
FUZZY_ROLE_FIX = {"defende": "defender"}


def fuzzy_correct(
    word: str, valid_list: List[str], fix_map: Dict[str, str] = None
) -> str:
    w = word.lower()
    if fix_map and w in fix_map:
        w = fix_map[w]
    # Closest valid (case-insensitive) or fallback to original
    candidates = [v for v in valid_list if v.startswith(w[:4])]
    return candidates[0] if candidates else word


# === HEADER EXTRACTION ===
def extract_monster_headers(ocr_lines: List[str]) -> List[Dict]:
    headers = []
    for idx, line in enumerate(ocr_lines):
        lraw = line
        l = line.strip()
        if not l or "malice" in l.lower():
            continue
        # Only consider lines containing "level" (various OCR mangles), with a number after it
        if not re.search(r"le?ve[l1it]", l.lower()):
            continue
        # Try to match: <name> LEVEL <number> <type> [role] [minor trailing junk]
        m = re.match(
            r"""^[\[\('"\- ]*
            (?P<name>[A-Z][A-Za-z0-9 \-']+?)\s+
            (?:Le?ve[l1it]{1,2}|Levet|Levelt?)\s*
            (?P<level>\d+)\s+
            (?P<type>[A-Za-z]+)
            (?:\s+(?P<role>[A-Za-z]+))?
            [\]\|\'"\-~ _]*$
            """,
            l,
            re.IGNORECASE | re.VERBOSE,
        )
        if m:
            name, level, typ, role = m.group("name", "level", "type", "role")
            typ = FUZZY_TYPE_FIX.get(typ.lower(), typ.lower())
            typ = fuzzy_correct(typ, valid_types_lower, FUZZY_TYPE_FIX).capitalize()
            role_out = ""
            if role:
                role = FUZZY_ROLE_FIX.get(role.lower(), role.lower())
                # Only accept if role is valid and is at the end of the line (allowing for minor trailing junk)
                role_clean = fuzzy_correct(
                    role, valid_roles_lower, FUZZY_ROLE_FIX
                ).capitalize()
                post_role = l[m.end("role") :]
                # Only allow a little junk after role (nothing or just punctuation/whitespace)
                if role_clean in VALID_ROLES and (
                    not post_role or post_role.strip("-|~_ '\"\t") == ""
                ):
                    role_out = role_clean
                else:
                    role_out = ""
            headers.append(
                {
                    "index": idx,
                    "name": name.strip().title(),
                    "level": int(level),
                    "type": typ,
                    "role": role_out,
                    "line": lraw,
                }
            )
    return headers


# === USAGE ===
if __name__ == "__main__":
    ocr_lines = Path(OCR_TEXT_PATH).read_text(encoding="utf-8").splitlines()
    monster_headers = extract_monster_headers(ocr_lines)
    for h in monster_headers:
        print(
            f"{h['index']:04d}: {h['name']} | Level: {h['level']} | Type: {h['type']} | Role: {h['role']} | Raw: {h['line']}"
        )
    print(f"\nFound {len(monster_headers)} monster headers.")
