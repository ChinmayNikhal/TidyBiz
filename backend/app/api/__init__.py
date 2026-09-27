"""TidyBiz FastAPI backend application package."""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine
from app.models import Base

logger = logging.getLogger("tidybiz")


def _create_tables_and_seed() -> None:
    """Create tables and run the idempotent demo seed (startup convenience)."""
    from app.seed.demo_data import run_seed

    Base.metadata.create_all(bind=engine)
    run_seed()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        _create_tables_and_seed()
        logger.info("Database ready (seed ensured)")
    except Exception:
        # Never mask a failed database as a healthy app.
        logger.exception("Database initialization failed; API may report degraded health")
    yield


app = FastAPI(
    title="TidyBiz API",
    version=settings.version,
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS — only needed when frontend and API run on different origins (local dev).
_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error(code: str, message: str, details: list | None = None, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Translate FastAPI validation errors into the standard API.md §10 envelope."""
    details = []
    for err in exc.errors():
        loc = [str(part) for part in err.get("loc", []) if part != "body"]
        details.append({"field": ".".join(loc) or "body", "issue": err.get("msg", "Invalid value")})
    return _error("VALIDATION_ERROR", "Request validation failed", details, status.HTTP_422_UNPROCESSABLE_ENTITY)


@app.exception_handler(status.HTTP_404_NOT_FOUND)
async def not_found_handler(request: Request, exc) -> JSONResponse:
    return _error("NOT_FOUND", "Resource not found", None, status.HTTP_404_NOT_FOUND)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return _error(
        "INTERNAL_SERVER_ERROR",
        "An unexpected error occurred.",
        None,
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


from app.api.routes import business, employees, health, tasks  # noqa: E402  (import order)

app.include_router(health.router, prefix="/api")
app.include_router(business.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")


def _serve_frontend() -> None:
    """Mount the built SPA when present (single-service production shape)."""
    dist = Path(__file__).resolve().parents[3] / "frontend" / "dist"
    assets = dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

        from fastapi.responses import FileResponse

        @app.get("/{full_path:path}", include_in_schema=False)
        async def spa(full_path: str):
            file = dist / full_path
            if full_path and file.is_file():
                return FileResponse(file)
            return FileResponse(dist / "index.html")


_serve_frontend()


@app.get("/health", include_in_schema=False)
async def root_health() -> dict:
    """Container-level health check (Cloud Run default probe path)."""
    from app.api.routes.health import health_payload

    return health_payload()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=False)
