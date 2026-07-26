import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, ArrowUpFromLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/reserve-data";

export const Route = createFileRoute("/wallet/move-out")({
  head: () => ({
    meta: [
      { title: "Move to Reserve · Wallet" },
      { name: "description", content: "Move spendable wallet funds into a reserve." },
      { property: "og:title", content: "Move to Reserve · Wallet" },
      { property: "og:description", content: "Move spendable wallet funds into a reserve." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MoveOutPage,
});

function MoveOutPage() {
  const store = useStore();
  const navigate = useNavigate();
  const [reserveId, setReserveId] = useState<string>(store.reserves[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const reserve = store.reserves.find((r) => r.id === reserveId);
  const value = Number(amount);
  const valid = !!reserve && Number.isFinite(value) && value > 0 && value <= store.wallet;

  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reserve) return;
    setBusy(true);
    try {
      await store.walletToReserve(reserve.id, value);
      toast.success(`Moved ${formatMoney(value)} → ${reserve.name}`);
      navigate({ to: "/wallet" });
    } catch (e: any) {
      toast.error(e?.message ?? "Not enough in wallet.");
      setBusy(false);
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            <ArrowUpFromLine className="size-3" /> Move to Reserve
          </span>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-reserve-navy p-4 text-white">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Wallet</p>
            <p className="mt-1 font-mono text-lg font-semibold">{formatMoney(store.wallet)}</p>
          </div>
          <div className="rounded-2xl border border-reserve-navy/5 bg-white p-4">
            <p className="text-[10px] uppercase tracking-wider text-reserve-slate">Reserve</p>
            <p className="mt-1 truncate font-mono text-lg font-semibold">
              {reserve ? formatMoney(reserve.current) : "—"}
            </p>
          </div>
        </section>

        {step === "form" ? (
          <section className="mt-6 space-y-4 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Destination Reserve</Label>
              <select
                value={reserveId}
                onChange={(e) => setReserveId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-reserve-navy/10 bg-white p-3 text-sm"
              >
                {store.reserves.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {formatMoney(r.current)}
                  </option>
                ))}
              </select>
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
                autoFocus
              />
              <p className="mt-1 text-[10px] text-reserve-slate">
                Available: {formatMoney(store.wallet)}
              </p>
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
            <p className="text-[11px] uppercase tracking-wider text-reserve-slate">Confirm Move</p>
            <p className="mt-3 font-mono text-3xl font-semibold">{formatMoney(value)}</p>
            <p className="mt-1 text-sm text-reserve-slate">Wallet → {reserve?.name}</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setStep("form")} disabled={busy}>Back</Button>
              <Button onClick={submit} disabled={busy} className="bg-reserve-navy text-white hover:bg-reserve-navy/90">
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