import "./main.js";

const form = document.querySelector("[data-whatsapp-form]");
if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.querySelector("#portal-name")?.value?.trim() ?? "";
    const message = form.querySelector("#portal-message")?.value?.trim() ?? "";
    if (!name || !message) return;

    const text = `Merhaba, ben ${name}.\n\n${message}`;
    const url = `https://api.whatsapp.com/send?phone=905300130326&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}
