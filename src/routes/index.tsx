import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  computeRunway,
  formatMoney,
  reserveProgress,
  targetAmount,
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

type TxMode = "deposit" | "withdraw" | "allocate";
// Target key: "unallocated" or a reserve id

function Index() {
  const store = useStore();
  const navigate = useNavigate();
  const { balance, unallocated, monthlyCost, reserves, transactions } = store;
  const [monthlyCostInput, setMonthlyCostInput] = useState<string>(
    String(monthlyCost),
  );
  const [tx, setTx] = useState<{ mode: TxMode; target: string } | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"days" | "amount">("amount");
  const [newValue, setNewValue] = useState("");

  const runway = useMemo(() => computeRunway(balance, monthlyCost), [balance, monthlyCost]);

  // Unallocated trend: sum of yield inflows in last 30 days vs previous 30
  const trend = useMemo(() => {
    const now = Date.now();
    const d = 24 * 60 * 60 * 1000;
    let recent = 0;
    let prior = 0;
    for (const t of transactions) {
      if (t.kind !== "yield") continue;
      const age = now - new Date(t.date).getTime();
      if (age <= 30 * d) recent += t.amount;
      else if (age <= 60 * d) prior += t.amount;
    }
    const delta = recent - prior;
    const pct = prior > 0 ? (delta / prior) * 100 : recent > 0 ? 100 : 0;
    return { recent, delta, pct };
  }, [transactions]);

  const openTx = (mode: TxMode, target?: string) => {
    const t = target ?? "unallocated";
    // Funding/cashing out the wallet itself needs real mobile money details
    // (network, phone, customer info) that this quick-amount dialog can't
    // collect — send those to the real forms instead.
    if (t === "unallocated" && mode === "deposit") {
      navigate({ to: "/wallet/deposit" });
      return;
    }
    if (t === "unallocated" && mode === "withdraw") {
      navigate({ to: "/wallet/withdraw" });
      return;
    }
    setAmount("");
    setTx({ mode, target: t });
  };

  const submitTx = async () => {
    if (!tx) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    const isUnallocated = tx.target === "unallocated";
    const reserve = isUnallocated ? null : reserves.find((r) => r.id === tx.target);
    if (!isUnallocated && !reserve) return;
    if (tx.mode === "allocate" && !reserve) {
      toast.error("Choose a reserve to allocate to.");
      return;
    }
    const label = isUnallocated ? "Unallocated" : reserve!.name;

    setBusy(true);
    try {
      if (tx.mode === "deposit") {
        // Reserve-context "deposit" is really funding a reserve from the
        // wallet — an instant, DB-only move.
        await store.walletToReserve(reserve!.id, value);
        toast.success(`Moved ${formatMoney(value)} to ${label}`);
      } else if (tx.mode === "withdraw") {
        await store.reserveToWallet(reserve!.id, value);
        toast.success(`Moved ${formatMoney(value)} from ${label} to Wallet`);
      } else {
        // allocate: from unallocated to a reserve
        await store.walletToReserve(reserve!.id, value);
        toast.success(`Allocated ${formatMoney(value)} to ${label}`);
      }
      setTx(null);
    } catch (e: any) {
      const max = isUnallocated ? unallocated : reserve!.current;
      toast.error(e?.message ?? `Only ${formatMoney(max)} available in ${label}.`);
    } finally {
      setBusy(false);
    }
  };

  const commitMonthlyCost = () => {
    const v = Number(monthlyCostInput.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(v) || v <= 0) {
      toast.error("Monthly cost must be greater than zero.");
      setMonthlyCostInput(String(monthlyCost));
      return;
    }
    store.setMonthlyCost(v);
    toast.success("Runway recalibrated.");
  };

  const submitCreate = () => {
    const name = newName.trim();
    const val = Number(newValue);
    if (!name) return toast.error("Give the reserve a name.");
    if (!Number.isFinite(val) || val <= 0) return toast.error("Target must be greater than zero.");
    store.createReserve({ name, targetType: newType, targetValue: val });
    toast.success(`Created reserve "${name}"`);
    setNewName("");
    setNewValue("");
    setNewType("amount");
    setCreateOpen(false);
  };

  const allocateTargets = reserves;

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
                {formatMoney(balance)}
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

        {/* Unallocated Balance */}
        <section className="mb-8">
          <div className="rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-reserve-slate">
                  Unallocated Balance
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold">{formatMoney(unallocated)}</p>
                <p className="mt-1 text-[11px] text-reserve-slate">
                  Yield &amp; deposits waiting to be assigned
                </p>
              </div>
              <div
                className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                  trend.delta >= 0
                    ? "bg-reserve-emerald/10 text-reserve-emerald"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {trend.delta >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {trend.delta >= 0 ? "+" : ""}
                {trend.pct.toFixed(0)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openTx("allocate", reserves[0]?.id)}
                disabled={reserves.length === 0 || unallocated <= 0}
                className="rounded-xl bg-reserve-navy px-3 py-2.5 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-40"
              >
                Allocate to Reserve
              </button>
              <button
                onClick={() => openTx("withdraw", "unallocated")}
                disabled={unallocated <= 0}
                className="rounded-xl border border-reserve-navy/10 bg-white px-3 py-2.5 text-xs font-semibold text-reserve-navy transition active:scale-95 disabled:opacity-40"
              >
                Withdraw
              </button>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="mb-10 grid grid-cols-2 gap-3">
          <button
            onClick={() => openTx("deposit", "unallocated")}
            className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl border border-reserve-navy/5 bg-white py-4 shadow-sm transition-transform active:scale-95"
          >
            <ArrowDownRight className="mb-1 size-4 text-reserve-emerald" />
            <span className="text-sm font-semibold">Deposit</span>
            <span className="text-[10px] uppercase text-reserve-slate">Add to safety</span>
          </button>
          <button
            onClick={() => openTx("withdraw", reserves[0]?.id ?? "unallocated")}
            className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl border border-reserve-navy/5 bg-white py-4 shadow-sm transition-transform active:scale-95"
          >
            <ArrowUpRight className="mb-1 size-4 text-reserve-navy" />
            <span className="text-sm font-semibold">Withdraw</span>
            <span className="text-[10px] uppercase text-reserve-slate">Access funds</span>
          </button>
        </div>

        {/* Reserves */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h3 className="text-sm font-semibold">Active Reserves</h3>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-reserve-navy/5 px-3 py-1 text-[11px] font-semibold text-reserve-navy active:scale-95"
            >
              <Plus className="size-3" /> New reserve
            </button>
          </div>

          {reserves.map((r) => {
            const pct = reserveProgress(r, monthlyCost);
            const target = targetAmount(r, monthlyCost);
            const complete = pct >= 100;
            const targetLabel =
              r.targetType === "days"
                ? `Target: Sustain ${r.targetValue} days`
                : `Target: Reach ${formatMoney(r.targetValue)}`;
            const rightMeta =
              r.targetType === "days"
                ? `${((r.current / monthlyCost) * 30).toFixed(0)} days ready`
                : `${formatMoney(Math.max(0, r.targetValue - r.current))} left`;
            return (
              <Link
                key={r.id}
                to="/reserves/$id"
                params={{ id: r.id }}
                className="block rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm transition active:scale-[0.99]"
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
                    {formatMoney(r.current)} / {formatMoney(target)}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium">
                    {complete ? "Fully Reserved" : rightMeta}
                  </span>
                </div>
              </Link>
            );
          })}
          {reserves.length === 0 && (
            <p className="rounded-2xl border border-dashed border-reserve-navy/10 bg-white/50 p-6 text-center text-xs text-reserve-slate">
              No reserves yet. Create one to start allocating.
            </p>
          )}
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

      {/* Tx Dialog */}
      <Dialog open={!!tx} onOpenChange={(o) => !o && setTx(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="capitalize">{tx?.mode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                {tx?.mode === "allocate" ? "To Reserve" : "Source"}
              </Label>
              <select
                value={tx?.target ?? ""}
                onChange={(e) => tx && setTx({ ...tx, target: e.target.value })}
                className="mt-2 w-full rounded-lg border border-reserve-navy/10 bg-white p-3 text-sm"
              >
                {tx?.mode !== "allocate" && (
                  <option value="unallocated">Unallocated — {formatMoney(unallocated)}</option>
                )}
                {(tx?.mode === "allocate" ? allocateTargets : reserves).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {formatMoney(r.current)}
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
            <Button variant="outline" onClick={() => setTx(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={submitTx}
              disabled={busy}
              className="bg-reserve-navy text-white hover:bg-reserve-navy/90"
            >
              Confirm {tx?.mode}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Reserve Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>New Reserve</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Home Deposit"
                className="mt-2"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                Target Type
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewType("days")}
                  className={`rounded-lg border p-3 text-xs font-medium transition ${
                    newType === "days"
                      ? "border-reserve-navy bg-reserve-navy text-white"
                      : "border-reserve-navy/10 bg-white text-reserve-navy"
                  }`}
                >
                  Sustain X days
                </button>
                <button
                  onClick={() => setNewType("amount")}
                  className={`rounded-lg border p-3 text-xs font-medium transition ${
                    newType === "amount"
                      ? "border-reserve-navy bg-reserve-navy text-white"
                      : "border-reserve-navy/10 bg-white text-reserve-navy"
                  }`}
                >
                  Reach $Y
                </button>
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                {newType === "days" ? "Days to sustain" : "Target amount ($)"}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={newType === "days" ? "90" : "5000"}
                className="mt-2 font-mono text-lg"
              />
              <p className="mt-2 text-[10px] text-reserve-slate">
                Starts at $0. Fund via deposit or allocation from unallocated balance.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitCreate}
              className="bg-reserve-navy text-white hover:bg-reserve-navy/90"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" richColors />
    </div>
  );
}