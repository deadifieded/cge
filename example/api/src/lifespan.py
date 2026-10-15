
from contextlib import asynccontextmanager
from typing import AsyncIterator
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
  # --- Startup Logic ---
  # e.g., app.state.db = await connect()
  
  yield
  
  # --- Shutdown Logic ---
  # e.g., await app.state.db.disconnect()
