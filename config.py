import os
from dotenv import load_dotenv

load_dotenv()

ENTREZ_EMAIL = os.getenv("ENTREZ_EMAIL", "")
ENTREZ_API_KEY = os.getenv("ENTREZ_API_KEY", None)

CANDIDATE_FETCH = int(os.getenv("CANDIDATE_FETCH", 50))
DEFAULT_TOP_K = int(os.getenv("DEFAULT_TOP_K", 5))
