import en from "../i18n/locales/en.json";
import tr from "../i18n/locales/tr.json";
import de from "../i18n/locales/de.json";
import sr from "../i18n/locales/sr.json";

export const LOCALES = {
  en: {
    code: "en",
    region: "EN",
    flag: "🇬🇧",
    label: "English",
    messages: en,
  },
  tr: {
    code: "tr",
    region: "TR",
    flag: "🇹🇷",
    label: "Türkçe",
    messages: tr,
  },
  de: {
    code: "de",
    region: "DE",
    flag: "🇩🇪",
    label: "Deutsch",
    messages: de,
  },
  sr: {
    code: "sr",
    region: "RS",
    flag: "🇷🇸",
    label: "Srpski",
    messages: sr,
  },
};

export const LOCALE_CODES = Object.keys(LOCALES);
export const DEFAULT_LOCALE = "tr";
export const STORAGE_KEY = "sanas-lang";

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES[saved]) return saved;
  } catch {
    /* ignore */
  }

  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("tr")) return "tr";
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("sr") || nav.startsWith("bs") || nav.startsWith("hr")) return "sr";
  if (nav.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

export function t(locale, key) {
  const pack = LOCALES[locale] || LOCALES[DEFAULT_LOCALE];
  const value = getByPath(pack.messages, key);
  if (value != null) return value;
  return getByPath(LOCALES[DEFAULT_LOCALE].messages, key) ?? key;
}

function syncLangSelect(lang) {
  const pack = LOCALES[lang] || LOCALES[DEFAULT_LOCALE];
  const root = document.querySelector("[data-lang-switch]");
  if (!root) return;

  const flag = root.querySelector("[data-lang-current-flag]");
  const code = root.querySelector("[data-lang-current-code]");
  if (flag) flag.textContent = pack.flag;
  if (code) code.textContent = pack.region;

  const trigger = root.querySelector("[data-lang-trigger]");
  if (trigger) {
    trigger.setAttribute("aria-label", `${t(lang, "nav.lang")}: ${pack.label}`);
  }

  document.querySelectorAll("[data-set-lang]").forEach((btn) => {
    const active = btn.getAttribute("data-set-lang") === lang;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  root.setAttribute("aria-label", t(lang, "nav.lang"));
}

function closeLangSelect() {
  const root = document.querySelector("[data-lang-switch]");
  if (!root) return;
  root.classList.remove("is-open");
  const trigger = root.querySelector("[data-lang-trigger]");
  const menu = root.querySelector("[data-lang-menu]");
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  if (menu) menu.hidden = true;
}

function openLangSelect() {
  const root = document.querySelector("[data-lang-switch]");
  if (!root) return;
  root.classList.add("is-open");
  const trigger = root.querySelector("[data-lang-trigger]");
  const menu = root.querySelector("[data-lang-menu]");
  if (trigger) trigger.setAttribute("aria-expanded", "true");
  if (menu) menu.hidden = false;
}

function toggleLangSelect() {
  const root = document.querySelector("[data-lang-switch]");
  if (!root) return;
  if (root.classList.contains("is-open")) closeLangSelect();
  else openLangSelect();
}

export function applyTranslations(locale) {
  const lang = LOCALES[locale] ? locale : DEFAULT_LOCALE;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const value = t(lang, key);
    if (el.hasAttribute("data-i18n-html")) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (!key) return;
    el.setAttribute("aria-label", t(lang, key));
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (!key) return;
    el.setAttribute("alt", t(lang, key));
  });

  document.querySelectorAll("[data-i18n-href]").forEach((el) => {
    const key = el.getAttribute("data-i18n-href");
    if (!key) return;
    const value = t(lang, key);
    if (value && value !== key) el.setAttribute("href", value.startsWith("mailto:") ? value : `mailto:${value}`);
  });

  document.querySelectorAll("[data-i18n-email]").forEach((el) => {
    const key = el.getAttribute("data-i18n-email");
    if (!key) return;
    const value = t(lang, key);
    if (value && value !== key) el.textContent = value;
  });

  const page = document.body?.dataset?.page;
  if (page) {
    const title = t(lang, `meta.${page}Title`);
    if (title && title !== `meta.${page}Title`) document.title = title;
    const desc = t(lang, `meta.${page}Description`);
    const meta = document.querySelector('meta[name="description"]');
    if (meta && desc && desc !== `meta.${page}Description`) meta.setAttribute("content", desc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title && title !== `meta.${page}Title`) ogTitle.setAttribute("content", title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      const slogan = t(lang, "home.slogan");
      if (slogan) ogDesc.setAttribute("content", slogan);
    }
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle && title && title !== `meta.${page}Title`) twTitle.setAttribute("content", title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) {
      const slogan = t(lang, "home.slogan");
      if (slogan) twDesc.setAttribute("content", slogan);
    }
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      const localeMap = { tr: "tr_TR", en: "en_US", de: "de_DE", sr: "sr_RS" };
      ogLocale.setAttribute("content", localeMap[lang] || "tr_TR");
    }
  }

  syncLangSelect(lang);
}

export function setLocale(locale) {
  const lang = LOCALES[locale] ? locale : DEFAULT_LOCALE;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  applyTranslations(lang);
  closeLangSelect();
  document.dispatchEvent(new CustomEvent("sanas:locale", { detail: { locale: lang } }));
  return lang;
}

export function initI18n() {
  const locale = detectLocale();
  applyTranslations(locale);

  const root = document.querySelector("[data-lang-switch]");
  const trigger = root?.querySelector("[data-lang-trigger]");

  trigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleLangSelect();
  });

  document.querySelectorAll("[data-set-lang]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const next = btn.getAttribute("data-set-lang");
      if (next) setLocale(next);
    });
  });

  document.addEventListener("click", (event) => {
    if (!root) return;
    if (!root.contains(event.target)) closeLangSelect();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLangSelect();
  });

  return locale;
}
