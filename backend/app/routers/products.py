from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Product


router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)


@router.get("/")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.is_available == True
    ).all()

    return products