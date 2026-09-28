import json
import os

from google import genai

from app.services.feedback_fallback import analyze_feedback_local


def analyze_feedback(feedback_text: str) -> dict:
    """
    Analyze customer feedback using Gemini.

    Falls back to local keyword-based analysis
    if Gemini is unavailable.
    """

    if not feedback_text or not feedback_text.strip():
        return {
            "sentiment": "neutral",
            "issue": None,
        }

    api_key = os.getenv("GEMINI_API_KEY")

    # ---------------------------------------------------------
    # LOCAL FALLBACK
    # ---------------------------------------------------------

    if not api_key:
        return analyze_feedback_local(
            feedback_text
        )

    try:
        client = genai.Client(
            api_key=api_key
        )

        prompt = f"""
Analyze the following customer feedback.

Return ONLY valid JSON.

Required format:

{{
    "sentiment": "positive",
    "issue": null
}}

Rules:

1. sentiment must be exactly one of:
   - positive
   - negative
   - neutral

2. issue:
   - Extract the main complaint/problem if one exists.
   - If there is no clear problem, use null.

Customer feedback:

"{feedback_text}"
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )

        text = response.text.strip()

        # Remove markdown code fences if Gemini adds them
        if text.startswith("```"):
            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

        result = json.loads(text)

        sentiment = str(
            result.get("sentiment", "neutral")
        ).lower().strip()

        if sentiment not in {
            "positive",
            "negative",
            "neutral",
        }:
            sentiment = "neutral"

        issue = result.get("issue")

        if issue:
            issue = str(issue).strip()
        else:
            issue = None

        return {
            "sentiment": sentiment,
            "issue": issue,
        }

    except Exception as error:
        print(
            f"Feedback AI analysis failed: {error}"
        )

        # Gemini failed → use local analysis
        return analyze_feedback_local(
            feedback_text
        )