import { firebaseConfig } from "./firebase.js";

const MEASUREMENT_ID = firebaseConfig.measurementId || "";

/** GA4 + dataLayer — Tag Assistant / gtag uyumlu sıra. */
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
    transport_type: "beacon",
  });

  /* Tag Assistant: id + dataLayer görünür */
  document.documentElement.dataset.gaMeasurementId = MEASUREMENT_ID;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.setAttribute("data-sanas-gtag", MEASUREMENT_ID);
  document.head.appendChild(script);

}
