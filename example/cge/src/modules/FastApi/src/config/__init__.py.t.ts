/** Only written if the part has no `config` package yet. */
export default function render(): string {
  return `
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import TypedDict, Any, NotRequired
from lifespan import lifespan


class Settings(TypedDict):
    title: NotRequired[str]
    description: NotRequired[str]
    version: NotRequired[str]
    docs_url: NotRequired[str | None]
    redoc_url: NotRequired[str | None]
    openapi_url: NotRequired[str | None]
    swagger_ui_parameters: NotRequired[dict[str, Any] | None]
    redirect_slashes: NotRequired[bool]
    servers: NotRequired[list[dict[str, str | Any]] | None]

development_settings = {
    "title": "My API (Development)",
    "description": "Local development environment with full documentation enabled.",
    "version": "1.0.0",
    "docs_url": "/docs",
    "redoc_url": "/redoc",
    "openapi_url": "/openapi.json",
    # Keeps you logged into Swagger UI when you refresh the page
    "swagger_ui_parameters": {"persistAuthorization": True},
    "redirect_slashes": False,
}

production_settings = {
    "title": "My API",
    "description": "Production API gateway.",
    "version": "1.0.0",
    # Obscure or completely disable the documentation endpoints
    "docs_url": None,
    "redoc_url": None,
    "openapi_url": None,
    "swagger_ui_parameters": None,
    "redirect_slashes": False,
}

origins = ["*"]  # Adjust this in production to restrict origins

def config() -> FastAPI:
    app = FastAPI(lifespan=lifespan, **production_settings)
    return app

def add_middleware(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

def error_handler(request: Request, exc: Exception) -> None:
    pass
`;
}
