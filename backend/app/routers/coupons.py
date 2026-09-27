from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Coupon, Customer
from app.schemas.coupon import (
    CouponCreate,
    CouponResponse,
    CouponValidateRequest,
    CouponValidateResponse,
)


router = APIRouter(
    prefix="/api/coupons",
    tags=["Coupons"],
)


# =========================================================
# CREATE COUPON
# =========================================================

@router.post("/", response_model=CouponResponse)
def create_coupon(
    coupon_data: CouponCreate,
    db: Session = Depends(get_db),
):
    code = coupon_data.code.strip().upper()

    if coupon_data.discount_type not in {
        "percentage",
        "fixed",
    }:
        raise HTTPException(
            status_code=400,
            detail="Discount type must be 'percentage' or 'fixed'.",
        )

    if (
        coupon_data.discount_type == "percentage"
        and coupon_data.discount_value > 100
    ):
        raise HTTPException(
            status_code=400,
            detail="Percentage discount cannot exceed 100%.",
        )

    existing_coupon = (
        db.query(Coupon)
        .filter(Coupon.code == code)
        .first()
    )

    if existing_coupon:
        raise HTTPException(
            status_code=400,
            detail="Coupon code already exists.",
        )

    coupon = Coupon(
        code=code,
        discount_type=coupon_data.discount_type,
        discount_value=coupon_data.discount_value,
        minimum_order=coupon_data.minimum_order,
        maximum_discount=coupon_data.maximum_discount,
        usage_limit=coupon_data.usage_limit,
        used_count=0,
        expires_at=coupon_data.expires_at,
        is_active=True,
        target_segment=coupon_data.target_segment,
    )

    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    return coupon


# =========================================================
# GET ALL COUPONS
# =========================================================

@router.get("/", response_model=list[CouponResponse])
def get_coupons(
    db: Session = Depends(get_db),
):
    coupons = (
        db.query(Coupon)
        .order_by(Coupon.created_at.desc())
        .all()
    )

    return coupons


# =========================================================
# GET SINGLE COUPON
# =========================================================

@router.get(
    "/{code}",
    response_model=CouponResponse,
)
def get_coupon(
    code: str,
    db: Session = Depends(get_db),
):
    coupon = (
        db.query(Coupon)
        .filter(
            Coupon.code == code.strip().upper()
        )
        .first()
    )

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Coupon not found.",
        )

    return coupon


# =========================================================
# DEACTIVATE COUPON
# =========================================================

@router.patch("/{coupon_id}/deactivate")
def deactivate_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == coupon_id)
        .first()
    )

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Coupon not found.",
        )

    coupon.is_active = False

    db.commit()
    db.refresh(coupon)

    return {
        "message": "Coupon deactivated successfully.",
        "coupon_id": coupon.id,
        "code": coupon.code,
        "is_active": coupon.is_active,
    }

# =========================================================
# ACTIVATE COUPON
# =========================================================

@router.patch("/{coupon_id}/activate")
def activate_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == coupon_id)
        .first()
    )

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Coupon not found.",
        )

    coupon.is_active = True

    db.commit()
    db.refresh(coupon)

    return {
        "message": "Coupon activated successfully.",
        "coupon_id": coupon.id,
        "code": coupon.code,
        "is_active": coupon.is_active,
    }



# =========================================================
# DELETE COUPON
# =========================================================

@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.id == coupon_id)
        .first()
    )

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Coupon not found.",
        )

    db.delete(coupon)
    db.commit()

    return {
        "message": "Coupon deleted successfully.",
        "coupon_id": coupon_id,
    }


# =========================================================
# VALIDATE COUPON
# =========================================================

@router.post(
    "/validate",
    response_model=CouponValidateResponse,
)
def validate_coupon(
    coupon_data: CouponValidateRequest,
    db: Session = Depends(get_db),
):
    code = coupon_data.code.strip().upper()

    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == code)
        .first()
    )

    # -----------------------------------------------------
    # Coupon doesn't exist
    # -----------------------------------------------------

    if not coupon:
        return CouponValidateResponse(
            valid=False,
            message="Invalid coupon code.",
        )

    # -----------------------------------------------------
    # Coupon inactive
    # -----------------------------------------------------

    if not coupon.is_active:
        return CouponValidateResponse(
            valid=False,
            message="This coupon is no longer active.",
        )

    # -----------------------------------------------------
    # Coupon expired
    # -----------------------------------------------------

    if (
        coupon.expires_at is not None
        and coupon.expires_at < datetime.utcnow()
    ):
        return CouponValidateResponse(
            valid=False,
            message="This coupon has expired.",
        )

    # -----------------------------------------------------
    # Usage limit
    # -----------------------------------------------------

    if (
        coupon.usage_limit is not None
        and coupon.used_count >= coupon.usage_limit
    ):
        return CouponValidateResponse(
            valid=False,
            message="This coupon has reached its usage limit.",
        )

    # -----------------------------------------------------
    # Minimum order
    # -----------------------------------------------------

    if coupon_data.order_total < float(
        coupon.minimum_order
    ):
        return CouponValidateResponse(
            valid=False,
            message=(
                f"Minimum order value is "
                f"₹{float(coupon.minimum_order):.2f}."
            ),
        )

    # -----------------------------------------------------
    # Customer segment validation
    # -----------------------------------------------------

    if coupon.target_segment:

        if coupon_data.customer_id is None:
            return CouponValidateResponse(
                valid=False,
                message="This coupon is available to selected customers only.",
            )

        customer = (
            db.query(Customer)
            .filter(
                Customer.id
                == coupon_data.customer_id
            )
            .first()
        )

        if not customer:
            return CouponValidateResponse(
                valid=False,
                message="Customer not found.",
            )

        if customer.segment != coupon.target_segment:
            return CouponValidateResponse(
                valid=False,
                message="You are not eligible for this coupon.",
            )

    # -----------------------------------------------------
    # Calculate discount
    # -----------------------------------------------------

    order_total = float(coupon_data.order_total)

    if coupon.discount_type == "percentage":

        discount = (
            order_total
            * float(coupon.discount_value)
            / 100
        )

    else:

        discount = float(
            coupon.discount_value
        )

    # -----------------------------------------------------
    # Maximum discount
    # -----------------------------------------------------

    if coupon.maximum_discount is not None:

        discount = min(
            discount,
            float(coupon.maximum_discount),
        )

    # -----------------------------------------------------
    # Never discount more than order value
    # -----------------------------------------------------

    discount = min(
        discount,
        order_total,
    )

    final_total = order_total - discount

    return CouponValidateResponse(
        valid=True,
        message="Coupon applied successfully.",
        coupon_code=coupon.code,
        discount=round(discount, 2),
        final_total=round(final_total, 2),
    )