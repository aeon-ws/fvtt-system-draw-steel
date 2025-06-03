from typing import Literal, Optional, TypedDict


class Cube(TypedDict):
    size: int
    within: int


class Line(TypedDict):
    width: int
    length: int
    within: int


class Distance(TypedDict, total=False):
    self: Optional[bool]
    melee: Optional[int]
    ranged: Optional[int]
    burst: Optional[int]
    cube: Optional[Cube]
    line: Optional[Line]


class Target(TypedDict, total=False):
    filter: Optional[str]
    text: str
    count: int | Literal["all"]
