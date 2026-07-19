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

function ensureMeta(name, content) {
  const code = String(content || "").trim();
  if (!code) return;
  if (document.querySelector(`meta[name="${name}"]`)) return;
  const meta = document.createElement("meta");
  meta.name = name;
  meta.content = code;
  document.head.appendChild(meta);
}

/** Inject Google / Bing / Yandex verification metas if configured. */
export async function injectSearchConsoleMeta() {
  const data = await fetchPublicSettings();
  ensureMeta("google-site-verification", data.googleSiteVerification);
  ensureMeta("msvalidate.01", data.bingSiteVerification);
  ensureMeta("yandex-verification", data.yandexSiteVerification);
}
