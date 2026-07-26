import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { api, BackendError } from "@/lib/backend";

export const Route = createFileRoute("/wallet/receive")({
  head: () => ({
    meta: [
      { title: "Receive · Wallet" },
      { name: "description", content: "Share your code — anyone can pay you, no account required." },
      { property: "og:title", content: "Receive · Wallet" },
      { property: "og:description", content: "Share your code — anyone can pay you, no account required." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReceivePage,
});

function ReceivePage() {
  const [receiveCode, setReceiveCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const payLink = receiveCode ? `${window.location.origin}/pay/${receiveCode}` : "";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.getReceiveCode();
        if (cancelled) return;
        setReceiveCode(res.receive_code);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof BackendError ? err.message : "Couldn't load your receive code.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!payLink) return;
    let cancelled = false;
    QRCode.toDataURL(payLink, { width: 480, margin: 1, color: { dark: "#0b1b34", light: "#ffffff" } })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't render the QR code.");
      });
    return () => {
      cancelled = true;
    };
  }, [payLink]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payLink);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy.");
    }
  };

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="flex items-center justify-between py-6">
          <Link to="/wallet" className="inline-flex items-center gap-1 text-xs font-semibold text-reserve-slate active:opacity-70">
            <ArrowLeft className="size-4" /> Wallet
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            Receive
          </span>
        </header>

        <section className="rounded-3xl border border-reserve-navy/5 bg-white p-6 text-center shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-reserve-slate">Your payment link</p>

          {loading ? (
            <div className="mx-auto mt-6 flex h-56 w-56 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-reserve-slate" />
            </div>
          ) : error ? (
            <p className="mt-6 rounded-xl bg-destructive/5 p-4 text-xs text-destructive">{error}</p>
          ) : (
            <>
              <div className="mx-auto mt-5 w-56 overflow-hidden rounded-xl border border-reserve-navy/5">
                {qrDataUrl && <img src={qrDataUrl} alt="Scan to pay" className="w-full" />}
              </div>
              <p className="mt-4 break-all font-mono text-[11px] text-reserve-slate">{payLink}</p>
            </>
          )}

          <button
            onClick={copy}
            disabled={!payLink}
            className="mt-5 inline-flex items-center gap-1 rounded-full bg-reserve-navy/5 px-3 py-1.5 text-[11px] font-semibold text-reserve-navy active:scale-95 disabled:opacity-40"
          >
            <Copy className="size-3" /> Copy link
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
          <p className="text-[11px] leading-relaxed text-reserve-slate">
            Anyone who scans this code or opens this link can pay you directly — <span className="font-semibold text-reserve-navy">they don't need
            a Fortress account.</span> They choose the amount themselves when they pay. This code doesn't expire, so it's safe to
            reuse, print, or save.
          </p>
        </section>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
