from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from semantic import rank_results
from pubmed_client import search_pubmed, fetch_abstracts
from utils import expand_query_with_synonyms
from summarizer import generate_summary   # Hugging Face summarizer
 
print("🚀 Starting Flask app...")
print(f"__name__ = {__name__}")
 
app = Flask(__name__, template_folder="templates", static_folder="static")
print("✅ Flask app object created successfully")
 
CORS(app)
 
@app.route("/")
def home():
    return render_template("index.html")
 
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})
 
@app.route("/api/search", methods=["POST"])
def search():
    data = request.get_json()
    query = data.get("query", "")
    top_k = int(data.get("top_k", 5))
 
    if not query:
        return jsonify({"error": "Query is required"}), 400
 
    try:
        # 1. Expand query with synonyms
        expanded_query = expand_query_with_synonyms(query)
 
        # 2. PubMed search
        pmids = search_pubmed(expanded_query, retmax=50)
        articles = fetch_abstracts(pmids)
 
        # 3. Rank with embeddings
        results = rank_results(query, articles, top_k=top_k)
 
        # 4. Add Hugging Face summary for each result
        for r in results:
            abstract = r.get("abstract", "")
            r["ai_summary"] = generate_summary(abstract)
 
        return jsonify({"query": query, "results": results})
 
    except Exception as e:
        return jsonify({"error": str(e)}), 500
 
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)