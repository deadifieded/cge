from __future__ import annotations
from types import EllipsisType
from typing import TypedDict, List, NotRequired, TypeAlias, Optional

monthType: TypeAlias = float

yearType: TypeAlias = float

class paramsType(TypedDict):
  """
  ```ts:
  {
    month: number;
    year: number;
  }
  ```
  """
  month: float
  """
  ```ts:
  number
  ```
  """
  year: float
  """
  ```ts:
  number
  ```
  """
class paramsType_:
  type_: TypeAlias = paramsType
class outputType_datesAway_item(TypedDict):
  """
  ```ts:
  {
    date: number;
    away: boolean;
  }
  ```
  """
  date: float
  """
  ```ts:
  number
  ```
  """
  away: bool
  """
  ```ts:
  boolean
  ```
  """
class outputType(TypedDict):
  """
  ```ts:
  {
    datesAway: {
      date: number;
      away: boolean;
    }[];
  }
  ```
  """
  datesAway: List[ outputType_datesAway_item ]
  """
  ```ts:
  {
    date: number;
    away: boolean;
  }[]
  ```
  """
class outputType_:
  type_: TypeAlias = outputType
  class datesAway_item:
    type_: TypeAlias = outputType_datesAway_item


class Errors:
  pass