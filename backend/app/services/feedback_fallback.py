def analyze_feedback_local(text: str) -> dict:
    text_lower = text.lower()

    negative_words = [
        "bad",
        "terrible",
        "cold",
        "late",
        "wrong",
        "missing",
        "poor",
        "awful",
        "disappointed",
        "slow",
    ]

    positive_words = [
        "good",
        "great",
        "amazing",
        "excellent",
        "love",
        "loved",
        "delicious",
        "perfect",
    ]

    negative_score = sum(
        word in text_lower
        for word in negative_words
    )

    positive_score = sum(
        word in text_lower
        for word in positive_words
    )

    if negative_score > positive_score:
        sentiment = "negative"
    elif positive_score > negative_score:
        sentiment = "positive"
    else:
        sentiment = "neutral"

    issue = None

    if "cold" in text_lower:
        issue = "food temperature"
    elif "late" in text_lower or "slow" in text_lower:
        issue = "delivery delay"
    elif "wrong" in text_lower:
        issue = "incorrect order"
    elif "missing" in text_lower:
        issue = "missing item"
    elif "bad" in text_lower or "poor" in text_lower:
        issue = "food quality"

    return {
        "sentiment": sentiment,
        "issue": issue,
    }