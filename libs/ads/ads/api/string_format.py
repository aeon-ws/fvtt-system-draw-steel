import re

NAME_FIXUPS = {
    "MOoHLER": "MOHLER",
    "Lacsi": "LAESI",
    "BopporrF BUCKFEATHER": "BODDORFF BUCKFEATHER",
    "iImit Putty": "IMIT PUTTY",
    "Memoriat Ivy": "MEMORIAL IVY",
    "MVURKOR": "VURKOR",
    "WorRG": "WORG",
    "GoBun": "Goblin",
    "GoBLIN": "Goblin",
    "GOBUN": "GOBLIN",
}

MINOR_WORDS = {"of", "the", "in", "on", "for", "and", "or", "to", "a"}


def title_case(any_case_value: str) -> str:
    words = any_case_value.split()
    result: list[str] = []
    for i, word in enumerate(words):
        word_as_lower_case = word.lower()
        if i == 0 or word_as_lower_case not in MINOR_WORDS:
            result.append(word.capitalize())
        else:
            result.append(word_as_lower_case)
    return " ".join(result)


def sanitize_name(raw_name: str) -> str:
    sanitized_name = re.sub(r"^[^A-Za-z0-9]+", "", raw_name).strip()
    return NAME_FIXUPS.get(sanitized_name, sanitized_name)
