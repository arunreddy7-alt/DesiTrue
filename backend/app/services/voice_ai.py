import json
import os
import re

import httpx
from sqlalchemy.orm import Session

from app.models import Product


OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434",
)

OLLAMA_MODEL = os.getenv(
    "VOICE_AI_MODEL",
    "phi3:mini",
)


VALID_ACTIONS = {
    "add_to_cart",
    "remove_from_cart",
    "update_quantity",
    "view_cart",
    "recommend_items",
    "ask_clarification",
    "checkout_confirmation",
    "checkout",
    "unknown",
}


NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
}


STOP_WORDS = {
    "i",
    "want",
    "would",
    "like",
    "can",
    "could",
    "get",
    "give",
    "me",
    "please",
    "add",
    "order",
    "buy",
    "have",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "a",
    "an",
    "the",
    "some",
    "of",
    "to",
    "for",
    "my",
    "with",
    "and",
    "another",
    "more",
    "item",
    "items",
    "food",
}


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("-", " ")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_quantity(text: str) -> int | None:
    normalized = normalize_text(text)

    match = re.search(r"\b(\d+)\b", normalized)
    if match:
        return max(1, int(match.group(1)))

    for word, value in NUMBER_WORDS.items():
        if re.search(rf"\b{re.escape(word)}\b", normalized):
            return value

    return None


def build_menu_context(products: list[Product]) -> str:
    return "\n".join(
        f"{product.id}|{product.name}|₹{product.price}"
        for product in products
        if product.is_available
    )


def normalize_cart(cart: list[dict]) -> list[dict]:
    cleaned = []

    for item in cart[:20]:
        product = item.get("product", {})

        cleaned.append(
            {
                "id": product.get("id"),
                "name": product.get("name"),
                "quantity": item.get("quantity", 1),
            }
        )

    return cleaned


def normalize_history(
    conversation_history: list[dict],
) -> list[dict]:
    return [
        {
            "role": item.get("role", ""),
            "message": str(item.get("message", ""))[:500],
        }
        for item in conversation_history[-6:]
    ]


def clean_state(state: dict | None) -> dict:
    state = state or {}

    pending_ids = state.get("pending_product_ids", [])
    if not isinstance(pending_ids, list):
        pending_ids = []

    cleaned_pending = []

    for value in pending_ids:
        try:
            cleaned_pending.append(int(value))
        except (TypeError, ValueError):
            continue

    last_selected = state.get("last_selected_product_id")
    last_mentioned = state.get("last_mentioned_product_id")

    try:
        last_selected = (
            int(last_selected)
            if last_selected is not None
            else None
        )
    except (TypeError, ValueError):
        last_selected = None

    try:
        last_mentioned = (
            int(last_mentioned)
            if last_mentioned is not None
            else None
        )
    except (TypeError, ValueError):
        last_mentioned = None

    pending_intent = state.get("pending_intent")

    return {
        "pending_product_ids": cleaned_pending,
        "last_selected_product_id": last_selected,
        "last_mentioned_product_id": last_mentioned,
        "pending_intent": (
            str(pending_intent)
            if pending_intent
            else None
        ),
    }


def state_response(
    state: dict,
) -> dict:
    return {
        "pending_product_ids": state["pending_product_ids"],
        "last_selected_product_id": state["last_selected_product_id"],
        "last_mentioned_product_id": state["last_mentioned_product_id"],
        "pending_intent": state["pending_intent"],
    }


def product_map(
    products: list[Product],
) -> dict[int, Product]:
    return {
        product.id: product
        for product in products
        if product.is_available
    }


def cart_product_ids(cart: list[dict]) -> set[int]:
    ids = set()

    for item in cart:
        product = item.get("product", {})
        product_id = product.get("id")

        try:
            if product_id is not None:
                ids.add(int(product_id))
        except (TypeError, ValueError):
            pass

    return ids


def find_exact_product_matches(
    transcript: str,
    products: list[Product],
) -> list[Product]:
    normalized = normalize_text(transcript)

    matches = []

    for product in products:
        name = normalize_text(product.name)

        if name and re.search(
            rf"(?<!\w){re.escape(name)}(?!\w)",
            normalized,
        ):
            matches.append(product)

    # Prefer the longest exact product name if names overlap.
    matches.sort(
        key=lambda product: len(
            normalize_text(product.name)
        ),
        reverse=True,
    )

    return matches


def category_candidates(
    transcript: str,
    products: list[Product],
) -> list[Product]:
    """
    Resolve a generic category request while respecting
    meaningful descriptors from the customer's request.

    Examples:
      "I want a burger" -> all burgers
      "I want a chicken burger" -> chicken burgers only
      "I want a veg burger" -> veg burgers only
      "I want a spicy burger" -> spicy burgers only
    """
    normalized = normalize_text(transcript)
    words = set(normalized.split())

    category = None

    if "burger" in words or "burgers" in words:
        category = "burger"
    elif "pizza" in words or "pizzas" in words:
        category = "pizza"
    elif (
        "fries" in words
        or "fry" in words
        or "french fries" in normalized
    ):
        category = "fries"

    if not category:
        return []

    if category == "burger":
        candidates = [
            product
            for product in products
            if "burger" in normalize_text(product.name).split()
            or "burgers" in normalize_text(product.name).split()
        ]
    elif category == "pizza":
        candidates = [
            product
            for product in products
            if "pizza" in normalize_text(product.name).split()
            or "pizzas" in normalize_text(product.name).split()
        ]
    else:
        candidates = [
            product
            for product in products
            if "fries" in normalize_text(product.name).split()
            or "fry" in normalize_text(product.name).split()
        ]

    # Words that describe the requested item rather than the category.
    ignored = STOP_WORDS | {
        "burger", "burgers", "pizza", "pizzas",
        "fries", "fry", "french",
    }

    descriptors = {
        word
        for word in words
        if word not in ignored
    }

    # Only filter when the customer supplied a descriptor.
    # This is what prevents "chicken burger" from listing veg burgers.
    if descriptors:
        filtered = []

        for product in candidates:
            product_words = set(
                normalize_text(product.name).split()
            )

            # Every descriptor should be represented in the product name.
            # "chicken burger" therefore excludes "Classic Veg Burger".
            if descriptors.issubset(product_words):
                filtered.append(product)

        if filtered:
            candidates = filtered
        else:
            # If the strict match produced nothing, allow partial matching
            # rather than returning unrelated category items.
            partial = [
                product
                for product in candidates
                if descriptors & set(
                    normalize_text(product.name).split()
                )
            ]
            candidates = partial

    return candidates


def clarification_message(
    candidates: list[Product],
) -> str:
    names = [product.name for product in candidates[:6]]

    if len(names) == 1:
        return (
            f"We have {names[0]}. Would you like that?"
        )

    if len(names) == 2:
        return (
            f"We have {names[0]} or {names[1]}. "
            "Which one would you like?"
        )

    return (
        f"We have {', '.join(names[:-1])}, "
        f"and {names[-1]}. "
        "Which one would you like?"
    )


def resolve_pending_reference(
    transcript: str,
    state: dict,
    products_by_id: dict[int, Product],
) -> Product | None:
    pending = [
        products_by_id[product_id]
        for product_id in state["pending_product_ids"]
        if product_id in products_by_id
    ]

    if not pending:
        return None

    normalized = normalize_text(transcript)

    # "first one", "second one", etc.
    ordinal_match = re.search(
        r"\b(first|second|third|fourth|fifth)\b",
        normalized,
    )

    if ordinal_match:
        ordinal_map = {
            "first": 0,
            "second": 1,
            "third": 2,
            "fourth": 3,
            "fifth": 4,
        }

        index = ordinal_map[ordinal_match.group(1)]

        if index < len(pending):
            return pending[index]

    # "spicy one", "crispy one", "plain one", etc.
    meaningful_words = {
        word
        for word in normalized.split()
        if word not in STOP_WORDS
        and word not in {
            "that",
            "this",
            "those",
            "them",
            "one",
            "ones",
            "one",
        }
    }

    if meaningful_words:
        scored = []

        for product in pending:
            product_words = set(
                normalize_text(product.name).split()
            )

            score = len(
                meaningful_words & product_words
            )

            if score > 0:
                scored.append(
                    (score, product)
                )

        if scored:
            scored.sort(
                key=lambda item: item[0],
                reverse=True,
            )

            highest = scored[0][0]
            best = [
                product
                for score, product in scored
                if score == highest
            ]

            if len(best) == 1:
                return best[0]

    # "that one", "this one", "the other one", "them", "those"
    reference_phrases = {
        "that one",
        "this one",
        "the other one",
        "that",
        "this",
        "them",
        "those",
    }

    if normalized in reference_phrases:
        if len(pending) == 1:
            return pending[0]

    return None



def is_price_query(transcript: str) -> bool:
    normalized = normalize_text(transcript)

    price_words = {
        "price",
        "prices",
        "cost",
        "costs",
        "how much",
        "rate",
        "rates",
    }

    return any(
        word in normalized
        for word in price_words
    )


def is_menu_query(transcript: str) -> bool:
    normalized = normalize_text(transcript)

    menu_phrases = {
        "what do you have",
        "what do you guys have",
        "what's available",
        "what is available",
        "show me the menu",
        "show me menu",
        "what is on the menu",
        "whats on the menu",
        "what can i get",
        "what can i order",
    }

    return (
        normalized in menu_phrases
        or "what do you have" in normalized
        or "what do you guys have" in normalized
    )


def price_response(products: list[Product]) -> str:
    if not products:
        return "I couldn't find that item on the menu."

    if len(products) == 1:
        product = products[0]
        return (
            f"{product.name} is {money_value(product.price)}."
        )

    parts = [
        f"{product.name} is {money_value(product.price)}"
        for product in products[:6]
    ]

    if len(parts) == 2:
        return f"{parts[0]}, and {parts[1]}."

    return (
        f"{', '.join(parts[:-1])}, "
        f"and {parts[-1]}."
    )


def money_value(value) -> str:
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return f"₹{value}"

    if amount.is_integer():
        return f"₹{int(amount)}"

    return f"₹{amount:.2f}"


def menu_response(products: list[Product]) -> str:
    if not products:
        return "There are no available items on the menu right now."

    names = [product.name for product in products[:8]]

    if len(names) == 1:
        return f"We have {names[0]}."

    if len(names) == 2:
        return f"We have {names[0]} and {names[1]}."

    return (
        f"We have {', '.join(names[:-1])}, "
        f"and {names[-1]}."
    )


def resolve_price_products(
    transcript: str,
    products: list[Product],
) -> list[Product]:
    """
    Resolve the item whose price the customer wants.

    Priority:
      1. Exact product name
      2. Category/descriptors such as "fries" or "chicken burger"
    """
    exact = find_exact_product_matches(
        transcript,
        products,
    )

    if exact:
        return exact

    return category_candidates(
        transcript,
        products,
    )

def build_prompt(
    transcript: str,
    menu_context: str,
    cart_context: str,
    history_context: str,
    state: dict,
) -> str:
    return f"""
You are a restaurant voice-ordering language understanding assistant.

Return ONLY valid JSON.

Your job is to understand the customer's latest message.
The application, not you, controls the real cart and menu.

AVAILABLE ACTIONS:
add_to_cart
remove_from_cart
update_quantity
view_cart
recommend_items
ask_clarification
checkout_confirmation
checkout
unknown

RULES:
- Use only products in MENU.
- Never invent product IDs.
- Never invent products.
- If the customer clearly names one exact product, add it.
- If a generic category has multiple products, ask which one.
- Use conversation state for "that one", "the spicy one", "first one", "them", "those", "another one".
- Quantity must be a positive integer.
- "that's it", "that's all", "done", "nothing else", "no more" means checkout_confirmation.
- "yes", "yeah", "yep", "sure", "proceed", "checkout" means checkout only when the previous assistant message asked about checkout.
- Keep response under 25 words.

CONVERSATION STATE:
{json.dumps(state, ensure_ascii=False)}

MENU:
{menu_context}

CURRENT CART:
{cart_context}

RECENT CONVERSATION:
{history_context}

CUSTOMER:
{transcript}

RETURN EXACTLY:
{{
  "action": "unknown",
  "product_id": null,
  "quantity": 1,
  "response": "Could you say that again?",
  "requires_confirmation": false
}}
"""


def call_ollama(prompt: str) -> dict:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0,
            "num_predict": 120,
        },
    }

    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=30.0,
        )
    except httpx.ConnectError as exc:
        raise RuntimeError(
            "Ollama is not running. Start Ollama and make sure "
            f"the '{OLLAMA_MODEL}' model is installed."
        ) from exc
    except httpx.TimeoutException as exc:
        raise RuntimeError(
            "Ollama took too long to respond."
        ) from exc

    if response.status_code != 200:
        raise RuntimeError(
            f"Ollama returned HTTP {response.status_code}: "
            f"{response.text}"
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError(
            "Ollama returned an invalid response."
        ) from exc

    raw_text = str(
        data.get("response", "")
    ).strip()

    if not raw_text:
        raise RuntimeError(
            "Ollama returned an empty response."
        )

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as exc:
        print(
            "Ollama returned invalid JSON:",
            raw_text,
        )
        raise RuntimeError(
            "The local voice AI returned invalid JSON."
        ) from exc


def process_voice_command(
    transcript: str,
    restaurant_id: int,
    cart: list[dict],
    conversation_history: list[dict],
    conversation_state: dict,
    db: Session,
) -> dict:
    products = (
        db.query(Product)
        .filter(
            Product.restaurant_id == restaurant_id,
            Product.is_available.is_(True),
        )
        .all()
    )

    if not products:
        return {
            "action": "error",
            "product_id": None,
            "quantity": 1,
            "response": (
                "Sorry, there are no available items "
                "on the menu right now."
            ),
            "requires_confirmation": False,
            "conversation_state": state_response(
                clean_state(conversation_state)
            ),
        }

    state = clean_state(conversation_state)
    products_by_id = product_map(products)

    normalized = normalize_text(transcript)
    quantity = extract_quantity(transcript) or 1

    # -----------------------------------------------------
    # 1. DETERMINISTIC MENU / PRICE QUESTIONS
    # -----------------------------------------------------

    if is_menu_query(transcript):
        state["pending_product_ids"] = []
        state["pending_intent"] = None

        return {
            "action": "menu_info",
            "product_id": None,
            "quantity": 1,
            "response": menu_response(products),
            "requires_confirmation": False,
            "conversation_state": state_response(state),
        }

    if is_price_query(transcript):
        price_products = resolve_price_products(
            transcript,
            products,
        )

        if len(price_products) == 1:
            product = price_products[0]

            state["pending_product_ids"] = []
            state["pending_intent"] = None
            state["last_mentioned_product_id"] = product.id

            return {
                "action": "price_query",
                "product_id": product.id,
                "quantity": 1,
                "response": price_response(price_products),
                "requires_confirmation": False,
                "conversation_state": state_response(state),
            }

        if len(price_products) > 1:
            state["pending_product_ids"] = [
                product.id
                for product in price_products
            ]
            state["pending_intent"] = "price_product"

            return {
                "action": "price_query",
                "product_id": None,
                "quantity": 1,
                "response": (
                    "Sure. "
                    + price_response(price_products)
                    + " Which one are you asking about?"
                ),
                "requires_confirmation": False,
                "conversation_state": state_response(state),
            }

        state["pending_product_ids"] = []
        state["pending_intent"] = "price_product"

        return {
            "action": "price_query",
            "product_id": None,
            "quantity": 1,
            "response": (
                "Sure. Which menu item would you like the price for?"
            ),
            "requires_confirmation": False,
            "conversation_state": state_response(state),
        }

    # -----------------------------------------------------
    # 2. DETERMINISTIC CHECKOUT
    # -----------------------------------------------------

    finished_phrases = {
        "thats it",
        "that is it",
        "thats all",
        "that is all",
        "done",
        "nothing else",
        "nothing more",
        "no more",
        "im done",
        "i am done",
        "im finished",
        "i am finished",
    }

    if normalized in finished_phrases:
        state["pending_product_ids"] = []
        state["pending_intent"] = None

        return {
            "action": "checkout_confirmation",
            "product_id": None,
            "quantity": 1,
            "response": (
                "Your order is ready. "
                "Would you like to proceed to checkout?"
            ),
            "requires_confirmation": True,
            "conversation_state": state_response(state),
        }

    checkout_confirmation_phrases = {
        "yes",
        "yeah",
        "yep",
        "yup",
        "sure",
        "proceed",
        "checkout",
        "go ahead",
        "yes please",
        "yeah please",
        "sure please",
    }

    last_assistant = ""

    for message in reversed(
        conversation_history[-6:]
    ):
        if message.get("role") == "assistant":
            last_assistant = normalize_text(
                str(message.get("message", ""))
            )
            break

    if (
        normalized in checkout_confirmation_phrases
        and (
            "proceed to checkout" in last_assistant
            or "proceed with checkout" in last_assistant
            or "checkout" in last_assistant
            and "would you" in last_assistant
        )
    ):
        state["pending_product_ids"] = []
        state["pending_intent"] = None

        return {
            "action": "checkout",
            "product_id": None,
            "quantity": 1,
            "response": (
                "Sure, let's proceed to checkout."
            ),
            "requires_confirmation": False,
            "conversation_state": state_response(state),
        }

    # -----------------------------------------------------
    # 3. CONTINUE A PRICE QUESTION
    # -----------------------------------------------------
    #
    # Example:
    # Customer: "What's the price?"
    # Assistant: "Which item?"
    # Customer: "I mean fries."
    #
    # Answer the price instead of adding fries.
    # -----------------------------------------------------

    if state["pending_intent"] == "price_product":
        price_candidates = category_candidates(
            normalized,
            products,
        )

        exact_price_matches = find_exact_product_matches(
            normalized,
            products,
        )

        if exact_price_matches:
            price_candidates = exact_price_matches

        if len(price_candidates) == 1:
            product = price_candidates[0]

            state["pending_product_ids"] = []
            state["pending_intent"] = None
            state["last_mentioned_product_id"] = product.id

            return {
                "action": "price_query",
                "product_id": product.id,
                "quantity": 1,
                "response": price_response(
                    price_candidates
                ),
                "requires_confirmation": False,
                "conversation_state": state_response(
                    state
                ),
            }

        if len(price_candidates) > 1:
            state["pending_product_ids"] = [
                product.id
                for product in price_candidates
            ]

            return {
                "action": "price_query",
                "product_id": None,
                "quantity": 1,
                "response": (
                    price_response(price_candidates)
                    + " Which one are you asking about?"
                ),
                "requires_confirmation": False,
                "conversation_state": state_response(
                    state
                ),
            }

    # -----------------------------------------------------
    # 4. CORRECTION / CATEGORY REQUEST
    # -----------------------------------------------------
    #
    # Handles:
    # "I mean fries"
    # "actually pizza"
    # "no, I want burgers"
    #
    # The resolver uses the REAL menu before asking Ollama.
    # -----------------------------------------------------

    correction_prefixes = (
        "i mean ",
        "actually ",
        "no i mean ",
        "no i want ",
        "i want ",
    )

    correction_text = normalized

    for prefix in correction_prefixes:
        if correction_text.startswith(prefix):
            correction_text = correction_text[len(prefix):].strip()
            break

    correction_candidates = category_candidates(
        correction_text,
        products,
    )

    if correction_candidates and (
        normalized.startswith("i mean ")
        or normalized.startswith("actually ")
        or normalized.startswith("no i mean ")
    ):
        if len(correction_candidates) > 1:
            state["pending_product_ids"] = [
                product.id
                for product in correction_candidates
            ]
            state["pending_intent"] = "select_product"

            return {
                "action": "ask_clarification",
                "product_id": None,
                "quantity": 1,
                "response": clarification_message(
                    correction_candidates
                ),
                "requires_confirmation": False,
                "conversation_state": state_response(state),
            }

        product = correction_candidates[0]

        state["pending_product_ids"] = []
        state["pending_intent"] = None
        state["last_mentioned_product_id"] = product.id

        return {
            "action": "add_to_cart",
            "product_id": product.id,
            "quantity": quantity,
            "response": (
                f"Added {product.name}. Anything else?"
            ),
            "requires_confirmation": False,
            "conversation_state": state_response(state),
        }

    # -----------------------------------------------------
    # 4. EXACT PRODUCT NAME
    # -----------------------------------------------------

    exact_matches = find_exact_product_matches(
        transcript,
        products,
    )

    if len(exact_matches) == 1:
        product = exact_matches[0]

        state["pending_product_ids"] = []
        state["pending_intent"] = None
        state["last_selected_product_id"] = product.id
        state["last_mentioned_product_id"] = product.id

        return {
            "action": "add_to_cart",
            "product_id": product.id,
            "quantity": quantity,
            "response": (
                f"Added {product.name}. "
                "Anything else?"
            ),
            "requires_confirmation": False,
            "conversation_state": state_response(state),
        }

    # -----------------------------------------------------
    # 3. RESOLVE A PENDING CLARIFICATION
    # -----------------------------------------------------

    pending_product = resolve_pending_reference(
        transcript,
        state,
        products_by_id,
    )

    if pending_product:
        state["pending_product_ids"] = []
        state["pending_intent"] = None
        state["last_selected_product_id"] = (
            pending_product.id
        )
        state["last_mentioned_product_id"] = (
            pending_product.id
        )

        return {
            "action": "add_to_cart",
            "product_id": pending_product.id,
            "quantity": quantity,
            "response": (
                f"Added {pending_product.name}. "
                "Anything else?"
            ),
            "requires_confirmation": False,
            "conversation_state": state_response(state),
        }

    # -----------------------------------------------------
    # 4. "ANOTHER ONE" / "ONE MORE"
    # -----------------------------------------------------

    another = (
        "another" in normalized
        or "one more" in normalized
        or "add more" in normalized
    )

    if another:
        last_id = (
            state["last_selected_product_id"]
            or state["last_mentioned_product_id"]
        )

        if last_id in products_by_id:
            product = products_by_id[last_id]

            state["pending_product_ids"] = []
            state["pending_intent"] = None

            return {
                "action": "add_to_cart",
                "product_id": product.id,
                "quantity": quantity,
                "response": (
                    f"Added {quantity} more "
                    f"{product.name}. Anything else?"
                ),
                "requires_confirmation": False,
                "conversation_state": state_response(
                    state
                ),
            }

    # -----------------------------------------------------
    # 5. GENERIC CATEGORY
    # -----------------------------------------------------

    candidates = category_candidates(
        transcript,
        products,
    )

    if len(candidates) > 1:
        state["pending_product_ids"] = [
            product.id
            for product in candidates
        ]
        state["pending_intent"] = "select_product"

        return {
            "action": "ask_clarification",
            "product_id": None,
            "quantity": 1,
            "response": clarification_message(
                candidates
            ),
            "requires_confirmation": False,
            "conversation_state": state_response(
                state
            ),
        }

    if len(candidates) == 1:
        product = candidates[0]

        state["pending_product_ids"] = []
        state["pending_intent"] = None
        state["last_selected_product_id"] = product.id
        state["last_mentioned_product_id"] = product.id

        return {
            "action": "add_to_cart",
            "product_id": product.id,
            "quantity": quantity,
            "response": (
                f"Added {product.name}. "
                "Anything else?"
            ),
            "requires_confirmation": False,
            "conversation_state": state_response(
                state
            ),
        }

    # -----------------------------------------------------
    # 6. FALL BACK TO OLLAMA
    # -----------------------------------------------------

    prompt = build_prompt(
        transcript=transcript,
        menu_context=build_menu_context(products),
        cart_context=json.dumps(
            normalize_cart(cart),
            ensure_ascii=False,
        ),
        history_context=json.dumps(
            normalize_history(
                conversation_history
            ),
            ensure_ascii=False,
        ),
        state=state,
    )

    result = call_ollama(prompt)

    action = result.get(
        "action",
        "unknown",
    )

    if action not in VALID_ACTIONS:
        action = "unknown"

    product_id = result.get(
        "product_id"
    )

    try:
        product_id = (
            int(product_id)
            if product_id is not None
            else None
        )
    except (TypeError, ValueError):
        product_id = None

    ai_quantity = result.get(
        "quantity",
        quantity,
    )

    try:
        ai_quantity = max(
            1,
            int(ai_quantity),
        )
    except (TypeError, ValueError):
        ai_quantity = quantity

    response_text = str(
        result.get(
            "response",
            "Sorry, I didn't understand that.",
        )
    ).strip()

    if not response_text:
        response_text = (
            "Sorry, I didn't understand that."
        )

    # -----------------------------------------------------
    # 7. VALIDATE AI PRODUCT ID
    # -----------------------------------------------------

    if action in {
        "add_to_cart",
        "remove_from_cart",
        "update_quantity",
    }:
        if (
            product_id is None
            or product_id not in products_by_id
        ):
            action = "ask_clarification"
            product_id = None
            ai_quantity = 1
            response_text = (
                "Which menu item would you like?"
            )

    # -----------------------------------------------------
    # 8. UPDATE STATE AFTER AI
    # -----------------------------------------------------

    if action == "add_to_cart" and product_id:
        state["pending_product_ids"] = []
        state["pending_intent"] = None
        state["last_selected_product_id"] = product_id
        state["last_mentioned_product_id"] = product_id

    elif action == "ask_clarification" and product_id is None:
        # If the model asks for clarification but does not give
        # candidates, leave existing state intact. The frontend
        # will send the state back on the next turn.
        pass

    elif action in {
        "checkout",
        "checkout_confirmation",
    }:
        state["pending_product_ids"] = []
        state["pending_intent"] = None

    return {
        "action": action,
        "product_id": product_id,
        "quantity": ai_quantity,
        "response": response_text,
        "requires_confirmation": bool(
            result.get(
                "requires_confirmation",
                False,
            )
        ),
        "conversation_state": state_response(
            state
        ),
    }
