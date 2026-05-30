import type { UserProfile } from "../types";

/**
 * Returns true if the current user and `otherUserId` mutually follow each other.
 * Used by the Friends feed segment and any mutuals-only filter.
 * 
 * NOTE: This is a client-side stub until backend follow graph is wired.
 * Real implementation will query the user graph from the backend.
 */
export function isMutual(user: UserProfile, otherUserId: string): boolean {
  if (!otherUserId) return false;
  const following = user.following || [];
  const followers = user.followers || [];
  return following.includes(otherUserId) && followers.includes(otherUserId);
}

/**
 * Returns the list of user IDs that are mutuals.
 */
export function getMutuals(user: UserProfile): string[] {
  const following = new Set(user.following || []);
  const followers = new Set(user.followers || []);
  return [...following].filter((id) => followers.has(id));
}
