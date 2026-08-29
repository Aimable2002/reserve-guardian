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
import { useReportsStore } from "@/lib/reports-store";

/**
 * Gate shown before a user has any Financial Reports books.
 *
 * The standard chart of accounts (Cash, Accounts Receivable, Equipment, …)
 * is still pre-built and gets seeded here, same as before — that list is
 * just structure, and picking from it is what happens naturally when the
 * user records their first journal entry. What this screen does NOT do is
 * put a balance in any of them: every account starts at 0. Opening balances,
 * if the user has any, are entered afterwards on the Chart of Accounts page
 * where they're always visible and editable — never invented up front.
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
      // Every account starts at 0 — nothing is pre-filled. Add real opening
      // balances afterwards from Chart of Accounts if you have any.
      await store.completeSetup(resolvedCurrency, {});
      toast.success("Books set up");
    } catch (setupError) {
      const message =
        setupError instanceof Error ? setupError.message : "Could not set up your books.";
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
            Set up your books
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-reserve-slate">
            One question to start: what currency will you record in? Your chart of accounts is set
            up automatically, all starting at zero — no balance is added until you record it
            yourself. You can add opening balances anytime from Chart of Accounts.
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
        {saving ? "Setting up…" : "Start my books"}
      </Button>
    </div>
  );
}
