from sentence_transformers import SentenceTransformer, util

# Load the model once
model = SentenceTransformer("all-MiniLM-L6-v2")

def rank_results(query: str, articles: dict, top_k: int = 5):
    """
    Rank PubMed articles by semantic similarity to the query.
    :param query: user query
    :param articles: dict of pmid -> {title, abstract, year}
    :param top_k: number of top results to return
    """
    results = []
    if not articles:
        return results

    # Encode query
    query_emb = model.encode(query, convert_to_tensor=True)

    # Prepare texts
    pmids = list(articles.keys())
    texts = [articles[pmid]["title"] + " " + articles[pmid]["abstract"] for pmid in pmids]

    # Encode all abstracts
    doc_embs = model.encode(texts, convert_to_tensor=True)

    # Compute similarity
    similarities = util.pytorch_cos_sim(query_emb, doc_embs)[0]

    # Sort by similarity
    scores = list(zip(pmids, similarities.tolist()))
    scores.sort(key=lambda x: x[1], reverse=True)

    # Collect top-k
    for pmid, score in scores[:top_k]:
        art = articles[pmid]
        results.append({
            "pmid": pmid,
            "title": art.get("title", ""),
            "abstract": art.get("abstract", ""),
            "year": art.get("year", ""),
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            "score": float(score)
        })

    return results
