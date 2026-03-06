import { getToken } from 'next-auth/jwt';

/**
 * Returns the current Riot session (puuid, gameName, tagLine, apiKey) from the JWT in the request.
 * Must be called from API route handlers with the incoming request so the cookie can be read.
 * @param {Request} request - The incoming request (e.g. from GET(request))
 * @returns {Promise<{ puuid: string; gameName: string; tagLine: string; apiKey: string } | null>}
 */
export async function getRiotSession(request) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  if (!token?.puuid || !token?.apiKey) return null;
  return {
    puuid: token.puuid,
    gameName: token.gameName ?? '',
    tagLine: token.tagLine ?? '',
    apiKey: token.apiKey,
  };
}

/**
 * Gets the Riot session from the request or returns a 401 JSON response (for use in API route handlers).
 * @param {import('next/server').NextResponse} NextResponse
 * @param {Request} request - The incoming request from the route handler
 */
export async function getRiotSessionOrFail(NextResponse, request) {
  const session = await getRiotSession(request);
  if (session) return { session, response: null };
  return {
    session: null,
    response: NextResponse.json({ error: 'Unauthorized', message: 'Please sign in.' }, { status: 401 }),
  };
}
