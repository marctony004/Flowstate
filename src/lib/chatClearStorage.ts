/**
 * Local chat clear storage helpers.
 *
 * When a user clears chat locally (Option A), we store a timestamp in
 * localStorage. Messages created before this timestamp are hidden in the
 * UI but remain untouched in the database.
 *
 * Key format: flowstate:chatCleared:{userId}
 */

const KEY_PREFIX = "flowstate:chatCleared";

function key(userId: string): string {
  return `${KEY_PREFIX}:${userId}`;
}

/** Returns the ISO timestamp after which messages should be shown, or null. */
export function getChatClearedAt(userId: string): string | null {
  try {
    return localStorage.getItem(key(userId));
  } catch {
    return null;
  }
}

/** Sets the local-clear timestamp (hides all messages created before now). */
export function setChatClearedAt(userId: string): void {
  try {
    localStorage.setItem(key(userId), new Date().toISOString());
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Removes the local-clear flag so messages are visible again. */
export function clearChatClearedAt(userId: string): void {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    // Silently ignore
  }
}
