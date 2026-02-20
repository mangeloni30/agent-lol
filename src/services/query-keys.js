/**
 * Centralized query keys for TanStack Query.
 * Used for cache invalidation and consistent key structure.
 */
export const queryKeys = {
  ddragon: ['ddragon', 'version'],
  account: ['riot', 'account'],
  matchIds: (puuid) => ['riot', 'match', 'ids', puuid],
  matchDetails: (matchId) => ['riot', 'match', 'details', matchId],
};
