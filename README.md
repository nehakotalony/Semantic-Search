🌐 Semantic Search Engine with PubMed & AI Summarization
A Flask-based web application that searches biomedical literature on PubMed, ranks results by semantic similarity, and generates AI-powered summaries

✨ Features
🔍 Semantic Search: Uses sentence-transformers to find the most relevant PubMed abstracts based on user query.
📚 PubMed Integration: Fetches real-time biomedical abstracts using NCBI’s E-utilities API.
🧠 AI Summarization: Automatically summarizes each result using facebook/bart-base (lightweight, fast, no auth needed).
🔄 Query Expansion: Enriches search terms with synonyms from biomedical lexicons.
🖥️ User-Friendly UI: Clean frontend built with HTML/CSS/JS.
🚀 How It Works
User enters a query (e.g., “effect of metformin on diabetes”)
Query is expanded with synonyms (e.g., “metformin”, “diabetes mellitus”, “glucose control”)
PubMed API is queried for up to 50 relevant papers
Abstracts are embedded using a sentence transformer model
Results are ranked by cosine similarity to the original query
Each abstract is summarized using facebook/bart-base
Final results are returned as JSON + rendered in a clean web interface
All components run in a single Docker container, deployed serverlessly on Google Cloud Run.

🛠 Tech Stack
Backend
Python 3.10, Flask, Gunicorn
ML Models
sentence-transformers/all-MiniLM-L6-v2
sshleifer/distilbart-cnn-6-6
Data Source
PubMed E-Utilities (NCBI)
Frontend
HTML, CSS, JavaScript

Google Cloud Platform (Free Tier)

📁 Project Structure


Semantic-Search/
├── app.py                  # Main Flask app
├── summarizer.py           # Hugging Face summarization logic
├── semantic.py             # Embedding & ranking engine
├── pubmed_client.py        # PubMed API wrapper
├── utils.py                # Synonym expansion (WordNet)
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container image definition
├── .github/workflows/deploy.yml  # Auto-deploy pipeline
├── templates/index.html    # Frontend UI
├── static/                 # CSS/JS assets
└── README.md               # You're here!
📦 Setup & Local Development
Prerequisites
Python 3.9+
pip
Install Dependencies
bash


1
pip install -r requirements.txt
Run Locally
bash


1
python app.py
Visit: http://localhost:5000

🤝 Contributing
Contributions welcome! Please open an issue or PR for:

Better UI/UX
Support for other databases 
Caching layer (Redis/Memcached)
Multi-language support


💬 Acknowledgments
🏫 Hugging Face — for open models and libraries
🧬 NCBI PubMed — for free access to biomedical literature
🎯 Google Cloud — for free-tier serverless deployment
🤖 Flask, Gunicorn, Docker — foundational tools that made this possible
🌟 Built with precision. Deployed with pride.
