from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import User


db = SessionLocal()

try:
    email = "owner@desitrue.com"
    password = "admin123"

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        print("User already exists.")
    else:
        user = User(
            email=email,
            password_hash=hash_password(password),
            role="OWNER",
            restaurant_id=None,
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print("Owner user created successfully.")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"User ID: {user.id}")

finally:
    db.close()