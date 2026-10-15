from .FastApiCommon import HealthCheck
from .FastApiCommon.baseAppError import BaseAppError
from config import config, add_middleware, error_handler
from fastapi import Request, Response, Depends
from fastapi.responses import JSONResponse
from handlers import HealthCheck as handlers_HealthCheck
from logging import error as log_error
from starlette.middleware.base import RequestResponseEndpoint, BaseHTTPMiddleware
from typing import Awaitable


app = config()

@app.exception_handler(BaseAppError)
async def global_generated_error_handler(request: Request, exc: BaseAppError) -> JSONResponse:
  return JSONResponse(
    status_code=exc.status_code,
    content={
      'code': exc.code,
      'detail': exc.detail,
    }
  )

class _UnhandledExceptionMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
    try:
      return await call_next(request)
    except Exception as exc:
      log_error('Unhandled exception occurred:', exc_info=True)
      error_handler(request, exc)
      return JSONResponse(
        status_code=500,
        content={
          'detail': 'Internal server error, please try again later.',
          'code': 'INTERNAL_SERVER_ERROR'
        }
      )
app.add_middleware(_UnhandledExceptionMiddleware)
add_middleware(app)
@app.get("/health")
async def wrapper_HealthCheck(context: handlers_HealthCheck.Context = Depends() ) -> HealthCheck.outputType:
  params: HealthCheck.paramsType = {  }
  return await handlers_HealthCheck.handle( params, context)

