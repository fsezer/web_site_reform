/** Firebase web config — project sanas-502703 (public client keys). */
export const firebaseConfig = {
  apiKey: "AIzaSyDj6bUrtd0xmOB8u-gecT8oaD7ZjUBX18M",
  authDomain: "sanas-502703.firebaseapp.com",
  projectId: "sanas-502703",
  storageBucket: "sanas-502703.firebasestorage.app",
  messagingSenderId: "614342760473",
  appId: "1:614342760473:web:846caaec954b1950c1b288",
  measurementId: "G-HY4FN9MXS9",
};

/** GA4 property id (Analytics Admin). */
export const GA4_PROPERTY_ID = "546157474";

/** Cloud Run — GA4 + Search Console Data API proxy. */
export const GA4_REPORT_URL =
  "https://sanas-ga4-api-614342760473.europe-west1.run.app/ga4";

export const SC_REPORT_URL =
  "https://sanas-ga4-api-614342760473.europe-west1.run.app/sc";

export const PSI_REPORT_URL =
  "https://sanas-ga4-api-614342760473.europe-west1.run.app/psi";

/** Cannot be removed from admin allowlist. */
export const LOCKED_ADMIN_EMAIL = "admin@istiklalyazilim.com";

const ALLOWLIST_KEY = "sanas-admin-allowlist";

const DEFAULT_ADMIN_EMAILS = ["fsezer.mail@gmail.com", LOCKED_ADMIN_EMAIL];

function normalizeList(emails) {
  const set = new Set(
    (emails || [])
      .map((e) => String(e || "").trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
  set.add(LOCKED_ADMIN_EMAIL);
  return [...set].sort((a, b) => {
    if (a === LOCKED_ADMIN_EMAIL) return -1;
    if (b === LOCKED_ADMIN_EMAIL) return 1;
    return a.localeCompare(b);
  });
}

export function getAllowlistLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(ALLOWLIST_KEY) || "null");
    if (Array.isArray(raw) && raw.length) return normalizeList(raw);
  } catch {
    /* ignore */
  }
  return normalizeList(DEFAULT_ADMIN_EMAILS);
}

export function saveAllowlistLocal(emails) {
  const list = normalizeList(emails);
  localStorage.setItem(ALLOWLIST_KEY, JSON.stringify(list));
  return list;
}

/** @deprecated use getAllowlistLocal / fetchAllowlist */
export const ALLOWED_ADMIN_EMAILS = DEFAULT_ADMIN_EMAILS;
