import { useState } from "react";
import { toast } from "sonner";
import { PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/reports-data";
import { describeError, useReportsStore } from "@/lib/reports-store";

/**
 * Prompt shown when profiles.default_currency is null — the one piece of
 * setup Financial Reports actually needs the user to state. The chart of
 * accounts (Cash, Accounts Receivable, Equipment, …) is pre-built and
 * already seeded by the time this shows, all starting at 0 — that part
 * needs no prompt since it's structure, not money. This screen only asks
 * for currency, and saves it onto the existing profiles.default_currency
 * column (shared with wallet/reserve — setting it here sets it everywhere).
 */
export function FirstTimeSetup() {
  const store = useReportsStore();
  const [currency, setCurrency] = useState<string>("");
  const [customCurrency, setCustomCurrency] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resolvedCurrency = currency === "OTHER" ? customCurrency.trim().toUpperCase() : currency;

  const submit = async () => {
    setError("");
    if (!resolvedCurrency) {
      setError("Choose the currency you'll record your books in.");
      return;
    }
    if (currency === "OTHER" && !/^[A-Za-z]{3}$/.test(resolvedCurrency)) {
      setError("Enter a 3-letter currency code, e.g. RWF, USD, KES.");
      return;
    }
    setSaving(true);
    try {
      await store.completeSetup(resolvedCurrency);
      toast.success("Currency set");
    } catch (setupError) {
      const message = describeError(setupError);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-reserve-navy/10 bg-white p-5 shadow-sm sm:p-8 dark:border-white/10 dark:bg-reserve-navy/40">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-reserve-navy text-white dark:bg-white dark:text-reserve-navy">
          <PiggyBank className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-reserve-navy sm:text-xl dark:text-white">
            What currency are you recording in?
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-reserve-slate">
            Your chart of accounts is already set up, every account starting at zero. This just sets
            how amounts are displayed and stored across your account.
          </p>
        </div>
      </div>

      <div className="mb-6 space-y-1.5">
        <Label htmlFor="setup-currency">Currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger id="setup-currency" aria-label="Currency">
            <SelectValue placeholder="Choose a currency" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
            <SelectItem value="OTHER">Other (enter code)…</SelectItem>
          </SelectContent>
        </Select>
        {currency === "OTHER" && (
          <Input
            className="mt-2"
            placeholder="3-letter code, e.g. CHF"
            maxLength={3}
            value={customCurrency}
            onChange={(event) => setCustomCurrency(event.target.value)}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="button" className="w-full" disabled={saving} onClick={() => void submit()}>
        {saving ? "Saving…" : "Save currency"}
      </Button>
    </div>
  );
}
