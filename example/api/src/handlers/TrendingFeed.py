from fastapi import Depends
from generated.FastApi.FastApiCommon.TrendingFeed import Errors, paramsType, outputType
from typing import Awaitable


class Context:
  #e.g __init__(self, Depends(get_dep)):
    #self.dep = get_dep
  def __init__(self) -> None:
    pass

async def handle(params: paramsType, context: Context ) -> outputType:
  return