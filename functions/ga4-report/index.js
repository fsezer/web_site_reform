import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "546157474";
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

async function runReport(from, to) {
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
  for (const r of rows) {
    const d =
      r.date?.length === 8
        ? `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}`
        : r.date;
    byDateMap.set(d, (byDateMap.get(d) || 0) + r.views);
    byPathMap.set(r.path, (byPathMap.get(r.path) || 0) + r.views);
  }

  const byDate = [...byDateMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, total]) => ({ date, total }));
  const byPath = [...byPathMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([path, views]) => ({ path, views }));

  return {
    propertyId: PROPERTY_ID,
    from,
    to,
    byDate,
    byPath,
    rowCount: rows.length,
  };
}

export async function ga4Report(req, res) {
  if (req.method === "OPTIONS") {
    Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    await requireAdmin(req);
    const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") || 7)));
    const to = ymd(addDays(new Date(), -1));
    const from = ymd(addDays(new Date(to), -(days - 1)));
    const data = await runReport(from, to);
    json(res, 200, { ok: true, ...data });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "GA4 hatası";
    console.error("ga4Report", message);
    json(res, status, { ok: false, error: message });
  }
}
