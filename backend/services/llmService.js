const axios = require('axios');

// ─── Provider router ──────────────────────────────────────────────────────────

async function queryLLM(prompt) {
  const provider = process.env.LLM_PROVIDER || 'ollama';

  try {
    if (provider === 'huggingface') {
      return await queryHuggingFace(prompt);
    } else {
      return await queryOllama(prompt);
    }
  } catch (err) {
    console.error(`[LLM:${provider}] Error:`, err.message);
    throw new Error(`LLM provider "${provider}" failed: ${err.message}`);
  }
}

// ─── Ollama (local) ───────────────────────────────────────────────────────────

async function queryOllama(prompt) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';

  const res = await axios.post(
    `${baseUrl}/api/generate`,
    {
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,      // low temp for factual medical answers
        num_predict: 1200,
        top_p: 0.9,
        repeat_penalty: 1.1,
      },
    },
    { timeout: 120000 } // 2 min timeout for local LLM
  );

  return res.data.response || '';
}

// ─── HuggingFace Inference API ────────────────────────────────────────────────

async function queryHuggingFace(prompt) {
  const token = process.env.HF_TOKEN;
  const model = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

  if (!token) throw new Error('HF_TOKEN not set in environment variables');

  // Format prompt for instruct models
  const formattedPrompt = `<s>[INST] ${prompt} [/INST]`;

  const res = await axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      inputs: formattedPrompt,
      parameters: {
        max_new_tokens: 900,
        temperature: 0.2,
        top_p: 0.9,
        return_full_text: false,
        do_sample: true,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const output = res.data;
  if (Array.isArray(output)) {
    return output[0]?.generated_text || '';
  }
  return output?.generated_text || '';
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(userQuery, disease, conversationHistory, publications, trials, patientContext) {
  // Build conversation context (last 4 exchanges)
  const historyText = (conversationHistory || [])
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Patient' : 'CuraLink'}: ${m.content}`)
    .join('\n');

  // Format publications for the prompt
  const pubSummaries = publications
    .slice(0, 6)
    .map((p, i) => {
      const abstract = (p.abstract || '').substring(0, 400);
      return `[PUB${i + 1}] "${p.title}" by ${p.authors || 'Unknown'} (${p.year || 'N/A'}, ${p.source})
Abstract: ${abstract}${abstract.length >= 400 ? '...' : ''}`;
    })
    .join('\n\n');

  // Format trials for the prompt
  const trialSummaries = trials
    .slice(0, 4)
    .map((t, i) => {
      const summary = (t.summary || '').substring(0, 250);
      return `[TRIAL${i + 1}] "${t.title}"
Status: ${t.status} | Phase: ${t.phase} | Location: ${t.locations}
Summary: ${summary}${summary.length >= 250 ? '...' : ''}`;
    })
    .join('\n\n');

  const patientInfo = patientContext
    ? `Patient: ${patientContext.patientName || 'Anonymous'}
Disease of Interest: ${disease}
Location: ${patientContext.location || 'Not specified'}
Additional Context: ${patientContext.additionalContext || 'None'}`
    : `Disease of Interest: ${disease}`;

  return `You are CuraLink, an advanced AI medical research assistant. Your role is to synthesize peer-reviewed research and clinical trial data into clear, personalized, research-backed responses. You NEVER hallucinate or make up information. You always cite from the provided sources.

PATIENT CONTEXT:
${patientInfo}

CONVERSATION HISTORY:
${historyText || 'No prior conversation.'}

CURRENT QUERY: ${userQuery}

RETRIEVED RESEARCH PUBLICATIONS:
${pubSummaries || 'No publications retrieved for this query.'}

RETRIEVED CLINICAL TRIALS:
${trialSummaries || 'No clinical trials retrieved for this query.'}

INSTRUCTIONS:
- Synthesize the publications and trials above into a helpful, accurate response
- Cite publications using [PUB1], [PUB2] etc. and trials using [TRIAL1] etc.
- Be specific to the patient's disease (${disease}) and query
- Do not hallucinate — only use information from the provided sources
- If sources don't have enough info, say so honestly
- Maintain conversation context from history
- Write in clear, accessible language (not overly technical)

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "conditionOverview": "2-3 sentences about ${disease} in the context of this query",
  "researchInsights": "4-6 sentences synthesizing the most relevant publications, citing [PUB1] etc.",
  "clinicalTrialsInsight": "2-3 sentences about relevant clinical trials found, citing [TRIAL1] etc. If none relevant, say so.",
  "keyTakeaway": "1-2 actionable sentences personalized to this patient's situation",
  "followUpSuggestions": ["question 1 the patient might want to ask next", "question 2", "question 3"],
  "disclaimer": "This information is for research and educational purposes only. Always consult a qualified physician before making medical decisions."
}`;
}

module.exports = { queryLLM, buildPrompt };