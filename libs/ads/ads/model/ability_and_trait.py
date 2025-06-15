from typing import List, Literal, NotRequired, Optional, TypedDict

from ads.model.distance_and_target import Distance, Target
from ads.model.effect import Effect
from ads.model.power_roll import PowerRoll


class Ability(TypedDict):
    name: str
    type: Literal[
        "freeMainAction",
        "freeManeuver",
        "freeTriggeredAction",
        "mainAction",
        "maneuver",
        "triggeredAction",
        "monsterTrait",
        "villainAction",
    ]
    villainActionOrdinal: NotRequired[Optional[int]]
    maliceCost: NotRequired[Optional[int]]
    powerRoll: NotRequired[Optional[PowerRoll]]
    keywords: List[str]
    distance: NotRequired[Optional[Distance]]
    target: NotRequired[Optional[Target]]
    trigger: NotRequired[Optional[str]]
    prePowerRollEffect: NotRequired[Optional[Effect]]
    maliceEffect: NotRequired[Optional[Effect]]
    isSignature: NotRequired[Optional[bool]]
    postPowerRollEffect: NotRequired[Optional[Effect]]
    header_raw: str


class Trait(TypedDict, total=False):
    name: str
    text: str
    header_raw: str
