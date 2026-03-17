from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from contextlib import asynccontextmanager
import os

from database import init_db, migrate_db
from routers import resources, files


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await migrate_db()
    yield


app = FastAPI(title="TechVault API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resources.router)
app.include_router(files.router)

# Serve uploaded files statically
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/api", include_in_schema=False)
async def api_root():
    return {
        "app": "TechVault API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": [
            "GET  /api/resources",
            "POST /api/resources",
            "GET  /api/resources/tags",
            "GET  /api/resources/categories",
            "GET  /api/resources/{id}",
            "PATCH /api/resources/{id}",
            "DELETE /api/resources/{id}",
            "POST /api/files",
            "GET  /api/files/download/{id}",
        ]
    }


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "TechVault"}
