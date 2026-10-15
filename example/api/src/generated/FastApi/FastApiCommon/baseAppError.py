class BaseAppError(Exception):
  detail: str
  status_code: int
  code: str