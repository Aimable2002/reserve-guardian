import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/wallet/receive")({
  head: () => ({
    meta: [
      { title: "Receive · Wallet" },
      { name: "description", content: "Share a code or request an amount to receive funds." },
      { property: "og:title", content: "Receive · Wallet" },
      { property: "og:description", content: "Share a code or request an amount to receive funds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReceivePage,
});

// Small deterministic pseudo-QR grid (18x18) so it looks like a code without a lib.
function useQrGrid(seed: string) {
  return useMemo(() => {
    const size = 18;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const cells: boolean[] = [];
    for (let i = 0; i < size * size; i++) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      cells.push((h & 1) === 1);
    }
    return { size, cells };
  }, [seed]);
}

function ReceivePage() {
  const [request, setRequest] = useState("");
  const handle = "@fortress/you";
  const payload = request ? `${handle}?amount=${request}` : handle;
  const { size, cells } = useQrGrid(payload);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Copied to clipboard");
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
          <p className="text-[11px] uppercase tracking-wider text-reserve-slate">Your handle</p>
          <p className="mt-1 font-mono text-lg font-semibold">{handle}</p>
          <div className="mx-auto mt-5 grid aspect-square w-56 gap-[2px] rounded-xl bg-reserve-navy/5 p-3"
               style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
            {cells.map((on, i) => (
              <span
                key={i}
                className={on ? "bg-reserve-navy" : "bg-transparent"}
                style={{ borderRadius: 1 }}
              />
            ))}
          </div>
          <button
            onClick={copy}
            className="mt-5 inline-flex items-center gap-1 rounded-full bg-reserve-navy/5 px-3 py-1.5 text-[11px] font-semibold text-reserve-navy active:scale-95"
          >
            <Copy className="size-3" /> Copy code
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
          <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
            Request specific amount (optional)
          </Label>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="0"
            className="mt-2 font-mono text-lg"
          />
          <p className="mt-3 text-[10px] leading-relaxed text-reserve-slate">
            Adding an amount encodes it into your shareable code above — it doesn't move any
            money. Funds actually arrive in your wallet once a mobile money deposit clears.
          </p>
        </section>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}