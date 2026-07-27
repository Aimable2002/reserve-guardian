import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Pencil, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatMoney, reserveProgress, targetAmount, can, ROLE_LABELS } from "@/lib/reserve-data";
import { submitWithdrawalRequest } from "@/lib/shared-reserves";
import { usePasswordConfirm } from "@/components/password-confirm";

export const Route = createFileRoute("/reserves/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Reserve · Fortress Reserve` },
      { name: "description", content: `Detail view for reserve ${params.id}.` },
      { property: "og:title", content: `Reserve — Fortress Reserve` },
      { property: "og:description", content: "Reserve detail, progress, and history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReserveDetail,
});

function ReserveDetail() {
  const { id } = Route.useParams();
  const store = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const reserve = store.reserves.find((r) => r.id === id);
  const pwd = usePasswordConfirm();

  const [tx, setTx] = useState<null | "deposit" | "withdraw">(null);
  const [amount, setAmount] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(reserve?.name ?? "");
  const [editType, setEditType] = useState<"days" | "amount">(reserve?.targetType ?? "amount");
  const [editValue, setEditValue] = useState(String(reserve?.targetValue ?? ""));

  const history = useMemo(
    () => store.transactions.filter((t) => t.from === id || t.to === id),
    [store.transactions, id],
  );

  if (!reserve) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-reserve-bg px-6 text-reserve-navy">
        <p className="text-sm text-reserve-slate">Reserve not found.</p>
        <Link to="/" className="mt-4 rounded-lg bg-reserve-navy px-4 py-2 text-xs font-semibold text-white">
          Back to Vault
        </Link>
      </div>
    );
  }

  const pct = reserveProgress(reserve, store.monthlyCost);
  const target = targetAmount(reserve, store.monthlyCost);
  const complete = pct >= 100;
  const targetLabel =
    reserve.targetType === "days"
      ? `Sustain ${reserve.targetValue} days · ${formatMoney(target)}`
      : `Reach ${formatMoney(reserve.targetValue)}`;

  const [busy, setBusy] = useState(false);

  const submitTx = async () => {
    const v = Number(amount);
    if (!Number.isFinite(v) || v <= 0) return toast.error("Enter an amount greater than zero.");
    setBusy(true);
    try {
      if (tx === "deposit") {
        // "Deposit" here means funding this reserve from the wallet — an
        // instant, DB-only move, not a Flutterwave charge.
        await store.walletToReserve(reserve.id, v);
        toast.success(`Moved ${formatMoney(v)} from Wallet`);
      } else if (tx === "withdraw") {
        await pwd.confirm();
        if (reserve.shared) {
          // Shared reserves route every withdrawal through the request
          // function — the owner's own request comes back already approved.
          const res = await submitWithdrawalRequest({
            reserveId: reserve.id,
            userId: user!.id,
            amount: v,
            currency: reserve.currency,
            reason: "",
          });
          toast.success(
            res.status === "approved"
              ? `Withdrew ${formatMoney(v, reserve.currency)} to your wallet`
              : "Request sent to the reserve owner for approval.",
          );
          await store.refresh();
        } else {
          await store.reserveToWallet(reserve.id, v);
          toast.success(`Moved ${formatMoney(v)} to Wallet`);
        }
      }
      setTx(null);
      setAmount("");
    } catch (e: any) {
      toast.error(e?.message ?? `Only ${formatMoney(reserve.current)} available.`);
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    const v = Number(editValue);
    if (!editName.trim()) return toast.error("Name required.");
    if (!Number.isFinite(v) || v <= 0) return toast.error("Target must be > 0.");
    try {
      await store.updateReserve(reserve.id, {
        name: editName.trim(),
        targetType: editType,
        targetValue: v,
      });
      toast.success("Reserve updated.");
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update that reserve.");
    }
  };

  const doDelete = async () => {
    if (reserve.current > 0) {
      toast.error("Withdraw all funds before deleting this reserve.");
      return;
    }
    if (reserve.memberCount > 1) {
      toast.error("Transfer ownership or remove the other members first.");
      return;
    }
    try {
      await store.deleteReserve(reserve.id);
      toast.success("Reserve deleted.");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete that reserve.");
    }
  };

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-reserve-slate active:opacity-70">
            <ArrowLeft className="size-4" /> Vault
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/reserve-settings/$id"
              params={{ id: reserve.id }}
              className="inline-flex items-center gap-1 rounded-full bg-reserve-navy/5 px-3 py-1 text-[11px] font-semibold text-reserve-navy active:scale-95"
            >
              <Users className="size-3" /> Members
            </Link>
            {can.manage(reserve.role) && (
              <button
                onClick={() => {
                  setEditName(reserve.name);
                  setEditType(reserve.targetType);
                  setEditValue(String(reserve.targetValue));
                  setEditOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-reserve-navy/5 px-3 py-1 text-[11px] font-semibold text-reserve-navy active:scale-95"
              >
                <Pencil className="size-3" /> Edit
              </button>
            )}
          </div>
        </header>

        <section className="rounded-3xl bg-reserve-navy p-7 text-white shadow-2xl shadow-reserve-navy/20">
          <p className="text-[11px] uppercase tracking-widest text-white/60">
            {reserve.shared ? `Shared reserve · ${ROLE_LABELS[reserve.role]}` : "Reserve"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{reserve.name}</h1>
          <p className="mt-1 text-xs text-white/60">{targetLabel}</p>
          <div className="mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-3xl font-semibold">{formatMoney(reserve.current)}</span>
              <span className="font-mono text-sm text-white/60">of {formatMoney(target)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ${
                  complete ? "bg-reserve-emerald" : "bg-white"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-white/60">
              <span>{pct.toFixed(0)}% funded</span>
              <span>{complete ? "Fully Reserved" : `${formatMoney(Math.max(0, target - reserve.current))} remaining`}</span>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setTx("deposit")}
            disabled={!can.deposit(reserve.role)}
            className="rounded-2xl border border-reserve-navy/5 bg-white py-4 text-sm font-semibold shadow-sm active:scale-95 disabled:opacity-40"
          >
            Deposit
          </button>
          <button
            onClick={() => setTx("withdraw")}
            disabled={!can.requestWithdrawal(reserve.role)}
            className="rounded-2xl border border-reserve-navy/5 bg-white py-4 text-sm font-semibold shadow-sm active:scale-95 disabled:opacity-40"
          >
            {reserve.shared && reserve.role !== "owner" ? "Request withdrawal" : "Withdraw"}
          </button>
        </div>

        <p className="mt-4 rounded-xl bg-reserve-navy/5 p-3 text-[11px] leading-relaxed text-reserve-slate">
          Reserves are isolated silos. To move funds between reserves, withdraw first, then deposit or allocate again.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Transaction History</h2>
          <div className="space-y-2">
            {history.length === 0 && (
              <p className="rounded-2xl border border-dashed border-reserve-navy/10 bg-white/60 p-6 text-center text-xs text-reserve-slate">
                No transactions yet.
              </p>
            )}
            {history.map((t) => {
              const inflow = t.to === reserve.id;
              const label =
                t.kind === "allocate"
                  ? "Allocated from Unallocated"
                  : t.kind === "deposit"
                    ? "Deposit"
                    : t.kind === "withdraw"
                      ? "Withdraw"
                      : "Yield";
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-reserve-navy/5 bg-white p-3"
                >
                  <div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-[10px] text-reserve-slate">
                      {new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-semibold ${
                      inflow ? "text-reserve-emerald" : "text-reserve-navy"
                    }`}
                  >
                    {inflow ? "+" : "−"}
                    {formatMoney(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <button
            onClick={doDelete}
            disabled={reserve.current > 0 || !can.manage(reserve.role) || reserve.memberCount > 1}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 py-4 text-sm font-semibold text-destructive transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-4" /> Delete reserve
          </button>
          {can.manage(reserve.role) && reserve.memberCount > 1 && (
            <p className="mt-2 text-center text-[11px] text-reserve-slate">
              Transfer ownership or remove the other members before deleting.
            </p>
          )}
          {reserve.current > 0 && (
            <p className="mt-2 text-center text-[11px] text-reserve-slate">
              Withdraw the remaining {formatMoney(reserve.current)} before deleting.
            </p>
          )}
        </section>
      </div>

      {/* Tx dialog */}
      <Dialog open={!!tx} onOpenChange={(o) => !o && setTx(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {tx} · {reserve.name}
            </DialogTitle>
          </DialogHeader>
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
          </div>
          {tx === "withdraw" && <div className="mt-4">{pwd.field}</div>}
          <DialogFooter className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setTx(null)} disabled={busy}>Cancel</Button>
            <Button
              onClick={submitTx}
              disabled={busy || (tx === "withdraw" && !pwd.ready)}
              className="bg-reserve-navy text-white hover:bg-reserve-navy/90"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Reserve</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Target Type</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditType("days")}
                  className={`rounded-lg border p-3 text-xs font-medium ${
                    editType === "days"
                      ? "border-reserve-navy bg-reserve-navy text-white"
                      : "border-reserve-navy/10 bg-white"
                  }`}
                >
                  Sustain X days
                </button>
                <button
                  onClick={() => setEditType("amount")}
                  className={`rounded-lg border p-3 text-xs font-medium ${
                    editType === "amount"
                      ? "border-reserve-navy bg-reserve-navy text-white"
                      : "border-reserve-navy/10 bg-white"
                  }`}
                >
                  Reach $Y
                </button>
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                {editType === "days" ? "Days" : "Amount ($)"}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="mt-2 font-mono text-lg"
              />
              <p className="mt-2 text-[10px] text-reserve-slate">
                Balance is untouched — only the target changes.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={submitEdit} className="bg-reserve-navy text-white hover:bg-reserve-navy/90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" richColors />
    </div>
  );
}