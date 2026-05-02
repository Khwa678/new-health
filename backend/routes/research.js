const express = require('express');
const router = express.Router();
const { fetchOpenAlex } = require('../services/openalexService');
const { fetchPubMed } = require('../services/pubmedService');
const { fetchClinicalTrials } = require('../services/clinicalTrialsService');
const { rankAndFilter } = require('../services/rankingService');

/**
 * GET /api/research
 * Standalone research retrieval without LLM (fast mode).
 */
router.get('/', async (req, res) => {
  const { query, disease, location, topN = 8 } = req.query;

  if (!query || !disease) {
    return res.status(400).json({ error: 'query and disease are required' });
  }

  try {
    const [openAlexResult, pubmedResult, trialsResult] = await Promise.allSettled([
      fetchOpenAlex(query, disease, 80),
      fetchPubMed(query, disease, 80),
      fetchClinicalTrials(query, disease, location, 20),
    ]);

    const allPubs = [
      ...(openAlexResult.status === 'fulfilled' ? openAlexResult.value : []),
      ...(pubmedResult.status === 'fulfilled' ? pubmedResult.value : []),
    ];
    const allTrials = trialsResult.status === 'fulfilled' ? trialsResult.value : [];

    const { publications, trials } = rankAndFilter(
      allPubs, allTrials, query, disease, parseInt(topN), 4
    );

    res.json({
      publications,
      trials,
      stats: { totalPublications: allPubs.length, totalTrials: allTrials.length },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;