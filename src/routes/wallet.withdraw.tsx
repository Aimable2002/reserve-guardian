import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/reserve-data";
import { BackendError } from "@/lib/backend";
import {
  RecipientForm,
  emptyRecipientForm,
  buildRecipient,
  isRecipientValid,
  recipientLabel,
  type RecipientFormValue,
} from "@/components/recipient-form";

export const Route = createFileRoute("/wallet/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw · Wallet" },
      { name: "description", content: "Cash out of your wallet via mobile money." },
      { property: "og:title", content: "Withdraw · Wallet" },
      { property: "og:description", content: "Cash out of your wallet via mobile money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WithdrawPage,
});

function WithdrawPage() {
  const store = useStore();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState<RecipientFormValue>(emptyRecipientForm);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [busy, setBusy] = useState(false);

  const value = Number(amount);
  const valid = isRecipientValid(recipient) && Number.isFinite(value) && value > 0 && value <= store.wallet;

  const submit = async () => {
    setBusy(true);
    try {
      await store.walletWithdraw({ amount: value, recipient: buildRecipient(recipient) });
      toast.success(`Withdrawing ${formatMoney(value)} to ${recipient.firstName} ${recipient.lastName}`);
      navigate({ to: "/wallet" });
    } catch (e) {
      toast.error(e instanceof BackendError ? e.message : "Withdrawal failed — check available balance.");
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
          <span className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            Withdraw
          </span>
        </header>

        <section className="rounded-2xl bg-reserve-navy p-5 text-white">
          <p className="text-[11px] uppercase tracking-wider text-white/60">Available</p>
          <p className="mt-1 font-mono text-2xl font-semibold">{formatMoney(store.wallet)}</p>
        </section>

        {step === "form" ? (
          <section className="mt-6 space-y-4 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Amount</Label>
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
            <RecipientForm value={recipient} onChange={setRecipient} />
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
            <p className="text-[11px] uppercase tracking-wider text-reserve-slate">Confirm Withdrawal</p>
            <p className="mt-3 font-mono text-3xl font-semibold">{formatMoney(value)}</p>
            <p className="mt-1 text-sm text-reserve-slate">to {recipientLabel(recipient)}</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setStep("form")} disabled={busy}>Back</Button>
              <Button onClick={submit} disabled={busy} className="bg-reserve-navy text-white hover:bg-reserve-navy/90">
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
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