from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.campaign_dispatch import dispatch_campaign
from app.core.database import get_db
from app.models import Campaign, Coupon
from app.schemas.campaign import (
    CampaignCreate,
    CampaignResponse,
    CampaignUpdate,
)
from app.services.campaign_image import generate_campaign_image


router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"],
)


VALID_STATUSES = {
    "draft",
    "scheduled",
    "active",
    "completed",
}


@router.post(
    "/",
    response_model=CampaignResponse,
)
def create_campaign(
    campaign_data: CampaignCreate,
    db: Session = Depends(get_db),
):
    if campaign_data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid campaign status. "
                "Use: draft, scheduled, active, or completed."
            ),
        )

    if campaign_data.coupon_id is not None:
        coupon = (
            db.query(Coupon)
            .filter(Coupon.id == campaign_data.coupon_id)
            .first()
        )

        if not coupon:
            raise HTTPException(
                status_code=404,
                detail="Coupon not found.",
            )

    campaign = Campaign(
        name=campaign_data.name,
        title=campaign_data.title,
        message=campaign_data.message,
        target_segment=campaign_data.target_segment,
        coupon_id=campaign_data.coupon_id,
        status=campaign_data.status,
        scheduled_at=campaign_data.scheduled_at,
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return campaign


@router.get(
    "/",
    response_model=list[CampaignResponse],
)
def get_campaigns(
    db: Session = Depends(get_db),
):
    return (
        db.query(Campaign)
        .order_by(Campaign.created_at.desc())
        .all()
    )


@router.get(
    "/{campaign_id}",
    response_model=CampaignResponse,
)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    return campaign


@router.patch(
    "/{campaign_id}",
    response_model=CampaignResponse,
)
def update_campaign(
    campaign_id: int,
    campaign_data: CampaignUpdate,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    if (
        campaign_data.status is not None
        and campaign_data.status not in VALID_STATUSES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid campaign status. "
                "Use: draft, scheduled, active, or completed."
            ),
        )

    if campaign_data.coupon_id is not None:
        coupon = (
            db.query(Coupon)
            .filter(Coupon.id == campaign_data.coupon_id)
            .first()
        )

        if not coupon:
            raise HTTPException(
                status_code=404,
                detail="Coupon not found.",
            )

    update_data = campaign_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)

    return campaign


@router.patch(
    "/{campaign_id}/activate",
)
def activate_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    campaign.status = "active"

    db.commit()
    db.refresh(campaign)

    return {
        "message": "Campaign activated successfully.",
        "campaign_id": campaign.id,
        "status": campaign.status,
    }


@router.patch(
    "/{campaign_id}/deactivate",
)
def deactivate_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    campaign.status = "draft"

    db.commit()
    db.refresh(campaign)

    return {
        "message": "Campaign moved back to draft.",
        "campaign_id": campaign.id,
        "status": campaign.status,
    }


@router.delete(
    "/{campaign_id}",
)
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    db.delete(campaign)
    db.commit()

    return {
        "message": "Campaign deleted successfully.",
        "campaign_id": campaign_id,
    }
@router.post(
    "/{campaign_id}/generate-image",
    response_model=CampaignResponse,
)
def generate_campaign_image_endpoint(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    coupon_code = None

    if campaign.coupon_id:
        coupon = (
            db.query(Coupon)
            .filter(
                Coupon.id == campaign.coupon_id
            )
            .first()
        )

        if coupon:
            coupon_code = coupon.code

    image_url = generate_campaign_image(
        campaign=campaign,
        coupon_code=coupon_code,
    )

    campaign.image_url = image_url

    db.commit()
    db.refresh(campaign)

    return campaign
@router.post("/{campaign_id}/send")
def send_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )


    result = dispatch_campaign(
        campaign=campaign,
        db=db,
    )

    return result