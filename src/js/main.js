const navToggle = document.querySelector("[data-nav-toggle]");
const navPanel = document.querySelector("[data-nav-panel]");

if (navToggle && navPanel) {
  navToggle.addEventListener("click", () => {
    const open = navPanel.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("overflow-hidden", open);
  });

  navPanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navPanel.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("overflow-hidden");
    });
  });
}

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
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );

  reveals.forEach((el) => observer.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}
