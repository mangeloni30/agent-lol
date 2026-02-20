/**
 * Fetches account data (PUUID, gameName, tagLine) using Riot account API.
 * @returns {Promise<{ puuid: string; gameName: string; tagLine: string; [key: string]: unknown }>}
 * @throws {Error} When the API returns an error response
 */
export async function fetchAccount() {
  const response = await fetch('/api/riot/account/get-puuid');
  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}
