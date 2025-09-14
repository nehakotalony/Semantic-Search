from synonyms import SYNONYMS
import re
from nltk.stem import WordNetLemmatizer
from pubmed_client import fetch_mesh_terms

lemmatizer = WordNetLemmatizer()

def normalize(text: str) -> str:
    return re.sub(r'\s+', ' ', (text or "").strip()).lower()

def expand_truncation(query: str) -> str:
    """
    Handle simple truncation (e.g. therap* -> therapy, therapies)
    and lemmatize words for better matching.
    """
    words = query.split()
    expanded_words = []
    for w in words:
        if w.endswith("*"):  # truncation pattern
            root = w[:-1]
            expanded_words.append(f"{root} OR {root}y OR {root}ies OR {root}ic")
        else:
            expanded_words.append(lemmatizer.lemmatize(w))
    return " ".join(expanded_words)

def expand_query_with_synonyms(query: str) -> str:
    """
    Expand the query with synonyms and MeSH terms if available.
    """
    qnorm = normalize(query)
    expanded_query = query

    additions = []
    # 1. Add synonyms
    for key, syns in SYNONYMS.items():
        if key in qnorm:
            group = " OR ".join([f'"{key}"'] + [f'"{s}"' for s in syns])
            additions.append(group)

    # 2. Add MeSH terms dynamically
    mesh_terms = fetch_mesh_terms(query)
    if mesh_terms:
        mesh_group = " OR ".join([f'"{m}"' for m in mesh_terms])
        additions.append(mesh_group)

    # 3. Build expanded query
    if additions:
        expanded = " OR ".join(additions)
        expanded_query = f'({expanded}) OR "{query}"'

    # 4. Handle truncation and lemmatization
    expanded_query = expand_truncation(expanded_query)

    return expanded_query
