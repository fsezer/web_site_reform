import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        introducing: resolve(__dirname, "introducing.html"),
        contact: resolve(__dirname, "contact.html"),
        portal: resolve(__dirname, "portal.html"),
      },
    },
  },
});
