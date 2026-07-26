import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, BackendError, type PayeeInfo } from "@/lib/backend";
import {
  PaymentMethodForm,
  emptyPaymentForm,
  buildPaymentMethod,
  buildCustomer,
  isPaymentFormValid,
  type PaymentFormValue,
} from "@/components/payment-method-form";

export const Route = createFileRoute("/pay/$code")({
  head: () => ({
    meta: [
      { title: "Pay · Fortress Reserve" },
      { name: "description", content: "Send money directly — no account required." },
    ],
  }),
  component: PayPage,
});

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; payee: PayeeInfo };

function PayPage() {
  const { code } = Route.useParams();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [form, setForm] = useState<PaymentFormValue>(emptyPaymentForm);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .resolveReceiveCode(code)
      .then((payee) => {
        if (!cancelled) setLoad({ status: "ready", payee });
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof BackendError ? err.message : "This payment link is invalid or no longer active.";
        setLoad({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const value = Number(amount);
  const valid = isPaymentFormValid(form) && Number.isFinite(value) && value > 0;

  const submit = async () => {
    setBusy(true);
    try {
      await api.payViaReceiveCode(code, {
        amount: value,
        payment_method: buildPaymentMethod(form),
        customer: buildCustomer(form),
      });
      setStep("done");
      toast.success("Payment started — check your phone to approve.");
    } catch (err) {
      toast.error(err instanceof BackendError ? err.message : "Payment failed.");
      setBusy(false);
    }
  };

  if (load.status === "loading") {
    return (
      <Centered>
        <Loader2 className="size-6 animate-spin text-reserve-navy" />
      </Centered>
    );
  }

  if (load.status === "error") {
    return (
      <Centered>
        <p className="max-w-xs text-center text-sm text-destructive">{load.message}</p>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <header className="mb-6 text-center">
          <p className="text-[11px] uppercase tracking-widest text-reserve-slate">Paying</p>
          <h1 className="mt-1 text-2xl font-semibold">{load.payee.display_name}</h1>
        </header>

        {step === "form" && (
          <section className="space-y-4 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                Amount ({load.payee.currency})
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
              <p className="mt-1 text-[10px] text-reserve-slate">
                You choose how much to send — this isn't fixed by the recipient.
              </p>
            </div>
            <PaymentMethodForm value={form} onChange={setForm} />
            <Button
              disabled={!valid}
              onClick={() => setStep("confirm")}
              className="w-full bg-reserve-navy text-white hover:bg-reserve-navy/90"
            >
              Review
            </Button>
          </section>
        )}

        {step === "confirm" && (
          <section className="rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-reserve-slate">Confirm payment</p>
            <p className="mt-3 font-mono text-3xl font-semibold">
              {load.payee.currency} {value.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-reserve-slate">
              to {load.payee.display_name} · via {form.network} · +{form.phoneDialCode}
              {form.phoneNumber}
            </p>
            <p className="mt-3 text-[10px] leading-relaxed text-reserve-slate">
              You'll get a prompt on your phone to approve this payment.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setStep("form")} disabled={busy}>
                Back
              </Button>
              <Button onClick={submit} disabled={busy} className="bg-reserve-navy text-white hover:bg-reserve-navy/90">
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm
              </Button>
            </div>
          </section>
        )}

        {step === "done" && (
          <section className="rounded-2xl border border-reserve-navy/5 bg-white p-6 text-center shadow-sm">
            <ShieldCheck className="mx-auto size-8 text-reserve-emerald" />
            <p className="mt-3 text-sm font-medium">Payment request sent</p>
            <p className="mt-1 text-xs text-reserve-slate">
              Approve the prompt on your phone to finish sending{" "}
              {load.payee.currency} {value.toLocaleString()} to {load.payee.display_name}.
            </p>
          </section>
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-reserve-bg px-4">{children}</div>;
}
