from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(
    prefix="/api/uploads",
    tags=["Uploads"],
)

UPLOADS_DIR = (
    Path(__file__).resolve().parent.parent.parent
    / "uploads"
)

RESTAURANT_LOGOS_DIR = (
    UPLOADS_DIR
    / "restaurant-logos"
)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/restaurant-logo")
async def upload_restaurant_logo(
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WebP images are allowed.",
        )

    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image must be smaller than 5 MB.",
        )

    extension = Path(file.filename or "").suffix.lower()

    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid image extension.",
        )

    filename = f"{uuid4().hex}{extension}"

    RESTAURANT_LOGOS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = RESTAURANT_LOGOS_DIR / filename

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    return {
        "success": True,
        "filename": filename,
        "url": f"/uploads/restaurant-logos/{filename}",
    }
@router.post("/product-image")
async def upload_product_image(
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WebP images are allowed.",
        )

    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image must be smaller than 5 MB.",
        )

    extension = Path(file.filename or "").suffix.lower()

    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid image extension.",
        )

    filename = f"{uuid4().hex}{extension}"

    PRODUCT_IMAGES_DIR = (
        UPLOADS_DIR
        / "product-images"
    )

    PRODUCT_IMAGES_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path = PRODUCT_IMAGES_DIR / filename

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    return {
        "success": True,
        "filename": filename,
        "url": f"/uploads/product-images/{filename}",
    }
@router.delete("/product-image")
async def delete_product_image(image_url: str):
    filename = Path(image_url).name

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid image URL.",
        )

    file_path = (
        UPLOADS_DIR
        / "product-images"
        / filename
    )

    if not file_path.exists():
        return {
            "success": True,
            "message": "Image already removed.",
        }

    try:
        file_path.unlink()
    except OSError:
        raise HTTPException(
            status_code=500,
            detail="Failed to remove image.",
        )

    return {
        "success": True,
        "message": "Product image removed.",
    }