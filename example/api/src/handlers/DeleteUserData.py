from fastapi import Depends
from generated.FastApi.FastApiCommon.DeleteUserData import Errors, outputType
from typing import Awaitable


class Context:
  #e.g __init__(self, Depends(get_dep)):
    #self.dep = get_dep
  def __init__(self) -> None:
    pass

async def handle(context: Context ) -> outputType:
  return