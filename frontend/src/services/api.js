// Dynamic High-Performance API Client for SDLC Documentation Governance Platform
const API_BASE = '/api';

// Fast in-memory cache for GET requests with TTL (invalidated on mutation)
const responseCache = new Map();
const CACHE_TTL_MS = 4000; // 4 seconds short-lived cache for instant UI response

/**
 * Standard fetch wrapper that injects JWT auth tokens, caches fast reads, and handles JSON payloads
 */
export async function fetchApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const token = localStorage.getItem('sdlc_user_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  // Cache check for GET requests
  const cacheKey = `${endpoint}:${token || 'anon'}`;
  if (method === 'GET') {
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }
  } else {
    // Mutation detected (POST, PUT, DELETE) -> Invalidate cache so UI is always fresh
    responseCache.clear();
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();

    // Cache successful GET responses
    if (method === 'GET') {
      responseCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// ============================================================
// Dispute Resolution Engine APIs (Unique SDLC Feature)
// ============================================================

export async function fetchDisputes(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/disputes${query ? `?${query}` : ''}`);
}

export async function fetchDisputeAnalytics() {
  return fetchApi('/disputes/analytics');
}

export async function fetchDisputeDetail(disputeId) {
  return fetchApi(`/disputes/${disputeId}`);
}

export async function createDispute(payload) {
  return fetchApi('/disputes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function addDisputeComment(disputeId, payload) {
  return fetchApi(`/disputes/${disputeId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function castDisputeVote(disputeId, payload) {
  return fetchApi(`/disputes/${disputeId}/vote`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function resolveDispute(disputeId, payload) {
  return fetchApi(`/disputes/${disputeId}/resolve`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function escalateDispute(disputeId, payload) {
  return fetchApi(`/disputes/${disputeId}/escalate`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ============================================================
// Collaborative Document Editing APIs
// ============================================================

export async function joinCollaboration(artifactId) {
  return fetchApi(`/collaboration/join/${artifactId}`, { method: 'POST' });
}

export async function heartbeatCollaboration(artifactId, cursor) {
  return fetchApi(`/collaboration/heartbeat/${artifactId}`, {
    method: 'POST',
    body: JSON.stringify({ cursor })
  });
}

export async function leaveCollaboration(artifactId) {
  return fetchApi(`/collaboration/leave/${artifactId}`, { method: 'POST' });
}

export async function getPresence(artifactId) {
  return fetchApi(`/collaboration/presence/${artifactId}`);
}

export async function saveCollaborativeDoc(artifactId, payload) {
  return fetchApi(`/collaboration/save/${artifactId}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchDocComments(artifactId) {
  return fetchApi(`/collaboration/comments/${artifactId}`);
}

export async function addDocComment(payload) {
  return fetchApi('/collaboration/comments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function resolveDocComment(commentId) {
  return fetchApi(`/collaboration/comments/${commentId}/resolve`, { method: 'PUT' });
}

export async function fetchDocSuggestions(artifactId) {
  return fetchApi(`/collaboration/suggestions/${artifactId}`);
}

export async function addDocSuggestion(payload) {
  return fetchApi('/collaboration/suggestions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function reviewDocSuggestion(suggestionId, status) {
  return fetchApi(`/collaboration/suggestions/${suggestionId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}
