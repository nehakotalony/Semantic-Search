class PubMedSemanticSearch {
  constructor() {
    this.baseURL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    this.currentResults = []
    this.currentPage = 1
    this.resultsPerPage = 20
    this.totalResults = 0
    this.currentQuery = ""
    this.maxResults = 20
    this.topKResults = 5

    this.recommendations = [
      { text: "COVID-19 vaccine efficacy", category: "Vaccines", icon: "🦠" },
      { text: "machine learning medical diagnosis", category: "AI/ML", icon: "🤖" },
      { text: "cancer immunotherapy breakthrough", category: "Oncology", icon: "🎗️" },
      { text: "diabetes prevention strategies", category: "Endocrinology", icon: "💉" },
      { text: "cardiovascular disease risk factors", category: "Cardiology", icon: "❤️" },
      { text: "mental health interventions", category: "Psychiatry", icon: "🧠" },
      { text: "antibiotic resistance mechanisms", category: "Microbiology", icon: "🦠" },
      { text: "gene therapy clinical trials", category: "Genetics", icon: "🧬" },
      { text: "alzheimer disease biomarkers", category: "Neurology", icon: "🧠" },
      { text: "stem cell regenerative medicine", category: "Regenerative", icon: "🔬" },
      { text: "CRISPR gene editing applications", category: "Genetics", icon: "✂️" },
      { text: "telemedicine patient outcomes", category: "Digital Health", icon: "📱" },
    ]
    this.isRecommendationsVisible = false

    this.initializeEventListeners()
    this.setupSemanticEnhancements()
    this.initializeSliders()
  }

  initializeEventListeners() {
    // Search form submission
    document.getElementById("searchForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.performSearch()
    })

    // Filters toggle
    document.getElementById("filtersToggle").addEventListener("click", () => {
      this.toggleFilters()
    })

    // Clear filters
    document.getElementById("clearBtn").addEventListener("click", () => {
      this.clearFilters()
    })

    // Sort change
    document.getElementById("sortBy").addEventListener("change", () => {
      this.sortResults()
    })

    // Real-time search suggestions (debounced)
    let searchTimeout
    document.getElementById("searchQuery").addEventListener("input", (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        this.provideSuggestions(e.target.value)
      }, 300)
    })

    const searchInput = document.getElementById("searchQuery")

    // Show recommendations on focus
    searchInput.addEventListener("focus", () => {
      this.showRecommendations()
    })

    // Hide recommendations on blur (with delay to allow clicks)
    searchInput.addEventListener("blur", () => {
      setTimeout(() => {
        this.hideRecommendations()
      }, 200)
    })

    // Filter recommendations on input
    searchInput.addEventListener("input", (e) => {
      this.filterRecommendations(e.target.value)
    })

    // Hide recommendations on escape key
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideRecommendations()
      }
    })

    // Click outside to hide recommendations
    document.addEventListener("click", (e) => {
      const searchContainer = document.querySelector(".search-input-group")
      if (!searchContainer.contains(e.target)) {
        this.hideRecommendations()
      }
    })
  }

  showRecommendations() {
    const recommendationsContainer = document.getElementById("searchRecommendations")
    const searchInput = document.getElementById("searchQuery")

    if (searchInput.value.trim().length === 0) {
      this.displayRecommendations(this.recommendations)
    } else {
      this.filterRecommendations(searchInput.value)
    }

    recommendationsContainer.style.display = "block"
    this.isRecommendationsVisible = true
  }

  hideRecommendations() {
    const recommendationsContainer = document.getElementById("searchRecommendations")
    recommendationsContainer.style.display = "none"
    this.isRecommendationsVisible = false
  }

  filterRecommendations(query) {
    if (!query.trim()) {
      this.displayRecommendations(this.recommendations)
      return
    }

    const filtered = this.recommendations.filter(
      (rec) =>
        rec.text.toLowerCase().includes(query.toLowerCase()) ||
        rec.category.toLowerCase().includes(query.toLowerCase()),
    )

    this.displayRecommendations(filtered)
  }

  displayRecommendations(recommendations) {
    const recommendationsList = document.getElementById("recommendationsList")

    if (recommendations.length === 0) {
      recommendationsList.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--muted-foreground); font-size: 0.875rem;">
          No matching suggestions found
        </div>
      `
      return
    }

    recommendationsList.innerHTML = recommendations
      .map(
        (rec) => `
      <button class="recommendation-item" onclick="pubmedSearch.selectRecommendation('${rec.text}')">
        <span class="recommendation-icon">${rec.icon}</span>
        <span class="recommendation-text">${rec.text}</span>
        <span class="recommendation-category">${rec.category}</span>
      </button>
    `,
      )
      .join("")
  }

  selectRecommendation(text) {
    const searchInput = document.getElementById("searchQuery")
    searchInput.value = text
    this.hideRecommendations()
    searchInput.focus()
  }

  initializeSliders() {
    const maxResultsSlider = document.getElementById("maxResultsSlider")
    const maxResultsValue = document.getElementById("maxResultsValue")
    const topKSlider = document.getElementById("topKSlider")
    const topKValue = document.getElementById("topKValue")

    // Max Results Slider
    maxResultsSlider.addEventListener("input", (e) => {
      this.maxResults = Number.parseInt(e.target.value)
      maxResultsValue.textContent = this.maxResults
      this.updateSliderBackground(maxResultsSlider)
    })

    // Top K Semantic Results Slider
    topKSlider.addEventListener("input", (e) => {
      this.topKResults = Number.parseInt(e.target.value)
      topKValue.textContent = this.topKResults
      this.updateSliderBackground(topKSlider)
    })

    // Initialize slider backgrounds
    this.updateSliderBackground(maxResultsSlider)
    this.updateSliderBackground(topKSlider)
  }

  updateSliderBackground(slider) {
    const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100
    slider.style.background = `linear-gradient(to right, #ef4444 0%, #f97316 ${value}%, #e2e8f0 ${value}%, #e2e8f0 100%)`
  }

  setupSemanticEnhancements() {
    // Semantic query expansion mappings
    this.semanticMappings = {
      covid: ["COVID-19", "SARS-CoV-2", "coronavirus", "pandemic"],
      cancer: ["neoplasm", "tumor", "malignancy", "carcinoma"],
      diabetes: ["diabetes mellitus", "hyperglycemia", "insulin resistance"],
      heart: ["cardiac", "cardiovascular", "myocardial"],
      brain: ["cerebral", "neurological", "neural", "cognitive"],
      treatment: ["therapy", "intervention", "management"],
      diagnosis: ["diagnostic", "screening", "detection"],
      prevention: ["prophylaxis", "preventive", "protective"],
    }

    // Medical abbreviation expansions
    this.abbreviations = {
      MI: "myocardial infarction",
      HTN: "hypertension",
      DM: "diabetes mellitus",
      COPD: "chronic obstructive pulmonary disease",
      CHF: "congestive heart failure",
      CAD: "coronary artery disease",
      CVD: "cardiovascular disease",
      ICU: "intensive care unit",
    }
  }

  enhanceQuery(query) {
    let enhancedQuery = query.toLowerCase()

    // Expand abbreviations
    Object.keys(this.abbreviations).forEach((abbr) => {
      const regex = new RegExp(`\\b${abbr}\\b`, "gi")
      if (enhancedQuery.match(regex)) {
        enhancedQuery += ` OR "${this.abbreviations[abbr]}"`
      }
    })

    // Add semantic expansions
    Object.keys(this.semanticMappings).forEach((term) => {
      if (enhancedQuery.includes(term)) {
        const synonyms = this.semanticMappings[term]
        const synonymQuery = synonyms.map((syn) => `"${syn}"`).join(" OR ")
        enhancedQuery += ` OR (${synonymQuery})`
      }
    })

    return enhancedQuery
  }

  buildSearchQuery() {
    const query = document.getElementById("searchQuery").value.trim()
    const searchField = document.getElementById("searchField").value
    const publicationType = document.getElementById("publicationType").value
    const dateFrom = document.getElementById("dateFrom").value
    const dateTo = document.getElementById("dateTo").value
    const language = document.getElementById("language").value

    if (!query) {
      throw new Error("Please enter a search query")
    }

    // Enhance query with semantic expansions
    let enhancedQuery = this.enhanceQuery(query)

    // Apply field restrictions
    if (searchField !== "all") {
      const fieldMap = {
        title: "[Title]",
        abstract: "[Abstract]",
        author: "[Author]",
        journal: "[Journal]",
      }
      enhancedQuery = `(${enhancedQuery})${fieldMap[searchField]}`
    }

    // Add publication type filter
    if (publicationType) {
      enhancedQuery += ` AND "${publicationType}"[Publication Type]`
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      const fromDate = dateFrom || "1900/01/01"
      const toDate = dateTo || new Date().toISOString().split("T")[0].replace(/-/g, "/")
      enhancedQuery += ` AND ("${fromDate}"[Date - Publication] : "${toDate}"[Date - Publication])`
    }

    // Add language filter
    if (language) {
      enhancedQuery += ` AND ${language}[Language]`
    }

    return enhancedQuery
  }

  async performSearch(page = 1) {
    try {
      this.showLoading()
      this.hideError()
      this.hideRecommendations() // Hide recommendations when searching

      const query = this.buildSearchQuery()
      const maxResults = this.maxResults

      this.currentQuery = query
      this.currentPage = page
      this.resultsPerPage = maxResults

      console.log(`[v0] Performing search with maxResults: ${maxResults}, topK: ${this.topKResults}`)

      // Step 1: Search for article IDs
      const searchResponse = await this.searchArticles(query, page, maxResults)

      if (searchResponse.esearchresult.idlist.length === 0) {
        this.showNoResults()
        return
      }

      // Step 2: Fetch article details
      let articles = await this.fetchArticleDetails(searchResponse.esearchresult.idlist)

      articles = this.applySemanticFiltering(articles, query)

      this.currentResults = articles
      this.totalResults = Number.parseInt(searchResponse.esearchresult.count)

      this.displayResults(articles)
      this.updatePagination()
    } catch (error) {
      console.error("Search error:", error)
      this.showError(error.message)
    } finally {
      this.hideLoading()
    }
  }

  applySemanticFiltering(articles, originalQuery) {
    console.log(`[v0] Applying semantic filtering to get top ${this.topKResults} results`)

    // Calculate semantic relevance scores
    const scoredArticles = articles.map((article) => {
      const score = this.calculateSemanticScore(article, originalQuery)
      return { ...article, semanticScore: score }
    })

    // Sort by semantic score and take top K
    const topResults = scoredArticles.sort((a, b) => b.semanticScore - a.semanticScore).slice(0, this.topKResults)

    console.log(`[v0] Filtered ${articles.length} articles to top ${topResults.length} semantic matches`)

    return topResults
  }

  calculateSemanticScore(article, query) {
   const queryTerms = query.toLowerCase().split(/\s+/)
  const articleText = `${article.title} ${article.abstract}`.toLowerCase()

  let score = 0

  // Helper: safely escape regex characters
  const escapeRegex = (str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  // Basic term frequency scoring
  queryTerms.forEach((term) => {
    const safeTerm = escapeRegex(term) // escape dangerous chars
    const regex = new RegExp(safeTerm, "g")
    const termCount = (articleText.match(regex) || []).length
    score += termCount
  })

  // Boost score for title matches
  queryTerms.forEach((term) => {
    if (article.title.toLowerCase().includes(term)) {
      score += 2
    }
  })

  // Apply semantic mappings boost
  Object.keys(this.semanticMappings).forEach((semanticTerm) => {
    if (queryTerms.some((term) => term.includes(semanticTerm))) {
      this.semanticMappings[semanticTerm].forEach((synonym) => {
        if (articleText.includes(synonym.toLowerCase())) {
          score += 1.5
        }
      })
    }
  })

  return score

  }

  async searchArticles(query, page, maxResults) {
    const retstart = (page - 1) * maxResults
    const searchURL =
      `${this.baseURL}esearch.fcgi?` +
      `db=pubmed&` +
      `term=${encodeURIComponent(query)}&` +
      `retmax=${maxResults}&` +
      `retstart=${retstart}&` +
      `retmode=json&` +
      `sort=relevance&` +
      `usehistory=y`

    const response = await fetch(searchURL)
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    return await response.json()
  }

  async fetchArticleDetails(idList) {
    if (!idList || idList.length === 0) {
      return []
    }

    const summaryURL = `${this.baseURL}esummary.fcgi?` + `db=pubmed&` + `id=${idList.join(",")}&` + `retmode=json`

    const response = await fetch(summaryURL)
    if (!response.ok) {
      throw new Error(`Failed to fetch article details: ${response.statusText}`)
    }

    const data = await response.json()
    const articles = []

    Object.keys(data.result).forEach((id) => {
      if (id !== "uids") {
        const article = data.result[id]
        articles.push(this.formatArticle(article))
      }
    })

    return articles
  }

  formatArticle(article) {
    // Extract authors
    const authors = article.authors
      ? article.authors
          .slice(0, 3)
          .map((author) => author.name)
          .join(", ") + (article.authors.length > 3 ? ", et al." : "")
      : "Unknown authors"

    // Format date
    const pubDate = article.pubdate ? new Date(article.pubdate).toLocaleDateString() : "Unknown date"

    // Create PubMed URL
    const pubmedURL = `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`

    return {
      id: article.uid,
      title: article.title || "Untitled",
      authors: authors,
      journal: article.fulljournalname || article.source || "Unknown journal",
      abstract: this.truncateText(article.title, 300), // Using title as abstract preview
      pubDate: pubDate,
      url: pubmedURL,
      doi: article.elocationid || null,
      pmid: article.uid,
    }
  }

  displayResults(articles) {
    const articlesGrid = document.getElementById("articlesGrid")
    const resultsSection = document.getElementById("resultsSection")
    const resultsCount = document.getElementById("resultsCount")

    const semanticInfo = articles.length < this.maxResults ? ` (showing top ${articles.length} semantic matches)` : ""
    resultsCount.textContent = `📊 Found ${this.totalResults.toLocaleString()} articles${semanticInfo}`

    // Clear previous results
    articlesGrid.innerHTML = ""

    // Display articles
    articles.forEach((article, index) => {
      const articleCard = this.createArticleCard(article, index + 1)
      articlesGrid.appendChild(articleCard)
    })

    // Show results section
    resultsSection.style.display = "block"
    resultsSection.scrollIntoView({ behavior: "smooth" })
  }
    updatePagination() {
    const pagination = document.getElementById("pagination")
    pagination.innerHTML = ""

    const totalPages = Math.ceil(this.totalResults / this.resultsPerPage)

    if (totalPages <= 1) return

    // Previous button
    if (this.currentPage > 1) {
      const prevBtn = document.createElement("button")
      prevBtn.textContent = "Previous"
      prevBtn.className = "btn btn-secondary"
      prevBtn.onclick = () => this.performSearch(this.currentPage - 1)
      pagination.appendChild(prevBtn)
    }

    // Page indicator
    const pageInfo = document.createElement("span")
    pageInfo.textContent = ` Page ${this.currentPage} of ${totalPages} `
    pagination.appendChild(pageInfo)

    // Next button
    if (this.currentPage < totalPages) {
      const nextBtn = document.createElement("button")
      nextBtn.textContent = "Next"
      nextBtn.className = "btn btn-secondary"
      nextBtn.onclick = () => this.performSearch(this.currentPage + 1)
      pagination.appendChild(nextBtn)
    }
  }


  createArticleCard(article, rank) {
    const card = document.createElement("div")
    card.className = "article-card"

    const semanticBadge = article.semanticScore
      ? `<div style="position: absolute; top: 1rem; right: 1rem; background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600;">#${rank} Match</div>`
      : ""

    card.innerHTML = `
            ${semanticBadge}
            <h3 class="article-title">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                    ${article.title}
                </a>
            </h3>
            <div class="article-authors">${article.authors}</div>
            <div class="article-journal">${article.journal}</div>
            <div class="article-abstract">${article.abstract}</div>
            <div class="article-meta">
                <div class="article-date">Published: ${article.pubDate}</div>
                <div class="article-actions">
                    <a href="${article.url}" target="_blank" class="btn btn-primary btn-small view-article-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15,3 21,3 21,9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        View Article
                    </a>
                    <button class="btn btn-summary btn-small" onclick="pubmedSearch.generateSummary('${article.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                        </svg>
                        Summary
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="pubmedSearch.saveArticle('${article.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Save
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="pubmedSearch.shareArticle('${article.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        Share
                    </button>
                </div>
            </div>
            <div class="article-summary" id="summary-${article.id}" style="display: none;">
                <!-- Summary content will be populated here -->
            </div>
        `

    return card
  }

  async generateSummary(articleId) {
    const article = this.currentResults.find((a) => a.id === articleId)
    if (!article) return

    const summaryContainer = document.getElementById(`summary-${articleId}`)
    const summaryButton = event.target.closest(".btn-summary")

    // Show loading state
    summaryButton.innerHTML = `
      <div class="summary-spinner"></div>
      Generating...
    `
    summaryButton.disabled = true

    try {
      // Simulate API call to generate summary (replace with actual backend endpoint)
      const summary = await this.callSummaryAPI(article)

      // Display the summary
      summaryContainer.innerHTML = `
        <div class="summary-content">
          <div class="summary-header">
            <h4>AI-Generated Summary</h4>
            <button class="summary-close" onclick="pubmedSearch.closeSummary('${articleId}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="summary-text">
            ${summary}
          </div>
          <div class="summary-disclaimer">
            <small>This summary was generated by AI and may not capture all nuances of the original research.</small>
          </div>
        </div>
      `

      summaryContainer.style.display = "block"
      summaryContainer.scrollIntoView({ behavior: "smooth", block: "nearest" })

      // Update button to show "Hide Summary"
      summaryButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        Hide Summary
      `
      summaryButton.onclick = () => this.closeSummary(articleId)
    } catch (error) {
      console.error("Summary generation failed:", error)
      summaryContainer.innerHTML = `
        <div class="summary-error">
          <p>Failed to generate summary. Please try again later.</p>
        </div>
      `
      summaryContainer.style.display = "block"

      // Reset button
      summaryButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
        Summary
      `
    } finally {
      summaryButton.disabled = false
    }
  }

  async callSummaryAPI(article) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In a real implementation, this would call your backend API
    // Example: const response = await fetch('/api/generate-summary', { method: 'POST', body: JSON.stringify(article) })

    // For now, generate a mock summary based on article data
    const mockSummary = this.generateMockSummary(article)
    return mockSummary
  }

  generateMockSummary(article) {
    const summaryLines = [
      `This study, published in ${article.journal}, investigates ${article.title.toLowerCase()}.`,
      `The research was conducted by ${article.authors} and focuses on key medical findings.`,
      `The study methodology involved comprehensive analysis of relevant patient data and clinical outcomes.`,
      `Key findings suggest significant implications for current medical practice and patient care.`,
      `The research contributes valuable insights to the existing body of medical literature.`,
      `Clinical applications of these findings may impact treatment protocols and patient outcomes.`,
      `The study's limitations include sample size considerations and potential confounding variables.`,
      `Future research directions should explore long-term effects and broader patient populations.`,
      `The findings support evidence-based medical decision making in clinical practice.`,
      `This research adds to our understanding of the underlying mechanisms and therapeutic approaches.`,
    ]

    return summaryLines.join(" ")
  }

  closeSummary(articleId) {
    const summaryContainer = document.getElementById(`summary-${articleId}`)
    const summaryButton = document
      .querySelector(`[onclick="pubmedSearch.closeSummary('${articleId}')"]`)
      .closest(".article-card")
      .querySelector(".btn-summary")

    summaryContainer.style.display = "none"

    // Reset button to original state
    summaryButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>
      Summary
    `
    summaryButton.onclick = () => this.generateSummary(articleId)
  }

  sortResults() {
    const sortBy = document.getElementById("sortBy").value

    const sortedResults = [...this.currentResults]

    switch (sortBy) {
      case "date":
        sortedResults.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        break
      case "author":
        sortedResults.sort((a, b) => a.authors.localeCompare(b.authors))
        break
      case "journal":
        sortedResults.sort((a, b) => a.journal.localeCompare(b.journal))
        break
      default: // relevance - keep original order
        break
    }

    this.displayResults(sortedResults)
  }

  toggleFilters() {
    const filtersContent = document.getElementById("filtersContent")
    const filterIcon = document.getElementById("filterIcon")

    if (filtersContent.classList.contains("active")) {
      filtersContent.classList.remove("active")
      filterIcon.textContent = "▼"
    } else {
      filtersContent.classList.add("active")
      filterIcon.textContent = "▲"
    }
  }

  clearFilters() {
    document.getElementById("searchQuery").value = ""
    document.getElementById("searchField").value = "all"
    document.getElementById("publicationType").value = ""
    document.getElementById("dateFrom").value = ""
    document.getElementById("dateTo").value = ""
    document.getElementById("language").value = ""
    document.getElementById("sortBy").value = "relevance"

    this.maxResults = 20
    this.topKResults = 5

    const maxResultsSlider = document.getElementById("maxResultsSlider")
    const maxResultsValue = document.getElementById("maxResultsValue")
    const topKSlider = document.getElementById("topKSlider")
    const topKValue = document.getElementById("topKValue")

    maxResultsSlider.value = 20
    maxResultsValue.textContent = "20"
    topKSlider.value = 5
    topKValue.textContent = "5"

    this.updateSliderBackground(maxResultsSlider)
    this.updateSliderBackground(topKSlider)

    // Hide results
    document.getElementById("resultsSection").style.display = "none"
  }

  provideSuggestions(query) {
    // Simple suggestion system based on common medical terms
    if (query.length < 3) return

    const suggestions = [
      "COVID-19 vaccine efficacy",
      "machine learning medical diagnosis",
      "cancer immunotherapy",
      "diabetes treatment guidelines",
      "cardiovascular disease prevention",
      "mental health interventions",
      "antibiotic resistance mechanisms",
      "gene therapy clinical trials",
    ]

    // This could be enhanced with a proper suggestion API
    console.log("Suggestions for:", query)
  }

  saveArticle(articleId) {
    // Implement save functionality
    const article = this.currentResults.find((a) => a.id === articleId)
    if (article) {
      // Save to localStorage or send to backend
      const savedArticles = JSON.parse(localStorage.getItem("savedArticles") || "[]")
      if (!savedArticles.find((a) => a.id === articleId)) {
        savedArticles.push(article)
        localStorage.setItem("savedArticles", JSON.stringify(savedArticles))
        alert("Article saved successfully!")
      } else {
        alert("Article already saved!")
      }
    }
  }

  shareArticle(articleId) {
    const article = this.currentResults.find((a) => a.id === articleId)
    if (article && navigator.share) {
      navigator.share({
        title: article.title,
        text: `Check out this research article: ${article.title}`,
        url: article.url,
      })
    } else if (article) {
      // Fallback to clipboard
      navigator.clipboard.writeText(article.url).then(() => {
        alert("Article URL copied to clipboard!")
      })
    }
  }

  showLoading() {
    document.getElementById("loadingSection").style.display = "block"
    document.getElementById("resultsSection").style.display = "none"
  }

  hideLoading() {
    document.getElementById("loadingSection").style.display = "none"
  }

  showError(message) {
    const errorMessage = document.getElementById("errorMessage")
    const errorText = document.getElementById("errorText")
    errorText.textContent = message
    errorMessage.style.display = "block"
    errorMessage.scrollIntoView({ behavior: "smooth" })
  }

  hideError() {
    document.getElementById("errorMessage").style.display = "none"
  }

  showNoResults() {
    const articlesGrid = document.getElementById("articlesGrid")
    const resultsSection = document.getElementById("resultsSection")
    const resultsCount = document.getElementById("resultsCount")

    resultsCount.textContent = "No articles found"
    articlesGrid.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--muted-foreground);">
                <h3>No results found</h3>
                <p>Try adjusting your search terms or filters</p>
                <ul style="text-align: left; max-width: 400px; margin: 1rem auto;">
                    <li>Check spelling of search terms</li>
                    <li>Use broader or more general terms</li>
                    <li>Remove some filters</li>
                    <li>Try synonyms or related terms</li>
                </ul>
            </div>
        `

    resultsSection.style.display = "block"
    document.getElementById("pagination").innerHTML = ""
  }

  truncateText(text, maxLength) {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }
}

// Initialize the application
const pubmedSearch = new PubMedSemanticSearch()

// Add some demo functionality for better UX
document.addEventListener("DOMContentLoaded", () => {
  // Add example searches
  const exampleQueries = [
    "COVID-19 vaccine efficacy",
    "machine learning medical diagnosis",
    "cancer immunotherapy breakthrough",
    "diabetes prevention strategies",
  ]

  // You could add these as clickable examples in the UI
  console.log("PubMed Semantic Search initialized")
  console.log("Example queries:", exampleQueries)
})
