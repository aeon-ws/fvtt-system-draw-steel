from typing import NotRequired, TypedDict


class Stamina(TypedDict, total=False):
    max: int
    perMinion: NotRequired[int]
    value: NotRequired[int]
