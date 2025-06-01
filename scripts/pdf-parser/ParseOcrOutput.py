import re
import uuid
from pathlib import Path
from typing import Any, Dict, List

# === CONFIGURATION ===
OCR_TEXT_PATH = "C:/_/aeon/fvtt-system-draw-steel/ocr-output/full_combined_ocr.txt"
VALID_TYPES = {"Minion", "Horde", "Platoon", "Elite", "Leader", "Solo"}
VALID_ROLES = {
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
}
NAME_CORRECTIONS = {
    "Mvurkor": "Vurkor",
    "Of the River": "Flow of the River",
    "Queen Bargnot": "Mystic Queen Bargnot",
    "Buckfeather": "Boddorff Buckfeather",
}
# If you want to expand this for more known fixes, add here.


# === HELPERS ===
def generate_id() -> str:
    return uuid.uuid4().hex[:16]


def normalize_o_to_zero(s: str) -> str:
    return re.sub(r"([+-])O\b", r"\g<1>0", s).replace("O", "0")


def correct_name(name: str) -> str:
    for wrong, right in NAME_CORRECTIONS.items():
        if wrong in name:
            return name.replace(wrong, right)
    return name


def extract_headers(lines: List[str]) -> List[Dict[str, Any]]:
    headers = []
    for idx, line in enumerate(lines):
        norm_line = re.sub(r"[^A-Za-z0-9 '\-]", "", line).strip()
        if "LEVEL" not in norm_line.upper():
            continue
        # Header: "NAME LEVEL X TYPE ROLE" or "NAME LEVEL X TYPE"
        pattern = re.compile(
            r"^(.*?)\s+LEVEL\s+(\d+)\s+("
            + "|".join(VALID_TYPES)
            + r")"
            + r"(?:\s+("
            + "|".join(VALID_ROLES)
            + r"))?$",
            re.IGNORECASE,
        )
        match = pattern.match(norm_line)
        if match:
            name, level, type_, role = match.groups()
            name = correct_name(name.strip().title())
            headers.append(
                {
                    "line": idx,
                    "name": name,
                    "level": int(level),
                    "type": type_.capitalize(),
                    "role": role.capitalize() if role else "",
                }
            )
    return headers


def segment_blocks(
    headers: List[Dict[str, Any]], lines: List[str]
) -> List[Dict[str, Any]]:
    blocks = []
    for i, header in enumerate(headers):
        start = header["line"]
        end = headers[i + 1]["line"] if i + 1 < len(headers) else len(lines)
        block = lines[start:end]
        blocks.append({"header": header, "lines": block})
    return blocks


def parse_main_stats(block_lines: List[str]) -> Dict[str, Any]:
    # Convert to one string for easier regex
    block_text = "\n".join(block_lines)
    block_text = normalize_o_to_zero(block_text)

    # Keywords and EV
    keywords_match = re.search(r"([A-Za-z, ]+) EV (\d+)", block_text)
    keywords = []
    ev = 0
    if keywords_match:
        kw_str, ev = keywords_match.groups()
        keywords = [k.strip() for k in kw_str.split(",") if k.strip()]
        ev = int(ev)

    # Stamina
    stamina_match = re.search(r"Stamina\s+(\d+)", block_text)
    stamina = int(stamina_match.group(1)) if stamina_match else 0

    # Speed, movement, size, stability
    spd_match = re.search(r"Speed\s+(\d+)(?:\s*\((.*?)\))?", block_text)
    speed = int(spd_match.group(1)) if spd_match else 0
    movement_types = (
        [t.strip() for t in spd_match.group(2).split(",")]
        if spd_match and spd_match.group(2)
        else ["walk"]
    )

    size_match = re.search(r"Size\s*([0-9]+[A-Z]?)", block_text)
    size = size_match.group(1) if size_match else "1"

    stab_match = re.search(r"Stability\s*(\d+)", block_text)
    stability = int(stab_match.group(1)) if stab_match else 0

    fs_match = re.search(r"Free Strike\s*(\d+)", block_text)
    free_strike = int(fs_match.group(1)) if fs_match else 0

    # Characteristics
    char_match = re.search(
        r"Might\s*([+-]?\d+)\s*Agility\s*([+-]?\d+)\s*Reason\s*([+-]?\d+)\s*Intuition\s*([+-]?\d+)\s*Presence\s*([+-]?\d+)",
        block_text,
    )
    if char_match:
        chars = [int(x) for x in char_match.groups()]
        keys = ["might", "agility", "reason", "intuition", "presence"]
        characteristics = dict(zip(keys, chars))
    else:
        characteristics = {
            k: 0 for k in ["might", "agility", "reason", "intuition", "presence"]
        }

    return {
        "keywords": keywords,
        "encounterValue": ev,
        "stamina": stamina,
        "speed": speed,
        "movementTypes": movement_types,
        "size": size,
        "stability": stability,
        "freeStrikeDamage": free_strike,
        "characteristics": characteristics,
    }


def build_yaml_block(monster: Dict[str, Any], stats: Dict[str, Any]) -> str:
    out = {
        "_id": generate_id(),
        "_key": f"!actors!{generate_id()}",
        "name": monster["name"],
        "type": monster["type"].lower(),
        "img": "icons/svg/mystery-man.svg",
        "prototypeToken": {
            "name": monster["name"],
            "displayName": 50,
            "displayBars": 50,
            "bar1": {"attribute": "stamina"},
            "bar2": {"attribute": None},
            "disposition": -1,
            "actorLink": False,
            "width": 1,  # You can use size parsing if you want (int(stats["size"][0]))
            "height": 1,
            "lockRotation": True,
            "texture": {"img": "icons/svg/mystery-man.svg"},
        },
        "system": {
            "name": monster["name"],
            "keywords": stats["keywords"],
            "level": monster["level"],
            "type": monster["type"],
            "role": monster.get("role", ""),
            "encounterValue": stats["encounterValue"],
            "characteristics": stats["characteristics"],
            "stamina": {"max": stats["stamina"], "value": stats["stamina"]},
            "combat": {
                "size": stats["size"],
                "stability": stats["stability"],
                "speed": stats["speed"],
                "movementTypes": stats["movementTypes"],
                "freeStrikeDamage": stats["freeStrikeDamage"],
            },
        },
        "items": [],
    }
    import yaml

    return yaml.dump(out, allow_unicode=True, sort_keys=False)


# === MAIN SCRIPT ===
if __name__ == "__main__":
    lines = [
        normalize_o_to_zero(line.rstrip())
        for line in Path(OCR_TEXT_PATH).read_text(encoding="utf-8").splitlines()
    ]
    headers = extract_headers(lines)
    blocks = segment_blocks(headers, lines)
    print(f"Found {len(blocks)} monster stat blocks.")

    # For testing, show YAML for a chosen monster (e.g. Werewolf or Mystic Queen Bargnot)
    test_name = "Werewolf"
    test_block = next(
        (b for b in blocks if b["header"]["name"].lower() == test_name.lower()), None
    )
    if test_block:
        stats = parse_main_stats(test_block["lines"])
        print(build_yaml_block(test_block["header"], stats))
    else:
        print(f"Monster '{test_name}' not found.")
