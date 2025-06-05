from typing import NotRequired, Optional, TypedDict

from ads.model.effect import Effect, PotencyEffect


class PowerRollTier(TypedDict):
    damage: NotRequired[Optional[int]]
    effect: NotRequired[Optional[Effect]]
    potencyEffect: NotRequired[Optional[PotencyEffect]]


class PowerRoll(TypedDict):
    # If the power roll doesn't have a bonus, it represents a resistance test.  The details will be in the
    # prePowerRollEffect text.
    bonus: int | None
    tier1: PowerRollTier
    tier2: PowerRollTier
    tier3: PowerRollTier
