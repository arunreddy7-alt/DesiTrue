import json
import time

from google import genai

from app.core.database import settings


client = genai.Client(
    api_key=settings.gemini_api_key
)


PROMPT_TEMPLATE = """
You are analyzing customer feedback for a food ordering application.

Analyze the feedback and return ONLY valid JSON.

Required JSON format:
{{
  "sentiment": "positive | neutral | negative",
  "issue": "string or null"
}}

Rules:
- sentiment must be exactly one of: positive, neutral, negative
- issue should describe the main problem if one exists
- if there is no specific issue, return null
- do not include markdown
- do not include explanations

Customer feedback:
{feedback}
"""

def analyze_feedback(text: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(feedback=text)

    models = [
        "gemini-3.8-flash",
    ]

    last_error = None

    for model in models:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                )

                result = response.text.strip()

                # Remove accidental markdown fences
                if result.startswith("```"):
                    result = result.replace("```json", "")
                    result = result.replace("```", "")
                    result = result.strip()

                analysis = json.loads(result)

                sentiment = analysis.get("sentiment")
                issue = analysis.get("issue")

                if sentiment not in {
                    "positive",
                    "neutral",
                    "negative",
                }:
                    raise ValueError(
                        "AI returned an invalid sentiment."
                    )

                return {
                    "sentiment": sentiment,
                    "issue": issue,
                }

            except Exception as error:
                last_error = error

                # Retry temporary provider failures.
                if "503" in str(error) or "UNAVAILABLE" in str(error):
                    time.sleep(2 * (attempt + 1))
                    continue

                raise

    raise RuntimeError(
        f"AI service unavailable after retries: {last_error}"
    )