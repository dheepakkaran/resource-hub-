from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class URLCreateRequest(BaseModel):
    url: str
    custom_title: Optional[str] = None
    custom_tags: list[str] = []


class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    category: Optional[str] = None
    priority: Optional[str] = None  # urgent | high | medium | low | None


class ResourceOut(BaseModel):
    id: int
    title: str
    url: Optional[str] = None
    description: Optional[str] = None
    resource_type: str
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    favicon: Optional[str] = None
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    tags: list[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_resource(cls, r):
        return cls(
            id=r.id,
            title=r.title,
            url=r.url,
            description=r.description,
            resource_type=r.resource_type,
            file_path=r.file_path,
            file_name=r.file_name,
            file_size=r.file_size,
            favicon=r.favicon,
            thumbnail=r.thumbnail,
            category=r.category,
            priority=r.priority,
            tags=r.tags,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
