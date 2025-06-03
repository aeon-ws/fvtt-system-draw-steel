from typing import List, NotRequired, Optional, TypedDict

from ads.model import (
    Ability,
    AppliedCaptainEffects,
    Characteristics,
    DerivedCaptainBonuses,
    ImmunityOrWeakness,
    Trait,
)


class MonsterHeader(TypedDict):
    name: str
    level: int
    type: str
    role: NotRequired[str]
    header_source_line: str
    start_line_index: int
    end_line_index: int


class MonsterBlock(TypedDict):
    header: MonsterHeader
    source_lines: List[str]
    raw_text: str


class Monster(TypedDict):
    name: str
    level: int
    type: str
    role: NotRequired[Optional[str]]
    header_text: str
    keywords: List[str]
    encounterValue: int
    stamina: int
    speed: int
    movementTypes: List[str]
    size: str
    stability: int
    freeStrikeDamage: int
    characteristics: Characteristics
    weakness: NotRequired[Optional[ImmunityOrWeakness]]
    immunity: NotRequired[Optional[ImmunityOrWeakness]]
    derivedCaptainBonuses: NotRequired[Optional[DerivedCaptainBonuses]]
    appliedCaptainEffects: NotRequired[Optional[AppliedCaptainEffects]]
    abilities: List[Ability]
    traits: List[Trait]
