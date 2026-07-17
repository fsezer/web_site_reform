import { initI18n } from "./i18n.js";

initI18n();

const body = document.body;
const navToggle = document.querySelector("[data-nav-toggle]");
const navClose = document.querySelector("[data-nav-close]");
const navPanel = document.querySelector("[data-nav-panel]");
const navBackdrop = document.querySelector("[data-nav-backdrop]");
const header = document.querySelector("[data-site-header]");
const intro = document.querySelector("[data-site-intro]");

function setLocked(locked) {
  body.classList.toggle("is-locked", locked);
}

function closeNav() {
  navPanel?.classList.remove("is-open");
  navBackdrop?.classList.remove("is-open");
  body.classList.remove("is-nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
  if (!intro || intro.classList.contains("is-done") || !document.body.contains(intro)) {
    setLocked(false);
  }
}

function openNav() {
  navPanel?.classList.add("is-open");
  navBackdrop?.classList.add("is-open");
  body.classList.add("is-nav-open");
  navToggle?.setAttribute("aria-expanded", "true");
  setLocked(true);
}

function toggleNav() {
  if (navPanel?.classList.contains("is-open")) closeNav();
  else openNav();
}

if (navToggle) navToggle.addEventListener("click", toggleNav);
if (navClose) navClose.addEventListener("click", closeNav);
if (navBackdrop) navBackdrop.addEventListener("click", closeNav);

navPanel?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => closeNav());
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNav();
});

/* Eagle intro — approach + brand title */
if (intro && body.dataset.page === "home") {
  const force = new URLSearchParams(location.search).has("intro");
  const seen = sessionStorage.getItem("sanas-intro");
  if (seen && !force) {
    intro.remove();
  } else {
    const eagle = intro.querySelector("[data-intro-eagle]");
    const bodyEl = eagle?.querySelector(".site-intro-eagle-body");
    const frames = eagle ? [...eagle.querySelectorAll(".eagle-flap")] : [];
    const titleWrap = intro.querySelector("[data-intro-title]");
    const typedEl = intro.querySelector("[data-intro-typed]");
    const caretEl = intro.querySelector("[data-intro-caret]");
    const eyebrowEl = intro.querySelector("[data-intro-eyebrow]");
    const fullTitle = "Sanas Technology";
    const FLAP_MS = 320;
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const showFrame = (index) => {
      frames.forEach((frame, i) => frame.classList.toggle("is-on", i === index));
      if (bodyEl) {
        const lift = index === 0 ? 2 : index === 1 ? 8 : 22;
        bodyEl.style.transform = `translateY(${lift}px)`;
      }
    };

    const grow = (level) => {
      eagle?.style.setProperty("--eagle-scale", String(0.42 + level * 0.11));
      eagle?.style.setProperty("--eagle-z", `${-520 + level * 90}px`);
    };

    setLocked(true);

    (async () => {
      const typePromise = (async () => {
        if (!typedEl) return;
        titleWrap?.classList.add("is-revealing");
        eyebrowEl?.classList.add("is-on");
        await wait(220);
        const charMs = 125;
        for (let i = 1; i <= fullTitle.length; i += 1) {
          typedEl.textContent = fullTitle.slice(0, i);
          await wait(charMs);
        }
        caretEl?.classList.add("is-done");
        titleWrap?.classList.add("is-settled");
        titleWrap?.classList.remove("is-revealing");
      })();

      grow(0);
      showFrame(2);

      // 3 sets: kapalı → orta, then open
      const flapSeq = [2, 1, 2, 1, 2, 1];
      for (let i = 0; i < flapSeq.length; i += 1) {
        grow(i + 1);
        showFrame(flapSeq[i]);
        await wait(FLAP_MS);
      }

      grow(7);
      showFrame(0);
      eagle?.classList.add("is-wings-open", "is-arrived");
      if (bodyEl) bodyEl.style.transform = "translateY(2px)";

      await typePromise;
      await wait(1400);

      intro.classList.add("is-done");
      sessionStorage.setItem("sanas-intro", "1");
      await wait(850);
      intro.remove();
      setLocked(false);
    })();
  }
}

/* Header on hero */
if (header && body.dataset.page === "home") {
  const hero = document.querySelector("[data-home-hero]");
  if (hero) {
    header.classList.add("is-on-hero");
    const sync = () => {
      header.classList.toggle("is-on-hero", hero.getBoundingClientRect().bottom > 72);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
  }
}

/* Reveal */
const reveals = document.querySelectorAll(".reveal");
if (reveals.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
  );
  reveals.forEach((el) => observer.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}

/* Project cards: count-up, users, forge typewriter */
function animateCount(el, target, duration = 1600) {
  const start = performance.now();
  const from = 0;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    const value = Math.round(from + (target - from) * eased);
    el.textContent = value.toLocaleString("tr-TR");
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function typeForge(codeEl, brandEl, lines, brand) {
  if (!codeEl) return;
  let cancelled = false;
  codeEl.textContent = "";
  if (brandEl) {
    brandEl.style.opacity = "0";
    brandEl.textContent = brand;
  }

  const full = lines.join("\n");
  let i = 0;
  const tick = () => {
    if (cancelled) return;
    i += 1;
    codeEl.textContent = full.slice(0, i);
    if (i < full.length) {
      window.setTimeout(tick, 16);
    } else if (brandEl) {
      brandEl.style.opacity = "1";
    }
  };
  tick();

  return () => {
    cancelled = true;
  };
}

document.querySelectorAll("[data-project-card]").forEach((card) => {
  const countEl = card.querySelector("[data-count-target]");
  const usersEl = card.querySelector("[data-users-target]");
  const media = card.querySelector(".project-media");
  const codeEl = card.querySelector("[data-forge-code]");
  const brandEl = card.querySelector("[data-forge-brand]");
  const target = Number(card.dataset.count || 0);
  const brand = card.dataset.brand || "";
  const forgeLines = (card.dataset.forge || "").split("\\n").filter(Boolean);
  let cancelType;

  if (usersEl) {
    const names = (card.dataset.users || "").split("|").filter(Boolean);
    names.forEach((name) => {
      const chip = document.createElement("span");
      chip.className = "user-chip";
      chip.textContent = name;
      usersEl.appendChild(chip);
    });
  }

  const inview = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        card.classList.add("is-inview");
        if (countEl && target) animateCount(countEl, target);
        if (usersEl) {
          window.setTimeout(() => usersEl.classList.add("is-fading"), 2800);
        }
        inview.unobserve(card);
      });
    },
    { threshold: 0.35 },
  );
  inview.observe(card);

  if (media) {
    media.addEventListener("mouseenter", () => {
      cancelType?.();
      cancelType = typeForge(codeEl, brandEl, forgeLines, brand);
    });
    media.addEventListener("mouseleave", () => {
      cancelType?.();
      if (codeEl) codeEl.textContent = "";
      if (brandEl) brandEl.style.opacity = "0";
    });
  }
});
