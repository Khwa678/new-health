/**
 * CuraLink Ranking Engine
 *
 * Scores and ranks a large pool of retrieved publications and clinical trials
 * down to the top N results using a multi-factor scoring system:
 *   - Query relevance (keyword matching, TF-IDF-like scoring)
 *   - Disease relevance
 *   - Recency (recent publications score higher)
 *   - Source credibility
 *   - Content quality (has abstract, citation count)
 */

// ─── Main export ──────────────────────────────────────────────────────────────

function rankAndFilter(publications, trials, query, disease, topNPubs = 6, topNTrials = 4) {
  const queryTerms = tokenize(query);
  const diseaseTerms = tokenize(disease);

  const scoredPubs = publications
    .filter((p) => p && p.title)
    .map((p) => ({ ...p, _score: scorePublication(p, queryTerms, diseaseTerms) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, topNPubs);

  const scoredTrials = trials
    .filter((t) => t && t.title)
    .map((t) => ({ ...t, _score: scoreTrial(t, queryTerms, diseaseTerms) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, topNTrials);

  return {
    publications: scoredPubs,
    trials: scoredTrials,
  };
}

// ─── Publication scoring ──────────────────────────────────────────────────────

function scorePublication(pub, queryTerms, diseaseTerms) {
  let score = 0;

  const titleText = (pub.title || '').toLowerCase();
  const abstractText = (pub.abstract || '').toLowerCase();
  const fullText = titleText + ' ' + abstractText;

  // 1. Query term relevance (title weighted higher)
  queryTerms.forEach((term) => {
    if (titleText.includes(term)) score += 20;   // title hit = very relevant
    else if (abstractText.includes(term)) score += 8; // abstract hit
    // count frequency for repeated relevance signal
    const freq = (fullText.match(new RegExp(term, 'g')) || []).length;
    score += Math.min(freq * 2, 10); // cap frequency bonus
  });

  // 2. Disease term relevance
  diseaseTerms.forEach((term) => {
    if (titleText.includes(term)) score += 15;
    else if (abstractText.includes(term)) score += 6;
  });

  // 3. Recency bonus (favor last 5 years)
  const year = parseInt(pub.year) || 2000;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (age <= 1) score += 25;
  else if (age <= 2) score += 20;
  else if (age <= 3) score += 15;
  else if (age <= 5) score += 10;
  else if (age <= 10) score += 5;

  // 4. Citation count (credibility signal, log scale)
  const citations = pub.citationCount || 0;
  if (citations > 0) score += Math.min(Math.log10(citations + 1) * 10, 25);

  // 5. Source credibility
  if (pub.source === 'PubMed') score += 8;
  if (pub.source === 'OpenAlex') score += 5;

  // 6. Content quality
  if (abstractText.length > 200) score += 8;
  if (abstractText.length > 500) score += 5;
  if (pub.isOpenAccess) score += 3;

  // 7. Has URL (accessibility)
  if (pub.url) score += 3;

  return Math.round(score);
}

// ─── Trial scoring ────────────────────────────────────────────────────────────

function scoreTrial(trial, queryTerms, diseaseTerms) {
  let score = 0;

  const titleText = (trial.title || '').toLowerCase();
  const summaryText = (trial.summary || '').toLowerCase();
  const eligText = (trial.eligibility || '').toLowerCase();
  const fullText = titleText + ' ' + summaryText + ' ' + eligText;

  // 1. Query relevance
  queryTerms.forEach((term) => {
    if (titleText.includes(term)) score += 20;
    else if (summaryText.includes(term)) score += 8;
  });

  // 2. Disease relevance
  diseaseTerms.forEach((term) => {
    if (titleText.includes(term)) score += 18;
    else if (fullText.includes(term)) score += 7;
  });

  // 3. Recruiting status bonus
  const status = (trial.status || '').toUpperCase();
  if (status === 'RECRUITING') score += 25;        // actively looking for participants
  else if (status === 'ACTIVE_NOT_RECRUITING') score += 15;
  else if (status === 'COMPLETED') score += 10;
  else if (status === 'NOT_YET_RECRUITING') score += 8;

  // 4. Phase bonus (later phase = more validated)
  const phase = trial.phase || '';
  if (phase.includes('3')) score += 15;
  else if (phase.includes('2')) score += 10;
  else if (phase.includes('4')) score += 12;
  else if (phase.includes('1')) score += 5;

  // 5. Has contact info
  if (trial.contact?.email) score += 8;
  if (trial.contact?.phone) score += 5;

  // 6. Recency (start date)
  if (trial.startDate && trial.startDate !== 'N/A') {
    const startYear = parseInt(trial.startDate);
    if (startYear >= 2023) score += 10;
    else if (startYear >= 2021) score += 7;
    else if (startYear >= 2019) score += 4;
  }

  return Math.round(score);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'they', 'been', 'have', 'were', 'when',
  'what', 'will', 'more', 'also', 'into', 'than', 'then', 'them', 'some',
  'these', 'those', 'such', 'each', 'which', 'their', 'there', 'about',
  'after', 'before', 'could', 'would', 'should', 'other', 'study', 'studies',
  'results', 'method', 'methods', 'patients', 'analysis', 'using', 'used',
]);

module.exports = { rankAndFilter };