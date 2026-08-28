from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .routers import employees_api, employees_sqlite


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(
    title="Tabulator demo backend",
    description="API de demo : source 'API' en memoire + source 'SQLite' avec tri/filtre/recherche/pagination serveur.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees_api.router)
app.include_router(employees_sqlite.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
