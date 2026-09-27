from decimal import Decimal

from app.core.database import SessionLocal
from app.models import Category, Product


def seed_database():
    db = SessionLocal()

    try:
        categories = {
            "Burgers": "burgers",
            "Pizza": "pizza",
            "Sides": "sides",
            "Drinks": "drinks",
        }

        category_objects = {}

        for name, slug in categories.items():
            category = (
                db.query(Category)
                .filter(Category.slug == slug)
                .first()
            )

            if not category:
                category = Category(
                    name=name,
                    slug=slug,
                    description=f"{name} menu items",
                )
                db.add(category)
                db.flush()

            category_objects[slug] = category

        products = [
            {
                "name": "Crispy Chicken Burger",
                "description": "Crispy chicken burger",
                "price": Decimal("199.00"),
                "category": "burgers",
            },
            {
                "name": "Spicy Chicken Burger",
                "description": "Spicy chicken burger",
                "price": Decimal("219.00"),
                "category": "burgers",
            },
            {
                "name": "Grilled Chicken Burger",
                "description": "Grilled chicken burger",
                "price": Decimal("229.00"),
                "category": "burgers",
            },
            {
                "name": "Classic Veg Burger",
                "description": "Classic vegetarian burger",
                "price": Decimal("149.00"),
                "category": "burgers",
            },
            {
                "name": "Loaded Fries",
                "description": "Loaded seasoned fries",
                "price": Decimal("129.00"),
                "category": "sides",
            },
            {
                "name": "Classic Fries",
                "description": "Classic crispy fries",
                "price": Decimal("99.00"),
                "category": "sides",
            },
        ]

        for item in products:
            existing = (
                db.query(Product)
                .filter(Product.name == item["name"])
                .first()
            )

            if not existing:
                product = Product(
                    name=item["name"],
                    description=item["description"],
                    price=item["price"],
                    category_id=category_objects[
                        item["category"]
                    ].id,
                )

                db.add(product)

        db.commit()

        print("DesiTrue database seeded successfully.")


    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()