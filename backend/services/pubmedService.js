const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const API_KEY = process.env.NCBI_API_KEY || '';

/**
 * Fetches research publications from PubMed (NCBI).
 * Uses ESearch + EFetch pipeline for detailed results.
 */
async function fetchPubMed(query, disease, maxResults = 100) {
  try {
    const expandedQuery = `${query} ${disease}`;

    // Step 1: Search for PMIDs
    const searchParams = {
      db: 'pubmed',
      term: expandedQuery,
      retmax: maxResults,
      retmode: 'json',
      sort: 'relevance',
      usehistory: 'y',
    };
    if (API_KEY) searchParams.api_key = API_KEY;

    const searchRes = await axios.get(`${BASE_URL}/esearch.fcgi`, {
      params: searchParams,
      timeout: 12000,
    });

    const { idlist, webenv, query_key, count } = searchRes.data.esearchresult;
    console.log(`[PubMed] Found ${count} results, fetching top ${idlist.length}`);

    if (!idlist || idlist.length === 0) return [];

    // Step 2: Fetch article details in batches of 50
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < idlist.length; i += batchSize) {
      batches.push(idlist.slice(i, i + batchSize));
    }

    const results = await Promise.allSettled(
      batches.map((batch) => fetchBatch(batch))
    );

    const articles = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    return articles;
  } catch (err) {
    console.error('[PubMed] fetch error:', err.message);
    return [];
  }
}

async function fetchBatch(ids) {
  const fetchParams = {
    db: 'pubmed',
    id: ids.join(','),
    rettype: 'abstract',
    retmode: 'xml',
  };
  if (API_KEY) fetchParams.api_key = API_KEY;

  const res = await axios.get(`${BASE_URL}/efetch.fcgi`, {
    params: fetchParams,
    timeout: 15000,
  });

  return parseXMLResponse(res.data);
}

function parseXMLResponse(xmlData) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) =>
      ['PubmedArticle', 'Author', 'AbstractText', 'MeshHeading'].includes(name),
  });

  try {
    const parsed = parser.parse(xmlData);
    const articles = parsed?.PubmedArticleSet?.PubmedArticle || [];

    return articles.map(mapArticle).filter((a) => a && a.title);
  } catch (err) {
    console.error('[PubMed] XML parse error:', err.message);
    return [];
  }
}

function mapArticle(item) {
  try {
    const citation = item?.MedlineCitation;
    const art = citation?.Article;
    if (!art) return null;

    const pmid =
      citation?.PMID?.['#text'] ||
      (typeof citation?.PMID === 'object' ? '' : citation?.PMID) ||
      '';

    // Handle abstract (can be structured with sections)
    let abstract = '';
    const abs = art?.Abstract?.AbstractText;
    if (Array.isArray(abs)) {
      abstract = abs
        .map((section) => {
          if (typeof section === 'string') return section;
          const label = section['@_Label'] ? `${section['@_Label']}: ` : '';
          return label + (section['#text'] || section || '');
        })
        .join(' ');
    } else if (typeof abs === 'string') {
      abstract = abs;
    } else if (abs?.['#text']) {
      abstract = abs['#text'];
    }

    // Authors
    const authorList = art?.AuthorList?.Author || [];
    const authors = authorList
      .slice(0, 5)
      .map((a) => {
        const last = a.LastName || '';
        const fore = a.ForeName || a.Initials || '';
        return `${last}${fore ? ' ' + fore : ''}`.trim();
      })
      .filter(Boolean)
      .join(', ');

    // Publication year
    const pubDate = art?.Journal?.JournalIssue?.PubDate;
    const year =
      pubDate?.Year ||
      pubDate?.MedlineDate?.substring(0, 4) ||
      '';

    // Journal
    const journal = art?.Journal?.Title || art?.Journal?.ISOAbbreviation || '';

    return {
      id: `pubmed_${pmid}`,
      title: typeof art.ArticleTitle === 'object'
        ? art.ArticleTitle['#text'] || ''
        : art.ArticleTitle || '',
      abstract,
      authors,
      year: parseInt(year) || null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      pmid,
      source: 'PubMed',
      journal,
      citationCount: 0,
      isOpenAccess: false,
    };
  } catch (err) {
    return null;
  }
}

module.exports = { fetchPubMed };