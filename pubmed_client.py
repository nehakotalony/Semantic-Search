from Bio import Entrez
from typing import List
from config import ENTREZ_EMAIL, ENTREZ_API_KEY

Entrez.email = ENTREZ_EMAIL
if ENTREZ_API_KEY:
    Entrez.api_key = ENTREZ_API_KEY

def search_pubmed(term: str, retmax: int = 50) -> List[str]:
    handle = Entrez.esearch(db="pubmed", term=term, retmax=retmax)
    record = Entrez.read(handle)
    handle.close()
    return record.get("IdList", [])

def fetch_abstracts(pmids: List[str]) -> dict:
    if not pmids:
        return {}
    ids = ",".join(pmids)
    handle = Entrez.efetch(db="pubmed", id=ids, retmode="xml")
    records = Entrez.read(handle)
    handle.close()

    out = {}
    for article in records.get("PubmedArticle", []):
        medline = article.get("MedlineCitation", {})
        pmid = str(medline.get("PMID", ""))
        article_info = medline.get("Article", {})

        title = article_info.get("ArticleTitle", "")
        abstract_text = ""
        if "Abstract" in article_info:
            parts = article_info["Abstract"].get("AbstractText", [])
            abstract_text = "\n".join([str(p) for p in parts])

        pub_date = article_info.get("Journal", {}).get("JournalIssue", {}).get("PubDate", {})
        year = pub_date.get("Year") or pub_date.get("MedlineDate", "")

        out[pmid] = {"title": title, "abstract": abstract_text, "year": year}
    return out

def fetch_mesh_terms(query: str, retmax: int = 5) -> List[str]:
    """
    Fetch MeSH terms related to the query from the MeSH database.
    """
    handle = Entrez.esearch(db="mesh", term=query, retmax=retmax)
    record = Entrez.read(handle)
    handle.close()

    mesh_terms = []
    for uid in record.get("IdList", []):
        # Fetch details for each MeSH ID
        h = Entrez.efetch(db="mesh", id=uid, retmode="xml")
        data = Entrez.read(h)
        h.close()
        if data and "DescriptorRecord" in data[0]:
            desc = data[0]["DescriptorRecord"]["DescriptorName"]["String"]
            mesh_terms.append(desc)
    return mesh_terms
