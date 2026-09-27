from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI

from app.routers.coupons import router as coupons_router

from fastapi.middleware.cors import CORSMiddleware

from app.routers.whatsapp import router as whatsapp_router

from app.routers.payments import router as payments_router

from app.routers.customers import router as customers_router

from app.routers.orders import router as orders_router

from app.routers.feedback import router as feedback_router

from app.routers.products import router as products_router

from app.core.database import engine


app = FastAPI(
    title="DesiTrue API",
    description="AI-powered voice and automation backend for DesiTrue",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(orders_router)
app.include_router(feedback_router)
app.include_router(customers_router)
app.include_router(payments_router)
app.include_router(whatsapp_router)
app.include_router(coupons_router)

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