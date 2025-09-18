const axios = require('axios');

function sanitiseNotes(notes) {
  if (!notes) return '';
  if (typeof notes !== 'string') return '';
  return notes.trim();
}

function buildPayload({ issueNumber, issueUrl, notes, analysis }) {
  const payload = {
    issue: {
      number: issueNumber,
      url: issueUrl
    },
    analysis: analysis || {}
  };

  const trimmedNotes = sanitiseNotes(notes);
  if (trimmedNotes) {
    payload.notes = trimmedNotes;
  }

  if (process.env.CODEX_AGENT_ID) {
    payload.agentId = process.env.CODEX_AGENT_ID;
  }

  if (process.env.CODEX_AGENT_REPO || process.env.GITHUB_REPOSITORY) {
    payload.repository = process.env.CODEX_AGENT_REPO || process.env.GITHUB_REPOSITORY;
  }

  return payload;
}

async function triggerCodexAgent({ issueNumber, issueUrl, notes, analysis }) {
  const endpoint = process.env.CODEX_AGENT_API_URL;
  const apiKey = process.env.CODEX_AGENT_API_KEY;

  if (!endpoint) {
    console.log('Codex agent endpoint not configured; skipping automation.');
    return null;
  }

  const payload = buildPayload({ issueNumber, issueUrl, notes, analysis });
  const headers = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (process.env.CODEX_AGENT_API_EXTRA_HEADERS) {
    try {
      const extraHeaders = JSON.parse(process.env.CODEX_AGENT_API_EXTRA_HEADERS);
      Object.assign(headers, extraHeaders);
    } catch (error) {
      console.warn('Failed to parse CODEX_AGENT_API_EXTRA_HEADERS:', error.message);
    }
  }

  try {
    const response = await axios.post(endpoint, payload, {
      headers,
      timeout: Number(process.env.CODEX_AGENT_API_TIMEOUT_MS) || 20000
    });

    return {
      success: true,
      jobId: response.data?.jobId || response.data?.id || null,
      raw: response.data
    };
  } catch (error) {
    if (error.response) {
      console.error('Codex agent trigger failed:', error.response.status, error.response.data);
      return {
        success: false,
        status: error.response.status,
        error: error.response.data?.message || error.response.statusText || 'Unknown API error'
      };
    }

    console.error('Codex agent trigger failed:', error.message);
    return {
      success: false,
      status: null,
      error: error.message
    };
  }
}

module.exports = {
  triggerCodexAgent
};
