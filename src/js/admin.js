import { bustAllowlistCache, logout, requireAuth } from "./auth.js";
import {
  ensureAllowlistRemote,
  fetchAllowlist,
  LOCKED_ADMIN_EMAIL,
  saveAllowlist,
} from "./allowlist.js";
import { fetchHitsBetween } from "./analytics.js";
import {
  deleteNote,
  deleteSeoPage,
  listNotes,
  listPublishedSeoForSitemap,
  listSeoPages,
  migrateLocalCmsIfNeeded,
  publishSeoPage,
  saveNote,
  saveSeoPage,
  unpublishSeoPage,
} from "./cms.js";
import { fetchPublicSettings, savePublicSettings } from "./siteSettings.js";

const KEYS = {
  theme: "sanas-admin-theme",
  domain: "sanas-admin-domain-expiry",
};

/** @type {any[]} */
let seoCache = [];
/** @type {any[]} */
let notesCache = [];

const FIXED_PAGES = [
  { id: "home", label: "Ana Sayfa", path: "/" },
  { id: "about", label: "Hakkımızda", path: "/about.html" },
  { id: "projects", label: "Projeler", path: "/projects.html" },
  { id: "capabilities", label: "Çözüm", path: "/introducing.html" },
  { id: "team", label: "Ekip", path: "/team.html" },
  { id: "contact", label: "İletişim", path: "/contact.html" },
];

const PAGE_SIZE = 8;

const LOCAL_OPPS = [
  {
    q: "Eskişehir yazılım firması",
    tip: "Kurumsal sayfa + vaka",
    slug: "eskisehir-yazilim-firmasi",
    title: "Eskişehir Yazılım Firması — Sanas Technology",
  },
  {
    q: "Eskişehir yapay zeka",
    tip: "Çözüm + Dr.Mind köprüsü",
    slug: "eskisehir-yapay-zeka",
    title: "Eskişehir Yapay Zeka Çözümleri",
  },
  {
    q: "Eskişehir mobil uygulama",
    tip: "Projeler + İstiklal linki",
    slug: "eskisehir-mobil-uygulama",
    title: "Eskişehir Mobil Uygulama Geliştirme",
  },
  {
    q: "Eskişehir özel yazılım",
    tip: "Hizmet SEO landing",
    slug: "eskisehir-ozel-yazilim",
    title: "Eskişehir Özel Yazılım Geliştirme",
  },
  {
    q: "Eskişehir bulut çözümleri",
    tip: "Cloud kartı içeriği",
    slug: "eskisehir-bulut-cozumleri",
    title: "Eskişehir Bulut Çözümleri",
  },
  {
    q: "Eskişehir kurumsal yazılım",
    tip: "Hakkımızda kanıtları",
    slug: "eskisehir-kurumsal-yazilim",
    title: "Eskişehir Kurumsal Yazılım",
  },
];

function draftBodyFromOpp(opp) {
  return [
    `${opp.q} arayanlar için net bir bakış: Sanas Technology, 2004’ten beri ölçeklenebilir yazılım sistemleri geliştirir.`,
    "",
    "## Ne sunuyoruz",
    "Kurumsal yazılım, bulut, yapay zekâ ve mobil çözümlerde uçtan uca tasarım ve teslimat.",
    "",
    "## Sanas yaklaşımı",
    "Abartısız iddia yerine gerçek projeler, ölçülebilir sonuç ve uzun vadeli bakım.",
    "",
    "## Sık sorulanlar",
    "Süreç nasıl işler? Keşif → mimari → geliştirme → yayın → destek.",
    "",
    "Türkiye operasyonları için: https://istiklalyazilim.com",
    "Çözümlerimiz: https://www.sanastechnology.com/introducing.html",
  ].join("\n");
}

const CHART_COLORS = ["#38bdf8", "#34d399", "#a78bfa", "#fbbf24", "#f472b6", "#22d3ee", "#fb7185"];

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ymd(d) {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function autoMeta(title, body) {
  const clean = String(body || "").replace(/\s+/g, " ").trim();
  const metaTitle = `${title} — Sanas Technology`.slice(0, 60);
  const metaDesc = (clean || title).slice(0, 155);
  const words = `${title} ${clean}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const freq = new Map();
  words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w)
    .join(", ");
  return { metaTitle, metaDesc, keywords };
}

function scoreSeo(item) {
  let score = 0;
  const hints = [];
  const title = String(item.title || "");
  const metaTitle = String(item.metaTitle || "");
  const metaDesc = String(item.metaDesc || "");
  const body = String(item.body || "");
  const keywords = String(item.keywords || "");
  const related = String(item.related || "");

  if (title.length >= 20 && title.length <= 70) score += 15;
  else hints.push("Başlık 20–70 karakter");

  if (metaTitle.length >= 30 && metaTitle.length <= 60) score += 15;
  else hints.push("Meta title 30–60");

  if (metaDesc.length >= 70 && metaDesc.length <= 160) score += 20;
  else hints.push("Meta description 70–160");

  if (keywords.split(",").filter(Boolean).length >= 3) score += 10;
  else hints.push("En az 3 keyword");

  if (body.length >= 400) score += 20;
  else hints.push("İçerik kısa");

  if (/istiklal/i.test(body) || /istiklalyazilim\.com/i.test(related) || /istiklal/i.test(related)) score += 10;
  else hints.push("İstiklal bağlantısı ekle");

  if (item.slug && /^[a-z0-9\-]+$/.test(item.slug)) score += 10;
  else hints.push("Slug düzelt");

  return { score: Math.min(100, score), hint: hints[0] || "Hazır" };
}

/** Deterministic mock until GA4 Data API is wired. */
function mockViews(pageId, dateStr) {
  let h = 0;
  const s = `${pageId}:${dateStr}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 8 + (h % 90);
}

function rangeDates(from, to) {
  const out = [];
  let cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    out.push(ymd(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

function pagesForSeg(seg) {
  if (seg === "fixed") return FIXED_PAGES.map((p) => ({ ...p, kind: "fixed" }));
  return seoCache
    .filter((p) => p.status === "published" || seg === "seo")
    .map((p) => ({
      id: p.id,
      label: p.title,
      path: `/content/${p.slug}`,
      kind: "seo",
      slug: p.slug,
    }));
}

function pathMatchesPage(hitPath, page) {
  const path = String(hitPath || "").split("?")[0];
  if (page.kind === "fixed") {
    if (page.path === "/") return path === "/" || path === "/index.html";
    return path === page.path || path === page.path.replace(/\.html$/, "");
  }
  const slug = page.slug || page.path.replace(/^\/content\//, "");
  return path === `/content/${slug}` || path === `/content/${slug}.html` || path.startsWith(`/content/${slug}?`);
}

function seriesFor(seg, from, to, hits = null) {
  const dates = rangeDates(from, to);
  const pages = pagesForSeg(seg);
  const useHits = Array.isArray(hits);

  const countFor = (page, dateStr) => {
    if (!useHits) return mockViews(page.id, dateStr);
    return hits.filter((h) => h.date === dateStr && pathMatchesPage(h.path, page)).length;
  };

  const byDate = dates.map((d) => ({
    date: d,
    total: pages.reduce((sum, p) => sum + countFor(p, d), 0),
  }));

  const prevFrom = addDays(from, -dates.length);
  const prevTo = addDays(from, -1);
  const prevDates = rangeDates(prevFrom, prevTo);

  const byPage = pages
    .map((p) => {
      const views = dates.reduce((sum, d) => sum + countFor(p, d), 0);
      const prev = prevDates.reduce((sum, d) => sum + countFor(p, d), 0);
      const delta = prev ? ((views - prev) / prev) * 100 : 0;
      return { ...p, views, delta };
    })
    .sort((a, b) => b.views - a.views);
  return { byDate, byPage, live: useHits };
}

function kpiFrom(byPage) {
  if (!byPage.length) return { max: null, min: null, avg: 0, total: 0 };
  const total = byPage.reduce((s, p) => s + p.views, 0);
  return {
    max: byPage[0],
    min: byPage[byPage.length - 1],
    avg: Math.round(total / byPage.length),
    total,
  };
}

function renderChart(el, points, type) {
  if (!el) return;
  if (!points.length) {
    el.innerHTML = `<div class="admin-chart-meta"><span>Görüntülenme</span><strong>Veri yok</strong></div>`;
    return;
  }

  const uid = `c${Math.random().toString(36).slice(2, 8)}`;
  const vals = points.map((p) => p.total);
  const total = vals.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / Math.max(1, vals.length));
  const meta = `<div class="admin-chart-meta">
      <span>Görüntülenme</span>
      <strong>Toplam ${total}</strong>
      <em>Ort. ${avg}/gün</em>
    </div>`;

  if (type === "pie" || type === "donut") {
    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const r = 88;
    const r0 = type === "donut" ? 48 : 0;
    let angle = -Math.PI / 2;
    const slices = points.map((p, i) => {
      const portion = total ? p.total / total : 0;
      const a0 = angle;
      const a1 = angle + portion * Math.PI * 2;
      angle = a1;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const path =
        r0 > 0
          ? `M ${cx + r0 * Math.cos(a0)} ${cy + r0 * Math.sin(a0)} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${cx + r0 * Math.cos(a1)} ${cy + r0 * Math.sin(a1)} A ${r0} ${r0} 0 ${large} 0 ${cx + r0 * Math.cos(a0)} ${cy + r0 * Math.sin(a0)} Z`
          : `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
      return { path, color: CHART_COLORS[i % CHART_COLORS.length], p, portion };
    });
    el.innerHTML = `${meta}
      <div class="admin-chart-pie-wrap">
        <svg viewBox="0 0 ${size} ${size}" class="admin-chart-svg admin-chart-pie" aria-hidden="true">${slices
          .map(
            (s) =>
              `<path d="${s.path}" fill="${s.color}" opacity="0.92"><title>${String(s.p.date || "").slice(5)}: ${s.p.total}</title></path>`,
          )
          .join("")}${
          type === "donut"
            ? `<text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="currentColor" font-size="18" font-weight="700">${total}</text>
               <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="currentColor" opacity="0.5" font-size="10">toplam</text>`
            : ""
        }</svg>
        <ul class="admin-chart-legend">${points
          .map(
            (p, i) =>
              `<li><i style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></i><span>${String(p.date || "").slice(5)}</span><strong>${p.total}</strong></li>`,
          )
          .join("")}</ul>
      </div>`;
    return;
  }

  if (type === "hbar") {
    const rowH = 28;
    const padL = 58;
    const padR = 36;
    const w = 680;
    const h = Math.max(160, 20 + points.length * rowH + 12);
    const max = Math.max(1, ...vals);
    const bars = points
      .map((p, i) => {
        const y = 16 + i * rowH;
        const bw = ((w - padL - padR) * p.total) / max;
        const c = CHART_COLORS[i % CHART_COLORS.length];
        return `<text x="8" y="${y + 12}" fill="currentColor" opacity="0.55" font-size="10">${String(p.date || "").slice(5)}</text>
          <rect x="${padL}" y="${y}" width="${bw}" height="14" rx="4" fill="${c}"/>
          <text x="${padL + bw + 6}" y="${y + 11}" fill="currentColor" font-size="10" font-weight="600">${p.total}</text>`;
      })
      .join("");
    el.innerHTML = `${meta}<svg viewBox="0 0 ${w} ${h}" class="admin-chart-svg">${bars}</svg>`;
    return;
  }

  const w = 680;
  const h = 280;
  const padL = 48;
  const padR = 18;
  const padT = 36;
  const padB = 48;
  const max = Math.max(1, ...vals);
  const n = Math.max(1, points.length - 1);
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const xy = points.map((p, i) => {
    const x = padL + (i / n) * plotW;
    const y = padT + plotH - (p.total / max) * plotH;
    return { x, y, ...p };
  });

  const yTicks = [0, 0.5, 1].map((t) => {
    const v = Math.round(max * t);
    const y = padT + plotH - t * plotH;
    return { v, y };
  });

  const grid = yTicks
    .map(
      (t) =>
        `<line x1="${padL}" y1="${t.y}" x2="${w - padR}" y2="${t.y}" stroke="currentColor" opacity="0.1"/>
         <text x="${padL - 10}" y="${t.y + 3}" text-anchor="end" fill="currentColor" opacity="0.5" font-size="11">${t.v}</text>`,
    )
    .join("");

  const labelStep = Math.max(1, Math.ceil(points.length / 5));
  const xLabels = xy
    .map((p, i) => {
      if (i !== 0 && i !== xy.length - 1 && i % labelStep !== 0) return "";
      return `<text x="${p.x}" y="${h - 14}" text-anchor="middle" fill="currentColor" opacity="0.5" font-size="10">${String(p.date || "").slice(5)}</text>`;
    })
    .join("");

  let plot = "";
  if (type === "bar") {
    const bw = Math.max(10, (plotW / points.length) * 0.5);
    plot = xy
      .map((p, i) => {
        const c = CHART_COLORS[i % CHART_COLORS.length];
        const show = points.length <= 10 || i % labelStep === 0 || i === xy.length - 1;
        return `<rect x="${p.x - bw / 2}" y="${p.y}" width="${bw}" height="${h - padB - p.y}" rx="4" fill="${c}" opacity="0.92"/>
          ${show ? `<text x="${p.x}" y="${Math.max(padT + 12, p.y - 8)}" text-anchor="middle" fill="currentColor" opacity="0.75" font-size="10" font-weight="600">${p.total}</text>` : ""}`;
      })
      .join("");
  } else {
    const line = xy.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
    const area = `${line} L${xy[xy.length - 1].x} ${h - padB} L${padL} ${h - padB} Z`;
    plot = `
      <defs>
        <linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#34d399"/>
        </linearGradient>
        <linearGradient id="${uid}f" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity=".28"/>
          <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${type === "area" ? `<path d="${area}" fill="url(#${uid}f)"/>` : ""}
      <path d="${line}" fill="none" stroke="url(#${uid})" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      ${xy
        .map((p, i) => {
          const show = points.length <= 8 || i % labelStep === 0 || i === xy.length - 1;
          return `<circle cx="${p.x}" cy="${p.y}" r="3.2" fill="${CHART_COLORS[i % CHART_COLORS.length]}"/>
            ${show ? `<text x="${p.x}" y="${Math.max(padT + 10, p.y - 10)}" text-anchor="middle" fill="currentColor" opacity="0.8" font-size="10" font-weight="600">${p.total}</text>` : ""}`;
        })
        .join("")}`;
  }

  el.innerHTML = `${meta}
    <svg viewBox="0 0 ${w} ${h}" class="admin-chart-svg" role="img" aria-label="Görüntülenme grafiği">
      ${grid}${plot}${xLabels}
    </svg>`;
}

function fmtDelta(d) {
  const sign = d > 0 ? "+" : "";
  const cls = d > 0 ? "is-up" : d < 0 ? "is-down" : "";
  return `<span class="admin-delta ${cls}">${sign}${d.toFixed(0)}%</span>`;
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function toCSV(rows) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function applyTheme(mode) {
  localStorage.setItem(KEYS.theme, mode);
  const sys = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.dataset.theme = mode === "system" ? sys : mode;
  document.querySelectorAll("[data-theme]").forEach((b) => {
    b.classList.toggle("is-active", b.getAttribute("data-theme") === mode);
  });
}

function openModal(el) {
  if (!el) return;
  el.hidden = false;
  document.body.classList.add("is-admin-modal");
}

function closeModal(el) {
  if (!el) return;
  el.hidden = true;
  if (![...document.querySelectorAll(".admin-modal")].some((m) => !m.hidden)) {
    document.body.classList.remove("is-admin-modal");
  }
}

const user = await requireAuth();
if (!user) {
  /* redirecting */
} else {
  const who = document.querySelector("[data-admin-user]");
  if (who) who.textContent = user.email || "";

  document.querySelector("[data-logout]")?.addEventListener("click", () => void logout());

  const closeSide = () => document.body.classList.remove("is-side-open");
  document.querySelector("[data-admin-menu]")?.addEventListener("click", () => {
    document.body.classList.toggle("is-side-open");
  });
  document.querySelector("[data-admin-backdrop]")?.addEventListener("click", closeSide);

  const collapseKey = "sanas-admin-side-collapsed";
  const applyCollapse = (on) => {
    document.body.classList.toggle("is-side-collapsed", on);
    localStorage.setItem(collapseKey, on ? "1" : "0");
  };
  applyCollapse(localStorage.getItem(collapseKey) === "1");
  document.querySelector("[data-admin-collapse]")?.addEventListener("click", () => {
    applyCollapse(!document.body.classList.contains("is-side-collapsed"));
  });

  /* tabs */
  document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-admin-tab");
      document.querySelectorAll("[data-admin-tab]").forEach((b) => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll("[data-panel]").forEach((p) => {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === tab);
      });
      closeSide();
    });
  });

  /* theme */
  applyTheme(localStorage.getItem(KEYS.theme) || "dark");
  document.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.getAttribute("data-theme")));
  });
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if ((localStorage.getItem(KEYS.theme) || "dark") === "system") applyTheme("system");
  });

  /* session timeout (client stub until Firebase) */
  const timeoutSel = document.querySelector("[data-session-timeout]");
  const timeoutKey = "sanas-admin-timeout-min";
  if (timeoutSel) {
    timeoutSel.value = localStorage.getItem(timeoutKey) || "60";
    timeoutSel.addEventListener("change", () => {
      localStorage.setItem(timeoutKey, timeoutSel.value);
    });
  }

  /* backup export */
  document.querySelector("[data-backup-export]")?.addEventListener("click", async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      seo: seoCache,
      notes: notesCache,
      allowlist: await fetchAllowlist(),
    };
    downloadBlob(`sanas-backup-${ymd(new Date())}.json`, JSON.stringify(payload, null, 2), "application/json");
  });

  document.querySelector("[data-sitemap-download]")?.addEventListener("click", async () => {
    let published = seoCache.filter((p) => p.status === "published");
    try {
      published = await listPublishedSeoForSitemap();
    } catch {
      /* use cache */
    }
    const fixed = [
      ["https://www.sanastechnology.com/", "1.0"],
      ["https://www.sanastechnology.com/about.html", "0.8"],
      ["https://www.sanastechnology.com/projects.html", "0.8"],
      ["https://www.sanastechnology.com/introducing.html", "0.7"],
      ["https://www.sanastechnology.com/team.html", "0.6"],
      ["https://www.sanastechnology.com/contact.html", "0.6"],
    ];
    const today = ymd(new Date());
    const urls = [
      ...fixed.map(
        ([loc, pri]) =>
          `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${pri}</priority>\n  </url>`,
      ),
      ...published.map((p) => {
        const mod = p.updated ? ymd(new Date(p.updated)) : today;
        return `  <url>\n    <loc>https://www.sanastechnology.com/content/${p.slug}</loc>\n    <lastmod>${mod}</lastmod>\n    <priority>0.5</priority>\n  </url>`;
      }),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
    downloadBlob(`sitemap-${today}.xml`, xml, "application/xml");
  });

  const scInput = document.querySelector("[data-sc-verification]");
  const scMsg = document.querySelector("[data-sc-msg]");
  void fetchPublicSettings().then((s) => {
    if (scInput && s.googleSiteVerification) scInput.value = s.googleSiteVerification;
  });
  document.querySelector("[data-sc-save]")?.addEventListener("click", async () => {
    const code = String(scInput?.value || "").trim();
    try {
      await savePublicSettings({ googleSiteVerification: code });
      if (scMsg) {
        scMsg.hidden = false;
        scMsg.textContent = code ? "Kaydedildi — tüm sayfalara meta eklenecek." : "Kod temizlendi.";
        scMsg.classList.remove("is-error");
      }
    } catch (err) {
      if (scMsg) {
        scMsg.hidden = false;
        scMsg.textContent = err?.message || "Kaydedilemedi";
        scMsg.classList.add("is-error");
      }
    }
  });

  document.querySelector("[data-local-opps]")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-opp-draft]");
    if (!btn) return;
    const opp = LOCAL_OPPS[Number(btn.getAttribute("data-opp-draft"))];
    if (!opp) return;
    if (seoCache.some((p) => p.slug === opp.slug)) {
      alert("Bu slug zaten var. SEO sekmesinden düzenle.");
      document.querySelector('[data-admin-tab="seo"]')?.click();
      return;
    }
    const body = draftBodyFromOpp(opp);
    const meta = autoMeta(opp.title, body);
    try {
      await saveSeoPage({
        id: opp.slug,
        slug: opp.slug,
        title: opp.title,
        subtitle: opp.tip,
        body,
        metaTitle: meta.metaTitle,
        metaDesc: meta.metaDesc,
        keywords: `${opp.q}, Eskişehir, Sanas Technology`,
        related: "İstiklal Yazılım | https://istiklalyazilim.com\nÇözümler | /introducing.html",
        status: "draft",
      });
      await refreshSeoCache();
      renderSeo();
      document.querySelector('[data-admin-tab="seo"]')?.click();
      alert(`Taslak hazır: /content/${opp.slug} — içeriği güçlendirip Yayınla.`);
    } catch (err) {
      alert(err?.message || "Taslak oluşturulamadı");
    }
  });

  /* Google allowlist */
  const allowListEl = document.querySelector("[data-allow-list]");
  const allowForm = document.querySelector("[data-allow-form]");

  async function renderAllowlist() {
    if (!allowListEl) return;
    const emails = await fetchAllowlist();
    allowListEl.innerHTML = emails
      .map((email) => {
        const locked = email === LOCKED_ADMIN_EMAIL;
        return `<li class="admin-allow-item${locked ? " is-locked" : ""}">
          <span>${email}${locked ? ' <em>kilitli</em>' : ""}</span>
          ${
            locked
              ? ""
              : `<button type="button" class="admin-btn admin-btn-ghost" data-allow-remove="${email}">Kaldır</button>`
          }
        </li>`;
      })
      .join("");
  }

  const allowMsg = document.querySelector("[data-allow-msg]");
  function setAllowMsg(text, isError = false) {
    if (!allowMsg) return;
    if (!text) {
      allowMsg.hidden = true;
      allowMsg.textContent = "";
      return;
    }
    allowMsg.hidden = false;
    allowMsg.textContent = text;
    allowMsg.classList.toggle("is-error", isError);
  }

  allowForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = allowForm.querySelector('input[name="email"]');
    const email = String(input?.value || "")
      .trim()
      .toLowerCase();
    if (!email.includes("@")) {
      setAllowMsg("Geçerli bir e-posta gir.", true);
      return;
    }
    const list = await fetchAllowlist();
    if (list.includes(email)) {
      setAllowMsg("Bu e-posta zaten yetkili listesinde.", true);
      return;
    }
    list.push(email);
    await saveAllowlist(list);
    bustAllowlistCache();
    if (input) input.value = "";
    setAllowMsg("Eklendi. Kişi Google ile giriş yapabilir.");
    await renderAllowlist();
  });

  allowListEl?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-allow-remove]");
    if (!btn) return;
    const email = btn.getAttribute("data-allow-remove");
    if (!email || email === LOCKED_ADMIN_EMAIL) return;
    const list = (await fetchAllowlist()).filter((x) => x !== email);
    await saveAllowlist(list);
    bustAllowlistCache();
    await renderAllowlist();
  });

  void (async () => {
    await ensureAllowlistRemote();
    bustAllowlistCache();
    await renderAllowlist();
  })();

  /* domain */
  const domainModal = document.querySelector("[data-domain-modal]");
  const domainDate = document.querySelector("[data-domain-date]");
  const domainDays = document.querySelector("[data-domain-days]");
  const domainSummaryDays = document.querySelector("[data-domain-summary-days]");

  function refreshDomainUI() {
    const expiry = localStorage.getItem(KEYS.domain) || ymd(addDays(new Date(), 365));
    if (domainDate) domainDate.value = expiry;
    const left = Math.ceil((new Date(expiry) - new Date()) / 86400000);
    if (domainDays) {
      domainDays.textContent = left >= 0 ? `${left} gün kaldı` : `${Math.abs(left)} gün gecikti`;
      domainDays.classList.toggle("is-warn", left < 30);
    }
    if (domainSummaryDays) {
      domainSummaryDays.textContent = left >= 0 ? `${left} gün` : `${Math.abs(left)} gün gecikti`;
      domainSummaryDays.classList.toggle("is-warn", left < 30);
    }
  }

  refreshDomainUI();
  document.querySelectorAll("[data-domain-info]").forEach((btn) => {
    btn.addEventListener("click", () => {
      refreshDomainUI();
      openModal(domainModal);
    });
  });
  document.querySelectorAll("[data-domain-modal-close]").forEach((b) => {
    b.addEventListener("click", () => closeModal(domainModal));
  });
  domainDate?.addEventListener("change", () => {
    if (domainDate.value) {
      localStorage.setItem(KEYS.domain, domainDate.value);
      refreshDomainUI();
    }
  });

  /* ---------- DASHBOARD ---------- */
  let dashSeg = "fixed";
  const dashRange = document.querySelector("[data-dash-range]");
  const dashType = document.querySelector("[data-dash-chart-type]");
  if (dashRange) dashRange.value = "yesterday";

  function dashBounds(preset) {
    const y = yesterday();
    if (preset === "week") return { from: addDays(y, -6), to: y };
    if (preset === "month") return { from: addDays(y, -29), to: y };
    return { from: y, to: y };
  }

  async function loadHits(from, to) {
    try {
      return await fetchHitsBetween(ymd(from), ymd(to));
    } catch {
      return null;
    }
  }

  async function renderDashboard() {
    const { from, to } = dashBounds(dashRange?.value || "yesterday");
    const prevFrom = addDays(from, -rangeDates(from, to).length);
    const hits = await loadHits(prevFrom, to);
    const { byDate, byPage, live } = seriesFor(dashSeg, from, to, hits);
    const kpi = kpiFrom(byPage);
    const titleEl = document.querySelector("[data-dash-title]");
    if (titleEl) titleEl.textContent = live ? "Trend (canlı)" : "Trend (örnek)";
    const kpiEl = document.querySelector("[data-dash-kpi]");
    if (kpiEl) {
      kpiEl.innerHTML = `
        <article class="admin-kpi-card"><span>Toplam</span><strong>${kpi.total}</strong></article>
        <article class="admin-kpi-card"><span>En çok</span><strong>${kpi.max?.label || "—"}</strong><em>${kpi.max?.views ?? "—"}</em></article>
        <article class="admin-kpi-card"><span>En az</span><strong>${kpi.min?.label || "—"}</strong><em>${kpi.min?.views ?? "—"}</em></article>
        <article class="admin-kpi-card"><span>Ortalama</span><strong>${kpi.avg}</strong></article>`;
    }
    renderChart(document.querySelector("[data-dash-chart]"), byDate, dashType?.value || "area");
    const tbody = document.querySelector("[data-dash-pages]");
    if (tbody) {
      tbody.innerHTML = byPage.length
        ? byPage
            .map(
              (p) =>
                `<tr><td>${p.label}</td><td>${p.views}</td><td>${fmtDelta(p.delta)}</td></tr>`,
            )
            .join("")
        : `<tr><td colspan="3" class="admin-empty">Kayıt yok</td></tr>`;
    }

    const tips = [];
    const weak = [...byPage].filter((p) => p.views < kpi.avg * 0.55).slice(0, 3);
    weak.forEach((p) => {
      tips.push(`${p.label}: düşük trafik · 1 haftalık Google Ads veya SEO landing dene`);
    });
    const falling = byPage.filter((p) => p.delta < -15).slice(0, 2);
    falling.forEach((p) => {
      tips.push(`${p.label}: ${p.delta.toFixed(0)}% düşüş · içerik/CTA gözden geçir`);
    });
    if (!tips.length) tips.push("Trend dengeli · yeni yerel SEO sayfası üretmeyi düşünebilirsin");
    const tipList = document.querySelector("[data-dash-tip-list]");
    if (tipList) tipList.innerHTML = tips.map((t) => `<li>${t}</li>`).join("");

    const opp = document.querySelector("[data-local-opps]");
    if (opp) {
      opp.innerHTML = LOCAL_OPPS.map(
        (o, i) =>
          `<li><strong>${o.q}</strong><span>${o.tip}</span>
            <button type="button" class="admin-btn admin-btn-sm" data-opp-draft="${i}">Taslak oluştur</button></li>`,
      ).join("");
    }

    const health = document.querySelector("[data-health-list]");
    if (health) {
      const expiry = localStorage.getItem(KEYS.domain) || ymd(addDays(new Date(), 365));
      const left = Math.ceil((new Date(expiry) - new Date()) / 86400000);
      const seoCount = seoCache.length;
      const pubCount = seoCache.filter((x) => x.status === "published").length;
      health.innerHTML = `
        <li><span>Domain</span><strong class="${left < 30 ? "is-warn" : ""}">${left} gün</strong></li>
        <li><span>SSL</span><strong class="is-ok">Aktif</strong></li>
        <li><span>Sitemap</span><strong class="is-ok">/sitemap.xml</strong></li>
        <li><span>SEO sayfa</span><strong>${seoCount} (${pubCount} yayında)</strong></li>
        <li><span>GA4</span><strong class="is-ok">G-HY4FN9MXS9</strong></li>
        <li><span>Firestore</span><strong class="is-ok">not + SEO</strong></li>`;
    }
  }

  document.querySelectorAll("[data-dash-seg] [data-seg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      dashSeg = btn.getAttribute("data-seg");
      document.querySelectorAll("[data-dash-seg] [data-seg]").forEach((b) => b.classList.toggle("is-active", b === btn));
      void renderDashboard();
    });
  });
  dashRange?.addEventListener("change", () => void renderDashboard());
  dashType?.addEventListener("change", () => void renderDashboard());
  document.querySelector("[data-dash-refresh]")?.addEventListener("click", () => void renderDashboard());
  void renderDashboard();

  /* ---------- ANALIZ ---------- */
  let analizSeg = "fixed";
  const fromInput = document.querySelector("[data-analiz-from]");
  const toInput = document.querySelector("[data-analiz-to]");
  const presetSel = document.querySelector("[data-analiz-preset]");
  const chartSel = document.querySelector("[data-analiz-chart-type]");

  function applyPreset(preset) {
    const y = yesterday();
    if (preset === "yesterday") {
      fromInput.value = ymd(y);
      toInput.value = ymd(y);
    } else if (preset === "week") {
      fromInput.value = ymd(addDays(y, -6));
      toInput.value = ymd(y);
    } else if (preset === "month") {
      fromInput.value = ymd(addDays(y, -29));
      toInput.value = ymd(y);
    }
  }

  applyPreset("yesterday");
  if (presetSel) presetSel.value = "yesterday";

  async function renderAnaliz() {
    const from = new Date(fromInput.value || ymd(yesterday()));
    const to = new Date(toInput.value || ymd(yesterday()));
    const prevFrom = addDays(from, -rangeDates(from, to).length);
    const hits = await loadHits(prevFrom, to);
    const { byDate, byPage, live } = seriesFor(analizSeg, from, to, hits);
    const total = byPage.reduce((s, p) => s + p.views, 0) || 1;
    const box = document.querySelector("[data-analiz-chart]");
    renderChart(box, byDate, chartSel?.value || "bar");
    if (box && live) box.dataset.live = "1";
    else if (box) delete box.dataset.live;
    const tbody = document.querySelector("[data-analiz-pages]");
    if (tbody) {
      tbody.innerHTML = byPage.length
        ? byPage
            .map(
              (p) =>
                `<tr><td>${p.label}</td><td>${p.views}</td><td>${((p.views / total) * 100).toFixed(1)}%</td></tr>`,
            )
            .join("")
        : `<tr><td colspan="3" class="admin-empty">Kayıt yok</td></tr>`;
    }
    return { byDate, byPage };
  }

  document.querySelectorAll("[data-analiz-seg] [data-seg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      analizSeg = btn.getAttribute("data-seg");
      document.querySelectorAll("[data-analiz-seg] [data-seg]").forEach((b) => b.classList.toggle("is-active", b === btn));
      void renderAnaliz();
    });
  });

  presetSel?.addEventListener("change", () => {
    if (presetSel.value !== "custom") applyPreset(presetSel.value);
    void renderAnaliz();
  });

  document.querySelector("[data-analiz-form]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (presetSel) presetSel.value = "custom";
    void renderAnaliz();
  });

  document.querySelector("[data-analiz-csv]")?.addEventListener("click", async () => {
    const { byPage } = await renderAnaliz();
    const rows = [["Sayfa", "Path", "Goruntulenme"], ...byPage.map((p) => [p.label, p.path, p.views])];
    downloadBlob(`analiz-${analizSeg}-${fromInput.value}-${toInput.value}.csv`, toCSV(rows), "text/csv;charset=utf-8");
  });

  document.querySelector("[data-analiz-xlsx]")?.addEventListener("click", async () => {
    const { byPage } = await renderAnaliz();
    const rows = [["Sayfa", "Path", "Goruntulenme"], ...byPage.map((p) => [p.label, p.path, p.views])];
    downloadBlob(
      `analiz-${analizSeg}-${fromInput.value}-${toInput.value}.xls`,
      `\ufeff${toCSV(rows)}`,
      "application/vnd.ms-excel",
    );
  });

  document.querySelector("[data-analiz-refresh]")?.addEventListener("click", () => void renderAnaliz());
  chartSel?.addEventListener("change", () => void renderAnaliz());

  void renderAnaliz();

  /* ---------- SEO CRUD (Firestore) ---------- */
  let seoPage = 1;
  let seoSort = { key: "updated", dir: -1 };
  const seoModal = document.querySelector("[data-seo-modal]");
  const seoForm = document.querySelector("[data-seo-form]");
  const seoSearch = document.querySelector("[data-seo-search]");

  async function refreshSeoCache() {
    try {
      seoCache = await listSeoPages();
    } catch (err) {
      console.warn("SEO listesi okunamadı", err);
      seoCache = [];
    }
  }

  function getSeo() {
    return seoCache;
  }

  function filteredSeo() {
    const q = String(seoSearch?.value || "")
      .toLowerCase()
      .trim();
    let list = getSeo().map((p) => ({ ...p, score: scoreSeo(p).score }));
    if (q) {
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.body?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q) ||
          p.keywords?.toLowerCase().includes(q),
      );
    }
    const { key, dir } = seoSort;
    list.sort((a, b) => {
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      if (typeof av === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "tr") * dir;
    });
    return list;
  }

  function renderSeo() {
    const list = filteredSeo();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (seoPage > pages) seoPage = pages;
    const slice = list.slice((seoPage - 1) * PAGE_SIZE, seoPage * PAGE_SIZE);
    const tbody = document.querySelector("[data-seo-tbody]");
    if (tbody) {
      tbody.innerHTML = slice.length
        ? slice
            .map((p) => {
              const sc = scoreSeo(p);
              const st = p.status === "published" ? "Yayında" : "Taslak";
              return `<tr>
                <td><code>/content/${p.slug}</code></td>
                <td>${p.title}</td>
                <td><span class="admin-status ${p.status === "published" ? "is-ok" : ""}">${st}</span></td>
                <td><span class="admin-score-pill" data-score="${sc.score}">${sc.score}</span></td>
                <td>${new Date(p.updated).toLocaleDateString("tr-TR")}</td>
                <td class="admin-row-actions">
                  <button type="button" class="admin-btn admin-btn-sm" data-seo-edit="${p.id}">Düzenle</button>
                  <button type="button" class="admin-btn admin-btn-sm" data-seo-publish="${p.id}">${p.status === "published" ? "Kaldır" : "Yayınla"}</button>
                  <a class="admin-btn admin-btn-sm" href="/content/${p.slug}" target="_blank" rel="noopener">Aç</a>
                  <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-seo-del="${p.id}">Sil</button>
                </td>
              </tr>`;
            })
            .join("")
        : `<tr><td colspan="6" class="admin-empty">Kayıt yok</td></tr>`;
    }
    const pager = document.querySelector("[data-seo-pager]");
    if (pager) {
      pager.innerHTML = Array.from({ length: pages }, (_, i) => {
        const n = i + 1;
        return `<button type="button" class="admin-page-btn ${n === seoPage ? "is-active" : ""}" data-seo-page="${n}">${n}</button>`;
      }).join("");
    }
    void renderDashboard();
    void renderAnaliz();
  }

  function refreshSeoScore() {
    if (!seoForm) return;
    const draft = {
      title: seoForm.title.value,
      slug: seoForm.slug.value,
      body: seoForm.body.value,
      metaTitle: seoForm.metaTitle.value,
      metaDesc: seoForm.metaDesc.value,
      keywords: seoForm.keywords.value,
      related: seoForm.related?.value || "",
    };
    const sc = scoreSeo(draft);
    const scoreEl = document.querySelector("[data-seo-score]");
    const hintEl = document.querySelector("[data-seo-score-hint]");
    if (scoreEl) scoreEl.textContent = String(sc.score);
    if (hintEl) hintEl.textContent = sc.hint;
  }

  function fillSeoMeta(force = false) {
    if (!seoForm) return;
    const title = seoForm.title.value.trim();
    const body = seoForm.body.value.trim();
    const meta = autoMeta(title, body);
    if (force || !seoForm.metaTitle.value.trim()) seoForm.metaTitle.value = meta.metaTitle;
    if (force || !seoForm.metaDesc.value.trim()) seoForm.metaDesc.value = meta.metaDesc;
    if (force || !seoForm.keywords.value.trim()) seoForm.keywords.value = meta.keywords;
    if (!seoForm.id.value && title && !seoForm.slug.dataset.touched) {
      seoForm.slug.value = slugify(title);
    }
    refreshSeoScore();
  }

  seoForm?.title.addEventListener("input", () => fillSeoMeta(false));
  seoForm?.body.addEventListener("input", () => fillSeoMeta(false));
  ["metaTitle", "metaDesc", "keywords", "related", "slug"].forEach((name) => {
    seoForm?.[name]?.addEventListener("input", refreshSeoScore);
  });
  document.querySelector("[data-seo-auto]")?.addEventListener("click", () => fillSeoMeta(true));
  document.querySelector("[data-seo-istiklal]")?.addEventListener("click", () => {
    if (!seoForm) return;
    const line = "İstiklal Yazılım | https://istiklalyazilim.com";
    const cur = seoForm.related.value.trim();
    if (!cur.includes("istiklalyazilim.com")) {
      seoForm.related.value = cur ? `${cur}\n${line}` : line;
    }
    const body = seoForm.body.value;
    if (!/istiklalyazilim\.com/i.test(body)) {
      seoForm.body.value = `${body.trim()}\n\nTürkiye operasyonları için: https://istiklalyazilim.com`.trim();
    }
    refreshSeoScore();
  });
  seoForm?.slug.addEventListener("input", () => {
    seoForm.slug.dataset.touched = "1";
  });

  document.querySelector("[data-seo-new]")?.addEventListener("click", () => {
    seoForm.reset();
    seoForm.id.value = "";
    delete seoForm.slug.dataset.touched;
    openModal(seoModal);
  });

  document.querySelectorAll("[data-seo-modal-close]").forEach((b) => {
    b.addEventListener("click", () => closeModal(seoModal));
  });

  seoForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(seoForm);
    const id = String(fd.get("id") || "").trim();
    const title = String(fd.get("title") || "").trim();
    const slug = String(fd.get("slug") || slugify(title)).trim();
    const body = String(fd.get("body") || "").trim();
    const generatedMeta = autoMeta(title, body);
    const prev = id ? getSeo().find((p) => p.id === id) : null;
    const item = {
      id: slug,
      title,
      slug,
      subtitle: String(fd.get("subtitle") || "").trim(),
      body,
      metaTitle: String(fd.get("metaTitle") || generatedMeta.metaTitle).trim(),
      metaDesc: String(fd.get("metaDesc") || generatedMeta.metaDesc).trim(),
      keywords: String(fd.get("keywords") || generatedMeta.keywords).trim(),
      related: String(fd.get("related") || "").trim(),
      status: prev?.status || "draft",
      created: prev?.created || Date.now(),
      updated: Date.now(),
    };
    try {
      await saveSeoPage(item, prev?.slug || id);
      await refreshSeoCache();
      closeModal(seoModal);
      renderSeo();
    } catch (err) {
      alert(err?.message || "SEO kaydı yazılamadı");
    }
  });

  document.querySelector("[data-seo-tbody]")?.addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-seo-edit]");
    const del = e.target.closest("[data-seo-del]");
    const pub = e.target.closest("[data-seo-publish]");
    if (edit) {
      const item = getSeo().find((p) => p.id === edit.getAttribute("data-seo-edit"));
      if (!item) return;
      seoForm.id.value = item.id;
      seoForm.title.value = item.title;
      seoForm.slug.value = item.slug;
      seoForm.slug.dataset.touched = "1";
      seoForm.subtitle.value = item.subtitle || "";
      seoForm.body.value = item.body || "";
      seoForm.metaTitle.value = item.metaTitle || "";
      seoForm.metaDesc.value = item.metaDesc || "";
      seoForm.keywords.value = item.keywords || "";
      if (seoForm.related) seoForm.related.value = item.related || "";
      refreshSeoScore();
      openModal(seoModal);
    }
    if (pub) {
      const id = pub.getAttribute("data-seo-publish");
      const item = getSeo().find((p) => p.id === id);
      if (!item) return;
      try {
        if (item.status === "published") await unpublishSeoPage(id);
        else await publishSeoPage(id);
        await refreshSeoCache();
        renderSeo();
      } catch (err) {
        alert(err?.message || "Yayınlama başarısız");
      }
    }
    if (del) {
      const id = del.getAttribute("data-seo-del");
      if (!confirm("Silinsin mi?")) return;
      try {
        await deleteSeoPage(id);
        await refreshSeoCache();
        renderSeo();
      } catch (err) {
        alert(err?.message || "Silinemedi");
      }
    }
  });

  document.querySelector("[data-seo-pager]")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-seo-page]");
    if (!btn) return;
    seoPage = Number(btn.getAttribute("data-seo-page"));
    renderSeo();
  });

  document.querySelectorAll("[data-seo-sort]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-seo-sort");
      if (seoSort.key === key) seoSort.dir *= -1;
      else seoSort = { key, dir: 1 };
      renderSeo();
    });
  });

  let seoSearchTimer;
  seoSearch?.addEventListener("input", () => {
    clearTimeout(seoSearchTimer);
    seoSearchTimer = setTimeout(() => {
      seoPage = 1;
      renderSeo();
    }, 180);
  });

  /* ---------- NOTES CRUD (Firestore) ---------- */
  const notesModal = document.querySelector("[data-notes-modal]");
  const notesForm = document.querySelector("[data-notes-form]");
  const notesSearch = document.querySelector("[data-notes-search]");
  const notesDelete = document.querySelector("[data-notes-delete]");
  let notesPage = 1;

  async function refreshNotesCache() {
    try {
      notesCache = await listNotes();
    } catch (err) {
      console.warn("Notlar okunamadı", err);
      notesCache = [];
    }
  }

  function getNotes() {
    return notesCache;
  }

  function renderNotes() {
    const q = String(notesSearch?.value || "")
      .toLowerCase()
      .trim();
    let list = getNotes();
    if (q) list = list.filter((n) => n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q));
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (notesPage > pages) notesPage = pages;
    const slice = list.slice((notesPage - 1) * PAGE_SIZE, notesPage * PAGE_SIZE);
    const grid = document.querySelector("[data-notes-grid]");
    if (!grid) return;
    grid.innerHTML = slice.length
      ? slice
          .map(
            (n) => `<article class="admin-note-card">
              <header><h3>${n.title}</h3><time>${new Date(n.updated).toLocaleString("tr-TR")}</time></header>
              <p>${n.body}</p>
              <div class="admin-row-actions">
                <button type="button" class="admin-btn admin-btn-sm" data-notes-edit="${n.id}">Düzenle</button>
                <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-notes-del="${n.id}">Sil</button>
              </div>
            </article>`,
          )
          .join("")
      : `<p class="admin-empty">Not yok</p>`;
    const pager = document.querySelector("[data-notes-pager]");
    if (pager) {
      pager.innerHTML = Array.from({ length: pages }, (_, i) => {
        const n = i + 1;
        return `<button type="button" class="admin-page-btn ${n === notesPage ? "is-active" : ""}" data-notes-page="${n}">${n}</button>`;
      }).join("");
    }
  }

  document.querySelector("[data-notes-new]")?.addEventListener("click", () => {
    notesForm.reset();
    notesForm.id.value = "";
    if (notesDelete) notesDelete.hidden = true;
    openModal(notesModal);
  });

  document.querySelectorAll("[data-notes-modal-close]").forEach((b) => {
    b.addEventListener("click", () => closeModal(notesModal));
  });

  notesForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(notesForm);
    const id = String(fd.get("id") || "") || crypto.randomUUID();
    const prev = getNotes().find((n) => n.id === id);
    const item = {
      id,
      title: String(fd.get("title") || "").trim(),
      body: String(fd.get("body") || "").trim(),
      updated: Date.now(),
      created: prev?.created || Date.now(),
    };
    try {
      await saveNote(item);
      await refreshNotesCache();
      closeModal(notesModal);
      renderNotes();
    } catch (err) {
      alert(err?.message || "Not yazılamadı");
    }
  });

  notesDelete?.addEventListener("click", async () => {
    const id = notesForm.id.value;
    if (!id || !confirm("Silinsin mi?")) return;
    try {
      await deleteNote(id);
      await refreshNotesCache();
      closeModal(notesModal);
      renderNotes();
    } catch (err) {
      alert(err?.message || "Silinemedi");
    }
  });

  document.querySelector("[data-notes-grid]")?.addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-notes-edit]");
    const del = e.target.closest("[data-notes-del]");
    if (edit) {
      const item = getNotes().find((n) => n.id === edit.getAttribute("data-notes-edit"));
      if (!item) return;
      notesForm.id.value = item.id;
      notesForm.title.value = item.title;
      notesForm.body.value = item.body;
      if (notesDelete) notesDelete.hidden = false;
      openModal(notesModal);
    }
    if (del) {
      const id = del.getAttribute("data-notes-del");
      if (!confirm("Silinsin mi?")) return;
      try {
        await deleteNote(id);
        await refreshNotesCache();
        renderNotes();
      } catch (err) {
        alert(err?.message || "Silinemedi");
      }
    }
  });

  document.querySelector("[data-notes-pager]")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-notes-page]");
    if (!btn) return;
    notesPage = Number(btn.getAttribute("data-notes-page"));
    renderNotes();
  });
  notesSearch?.addEventListener("input", () => {
    notesPage = 1;
    renderNotes();
  });

  await migrateLocalCmsIfNeeded();
  await refreshSeoCache();
  await refreshNotesCache();
  renderSeo();
  renderNotes();
}

