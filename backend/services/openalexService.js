const axios = require('axios');

/**
 * Fetches research publications from OpenAlex API.
 * Retrieves up to 100 results for broad coverage before ranking.
 */
async function fetchOpenAlex(query, disease, maxResults = 100) {
  const expandedQuery = buildExpandedQuery(query, disease);

  try {
    // Fetch in two pages of 50 for broader coverage
    const [page1, page2] = await Promise.allSettled([
      fetchPage(expandedQuery, 1, 50),
      fetchPage(expandedQuery, 2, 50),
    ]);

    const results1 = page1.status === 'fulfilled' ? page1.value : [];
    const results2 = page2.status === 'fulfilled' ? page2.value : [];

    const combined = [...results1, ...results2];

    // Deduplicate by DOI or title
    const seen = new Set();
    return combined.filter((item) => {
      const key = item.doi || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (err) {
    console.error('[OpenAlex] fetch error:', err.message);
    return [];
  }
}

async function fetchPage(query, page, perPage) {
  const res = await axios.get('https://api.openalex.org/works', {
    params: {
      search: query,
      per_page: perPage,
      page,
      sort: 'relevance_score:desc',
      filter: 'has_abstract:true,type:article',
      select: [
        'id', 'title', 'abstract_inverted_index', 'authorships',
        'publication_year', 'doi', 'primary_location', 'cited_by_count',
        'open_access', 'concepts',
      ].join(','),
    },
    headers: {
      'User-Agent': 'CuraLink/1.0 (mailto:curalink@research.ai)',
    },
    timeout: 12000,
  });

  return (res.data.results || []).map(mapWork);
}

function mapWork(w) {
  const abstract = w.abstract_inverted_index
    ? invertedIndexToText(w.abstract_inverted_index)
    : '';

  const authors = (w.authorships || [])
    .slice(0, 5)
    .map((a) => a.author?.display_name)
    .filter(Boolean)
    .join(', ');

  const url =
    w.primary_location?.landing_page_url ||
    (w.doi ? `https://doi.org/${w.doi}` : null) ||
    w.id;

  return {
    id: w.id,
    title: w.title || 'Untitled',
    abstract,
    authors,
    year: w.publication_year,
    url,
    doi: w.doi,
    source: 'OpenAlex',
    citationCount: w.cited_by_count || 0,
    isOpenAccess: w.open_access?.is_oa || false,
    concepts: (w.concepts || []).slice(0, 5).map((c) => c.display_name),
  };
}

function invertedIndexToText(index) {
  try {
    const words = [];
    for (const [word, positions] of Object.entries(index)) {
      positions.forEach((pos) => { words[pos] = word; });
    }
    return words.filter(Boolean).join(' ');
  } catch {
    return '';
  }
}

function buildExpandedQuery(query, disease) {
  // Intelligently expand query with disease context
  const q = query.toLowerCase();
  const d = disease.toLowerCase();

  // If disease is already in query, don't duplicate
  if (q.includes(d)) return query;

  // Combine query + disease for context-aware retrieval
  return `${query} ${disease}`;
}

module.exports = { fetchOpenAlex };