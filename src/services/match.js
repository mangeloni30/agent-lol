/**
 * Fetches match IDs for a given PUUID.
 * @param {string} puuid - Player's unique identifier
 * @returns {Promise<string[]>}
 * @throws {Error} When the API returns an error response
 */
export async function fetchMatchIds(puuid) {
  const response = await fetch(`/api/riot/match/by-puuid/ids?puuid=${puuid}`);
  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Fetches match details for a given match ID.
 * @param {string} matchId - Match identifier
 * @returns {Promise<object>}
 * @throws {Error} When the API returns an error response
 */
export async function fetchMatchDetails(matchId) {
  const response = await fetch(`/api/riot/match/matchId?matchId=${matchId}`);
  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}

/**
 * Fetches match timeline for a given match ID.
 * @param {string} matchId - Match identifier
 * @returns {Promise<object>}
 * @throws {Error} When the API returns an error response
 */
export async function fetchMatchTimeline(matchId) {
  const response = await fetch(`/api/riot/match/timeline?matchId=${matchId}`);
  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}

/**
 * Fetches first-minute lane comparison (you vs enemy same role) using timeline frame 0 + optional agent.
 * @param {string} matchId - Match identifier
 * @param {{ gameName?: string, tagLine?: string }} options - Optional current user id (falls back to env)
 * @returns {Promise<{ role, userChampion, enemyChampion, userFrame, enemyFrame, comparison? }>}
 */
export async function fetchTimelineCompare(matchId, options = {}) {
  const params = new URLSearchParams({ matchId });
  if (options.gameName) params.set('gameName', options.gameName);
  if (options.tagLine) params.set('tagLine', options.tagLine);
  const response = await fetch(`/api/riot/match/timeline/compare?${params}`);
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}
