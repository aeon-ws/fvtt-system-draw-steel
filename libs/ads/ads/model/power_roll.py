from typing import NotRequired, Optional, TypedDict

from ads.model.effect import Effect, PotencyEffect


class PowerRollTier(TypedDict):
    damage: NotRequired[Optional[int]]
    effect: NotRequired[Optional[Effect]]
    potencyEffect: NotRequired[Optional[PotencyEffect]]


class PowerRoll(TypedDict):
    bonus: int
    tier1: PowerRollTier
    tier2: PowerRollTier
    tier3: PowerRollTier
