from __future__ import annotations
from types import EllipsisType
from typing import TypedDict, List, NotRequired, TypeAlias, Optional

class inputType_dayEdits_item(TypedDict):
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
class inputType(TypedDict):
  """
  ```ts:
  {
    dayEdits: {
      date: number;
      away: boolean;
    }[];
  }
  ```
  """
  dayEdits: List[ inputType_dayEdits_item ]
  """
  ```ts:
  {
    date: number;
    away: boolean;
  }[]
  ```
  """
class inputType_:
  type_: TypeAlias = inputType
  class dayEdits_item:
    type_: TypeAlias = inputType_dayEdits_item

class outputType(TypedDict):
  """
  ```ts:
  {
    totalDaysAway: number;
  }
  ```
  """
  totalDaysAway: float
  """
  ```ts:
  number
  ```
  """
class outputType_:
  type_: TypeAlias = outputType


class Errors:
  pass