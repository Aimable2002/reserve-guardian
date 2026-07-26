import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [
    VitePWA({
      outDir: ".output/public",
      registerType: "prompt",
      injectRegister: false,
      manifest: false,
      workbox: {
        globDirectory: ".output/public",
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Optional: fallback runtime cache rule so Workbox always has a valid config
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
            },
          },
        ],
      },
    }),
  ],
});