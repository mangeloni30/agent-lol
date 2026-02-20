/**
 * Fetches the latest Data Dragon game version for asset URLs.
 * @returns {Promise<{ version: string } | null>}
 */
export async function fetchDdragonVersion() {
  const res = await fetch('/api/ddragon/version');
  const data = await res.json();
  if (res.ok && data.version) {
    return data.version;
  }
  return null;
}
