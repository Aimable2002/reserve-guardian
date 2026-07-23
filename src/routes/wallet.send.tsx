import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatUSD } from "@/lib/reserve-data";

export const Route = createFileRoute("/wallet/send")({
  head: () => ({
    meta: [
      { title: "Send · Wallet" },
      { name: "description", content: "Send funds from your spendable wallet." },
      { property: "og:title", content: "Send · Wallet" },
      { property: "og:description", content: "Send funds from your spendable wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SendPage,
});

function SendPage() {
  const store = useStore();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const value = Number(amount);
  const valid = recipient.trim() && Number.isFinite(value) && value > 0 && value <= store.wallet;

  const submit = () => {
    const ok = store.walletSend(recipient.trim(), value, note.trim() || undefined);
    if (!ok) return toast.error("Send failed — check available balance.");
    toast.success(`Sent ${formatUSD(value)} to ${recipient.trim()}`);
    navigate({ to: "/wallet" });
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
            Send
          </span>
        </header>

        <section className="rounded-2xl bg-reserve-navy p-5 text-white">
          <p className="text-[11px] uppercase tracking-wider text-white/60">Available</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{formatUSD(store.wallet)}</p>
        </section>

        {step === "form" ? (
          <section className="mt-6 space-y-4 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Recipient</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Name, handle, or contact"
                className="mt-2"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Amount (USD)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="mt-2 font-mono text-lg"
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Note (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's it for?"
                className="mt-2"
              />
            </div>
            <Button
              disabled={!valid}
              onClick={() => setStep("confirm")}
              className="w-full bg-reserve-navy text-white hover:bg-reserve-navy/90"
            >
              Review
            </Button>
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-reserve-slate">Confirm Send</p>
            <p className="mt-3 font-mono text-3xl font-semibold">{formatUSD(value)}</p>
            <p className="mt-1 text-sm text-reserve-slate">to {recipient.trim()}</p>
            {note && <p className="mt-1 text-xs text-reserve-slate">"{note.trim()}"</p>}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setStep("form")}>Back</Button>
              <Button onClick={submit} className="bg-reserve-navy text-white hover:bg-reserve-navy/90">
                Confirm
              </Button>
            </div>
          </section>
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}