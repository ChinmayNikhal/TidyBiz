"""Pydantic response schema for the business workspace (API.md §4)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BusinessRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    timezone: str
    created_at: datetime
