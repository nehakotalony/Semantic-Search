import logging
from transformers import pipeline

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_summarizer = None

try:
    logger.info("🚀 Loading summarization model... (this may take 10-20 seconds)")
    _summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-6-6")
    logger.info("✅ Summarization model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load summarization model: {str(e)}")
    # Keep _summarizer = None so we can handle it safely later

def generate_summary(abstract):
    if not abstract or len(abstract.strip()) == 0:
        return "Summary not available."

    if _summarizer is None:
        return "⚠️ Summary service temporarily unavailable (model failed to load)."

    try:
        result = _summarizer(abstract, max_length=130, min_length=30, do_sample=False)
        return result[0]['summary_text']
    except Exception as e:
        return f"⚠️ Summary generation failed: {str(e)}"