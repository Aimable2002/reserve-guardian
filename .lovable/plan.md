## Fortress Reserve — Mobile-First PWA Prototype

Build a mobile-first personal "reserve bank" dashboard as an installable PWA using the selected Swiss Institutional direction. All data is mock and lives in local React state — no backend, no persistence between reloads.

### Mobile-first commitments

- Layout is designed at 390px width first; `md:` breakpoints only widen the phone frame and center it on tablet/desktop.
- Touch targets ≥ 44px, thumb-reachable bottom nav (already fixed to bottom), safe-area insets (`env(safe-area-inset-bottom)`) so the nav clears the iOS home indicator.
- No hover-only affordances; use `active:` states for tap feedback.
- Preview will be switched to the mobile viewport.

### Screens (single scrollable page)

1. **Header** — "Fortress Reserve / Personal Ledger" + avatar circle.
2. **Balance hero card** — deep navy card, total reserved balance ($42,850.00), runway in months, subtle emerald glow.
3. **Quick actions** — Deposit and Withdraw buttons opening a modal.
4. **Reserves list** — 3 mock reserves, each with title, target ("Sustain X days" or "Reach $Y"), percentage, animated progress bar, current/target amounts:
   - Emergency Survival — 12-month coverage
   - Winter Sabbatical — $10,000
   - Health Buffer — 180 days (100%)
5. **Survival cost configuration** — editable monthly cost; updates runway live.
6. **Fixed bottom nav** — Vault (active) / Analytics / History (visual only).

### Interactions (mock, local state only)

- **Deposit / Withdraw**: shadcn Dialog with amount input + reserve selector. Updates total balance and the target reserve's current amount. Withdraw clamps to available. Toast confirms.
- **Monthly survival cost**: controlled input; runway = `balance / monthlyCost` → months + days. Time-based reserves recompute.
- **Progress bars**: animate width on mount.

### PWA (manifest-only, installable to home screen)

Home-screen install only — no offline caching, no service worker (per PWA skill: manifest-only path is correct for "add to home screen").

- `public/manifest.webmanifest` — name "Fortress Reserve", short_name "Reserve", `display: "standalone"`, `background_color: #f8fafc`, `theme_color: #0f172a`, `start_url: "/"`, `scope: "/"`, icons at 192 and 512 (maskable + any).
- Generate a square navy brand mark with an emerald accent; save as `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, and `public/favicon.png`. Delete the default `public/favicon.ico`.
- Wire into `src/routes/__root.tsx` head() `links`/`meta`:
  - `<link rel="manifest" href="/manifest.webmanifest">`
  - `<link rel="icon" type="image/png" href="/favicon.png">`
  - `<link rel="apple-touch-icon" href="/icon-192.png">`
  - `<meta name="theme-color" content="#0f172a">`
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - `<meta name="apple-mobile-web-app-title" content="Reserve">`
  - Viewport meta already exists — extend with `viewport-fit=cover` for safe areas.
- No `vite-plugin-pwa`, no `sw.js`, no registration code — installability comes from the manifest + icons alone.

**Install behavior**: on Android/Chrome an install prompt appears; on iOS Safari users use Share → Add to Home Screen. Standalone launch works because of `display: standalone`. Offline is out of scope and I will say so explicitly.

### Design system

Port prototype tokens verbatim into `src/styles.css`:
- Fonts: Instrument Sans, JetBrains Mono via `<link>` in `__root.tsx`.
- Colors as oklch mapped through `@theme inline`: `--reserve-navy` (#0f172a), `--reserve-emerald` (#059669), `--reserve-slate` (#64748b), `--reserve-bg` (#f8fafc).
- Match rounded-2xl/3xl radii, spacing, and typographic hierarchy from the chosen direction.
- Light mode only (matches selected direction).

### Files

- `src/routes/index.tsx` — replace placeholder; render dashboard, own mock state, wire dialogs; set route `head()` with app-specific title/description/og.
- `src/routes/__root.tsx` — add font `<link>` tags, manifest link, apple/theme meta.
- `src/styles.css` — add font-family and reserve color tokens.
- `src/lib/reserve-data.ts` — initial mock reserves + types.
- `public/manifest.webmanifest` — PWA manifest.
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/favicon.png` — generated brand icons.
- Delete `public/favicon.ico`.
- Reuse shadcn `Dialog`, `Input`, `Button`, `Label`, `Sonner`; install any missing.

### Out of scope

- No offline mode, no service worker, no push notifications.
- No auth, database, or Cloud.
- No real transactions — reload resets to mock defaults.
- No dark mode toggle in this pass.