from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from database import get_db
from models import Resource
from schemas import URLCreateRequest, ResourceUpdate, ResourceOut
from services.metadata import fetch_url_metadata
import json

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("", response_model=list[ResourceOut])
async def list_resources(
    search: str = Query(None),
    tag: str = Query(None),
    category: str = Query(None),
    resource_type: str = Query(None),
    priority: str = Query(None),
    skip: int = 0,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Resource).order_by(Resource.created_at.desc())

    if resource_type:
        stmt = stmt.where(Resource.resource_type == resource_type)
    if category:
        stmt = stmt.where(Resource.category == category)
    if priority:
        stmt = stmt.where(Resource.priority == priority)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Resource.title.ilike(pattern),
                Resource.description.ilike(pattern),
                Resource.url.ilike(pattern),
                Resource._tags.ilike(pattern),
            )
        )
    if tag:
        stmt = stmt.where(Resource._tags.ilike(f'%"{tag}"%'))

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    resources = result.scalars().all()
    return [ResourceOut.from_orm_resource(r) for r in resources]


@router.post("", response_model=ResourceOut)
async def create_url_resource(payload: URLCreateRequest, db: AsyncSession = Depends(get_db)):
    metadata = await fetch_url_metadata(payload.url)
    merged_tags = list(dict.fromkeys(metadata["tags"] + payload.custom_tags))

    resource = Resource(
        title=payload.custom_title or metadata["title"],
        url=payload.url,
        description=metadata["description"],
        resource_type="url",
        favicon=metadata["favicon"],
        thumbnail=metadata["thumbnail"],
        category=metadata["category"],
    )
    resource.tags = merged_tags

    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return ResourceOut.from_orm_resource(resource)


@router.post("/preview")
async def preview_url(payload: URLCreateRequest):
    """Fetch metadata + tags for a URL without saving — used for real-time preview."""
    metadata = await fetch_url_metadata(payload.url)
    return {
        "title":       metadata["title"],
        "description": metadata["description"],
        "favicon":     metadata["favicon"],
        "thumbnail":   metadata["thumbnail"],
        "category":    metadata["category"],
        "tags":        list(dict.fromkeys(metadata["tags"] + payload.custom_tags)),
    }


@router.get("/tags", response_model=list[str])
async def list_all_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource._tags))
    all_tags: set[str] = set()
    for (tags_json,) in result:
        try:
            all_tags.update(json.loads(tags_json or "[]"))
        except Exception:
            pass
    return sorted(all_tags)


@router.get("/categories", response_model=list[str])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resource.category).distinct().where(Resource.category.isnot(None))
    )
    return sorted([row[0] for row in result if row[0]])


@router.get("/{resource_id}", response_model=ResourceOut)
async def get_resource(resource_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return ResourceOut.from_orm_resource(resource)


@router.patch("/{resource_id}", response_model=ResourceOut)
async def update_resource(resource_id: int, payload: ResourceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "tags":
            resource.tags = value
        else:
            setattr(resource, key, value)

    await db.commit()
    await db.refresh(resource)
    return ResourceOut.from_orm_resource(resource)


@router.delete("/{resource_id}")
async def delete_resource(resource_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.file_path:
        import os
        try:
            os.remove(resource.file_path)
        except Exception:
            pass

    await db.delete(resource)
    await db.commit()
    return {"ok": True}
