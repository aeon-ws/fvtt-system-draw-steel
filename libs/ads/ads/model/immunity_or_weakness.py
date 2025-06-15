from typing import TypedDict


class ImmunityOrWeakness(TypedDict, total=False):
    acid: int
    cold: int
    corruption: int
    damage: int
    fire: int
    holy: int
    lightning: int
    poison: int
    psychic: int
    sonic: int
