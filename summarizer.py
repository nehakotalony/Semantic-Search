from transformers import pipeline
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-6-6")

def generate_summary(text: str) -> str:
    if not text:
        return "No abstract available to summarize."

    try:
        if len(text.split()) > 500:
            text = " ".join(text.split()[:500])

        summary = summarizer(text, max_length=150, min_length=50, do_sample=False)
        return summary[0]["summary_text"]
    except Exception as e:
        return f"[AI Summary unavailable: {e}]"
