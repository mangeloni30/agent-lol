/**
 * Fetches account data (PUUID, gameName, tagLine) from session (server returns session data).
 * On 401, redirects to login so the user can re-authenticate.
 * @returns {Promise<{ puuid: string; gameName: string; tagLine: string; [key: string]: unknown }>}
 * @throws {Error} When the API returns an error response (other than 401)
 */
export async function fetchAccount() {
  const response = await fetch('/api/riot/account/get-puuid');
  const data = await response.json();

  if (response.status === 401) {
    window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw data;
  }

  return data;
}
