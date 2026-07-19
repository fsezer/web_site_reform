import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase.js";

const MEASUREMENT_ID = firebaseConfig.measurementId || "";
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export function initAnalytics() {
  if (!MEASUREMENT_ID || typeof window === "undefined") return;
  if (window.__sanasGa) return;
  window.__sanasGa = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: true,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  void isSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });

  void recordHit();
}

function ymd(d = new Date()) {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}

async function recordHit() {
  try {
    const path = `${location.pathname}${location.search}`.slice(0, 180);
    if (path.startsWith("/Admin") || path.startsWith("/admin") || path.startsWith("/login")) return;
    await addDoc(collection(db, "hits"), {
      path,
      date: ymd(),
      ts: Date.now(),
    });
  } catch {
    /* rules / offline */
  }
}

/** Admin: tarih aralığında path sayımları. */
export async function fetchHitsBetween(fromYmd, toYmd) {
  const snap = await getDocs(
    query(collection(db, "hits"), where("date", ">=", fromYmd), where("date", "<=", toYmd)),
  );
  return snap.docs.map((d) => d.data());
}
