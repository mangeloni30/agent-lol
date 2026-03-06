import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const RIOT_ACCOUNT_URL = (gameName, tagLine) =>
  `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

/**
 * Validates and normalizes login input (server-side).
 */
function validateCredentials(gameName, tagLine, apiKey) {
  const errors = [];
  const g = typeof gameName === 'string' ? gameName.trim() : '';
  const t = typeof tagLine === 'string' ? tagLine.replace(/^#/, '').trim() : '';
  const k = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!g || g.length < 2) errors.push('Game Name must be at least 2 characters');
  if (!t) errors.push('Tag Line is required');
  if (!k) errors.push('API Key is required');
  return { gameName: g, tagLine: t, apiKey: k, errors };
}

export const { handlers, signIn, signOut, auth, getToken } = NextAuth({
  providers: [
    Credentials({
      id: 'riot-credentials',
      name: 'Riot Account',
      credentials: {
        gameName: { label: 'Game Name', type: 'text' },
        tagLine: { label: 'Tag Line', type: 'text' },
        apiKey: { label: 'API Key', type: 'password' },
      },
      async authorize(credentials) {
        const { gameName, tagLine, apiKey, errors } = validateCredentials(
          credentials?.gameName,
          credentials?.tagLine,
          credentials?.apiKey
        );
        if (errors.length) {
          throw new Error(errors.join('. '));
        }

        const url = RIOT_ACCOUNT_URL(gameName, tagLine);
        const response = await fetch(url, {
          headers: { 'X-Riot-Token': apiKey },
          cache: 'no-store',
        });
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key or Riot account.');
          }
          if (response.status === 403) {
            throw new Error('API key forbidden or rate limited.');
          }
          if (response.status === 404) {
            throw new Error('Riot ID not found. Check Game Name and Tag Line.');
          }
          if (response.status === 429) {
            throw new Error('Too many requests. Please try again later.');
          }
          throw new Error(data?.status?.message || `Riot API error (${response.status}).`);
        }

        const puuid = data?.puuid;
        const riotGameName = data?.gameName ?? gameName;
        const riotTagLine = data?.tagLine ?? tagLine;
        if (!puuid) {
          throw new Error('PUUID not returned by Riot API.');
        }

        return {
          id: puuid,
          puuid,
          gameName: riotGameName,
          tagLine: riotTagLine,
          apiKey, // stored only in JWT, never exposed in session callback
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,    // update session every 24h
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.puuid = user.puuid;
        token.gameName = user.gameName;
        token.tagLine = user.tagLine;
        token.apiKey = user.apiKey;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.puuid = token.puuid;
        session.user.gameName = token.gameName;
        session.user.tagLine = token.tagLine;
        // apiKey is intentionally NOT exposed to the client
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  trustHost: true,
});
