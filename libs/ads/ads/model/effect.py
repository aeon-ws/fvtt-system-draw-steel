from typing import Literal, Optional, TypedDict

from ads.model.immunity_or_weakness import ImmunityOrWeakness


class Effect(TypedDict, total=False):
    text: str

    targets: str
    duration: Optional[Literal["startOfTargetTurn", "endOfTargetTurn", "saveEnds", "endOfEncounter"]]

    bleeding: bool
    frightened: bool
    grabbed: bool
    noEffect: bool
    prone: bool
    restrained: bool
    slowed: bool
    taunted: bool
    weakened: bool
    weakness: Optional[ImmunityOrWeakness]


class PotencyEffect(TypedDict, total=False):
    targetCharacteristic: Literal["might", "agility", "reason", "intuition", "presence"]
    value: int
    effect: Effect
