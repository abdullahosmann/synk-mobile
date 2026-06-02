/**
 * routineSharing — RN port of src/lib/routineSharing.ts.
 *
 * Web→RN: `btoa`/`atob` → the `base-64` package's `encode`/`decode`; the
 * `unescape(encodeURIComponent(...))` / `decodeURIComponent(escape(...))`
 * UTF-8 trick is preserved (Hermes implements the legacy escape/unescape
 * globals). `window.location.origin` → the hard-coded production domain.
 */
import { encode as b64encode, decode as b64decode } from "base-64";
import { CustomRoutine, CustomRoutineExercise } from "../types";

const SHARE_ORIGIN = "https://synk.app";

export interface ShareableRoutine {
  v: 1; // schema version
  n: string; // name
  e: Array<{
    n: string; // name
    s: number; // sets
    r: number; // reps
    w: number; // weight
    m?: string; // muscle group
    eq?: string; // equipment
  }>;
}

/**
 * Convert a CustomRoutine (or today's workout) into a compact shareable payload.
 */
export function toShareable(name: string, exercises: any[]): ShareableRoutine {
  return {
    v: 1,
    n: name.slice(0, 40),
    e: exercises.map((ex: any) => ({
      n: ex.name,
      s: ex.sets || 3,
      r: ex.reps || 10,
      w: ex.weight || 0,
      m: ex.muscleGroup,
      eq: ex.equipment,
    })),
  };
}

/**
 * Encode to a URL-safe base64 string.
 */
export function encodeRoutine(routine: ShareableRoutine): string {
  const json = JSON.stringify(routine);
  // Base64-encode (UTF-8 safe)
  const b64 = b64encode(unescape(encodeURIComponent(json)));
  // URL-safe variant
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a URL-safe base64 string back to a ShareableRoutine.
 * Returns null if invalid.
 */
export function decodeRoutine(encoded: string): ShareableRoutine | null {
  try {
    // Reverse URL-safe variant
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // Re-pad
    while (b64.length % 4) b64 += "=";
    const json = decodeURIComponent(escape(b64decode(b64)));
    const parsed = JSON.parse(json);
    if (parsed.v !== 1 || !parsed.n || !Array.isArray(parsed.e)) return null;
    return parsed as ShareableRoutine;
  } catch {
    return null;
  }
}

/**
 * Generate a 6-character human-friendly code from a routine.
 * Uses uppercase alphanumeric, hyphenated as XXX-XXX.
 * This is for DISPLAY only — the actual data travels in the URL or
 * via the full encoded payload that follows the code.
 */
export function generateShortCode(routine: ShareableRoutine): string {
  // Simple deterministic hash from name + exercise count + first exercise
  const seed = `${routine.n}-${routine.e.length}-${routine.e[0]?.n || ""}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // omit I, L, O, 0, 1 to avoid confusion
  let code = "";
  let n = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length);
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Build a shareable URL.
 */
export function buildShareURL(routine: ShareableRoutine): string {
  const encoded = encodeRoutine(routine);
  return `${SHARE_ORIGIN}/r/${encoded}`;
}

/**
 * The "share package" — both pieces a user might need.
 */
export function buildSharePackage(
  name: string,
  exercises: any[],
): {
  routine: ShareableRoutine;
  code: string;
  url: string;
  payload: string; // raw encoded for use with code-paste
} {
  const routine = toShareable(name, exercises);
  const code = generateShortCode(routine);
  const url = buildShareURL(routine);
  const payload = encodeRoutine(routine);
  return { routine, code, url, payload };
}
