import { initializeApp, getApps } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import {
  firebaseConfig,
  getAllowlistLocal,
  LOCKED_ADMIN_EMAIL,
  saveAllowlistLocal,
} from "./firebase.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const REMOTE_PATH = ["settings", "admins"];
const REMOTE_TIMEOUT_MS = 3000;
let memoryCache = null;

/** Firestore yoksa/ulaşılamıyorsa admin asılı kalmasın diye zaman aşımı. */
function withTimeout(promise, ms = REMOTE_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("firestore-timeout")), ms)),
  ]);
}

export function clearAllowlistCache() {
  memoryCache = null;
}

export async function fetchAllowlist() {
  if (memoryCache) return memoryCache;
  try {
    const snap = await withTimeout(getDoc(doc(db, ...REMOTE_PATH)));
    if (snap.exists()) {
      const emails = snap.data()?.emails;
      if (Array.isArray(emails) && emails.length) {
        memoryCache = saveAllowlistLocal(emails);
        return memoryCache;
      }
    }
  } catch {
    /* offline / rules */
  }
  memoryCache = getAllowlistLocal();
  return memoryCache;
}

/** Push local defaults to Firestore when remote doc is missing (bootstrap). */
export async function ensureAllowlistRemote() {
  try {
    const snap = await withTimeout(getDoc(doc(db, ...REMOTE_PATH)));
    if (snap.exists() && Array.isArray(snap.data()?.emails) && snap.data().emails.length) {
      return fetchAllowlist();
    }
    return saveAllowlist(getAllowlistLocal());
  } catch {
    return getAllowlistLocal();
  }
}

export async function saveAllowlist(emails) {
  const list = saveAllowlistLocal(emails);
  memoryCache = list;
  try {
    await withTimeout(
      setDoc(
        doc(db, ...REMOTE_PATH),
        {
          emails: list,
          locked: LOCKED_ADMIN_EMAIL,
          updatedAt: Date.now(),
        },
        { merge: true },
      ),
    );
  } catch (error) {
    console.warn("Allowlist Firestore yazılamadı, yerel kayıt kullanılıyor.", error);
  }
  return list;
}

export { LOCKED_ADMIN_EMAIL };
