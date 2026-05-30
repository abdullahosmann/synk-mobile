/**
 * SYNK Storage Utility Helpers — React Native (AsyncStorage-backed).
 *
 * The web app read localStorage synchronously inside useState initializers.
 * AsyncStorage is async, so we keep an in-memory synchronous cache that is
 * hydrated once at boot (see `hydrateStorage`). After hydration, the synchronous
 * helpers below behave like the web `localStorage` ones, and every write is
 * mirrored to AsyncStorage in the background.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEY_LANGUAGE = "synk:language";
export const KEY_THEME = "theme";
export const KEY_APP_MODE = "synk:appMode";
export const KEY_USER = "synk:user";
export const KEY_TODAYS_LOGS = "synk:todaysLogs";
export const KEY_STREAKS = "synk:streaks";
export const KEY_PENDING_ADAPTATIONS = "synk:pendingAdaptations";
export const KEY_XP = "synk:xp";
export const KEY_PLAN = "synk:currentPlan";
export const KEY_HISTORICAL_SETS = "synk:historicalSets";
export const LOGS_PREFIX = "synk:logs:";

// ---- In-memory synchronous mirror of AsyncStorage ----
const cache = new Map<string, string>();
let hydrated = false;

/**
 * Loads all persisted keys into the in-memory cache. Call once at app boot
 * before rendering anything that reads storage.
 */
export async function hydrateStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    for (const [key, value] of entries) {
      if (value !== null) cache.set(key, value);
    }
  } catch (error) {
    console.warn("Storage hydration failed:", error);
  } finally {
    hydrated = true;
  }
}

export function isHydrated(): boolean {
  return hydrated;
}

// ---- Synchronous localStorage-compatible surface ----

/** Mirrors `localStorage.getItem`. Returns null if absent. */
export function getItem(key: string): string | null {
  return cache.has(key) ? cache.get(key)! : null;
}

/** Mirrors `localStorage.setItem`. Writes through to AsyncStorage. */
export function setItem(key: string, value: string): void {
  cache.set(key, value);
  AsyncStorage.setItem(key, value).catch((e) =>
    console.warn(`Storage write failed for "${key}":`, e),
  );
}

/** Mirrors `localStorage.removeItem`. */
export function removeItem(key: string): void {
  cache.delete(key);
  AsyncStorage.removeItem(key).catch((e) =>
    console.warn(`Storage remove failed for "${key}":`, e),
  );
}

/** Mirrors `localStorage.clear`. */
export function clear(): void {
  cache.clear();
  AsyncStorage.clear().catch((e) => console.warn("Storage clear failed:", e));
}

/** All currently cached keys (mirrors iterating localStorage). */
export function allKeys(): string[] {
  return [...cache.keys()];
}

/**
 * Safely retrieves and parses a value. Mirrors the web `getStored`.
 */
export function getStored<T>(key: string, fallback: T): T {
  try {
    const item = getItem(key);
    if (item === null || item === "undefined") return fallback;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.warn(`Storage read failed for key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely stringifies and sets a value. Mirrors the web `setStored`.
 */
export function setStored<T>(key: string, value: T): void {
  if (value === undefined) {
    removeItem(key);
    return;
  }
  try {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    setItem(key, stringValue);
  } catch (error) {
    console.warn(`Storage write failed for key "${key}":`, error);
  }
}

export function removeStored(key: string): void {
  removeItem(key);
}

/**
 * Lists all historical log dates by scanning keys with the logs prefix.
 * Returns sorted descending (most recent first).
 */
export function listLogDates(): string[] {
  try {
    return allKeys()
      .filter((k) => k.startsWith(LOGS_PREFIX))
      .map((k) => k.replace(LOGS_PREFIX, ""))
      .sort((a, b) => b.localeCompare(a));
  } catch (error) {
    console.warn("Failed to list log dates:", error);
    return [];
  }
}

/**
 * A drop-in object mirroring the `localStorage` web API, so screens that used
 * `localStorage.getItem(...)` directly can be migrated with a single import
 * swap: `import { localStorage } from '@/lib/storage'`.
 */
export const localStorage = {
  getItem,
  setItem,
  removeItem,
  clear,
  get length() {
    return cache.size;
  },
  key(index: number): string | null {
    return allKeys()[index] ?? null;
  },
};
