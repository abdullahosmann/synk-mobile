/**
 * photoStorage — RN port of src/lib/photoStorage.ts.
 *
 * Web kept photo blobs in IndexedDB keyed by photoId and handed back object URLs.
 * In RN we copy the picked image into the app's document directory keyed by
 * photoId and hand back the persistent file:// URI (RN <Image>/expo-image accept
 * file URIs directly — no Blob/ObjectURL needed).
 */
import * as FileSystem from "expo-file-system/legacy";

const DIR = `${FileSystem.documentDirectory}progress-photos/`;
let ensured = false;

async function ensureDir() {
  if (ensured) return;
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  ensured = true;
}

/** Copy a picked image URI into permanent storage; returns the stored file URI. */
export async function savePhotoUri(photoId: string, srcUri: string): Promise<string> {
  await ensureDir();
  const dest = `${DIR}${photoId}.jpg`;
  try {
    await FileSystem.copyAsync({ from: srcUri, to: dest });
    return dest;
  } catch {
    return srcUri;
  }
}

/** Returns the stored file URI for a photoId, or "" if missing. */
export async function getPhotoUrl(photoId: string): Promise<string> {
  const dest = `${DIR}${photoId}.jpg`;
  try {
    const info = await FileSystem.getInfoAsync(dest);
    return info.exists ? dest : "";
  } catch {
    return "";
  }
}

export async function deletePhotoBlob(photoId: string): Promise<void> {
  const dest = `${DIR}${photoId}.jpg`;
  try {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  } catch {
    /* ignore */
  }
}
