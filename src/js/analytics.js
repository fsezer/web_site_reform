/**
 * GA4 — gtag + Firebase Analytics (measurementId zorunlu).
 */
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { firebaseConfig } from "./firebase.js";

const MEASUREMENT_ID = firebaseConfig.measurementId || "";

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

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  void isSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });
}
