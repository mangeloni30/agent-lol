/**
 * Centralized query keys for TanStack Query.
 * Used for cache invalidation and consistent key structure.
 */
export const queryKeys = {
  ddragon: ['ddragon', 'version'],
  account: ['riot', 'account'],
  matchIds: (puuid) => ['riot', 'match', 'ids', puuid],
  matchDetails: (matchId) => ['riot', 'match', 'details', matchId],
  matchTimeline: (matchId) => ['riot', 'match', 'timeline', matchId],
  matchTimelineCompare: (matchId, gameName, tagLine) =>
    ['riot', 'match', 'timeline', 'compare', matchId, gameName, tagLine],
};
