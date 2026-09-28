from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Customer
from app.schemas.order import CustomerCreate, CustomerResponse


router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"],
)


@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
):
    # Check if customer already exists by phone
    if customer_data.phone:
        existing_customer = (
            db.query(Customer)
            .filter(Customer.phone == customer_data.phone)
            .first()
        )

        if existing_customer:
            return existing_customer

    customer = Customer(
        name=customer_data.name,
        phone=customer_data.phone,
        whatsapp_opt_in=customer_data.whatsapp_opt_in,
        segment="new_customer",
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )

    return customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )

    if customer_data.name is not None:
        customer.name = customer_data.name

    if customer_data.phone is not None:
        customer.phone = customer_data.phone

    customer.whatsapp_opt_in = customer_data.whatsapp_opt_in

    db.commit()
    db.refresh(customer)

    return customer