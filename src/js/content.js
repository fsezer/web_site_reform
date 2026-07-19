import { getSeoBySlug } from "./cms.js";

const SITE = "https://www.sanastechnology.com";
const SLOGAN = "Kodun büyüsüyle, sonsuz çözümlere.";

function slugFromPath() {
  const parts = location.pathname.split("/").filter(Boolean);
  const params = new URLSearchParams(location.search);
  if (params.get("slug")) return params.get("slug").replace(/\.html$/i, "");
  if (parts[0] === "content" && parts[1]) return parts[1].replace(/\.html$/i, "");
  if (parts[0] === "content.html") return "";
  return "";
}

function setMeta(name, content, attr = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = url;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkify(escaped) {
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );
}

function bodyToHtml(body) {
  const lines = String(body || "").replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let buf = [];

  const flushP = () => {
    const text = buf.join("\n").trim();
    buf = [];
    if (!text) return;
    out.push(`<p>${linkify(escapeHtml(text)).replace(/\n/g, "<br />")}</p>`);
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushP();
      out.push(`<h2>${escapeHtml(h2[1].trim())}</h2>`);
      continue;
    }
    if (!line.trim()) {
      flushP();
      continue;
    }
    buf.push(line.trim());
  }
  flushP();
  return out.join("");
}

/** "Soru? Cevap" satırlarından FAQ çıkar. */
function extractFaqs(body) {
  const faqs = [];
  const lines = String(body || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    if (line.startsWith("##")) continue;
    const m = line.match(/^(.+\?)\s+(.+)$/);
    if (m) faqs.push({ q: m[1].trim(), a: m[2].trim() });
  }
  return faqs.slice(0, 8);
}

function injectJsonLd(id, data) {
  let el = document.querySelector(`script[data-sanas-schema="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.dataset.sanasSchema = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function relatedHtml(related) {
  const lines = String(related || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const items = lines.length
    ? lines.map((line) => {
        const [label, url] = line.split("|").map((x) => x.trim());
        const href = url || "";
        const isExt = /^https?:\/\//i.test(href);
        if (href)
          return `<li><a href="${escapeHtml(href)}"${isExt ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(label || url)}</a></li>`;
        return `<li>${escapeHtml(line)}</li>`;
      })
    : [
        '<li><a href="/introducing.html">Çözümlerimiz</a></li>',
        '<li><a href="/projects.html">Projeler</a></li>',
        '<li><a href="https://istiklalyazilim.com" target="_blank" rel="noopener noreferrer">İstiklal Yazılım</a></li>',
        '<li><a href="/contact.html">İletişim</a></li>',
      ];
  return items.join("");
}

function showMissing() {
  document.title = "İçerik bulunamadı — Sanas Technology";
  const title = document.querySelector("[data-content-title]");
  const sub = document.querySelector("[data-content-subtitle]");
  const body = document.querySelector("[data-content-body]");
  if (title) title.textContent = "İçerik bulunamadı";
  if (sub) sub.textContent = "Bu sayfa yayınlanmamış veya kaldırılmış olabilir.";
  if (body) body.innerHTML = `<p><a href="/index.html">Ana sayfaya dön</a></p>`;
  setMeta("robots", "noindex, follow");
}

async function main() {
  if (!document.body?.hasAttribute("data-content-live")) return;
  const slug = slugFromPath();
  if (!slug) {
    showMissing();
    return;
  }

  let page = null;
  try {
    page = await getSeoBySlug(slug);
  } catch {
    showMissing();
    return;
  }
  if (!page) {
    showMissing();
    return;
  }

  const url = `${SITE}/content/${page.slug}`;
  const title = page.metaTitle || `${page.title} — Sanas Technology`;
  document.title = title;
  setMeta("description", page.metaDesc || SLOGAN);
  setMeta("keywords", page.keywords || "");
  setMeta("robots", "index, follow");
  setCanonical(url);
  setMeta("og:type", "article", "property");
  setMeta("og:title", title, "property");
  setMeta("og:description", page.metaDesc || SLOGAN, "property");
  setMeta("og:url", url, "property");
  setMeta("twitter:card", "summary_large_image");

  const h1 = document.querySelector("[data-content-title]");
  const sub = document.querySelector("[data-content-subtitle]");
  const body = document.querySelector("[data-content-body]");
  const related = document.querySelector("[data-content-related]");
  if (h1) h1.textContent = page.title || "";
  if (sub) sub.textContent = page.subtitle || "";
  if (body) body.innerHTML = bodyToHtml(page.body);
  if (related) related.innerHTML = relatedHtml(page.related);

  injectJsonLd("article", {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.metaDesc || SLOGAN,
    dateModified: page.updated ? new Date(page.updated).toISOString() : undefined,
    datePublished: page.publishedAt
      ? new Date(page.publishedAt).toISOString()
      : page.created
        ? new Date(page.created).toISOString()
        : undefined,
    author: { "@type": "Organization", name: "Sanas Technology" },
    publisher: {
      "@type": "Organization",
      name: "Sanas Technology",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/img/brand/logo-mark.png`,
      },
    },
    mainEntityOfPage: url,
    inLanguage: "tr",
  });

  const faqs = extractFaqs(page.body);
  if (faqs.length) {
    injectJsonLd("faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
}

void main();
