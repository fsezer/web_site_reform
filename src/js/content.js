import { getSeoBySlug } from "./cms.js";

const SITE = "https://www.sanastechnology.com";
const SLOGAN = "Kodun büyüsüyle, sonsuz çözümlere.";

function slugFromPath() {
  const parts = location.pathname.split("/").filter(Boolean);
  // /content.html?slug=x or /content/x or /content/x.html
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

function bodyToHtml(body) {
  return String(body || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const withLinks = escapeHtml(p).replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
      );
      return `<p>${withLinks.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function relatedHtml(related) {
  const lines = String(related || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const items = lines.length
    ? lines.map((line) => {
        const [label, url] = line.split("|").map((x) => x.trim());
        if (url) return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)}</a></li>`;
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
}

void main();
