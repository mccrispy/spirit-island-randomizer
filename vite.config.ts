import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const base = "/spirit-island-randomizer/";

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"),
) as { version: string };

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        id: base,
        name: "Spirit Island Randomizer",
        short_name: "Spirit Randomizer",
        description: "Build and save randomized Spirit Island game setups.",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#f2efe7",
        theme_color: "#18332f",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{css,html,ico,js,json,png,svg,webmanifest,woff2}"],
        globIgnores: ["manifest.webmanifest"],
        navigateFallback: "index.html",
        navigateFallbackAllowlist: [/^\/spirit-island-randomizer\/$/],
      },
    }),
  ],
  base,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});
