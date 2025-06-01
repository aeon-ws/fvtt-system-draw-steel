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


# --- Constants and Whitelists ---

# Accept OCR variants, fuzzy matching later
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


# --- Example Usage ---

if __name__ == "__main__":
    with open("full_combined_ocr.txt", encoding="utf-8") as f:
        lines = f.readlines()

    headers = extract_headers_from_lines(lines)
    print("Headers found:")
    for h in headers:
        print(h)

    # Diagnostics: print possible headers not matched by regex
    print("\n--- Header Candidates NOT Matched ---")
    candidate_lines = get_header_candidates(lines)
    for idx, line in candidate_lines:
        if not parse_header_line(line):
            print(f"[{idx}] {line}")
