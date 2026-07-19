import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: "localhost",
    port: 5703,
    strictPort: true,
  },
  preview: {
    host: "localhost",
    port: 5703,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        introducing: resolve(__dirname, "introducing.html"),
        contact: resolve(__dirname, "contact.html"),
        projects: resolve(__dirname, "projects.html"),
        team: resolve(__dirname, "team.html"),
        portal: resolve(__dirname, "portal.html"),
        login: resolve(__dirname, "login.html"),
        admin: resolve(__dirname, "admin.html"),
        contentExample: resolve(__dirname, "content/20-yuzyil-en-iyi-diller.html"),
        contentLive: resolve(__dirname, "content.html"),
      },
    },
  },
});
