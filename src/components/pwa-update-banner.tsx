import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

/**
 * Registers the service worker and shows a persistent "new version
 * available" banner when one is waiting — this is the whole reason
 * registerType is 'prompt' rather than 'autoUpdate' in vite.config.ts: an
 * update landing mid-session is exactly the kind of thing a user could
 * otherwise miss, so it doesn't auto-dismiss and doesn't apply itself.
 *
 * offlineReady is intentionally unused — this app doesn't need an "app
 * ready to work offline" message, only installability.
 */
export function PwaUpdateBanner() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisterError(error) {
      console.error("Service worker registration failed", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className="fixed inset-x-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-reserve-navy/10 bg-reserve-navy px-4 py-3 text-white shadow-xl"
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
    >
      <p className="flex-1 text-xs font-medium">A new version is available.</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-reserve-navy active:scale-95"
      >
        <RefreshCw className="size-3" /> Reload
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss"
        className="text-white/60 active:opacity-70"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}