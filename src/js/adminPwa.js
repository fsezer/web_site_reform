/** Admin / login PWA: service worker + install prompt. */

export function initAdminPwa() {
  if (!("serviceWorker" in navigator)) return;

  void navigator.serviceWorker.register("/sw-admin.js", { scope: "/" }).catch(() => {});

  const btn = document.querySelector("[data-pwa-install]");
  const status = document.querySelector("[data-pwa-status]");
  let deferred = null;

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    navigator.standalone === true;

  if (standalone && status) {
    status.hidden = false;
    status.textContent = "Uygulama yüklü (ana ekran)";
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    if (btn) {
      btn.hidden = false;
      btn.disabled = false;
    }
    if (status && !standalone) {
      status.hidden = false;
      status.textContent = "Tarayıcı yüklemeyi destekliyor";
    }
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    if (btn) btn.hidden = true;
    if (status) {
      status.hidden = false;
      status.textContent = "Uygulama yüklendi";
    }
  });

  btn?.addEventListener("click", async () => {
    if (!deferred) {
      if (status) {
        status.hidden = false;
        status.textContent =
          "Chrome/Edge menü → ‘Uygulamayı yükle’ veya iPhone’da Paylaş → Ana Ekrana Ekle";
      }
      return;
    }
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    deferred = null;
    if (btn) btn.hidden = true;
  });
}
