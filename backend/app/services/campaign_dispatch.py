from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Campaign, CampaignDelivery, Customer
from app.services.whatsapp_service import (
    send_campaign_whatsapp,
)


def dispatch_campaign(
    campaign: Campaign,
    db: Session,
) -> dict:
    """
    Sends a campaign to eligible customers.

    Eligibility:
    - Customer has a phone number.
    - Customer has WhatsApp opt-in.
    - Customer matches the campaign segment.
    - Customer has not already received this campaign.
    """

    query = db.query(Customer).filter(
        Customer.phone.isnot(None),
        Customer.whatsapp_opt_in.is_(True),
    )

    # -----------------------------------------------------
    # TARGET SEGMENT
    # -----------------------------------------------------

    if campaign.target_segment:
        query = query.filter(
            Customer.segment
            == campaign.target_segment
        )

    customers = query.all()

    sent_count = 0
    skipped_count = 0

    for customer in customers:

        # -------------------------------------------------
        # PREVENT DUPLICATE CAMPAIGN SENDS
        # -------------------------------------------------

        existing_delivery = (
            db.query(CampaignDelivery)
            .filter(
                CampaignDelivery.campaign_id
                == campaign.id,
                CampaignDelivery.customer_id
                == customer.id,
            )
            .first()
        )

        if existing_delivery:
            skipped_count += 1
            continue

        # -------------------------------------------------
        # SEND THROUGH WHATSAPP SIMULATOR
        # -------------------------------------------------

        whatsapp_message = (
            send_campaign_whatsapp(
                db=db,
                customer=customer,
                campaign=campaign,
            )
        )

        if whatsapp_message is None:
            skipped_count += 1
            continue

        # -------------------------------------------------
        # RECORD CAMPAIGN DELIVERY
        # -------------------------------------------------

        delivery = CampaignDelivery(
            campaign_id=campaign.id,
            customer_id=customer.id,
            message=whatsapp_message.message,
            status="sent",
            sent_at=datetime.utcnow(),
        )

        db.add(delivery)

        sent_count += 1

    # -----------------------------------------------------
    # MARK CAMPAIGN COMPLETED
    # -----------------------------------------------------

    campaign.status = "completed"

    db.commit()

    return {
        "campaign_id": campaign.id,
        "status": campaign.status,
        "customers_found": len(customers),
        "messages_sent": sent_count,
        "messages_skipped": skipped_count,
    }