import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./allowlist.js";

const PUBLIC_SETTINGS = ["settings", "public"];

export async function fetchPublicSettings() {
  try {
    const snap = await getDoc(doc(db, ...PUBLIC_SETTINGS));
    if (snap.exists()) return snap.data() || {};
  } catch {
    /* offline */
  }
  return {};
}

export async function savePublicSettings(partial) {
  await setDoc(doc(db, ...PUBLIC_SETTINGS), { ...partial, updatedAt: Date.now() }, { merge: true });
  return fetchPublicSettings();
}

/** Inject Google Search Console verification meta if configured. */
export async function injectSearchConsoleMeta() {
  if (document.querySelector('meta[name="google-site-verification"]')) return;
  const data = await fetchPublicSettings();
  const code = String(data.googleSiteVerification || "").trim();
  if (!code) return;
  const meta = document.createElement("meta");
  meta.name = "google-site-verification";
  meta.content = code;
  document.head.appendChild(meta);
}
