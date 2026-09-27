"""Application settings loaded from environment variables / .env file.

Never store real secrets in source control. Copy .env.example to .env for local values.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_name: str = "tidybiz-backend"
    version: str = "0.1.0"
    debug: bool = False

    # Database — SQLite for local development. For hosted deployment, point this
    # at Supabase PostgreSQL via DATABASE_URL (see Architecture.md §14).
    database_url: str = "sqlite:///./tidybiz.db"

    # CORS — comma-separated origins allowed to call the API from a browser.
    cors_origins: str = "http://localhost:5173"

    # Port binding (deployment hosts supply PORT; local fallback 8000)
    port: int = 8000

    # Create tables and ensure the idempotent demo seed on startup.
    seed_on_startup: bool = True

    # Supabase (optional for hosted PostgreSQL & Auth integration)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    model_config = {"env_prefix": "TIDYBIZ_", "env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
