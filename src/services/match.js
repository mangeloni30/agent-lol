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
