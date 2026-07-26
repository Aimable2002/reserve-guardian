// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  plugins: [
    VitePWA({
      // This is a Nitro-based SSR build (TanStack Start), so client assets
      // land in .output/public rather than the plain "dist" the plugin
      // assumes by default — without this, its precache glob finds nothing.
      outDir: ".output/public",
      // 'prompt' (not 'autoUpdate'): a new build shouldn't silently swap the
      // service worker under a user mid-session — the app surfaces an
      // in-app "new version available" banner instead (see use-sw-update.ts)
      // and only activates it once they tap Reload.
      registerType: "prompt",
      // This is an SSR app (TanStack Start), not a static index.html SPA —
      // there's nothing for the plugin's normal <script> auto-injection to
      // inject into. Registration happens explicitly via the
      // virtual:pwa-register/react hook mounted in __root.tsx instead.
      injectRegister: false,
      // Reuse the existing hand-written manifest rather than generating a
      // second one — this is also where the icon-size mismatch that broke
      // installability lived (declared 512x512, actual files were 816x816;
      // the files are now the correct size).
      manifest: false,
      workbox: {
        // Precache the app shell so the install criteria (manifest +
        // registered service worker) are met; this app doesn't need
        // offline transaction support, just installability.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
      includeManifestIcons: false,
    }),
  ],
});