import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Pattern, Tuple

# --- Type Definitions ---


@dataclass
class MonsterHeader:
    name: str
    level: int
    type: str
    role: Optional[str]
    header_text: str
    start_idx: int
    end_idx: int


@dataclass
class MonsterBlock:
    header: MonsterHeader
    lines: List[str]
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

WEAKNESS_IMMUNITY_TYPES = {
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
TYPE_WHITELIST = ["minion", "horde", "platoon", "elite", "leader", "solo"]
ROLE_WHITELIST = [
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

KEYWORD_WHITELIST = set(
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
LEVEL_PATTERN = (
    r"L[e3][vvu][e1il|1lt]+"  # Removed (?i) – will use re.IGNORECASE on compile
)

TYPE_PATTERN = "|".join([rf"\b{t}\b" for t in TYPE_WHITELIST])
ROLE_PATTERN = "|".join([rf"\b{r}\b" for r in ROLE_WHITELIST])

# Known OCR fixup map
NAME_FIXUPS = {
    "_BUGBEAR COMMANDER": "BUGBEAR COMMANDER",
    "MOoHLER": "MOHLER",
    "Lacsi": "LAESI",
    "BopporrF BUCKFEATHER": "BODDORFF BUCKFEATHER",
    "iImit Putty": "IMIT PUTTY",
    "Memoriat Ivy": "MEMORIAL IVY",
    "MVURKOR": "VURKOR",
    # Add more as found
}

MINOR_WORDS = {"of", "the", "in", "on", "for", "and", "or", "to", "a"}


def is_noise_header(line: str) -> bool:
    return line.strip().upper() in (h.upper() for h in NOISE_HEADERS)


def normalize_keywords(keywords: List[str]) -> List[str]:
    fixed = []
    for k in keywords:
        k = fixup_name(k)
        if k.lower() == "human rival":
            fixed.extend(["Human", "Rival"])
        else:
            fixed.append(title_case(k))
    return fixed


def parse_row2_keywords_ev(lines: list) -> (list, int):
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
            normalized = []
            for c in candidates:
                tc = title_case(fixup_name(c))
                if tc in KEYWORD_WHITELIST:
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
    return [], None


def title_case(s: str) -> str:
    words = s.split()
    result = []
    for i, word in enumerate(words):
        lw = word.lower()
        if i == 0 or lw not in MINOR_WORDS:
            result.append(word.capitalize())
        else:
            result.append(lw)
    return " ".join(result)


def fixup_name(name: str) -> str:
    name = re.sub(r"^[^A-Za-z0-9]+", "", name)  # Strip leading non-alphanum
    name = name.strip()
    return NAME_FIXUPS.get(name, name)


def normalize_header_fields(header: MonsterHeader) -> MonsterHeader:
    name = title_case(fixup_name(header.name))
    type_ = title_case(header.type)
    role = title_case(header.role) if header.role else None
    return MonsterHeader(
        name=name,
        level=header.level,
        type=type_,
        role=role,
        header_text=header.header_text,
        start_idx=header.start_idx,
        end_idx=header.end_idx,
    )


def normalize_text(s: str) -> str:
    # Unicode normalize, replace curly quotes, collapse whitespace
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[‘’“”´`]", "'", s)  # curly/smart quotes to ascii
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def ocr_level_to_int(lvl_str: str) -> Optional[int]:
    # Extract integer, correcting O/0 confusion
    lvl_str = lvl_str.replace("O", "0")
    m = re.search(r"(\d+)", lvl_str)
    if m:
        return int(m.group(1))
    return None


# --- Header Regex Builder ---


def get_header_regex() -> Pattern:
    type_join = "|".join(TYPE_WHITELIST)
    role_join = "|".join(ROLE_WHITELIST)
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
    candidates = []
    for idx, line in enumerate(lines):
        norm = normalize_text(line)
        # Must contain an OCR'd LEVEL, a known type, and a number close to LEVEL (avoid prose)
        if (
            re.search(r"L[EV1I]{2,4}", norm, re.IGNORECASE)
            and re.search(r"\d", norm)
            and any(t in norm.upper() for t in [t.upper() for t in TYPE_WHITELIST])
            and not re.search(r"malice", norm, re.IGNORECASE)
        ):
            candidates.append((idx, norm))
    return candidates


# --- Header Parsing Core ---


def parse_header_line(line: str) -> Optional[Dict[str, Any]]:
    regex = get_header_regex()
    m = regex.search(line)
    if not m:
        return None
    gd = m.groupdict()
    name = fix_ocr_name(gd.get("name", "").strip(" |:-"))
    type_ = gd.get("type")
    role = gd.get("role")
    level = ocr_level_to_int(gd.get("level", ""))
    # Filter per rules: if type is solo/leader, role must not be present
    if type_ and type_.lower() in {"solo", "leader"}:
        role = None
    # Role must be last or nearly last (not followed by extra tokens except punctuation)
    # (This is already enforced by regex $ anchor and trailing junk)
    return dict(name=name, type=type_, role=role, level=level)


# --- Main Header Detection Function ---


def extract_headers_from_lines(lines: List[str]) -> List[MonsterHeader]:
    headers: List[MonsterHeader] = []
    candidates = get_header_candidates(lines)
    for idx, line in candidates:
        parsed = parse_header_line(line)
        if parsed and parsed["name"] and parsed["type"] and parsed["level"] is not None:
            header = MonsterHeader(
                name=parsed["name"],
                level=parsed["level"],
                type=parsed["type"].capitalize(),
                role=(parsed["role"].capitalize() if parsed["role"] else None),
                header_text=line,
                start_idx=idx,
                end_idx=idx,  # may be adjusted for multi-line headers in future
            )
            headers.append(header)

    headers = [normalize_header_fields(h) for h in headers]

    return headers


def parse_monster_row2(block_lines: List[str]) -> Tuple[List[str], Optional[int]]:
    keywords, encounter_value = parse_row2_keywords_ev(block_lines)
    keywords = normalize_keywords(keywords)
    return keywords, encounter_value


def parse_stamina(lines: List[str]) -> int:
    for line in lines:
        m = re.search(r"\bStamina\s+([0-9O]+)", line, re.IGNORECASE)
        if m:
            value = m.group(1).replace("O", "0")
            return int(value)
    return None  # Or raise, or log


def parse_speed_and_movement(lines: List[str]) -> tuple[int, List[str]]:
    for line in lines:
        m = re.search(r"\bSpeed\s+([0-9O]+)\s*(?:\(([^)]+)\))?", line, re.IGNORECASE)
        if m:
            value = m.group(1).replace("O", "0")
            movement_types = (
                [x.strip().lower() for x in m.group(2).split(",")]
                if m.group(2)
                else ["walk"]
            )
            return int(value), movement_types
    return None, []


def parse_size_and_stability(lines: List[str]) -> tuple[str, int]:
    for line in lines:
        m = re.search(
            r"\bSize\s+(\w+)\s*/\s*Stability\s*([0-9O]+)", line, re.IGNORECASE
        )
        if m:
            size = m.group(1)
            stability = int(m.group(2).replace("O", "0"))
            return size, stability
    return None, None


def parse_free_strike(lines: List[str]) -> int:
    for line in lines:
        m = re.search(r"\bFree Strike\s*([0-9O]+)", line, re.IGNORECASE)
        if m:
            value = m.group(1).replace("O", "0")
            return int(value)
    return None


def parse_characteristics(lines: List[str]) -> dict:
    for line in lines:
        m = re.findall(
            r"(Might|Agility|Reason|Intuition|Presence)\s*([+\-]?[0-9O]+)",
            line,
            re.IGNORECASE,
        )
        if m and len(m) == 5:
            d = {}
            for stat, val in m:
                d[stat.lower()] = int(val.upper().replace("O", "0"))
            return d
    return {}


def parse_with_captain(lines: list) -> dict:
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
    stat_end_idx = next(
        (
            i
            for i, line in enumerate(lines)
            if all(
                f in line.lower()
                for f in ["might", "agility", "reason", "intuition", "presence"]
            )
        ),
        len(lines),
    )
    for line in lines[: stat_end_idx + 1]:
        m = re.search(r"with captain\s*(.+)", line, re.IGNORECASE)
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
                return {"appliedCaptainEffects": {"temporaryStamina": value}}
            # Try all other bonus types
            for key, field_name in captain_bonus_map.items():
                if key in rest:
                    mval = re.search(r"([+\-]?\d+)", rest)
                    if mval:
                        return {
                            "derivedCaptainBonuses": {field_name: int(mval.group(1))}
                        }
                    else:
                        return {"derivedCaptainBonuses": {field_name: True}}
    return None


def find_last_stat_index(lines: list) -> int:
    for i, line in enumerate(lines):
        # Look for a line containing all 5 characteristic names (order doesn’t matter)
        fields = ["might", "agility", "reason", "intuition", "presence"]
        found = all(f in line.lower() for f in fields)
        if found:
            return i
    return len(lines)  # fallback: parse all


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


def parse_weakness_immunity(lines: list) -> (dict, dict):
    stat_end_idx = find_last_stat_index(lines)
    lines = lines[: stat_end_idx + 1]  # Only parse the metadata/stat section
    weakness, immunity = {}, {}
    for line in lines:
        line = line.replace("O", "0").replace("o", "0")
        for field in re.finditer(
            r"(Immunity|Weakness)\s+([^/|]+)", line, re.IGNORECASE
        ):
            label = field.group(1).lower()
            entries = field.group(2)
            for e in entries.split(","):
                e = e.strip()
                tokens = e.split()
                if len(tokens) == 2:
                    k, v = tokens
                else:
                    continue
                k_norm = normalize_weakness_immunity_type(k)
                if k_norm in WEAKNESS_IMMUNITY_TYPES:
                    try:
                        if label == "immunity":
                            immunity[k_norm] = int(v)
                        else:
                            weakness[k_norm] = int(v)
                    except Exception:
                        continue
                else:
                    print(
                        f"Unknown Weakness/Immunity type: {k!r} normalized as {k_norm!r} in entry: {e!r}"
                    )
    return (weakness or None, immunity or None)


def parse_stats_from_block(block: MonsterBlock) -> dict:
    # Copy header fields
    stats = {
        "name": block.header.name,
        "level": block.header.level,
        "type": block.header.type,
        "role": block.header.role,
        "header_text": block.header.header_text,
    }
    stats["keywords"], stats["encounterValue"] = parse_monster_row2(block.lines)
    stats["stamina"] = parse_stamina(block.lines)
    stats["speed"], stats["movementTypes"] = parse_speed_and_movement(block.lines)
    stats["size"], stats["stability"] = parse_size_and_stability(block.lines)
    stats["freeStrikeDamage"] = parse_free_strike(block.lines)
    stats["characteristics"] = parse_characteristics(block.lines)

    # Optional fields:
    stats["weakness"], stats["immunity"] = parse_weakness_immunity(block.lines)
    if block.header.type.lower() == "minion":
        captain_result = parse_with_captain(block.lines)
        if captain_result:
            stats.update(captain_result)
    # ... other optionals here
    return stats


def blockify_monsters(
    lines: List[str], headers: List[MonsterHeader]
) -> List[MonsterBlock]:
    blocks = []
    header_indices = [h.start_idx for h in headers]
    num_lines = len(lines)
    header_line_set = set(header_indices)
    for i, header in enumerate(headers):
        start = header.start_idx + 1
        end = num_lines
        j = start
        while j < num_lines:
            # 1. Next detected monster header
            if j in header_line_set and j != header.start_idx:
                end = j
                break
            # 2. New page (always stop at next left marker)
            if PAGE_LEFT_MARKER.match(lines[j]):
                end = j
                break
            # 3. Explicit noise header (e.g., ENCOUNTER D4)
            if is_noise_header(lines[j]):
                end = j
                break
            j += 1

        # Remove footers and all page/column markers from output
        block_lines = [
            l
            for l in lines[start:end]
            if not FOOTER_RE.search(l) and not PAGE_MARKER.match(l)
        ]
        raw_text = "".join(block_lines)
        blocks.append(MonsterBlock(header=header, lines=block_lines, raw_text=raw_text))
    return blocks


# --- Example Usage ---

if __name__ == "__main__":
    with open(
        "c:/_/aeon/fvtt-system-draw-steel/scripts/pdf-parser/full_combined_ocr.txt",
        encoding="utf-8",
    ) as f:
        lines = f.readlines()

    headers = extract_headers_from_lines(lines)
    blocks = blockify_monsters(lines, headers)

    # Now you can process each monster block independently:
    print(f"Found {len(blocks)} monster blocks:")
    for block in blocks:
        # print(block.header.name, "block has", len(block.lines), "lines")
        parsed_block: dict[str, Any] = parse_stats_from_block(
            block
        )  # Example of parsing stats

        if block.header.name == "Mystic Queen Bargnot":
            print((f"{parsed_block}").replace("'", '"').replace("None", "null"))
        # print(f"Parsed stats for {block.header.name}: {parsed_block}")
