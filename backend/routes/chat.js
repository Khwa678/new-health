const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const { fetchOpenAlex } = require('../services/openalexService');
const { fetchPubMed } = require('../services/pubmedService');
const { fetchClinicalTrials } = require('../services/clinicalTrialsService');
const { rankAndFilter } = require('../services/rankingService');
const { queryLLM, buildPrompt } = require('../services/llmService');

/**
 * POST /api/chat
 * Main endpoint for sending messages and receiving AI-powered research responses.
 */
router.post('/', async (req, res) => {
  const {
    sessionId,
    message,
    disease,
    location,
    patientName,
    additionalContext,
    isNewSession,
  } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const effectiveSessionId = sessionId || uuidv4();

  try {
    // ── 1. Load or create conversation ──────────────────────────────────────
    let conversation = await Conversation.findOne({ sessionId: effectiveSessionId });

    if (!conversation) {
      if (!disease) {
        return res.status(400).json({ error: 'Disease/condition is required to start a conversation' });
      }
      conversation = new Conversation({
        sessionId: effectiveSessionId,
        patientName: patientName || '',
        disease: disease,
        location: location || '',
        additionalContext: additionalContext || '',
        messages: [],
      });
    } else if (isNewSession) {
      // Update context if starting fresh
      conversation.disease = disease || conversation.disease;
      conversation.location = location || conversation.location;
      conversation.patientName = patientName || conversation.patientName;
    }

    const effectiveDisease = disease || conversation.disease;
    const effectiveLocation = location || conversation.location;

    // ── 2. Add user message ──────────────────────────────────────────────────
    conversation.messages.push({ role: 'user', content: message });

    console.log(`\n[Chat] Session: ${effectiveSessionId}`);
    console.log(`[Chat] Disease: ${effectiveDisease} | Query: "${message}"`);

    // ── 3. Parallel retrieval from all 3 sources ────────────────────────────
    console.log('[Chat] Starting parallel retrieval...');
    const startTime = Date.now();

    const [openAlexResult, pubmedResult, trialsResult] = await Promise.allSettled([
      fetchOpenAlex(message, effectiveDisease, 100),
      fetchPubMed(message, effectiveDisease, 100),
      fetchClinicalTrials(message, effectiveDisease, effectiveLocation, 30),
    ]);

    const openAlexPubs = openAlexResult.status === 'fulfilled' ? openAlexResult.value : [];
    const pubmedPubs = pubmedResult.status === 'fulfilled' ? pubmedResult.value : [];
    const allTrials = trialsResult.status === 'fulfilled' ? trialsResult.value : [];

    if (openAlexResult.status === 'rejected') console.error('[OpenAlex] failed:', openAlexResult.reason?.message);
    if (pubmedResult.status === 'rejected') console.error('[PubMed] failed:', pubmedResult.reason?.message);
    if (trialsResult.status === 'rejected') console.error('[ClinicalTrials] failed:', trialsResult.reason?.message);

    // Merge and deduplicate publications
    const allPublications = deduplicatePublications([...openAlexPubs, ...pubmedPubs]);
    const retrievalMs = Date.now() - startTime;
    console.log(`[Chat] Retrieved: ${allPublications.length} pubs + ${allTrials.length} trials in ${retrievalMs}ms`);

    // ── 4. Rank and filter ───────────────────────────────────────────────────
    const { publications: topPubs, trials: topTrials } = rankAndFilter(
      allPublications,
      allTrials,
      message,
      effectiveDisease,
      6,
      4
    );

    console.log(`[Chat] After ranking: top ${topPubs.length} pubs, top ${topTrials.length} trials`);

    // ── 5. Build prompt and call LLM ─────────────────────────────────────────
    const patientContext = {
      patientName: conversation.patientName,
      location: conversation.location,
      additionalContext: conversation.additionalContext,
    };

    const prompt = buildPrompt(
      message,
      effectiveDisease,
      conversation.messages.slice(0, -1), // exclude just-added user msg
      topPubs,
      topTrials,
      patientContext
    );

    console.log('[Chat] Calling LLM...');
    const llmStart = Date.now();

    let llmResponse = null;
    let llmRaw = '';

    try {
      llmRaw = await queryLLM(prompt);

      // Extract JSON from the response (handles cases where model adds extra text)
      const jsonMatch = llmRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        llmResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in LLM response');
      }
    } catch (llmErr) {
      console.error('[Chat] LLM error:', llmErr.message);
      // Graceful fallback response
      llmResponse = {
        conditionOverview: `Here is research information about ${effectiveDisease} related to your query.`,
        researchInsights: topPubs.length > 0
          ? `Found ${topPubs.length} relevant publications. Please review the research cards below for details. Key sources include: ${topPubs.slice(0, 3).map((p, i) => `[PUB${i+1}] "${p.title}" (${p.year})`).join('; ')}.`
          : 'No publications were retrieved for this specific query. Please try a different search term.',
        clinicalTrialsInsight: topTrials.length > 0
          ? `Found ${topTrials.length} relevant clinical trials. See trial cards below for eligibility and contact information.`
          : 'No clinical trials were found for this query and location.',
        keyTakeaway: 'Please consult a qualified healthcare provider to interpret this research in the context of your specific situation.',
        followUpSuggestions: [
          `What are the side effects of treatments for ${effectiveDisease}?`,
          `Are there new clinical trials for ${effectiveDisease}?`,
          `What do researchers say about quality of life with ${effectiveDisease}?`,
        ],
        disclaimer: 'This information is for research and educational purposes only. Always consult a qualified physician before making medical decisions.',
      };
    }

    const llmMs = Date.now() - llmStart;
    console.log(`[Chat] LLM responded in ${llmMs}ms`);

    // ── 6. Save assistant response ───────────────────────────────────────────
    const assistantContent =
      llmResponse.researchInsights || llmResponse.conditionOverview || 'Response generated.';

    conversation.messages.push({
      role: 'assistant',
      content: assistantContent,
      publications: topPubs,
      trials: topTrials,
      llmResponse,
      totalRetrieved: allPublications.length + allTrials.length,
    });

    await conversation.save();

    // ── 7. Send response ─────────────────────────────────────────────────────
    res.json({
      sessionId: effectiveSessionId,
      llm: llmResponse,
      publications: topPubs,
      trials: topTrials,
      stats: {
        totalRetrieved: allPublications.length + allTrials.length,
        publicationsPool: allPublications.length,
        trialsPool: allTrials.length,
        retrievalMs,
        llmMs,
      },
    });
  } catch (err) {
    console.error('[Chat] Unhandled error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deduplicatePublications(publications) {
  const seen = new Set();
  return publications.filter((pub) => {
    // Deduplicate by DOI, then by normalized title
    const key =
      pub.doi ||
      (pub.title || '').toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = router;