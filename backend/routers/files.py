from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Resource
from schemas import ResourceOut
from services.metadata import auto_tag_file
import aiofiles
import os
import json

router = APIRouter(prefix="/api/files", tags=["files"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("", response_model=ResourceOut)
async def upload_file(
    file: UploadFile = File(...),
    custom_title: str = Form(None),
    custom_tags: str = Form("[]"),
    db: AsyncSession = Depends(get_db),
):
    # Validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    # Parse tags
    try:
        extra_tags = json.loads(custom_tags)
    except Exception:
        extra_tags = []

    # Save file
    safe_name = os.path.basename(file.filename or "upload")
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    # Avoid overwriting — append a counter if needed
    base, ext = os.path.splitext(safe_name)
    counter = 1
    while os.path.exists(file_path):
        file_path = os.path.join(UPLOAD_DIR, f"{base}_{counter}{ext}")
        counter += 1

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    category, tags = auto_tag_file(safe_name)
    merged_tags = list(dict.fromkeys(tags + extra_tags))

    resource = Resource(
        title=custom_title or safe_name,
        resource_type="file",
        file_path=file_path,
        file_name=safe_name,
        file_size=len(content),
        category=category,
    )
    resource.tags = merged_tags

    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return ResourceOut.from_orm_resource(resource)


@router.get("/download/{resource_id}")
async def download_file(resource_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from fastapi.responses import FileResponse

    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource or not resource.file_path:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(resource.file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")

    return FileResponse(
        resource.file_path,
        filename=resource.file_name or os.path.basename(resource.file_path),
    )
