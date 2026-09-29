from dotenv import load_dotenv

from pathlib import Path

from fastapi.staticfiles import StaticFiles

load_dotenv()

from fastapi import FastAPI

from app.routers.restaurants import router as restaurants_router
from app.routers.campaigns import router as campaigns_router
from app.routers.categories import router as categories_router
from app.routers.coupons import router as coupons_router
from fastapi.middleware.cors import CORSMiddleware
from app.routers.whatsapp import router as whatsapp_router
from app.routers.payments import router as payments_router
from app.routers.customers import router as customers_router
from app.routers.orders import router as orders_router
from app.routers.feedback import router as feedback_router
from app.routers.products import router as products_router
from app.routers.uploads import router as uploads_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router

from app.core.database import engine


app = FastAPI(
    title="DesiTrue API",
    description="AI-powered voice and automation backend for DesiTrue",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(products_router)
app.include_router(orders_router)
app.include_router(feedback_router)
app.include_router(customers_router)
app.include_router(payments_router)
app.include_router(whatsapp_router)
app.include_router(coupons_router)
app.include_router(campaigns_router)
app.include_router(categories_router)
app.include_router(restaurants_router)
app.include_router(uploads_router)
app.include_router(auth_router)
app.include_router(users_router)


# ============================================================
# GENERATED CAMPAIGN FILES
# ============================================================

GENERATED_CAMPAIGNS_DIR = (
    Path(__file__).resolve().parent.parent
    / "generated_campaigns"
)

GENERATED_CAMPAIGNS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

app.mount(
    "/generated-campaigns",
    StaticFiles(
        directory=GENERATED_CAMPAIGNS_DIR
    ),
    name="generated-campaigns",
)


# ============================================================
# UPLOADED MEDIA FILES
# ============================================================

UPLOADS_DIR = (
    Path(__file__).resolve().parent.parent
    / "uploads"
)

RESTAURANT_LOGOS_DIR = (
    UPLOADS_DIR
    / "restaurant-logos"
)

PRODUCT_IMAGES_DIR = (
    UPLOADS_DIR
    / "product-images"
)


RESTAURANT_LOGOS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

PRODUCT_IMAGES_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOADS_DIR
    ),
    name="uploads",
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "name": "DesiTrue API",
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "database": "configured",
    }