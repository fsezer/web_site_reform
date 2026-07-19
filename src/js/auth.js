import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { clearAllowlistCache, fetchAllowlist } from "./allowlist.js";
import { firebaseConfig } from "./firebase.js";
import { initAdminPwa } from "./adminPwa.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let cachedAllowlist = null;

export async function getAllowedEmails() {
  if (cachedAllowlist) return cachedAllowlist;
  cachedAllowlist = await fetchAllowlist();
  return cachedAllowlist;
}

export function bustAllowlistCache() {
  cachedAllowlist = null;
  clearAllowlistCache();
}

export async function isAllowedEmail(email) {
  const list = await getAllowedEmails();
  return list.includes(String(email || "").trim().toLowerCase());
}

export function waitForUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

export async function requireAuth() {
  const user = await waitForUser();
  if (user && (await isAllowedEmail(user.email))) return user;

  if (user) {
    await signOut(auth);
  }

  const next = encodeURIComponent(`${location.pathname}${location.search}`);
  location.replace(`/login?next=${next}`);
  return null;
}

export async function logout() {
  await signOut(auth);
  location.replace("/login");
}

function showError(message) {
  const err = document.querySelector("[data-login-error]");
  if (!err) return;
  err.hidden = false;
  err.textContent = message;
}

function redirectAfterLogin() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "/Admin";
  location.replace(next.startsWith("/") ? next : "/Admin");
}

async function signInWithGoogle() {
  const btn = document.querySelector("[data-google-login]");
  if (btn) btn.disabled = true;

  try {
    bustAllowlistCache();
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user?.email || "";

    if (!(await isAllowedEmail(email))) {
      await signOut(auth);
      showError(`Bu hesap yetkili değil: ${email}`);
      return;
    }

    redirectAfterLogin();
  } catch (error) {
    const code = error?.code || "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      showError("Giriş iptal edildi.");
    } else if (code === "auth/operation-not-allowed") {
      showError("Google girişi henüz Firebase Console’da açılmamış.");
    } else {
      showError(error?.message || "Giriş başarısız.");
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

const loginPage = document.body?.dataset?.page === "login";
if (loginPage) {
  initAdminPwa();
  waitForUser().then(async (user) => {
    if (user && (await isAllowedEmail(user.email))) redirectAfterLogin();
  });

  document.querySelector("[data-google-login]")?.addEventListener("click", () => {
    void signInWithGoogle();
  });
}
