import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { google } from "googleapis";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "546157474";
const SC_SITE = process.env.SC_SITE_URL || "sc-domain:sanastechnology.com";
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "sanas-502703";
const LOCKED = "admin@istiklalyazilim.com";

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const analytics = new BetaAnalyticsDataClient();
const db = getFirestore();

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "3600",
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

function ymd(d) {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function parseDays(req) {
  const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
  return Math.min(90, Math.max(1, Number(url.searchParams.get("days") || 7)));
}

function dateRange(days) {
  const to = ymd(addDays(new Date(), -1));
  const from = ymd(addDays(new Date(to), -(days - 1)));
  return { from, to };
}

async function requireAdmin(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw Object.assign(new Error("Yetki gerekli"), { status: 401 });
  const decoded = await getAuth().verifyIdToken(token);
  const email = String(decoded.email || "")
    .trim()
    .toLowerCase();
  if (!email) throw Object.assign(new Error("E-posta yok"), { status: 403 });

  if (email === LOCKED || email === "fsezer.mail@gmail.com") return decoded;

  try {
    const snap = await db.doc("settings/admins").get();
    const emails = (snap.data()?.emails || []).map((e) => String(e).toLowerCase());
    if (emails.includes(email)) return decoded;
  } catch (err) {
    console.warn("allowlist read failed", err?.message);
  }
  throw Object.assign(new Error("Yetkisiz"), { status: 403 });
}

async function runGa4Report(from, to) {
  const [response] = await analytics.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: from, endDate: to }],
    dimensions: [{ name: "pagePath" }, { name: "date" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 100,
  });

  const rows = (response.rows || []).map((row) => ({
    path: row.dimensionValues?.[0]?.value || "/",
    date: row.dimensionValues?.[1]?.value || "",
    views: Number(row.metricValues?.[0]?.value || 0),
  }));

  const byDateMap = new Map();
  const byPathMap = new Map();
  // Sabit sayfalar ↔ SEO sayfaları (/content/…) günlük kırılımı — mobil trend tab'ları
  const byDateFixedMap = new Map();
  const byDateSeoMap = new Map();
  for (const r of rows) {
    const d =
      r.date?.length === 8
        ? `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}`
        : r.date;
    byDateMap.set(d, (byDateMap.get(d) || 0) + r.views);
    byPathMap.set(r.path, (byPathMap.get(r.path) || 0) + r.views);
    const seg = r.path.startsWith("/content/") ? byDateSeoMap : byDateFixedMap;
    seg.set(d, (seg.get(d) || 0) + r.views);
  }

  const toSeries = (map) =>
    [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }));

  return {
    propertyId: PROPERTY_ID,
    from,
    to,
    byDate: toSeries(byDateMap),
    byDateFixed: toSeries(byDateFixedMap),
    byDateSeo: toSeries(byDateSeoMap),
    byPath: [...byPathMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([path, views]) => ({ path, views })),
    rowCount: rows.length,
  };
}

async function runScReport(from, to) {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const sc = google.searchconsole({ version: "v1", auth });
  const { data } = await sc.searchanalytics.query({
    siteUrl: SC_SITE,
    requestBody: {
      startDate: from,
      endDate: to,
      dimensions: ["query"],
      rowLimit: 30,
      dataState: "final",
    },
  });

  const queries = (data.rows || []).map((r) => ({
    query: r.keys?.[0] || "",
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
    position: Number((r.position || 0).toFixed(1)),
  }));

  return {
    siteUrl: SC_SITE,
    from,
    to,
    queries,
    rowCount: queries.length,
  };
}

function wrap(handler) {
  return async (req, res) => {
    if (req.method === "OPTIONS") {
      Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 204;
      res.end();
      return;
    }
    try {
      await requireAdmin(req);
      const days = parseDays(req);
      const { from, to } = dateRange(days);
      const data = await handler(from, to);
      json(res, 200, { ok: true, ...data });
    } catch (error) {
      const status = error.status || 500;
      const message = error.message || "API hatası";
      console.error(handler.name || "handler", message);
      json(res, status, { ok: false, error: message });
    }
  };
}

const PSI_CATS = ["performance", "accessibility", "best-practices", "seo"];

async function runPsi(req) {
  const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
  const target = String(url.searchParams.get("url") || "https://www.sanastechnology.com/").trim();
  const strategy = String(url.searchParams.get("strategy") || "mobile").trim() === "desktop" ? "desktop" : "mobile";
  if (!/^https:\/\/(www\.)?sanastechnology\.com(\/|$)/i.test(target)) {
    throw Object.assign(new Error("Sadece sanastechnology.com URL’leri"), { status: 400 });
  }
  const key = process.env.PSI_API_KEY || "";
  if (!key) throw Object.assign(new Error("PSI_API_KEY yok"), { status: 500 });

  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", target);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("key", key);
  for (const c of PSI_CATS) endpoint.searchParams.append("category", c);

  const res = await fetch(endpoint);
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data?.error?.message || `PageSpeed HTTP ${res.status}`), {
      status: res.status >= 400 && res.status < 500 ? res.status : 502,
    });
  }

  const lhr = data.lighthouseResult || {};
  const cats = lhr.categories || {};
  const scores = {};
  for (const c of PSI_CATS) {
    const s = cats[c]?.score;
    scores[c] = s == null ? null : Math.round(Number(s) * 100);
  }
  const audits = lhr.audits || {};
  const dv = (id) => audits[id]?.displayValue || null;
  const vitals = {};
  if (dv("largest-contentful-paint")) vitals.LCP = dv("largest-contentful-paint");
  if (dv("cumulative-layout-shift")) vitals.CLS = dv("cumulative-layout-shift");
  if (dv("total-blocking-time")) vitals.TBT = dv("total-blocking-time");
  if (dv("first-contentful-paint")) vitals.FCP = dv("first-contentful-paint");
  if (dv("speed-index")) vitals.SI = dv("speed-index");

  const refs = new Set();
  for (const cat of Object.values(cats)) {
    for (const r of cat.auditRefs || []) {
      if (r.group === "hidden" || r.weight === 0) continue;
      refs.add(r.id);
    }
  }
  const issues = [];
  for (const id of refs) {
    const a = audits[id];
    if (!a || a.score == null) continue;
    const score = Number(a.score);
    if (score >= 0.9) continue;
    const mode = a.scoreDisplayMode;
    if (mode === "informative" || mode === "manual" || mode === "notApplicable") continue;
    const details = a.details || {};
    let impact = "—";
    if (typeof details.overallSavingsMs === "number" && details.overallSavingsMs > 0) {
      impact = `~${Math.round(details.overallSavingsMs)} ms`;
    } else if (typeof details.overallSavingsBytes === "number" && details.overallSavingsBytes > 0) {
      const kb = details.overallSavingsBytes / 1024;
      impact = kb >= 1024 ? `~${(kb / 1024).toFixed(1)} MB` : `~${Math.round(kb)} KB`;
    } else if (mode === "binary") {
      impact = score === 1 ? "OK" : "Başarısız";
    }
    const desc = String(a.description || "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .slice(0, 180);
    issues.push({
      title: a.title || id,
      description: desc.length === 180 ? `${desc}…` : desc,
      impact,
      score: Math.round(score * 100),
    });
  }
  issues.sort((a, b) => a.score - b.score);

  const path = target.replace(/^https:\/\/(www\.)?sanastechnology\.com/i, "") || "/";
  return {
    url: target,
    strategy,
    scores,
    vitals,
    issues: issues.slice(0, 18),
    status: `${path} · ${strategy} · Perf ${scores.performance ?? "—"}`,
  };
}

export const ga4Report = wrap(runGa4Report);
export const scReport = wrap(runScReport);

export async function psiReport(req, res) {
  if (req.method === "OPTIONS") {
    Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = 204;
    res.end();
    return;
  }
  try {
    await requireAdmin(req);
    const data = await runPsi(req);
    json(res, 200, { ok: true, ...data });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "PageSpeed hatası";
    console.error("psiReport", message);
    json(res, status, { ok: false, error: message });
  }
}
