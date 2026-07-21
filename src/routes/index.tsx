import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  INITIAL_BALANCE,
  INITIAL_MONTHLY_COST,
  INITIAL_RESERVES,
  computeRunway,
  formatUSD,
  reserveProgress,
  targetAmount,
  type Reserve,
} from "@/lib/reserve-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fortress Reserve — Personal Ledger" },
      {
        name: "description",
        content:
          "Reserve money for long-term survival. Track your runway and progress toward each reserve target.",
      },
      { property: "og:title", content: "Fortress Reserve — Personal Ledger" },
      {
        property: "og:description",
        content: "Reserve money for long-term survival. Track your runway and reserves.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type TxMode = "deposit" | "withdraw";

function Index() {
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [monthlyCost, setMonthlyCost] = useState<number>(INITIAL_MONTHLY_COST);
  const [monthlyCostInput, setMonthlyCostInput] = useState<string>(
    String(INITIAL_MONTHLY_COST),
  );
  const [reserves, setReserves] = useState<Reserve[]>(INITIAL_RESERVES);
  const [tx, setTx] = useState<{ mode: TxMode; reserveId: string } | null>(null);
  const [amount, setAmount] = useState<string>("");

  const runway = useMemo(() => computeRunway(balance, monthlyCost), [balance, monthlyCost]);

  const openTx = (mode: TxMode) => {
    setAmount("");
    setTx({ mode, reserveId: reserves[0]?.id ?? "" });
  };

  const submitTx = () => {
    if (!tx) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    const reserve = reserves.find((r) => r.id === tx.reserveId);
    if (!reserve) return;

    if (tx.mode === "deposit") {
      setBalance((b) => b + value);
      setReserves((rs) =>
        rs.map((r) => (r.id === reserve.id ? { ...r, current: r.current + value } : r)),
      );
      toast.success(`Deposited ${formatUSD(value)} to ${reserve.name}`);
    } else {
      const max = Math.min(reserve.current, balance);
      if (value > max) {
        toast.error(`Only ${formatUSD(max)} available in ${reserve.name}.`);
        return;
      }
      setBalance((b) => b - value);
      setReserves((rs) =>
        rs.map((r) => (r.id === reserve.id ? { ...r, current: r.current - value } : r)),
      );
      toast.success(`Withdrew ${formatUSD(value)} from ${reserve.name}`);
    }
    setTx(null);
  };

  const commitMonthlyCost = () => {
    const v = Number(monthlyCostInput.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(v) || v <= 0) {
      toast.error("Monthly cost must be greater than zero.");
      setMonthlyCostInput(String(monthlyCost));
      return;
    }
    setMonthlyCost(v);
    toast.success("Runway recalibrated.");
  };

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        {/* Header */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-6">
          <div className="min-w-0">
            <h1 className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
              Fortress Reserve
            </h1>
            <p className="truncate text-lg font-medium">Personal Ledger</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-reserve-navy/10 bg-reserve-navy/5">
            <div className="size-6 rounded-full bg-gradient-to-br from-reserve-emerald to-reserve-navy" />
          </div>
        </header>

        {/* Balance Hero */}
        <section className="mt-2 mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-reserve-navy p-7 text-white shadow-2xl shadow-reserve-navy/20">
            <div className="relative z-10">
              <p className="mb-1 text-sm text-white/60">Total Reserved Balance</p>
              <h2 className="mb-6 font-mono text-4xl font-semibold tracking-tight">
                {formatUSD(balance)}
              </h2>
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-white/60">
                    Current Runway
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold">{runway.months}</span>
                    <span className="text-sm text-white/60">months ·</span>
                    <span className="text-lg font-semibold">{runway.days}</span>
                    <span className="text-sm text-white/60">days</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  <span className="font-mono text-[10px] font-bold text-reserve-emerald">
                    RSVD
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 -mr-16 -mt-16 size-48 bg-reserve-emerald/20 blur-3xl" />
          </div>
        </section>

        {/* Quick Actions */}
        <div className="mb-10 grid grid-cols-2 gap-3">
          <button
            onClick={() => openTx("deposit")}
            className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl border border-reserve-navy/5 bg-white py-4 shadow-sm transition-transform active:scale-95"
          >
            <span className="mb-1 text-sm font-semibold">Deposit</span>
            <span className="text-[10px] uppercase text-reserve-slate">Add to safety</span>
          </button>
          <button
            onClick={() => openTx("withdraw")}
            className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl border border-reserve-navy/5 bg-white py-4 shadow-sm transition-transform active:scale-95"
          >
            <span className="mb-1 text-sm font-semibold">Withdraw</span>
            <span className="text-[10px] uppercase text-reserve-slate">Access funds</span>
          </button>
        </div>

        {/* Reserves */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h3 className="text-sm font-semibold">Active Reserves</h3>
            <span className="text-xs font-medium text-reserve-emerald">{reserves.length} active</span>
          </div>

          {reserves.map((r) => {
            const pct = reserveProgress(r, monthlyCost);
            const target = targetAmount(r, monthlyCost);
            const complete = pct >= 100;
            const targetLabel =
              r.targetType === "days"
                ? `Target: Sustain ${r.targetValue} days`
                : `Target: Reach ${formatUSD(r.targetValue)}`;
            const rightMeta =
              r.targetType === "days"
                ? `${((r.current / monthlyCost) * 30).toFixed(0)} days ready`
                : `${formatUSD(Math.max(0, r.targetValue - r.current))} left`;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate font-medium">{r.name}</h4>
                    <p className="text-[11px] text-reserve-slate">{targetLabel}</p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-sm font-medium ${
                      complete ? "text-reserve-emerald" : "text-reserve-navy/60"
                    }`}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-reserve-bg">
                  <div
                    className={`h-full rounded-full transition-[width] duration-1000 ${
                      complete ? "bg-reserve-emerald" : "bg-reserve-navy/70"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <span className="truncate text-[11px] text-reserve-slate">
                    {formatUSD(r.current)} / {formatUSD(target)}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium">
                    {complete ? "Fully Reserved" : rightMeta}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Monthly Cost */}
        <section className="mt-10 border-t border-reserve-navy/5 pt-8">
          <div className="rounded-2xl bg-reserve-navy/5 p-6">
            <label className="mb-4 block text-xs font-semibold uppercase tracking-wider text-reserve-slate">
              Survival Cost Configuration
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-reserve-navy/10 bg-white p-3">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] leading-none text-reserve-slate">
                  Monthly Survival Cost ($)
                </p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyCostInput}
                  onChange={(e) => setMonthlyCostInput(e.target.value)}
                  className="w-full bg-transparent font-mono text-lg font-medium focus:outline-none"
                />
              </div>
              <button
                onClick={commitMonthlyCost}
                className="shrink-0 rounded-lg bg-reserve-navy px-4 py-2 text-xs font-medium text-white active:scale-95"
              >
                Update
              </button>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-reserve-slate">
              Changing this recalibrates your runway across all time-based reserves instantly.
            </p>
          </div>
        </section>
      </div>

      {/* Bottom Nav */}
      <nav
        className="fixed inset-x-4 bottom-4 z-40 mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl border border-reserve-navy/5 bg-white/85 px-4 shadow-xl backdrop-blur-md"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col items-center opacity-100">
          <div className="mb-1 size-1.5 rounded-full bg-reserve-navy" />
          <span className="text-[10px] font-semibold">Vault</span>
        </div>
        <div className="flex flex-col items-center opacity-40">
          <div className="mb-1 size-1.5 rounded-full bg-transparent" />
          <span className="text-[10px] font-semibold">Analytics</span>
        </div>
        <div className="flex flex-col items-center opacity-40">
          <div className="mb-1 size-1.5 rounded-full bg-transparent" />
          <span className="text-[10px] font-semibold">History</span>
        </div>
      </nav>

      {/* Tx Dialog */}
      <Dialog open={!!tx} onOpenChange={(o) => !o && setTx(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="capitalize">{tx?.mode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                Reserve
              </Label>
              <select
                value={tx?.reserveId ?? ""}
                onChange={(e) => tx && setTx({ ...tx, reserveId: e.target.value })}
                className="mt-2 w-full rounded-lg border border-reserve-navy/10 bg-white p-3 text-sm"
              >
                {reserves.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {formatUSD(r.current)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                Amount (USD)
              </Label>
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
            </div>
          </div>
          <DialogFooter className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setTx(null)}>
              Cancel
            </Button>
            <Button
              onClick={submitTx}
              className="bg-reserve-navy text-white hover:bg-reserve-navy/90"
            >
              Confirm {tx?.mode}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" richColors />
    </div>
  );
}
