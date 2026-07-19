import { initI18n } from "./i18n.js";
import { initAnalytics } from "./analytics.js";

initI18n();
initAnalytics();

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

/* Intro — centered brand title + blue wave rule (first entry per session, any page) */
if (intro) {
  const force = new URLSearchParams(location.search).has("intro");
  const seen = sessionStorage.getItem("sanas-intro");
  if (seen && !force) {
    intro.remove();
  } else {
    const titleWrap = intro.querySelector("[data-intro-title]");
    const typedEl = intro.querySelector("[data-intro-typed]");
    const caretEl = intro.querySelector("[data-intro-caret]");
    const eyebrowEl = intro.querySelector("[data-intro-eyebrow]");
    const fullTitle = "Sanas Technology";
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    setLocked(true);

    (async () => {
      titleWrap?.classList.add("is-revealing");
      eyebrowEl?.classList.add("is-on");
      await wait(500);

      const charMs = 125;
      for (let i = 1; i <= fullTitle.length; i += 1) {
        typedEl.textContent = fullTitle.slice(0, i);
        await wait(charMs);
      }
      caretEl?.classList.add("is-done");
      titleWrap?.classList.add("is-settled");
      titleWrap?.classList.remove("is-revealing");

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

/* Language change greeting — transparent circular popup in screen center */
const GREETINGS = {
  tr: { text: "Merhaba", flag: "🇹🇷" },
  en: { text: "Hello", flag: "🇬🇧" },
  de: { text: "Hallo", flag: "🇩🇪" },
  sr: { text: "Zdravo", flag: "🇷🇸" },
};

document.addEventListener("sanas:locale", (event) => {
  const greet = GREETINGS[event.detail?.locale];
  if (!greet) return;

  document.querySelector(".lang-greet")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "lang-greet";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="lang-greet-circle">
      <span class="lang-greet-flag">${greet.flag}</span>
      <span class="lang-greet-text">${greet.text}</span>
    </div>`;
  document.body.appendChild(overlay);
  window.setTimeout(() => overlay.remove(), 2450);
});

/* Home: hero auto-rotating quote slides + logo icon hue */
const heroSlidesWrap = document.querySelector("[data-hero-slides]");
if (heroSlidesWrap) {
  const slides = Array.from(heroSlidesWrap.querySelectorAll(".hero-slide"));
  const heroLogo = document.querySelector("[data-hero-logo]");
  let slideIdx = 0;
  const nextSlide = () => {
    slides[slideIdx].classList.remove("is-active");
    slideIdx = (slideIdx + 1) % slides.length;
    slides[slideIdx].classList.add("is-active");
    heroLogo?.style.setProperty("--hue", `${slides[slideIdx].dataset.hue || 0}deg`);
    window.setTimeout(nextSlide, slideIdx === 0 ? 5000 : 4000);
  };
  window.setTimeout(nextSlide, 5000);
}

/* Home: live code typer (loops, scrolls down) */
const codeTyper = document.querySelector("[data-code-typer]");
if (codeTyper) {
  const LINES = [
    'const sanas = new Forge({ est: 2004 });',
    'sanas.stack(["python", "java", "c++", "js"]);',
    "const build = await sanas.compile(idea);",
    'build.test({ coverage: "full" });',
    'build.review().sign("sanas-core");',
    "deploy(build).to(cloud.grid());",
    "monitor(build).alert(on.call);",
    'scale(build, { users: "millions" });',
    "// 20 years. still shipping.",
  ];
  const MAX_LINES = 12;
  const caret = document.createElement("span");
  caret.className = "code-typer-caret";

  let lineIdx = 0;
  let charIdx = 0;
  let lineEl = null;
  let typerRunning = false;
  let typerTimer = null;

  const newLine = () => {
    lineEl = document.createElement("span");
    lineEl.className = "code-typer-line";
    codeTyper.appendChild(lineEl);
    lineEl.appendChild(caret);
    while (codeTyper.children.length > MAX_LINES) {
      codeTyper.removeChild(codeTyper.firstChild);
    }
  };

  const tick = () => {
    if (!typerRunning) return;
    if (!lineEl) newLine();
    const text = LINES[lineIdx % LINES.length];
    charIdx += 1;
    lineEl.textContent = text.slice(0, charIdx);
    lineEl.appendChild(caret);
    if (charIdx >= text.length) {
      charIdx = 0;
      lineIdx += 1;
      lineEl = null;
      typerTimer = window.setTimeout(tick, 620);
    } else {
      typerTimer = window.setTimeout(tick, 34 + Math.random() * 40);
    }
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !typerRunning) {
            typerRunning = true;
            tick();
          } else if (!entry.isIntersecting && typerRunning) {
            typerRunning = false;
            window.clearTimeout(typerTimer);
          }
        });
      },
      { threshold: 0 },
    );
    io.observe(codeTyper);
  } else {
    typerRunning = true;
    tick();
  }
}

/* Home: weave animation — glyphs fly from keyboard up into the screen */
const weave = document.querySelector("[data-weave]");
if (weave && "IntersectionObserver" in window) {
  const GLYPHS = "01{}();=</>#&$fnif".split("");
  const COLORS = ["#7dd3fc", "#38bdf8", "#fb923c", "#fbbf24", "#a5b4fc", "#86efac"];
  let running = false;
  let timer = null;

  const spawn = () => {
    if (!running) return;
    const rect = weave.getBoundingClientRect();
    if (rect.width > 0) {
      const el = document.createElement("span");
      el.className = "weave-glyph";
      el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const startX = rect.width * (0.3 + Math.random() * 0.4);
      const startY = rect.height * (0.72 + Math.random() * 0.1);
      const endY = rect.height * (0.16 + Math.random() * 0.14);
      const driftX = (Math.random() - 0.5) * rect.width * 0.28;
      const size = 9 + Math.random() * 8;
      el.style.left = `${startX}px`;
      el.style.top = "0px";
      el.style.fontSize = `${size}px`;
      el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      el.style.textShadow = `0 0 8px ${el.style.color}`;
      weave.appendChild(el);

      const dur = 2200 + Math.random() * 1800;
      const anim = el.animate(
        [
          { transform: `translate(0px, ${startY}px) scale(1)`, opacity: 0 },
          { transform: `translate(${driftX * 0.3}px, ${startY - (startY - endY) * 0.25}px) scale(1.05)`, opacity: 1, offset: 0.22 },
          { transform: `translate(${driftX}px, ${endY + (startY - endY) * 0.25}px) scale(0.9)`, opacity: 0.9, offset: 0.75 },
          { transform: `translate(${driftX * 1.15}px, ${endY}px) scale(0.55)`, opacity: 0 },
        ],
        { duration: dur, easing: "cubic-bezier(0.3, 0, 0.4, 1)" },
      );
      anim.onfinish = () => el.remove();
    }
    timer = window.setTimeout(spawn, 140 + Math.random() * 200);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !running) {
          running = true;
          spawn();
        } else if (!entry.isIntersecting && running) {
          running = false;
          window.clearTimeout(timer);
        }
      });
    },
    { threshold: 0.2 },
  );
  io.observe(weave);
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
