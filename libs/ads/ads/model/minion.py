from typing import Optional, TypedDict


class AppliedCaptainEffects(TypedDict, total=False):
    temporaryStamina: Optional[int]


class DerivedCaptainBonuses(TypedDict, total=False):
    speed: Optional[int]
    meleeDistanceBonus: Optional[int]
    rangedDistanceBonus: Optional[int]
    strikeDamage: Optional[int]
    strikeEdge: Optional[int]
