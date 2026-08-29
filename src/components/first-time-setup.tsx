import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, PiggyBank } from "lucide-react";
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
import { DEFAULT_REPORT_ACCOUNTS, SUPPORTED_CURRENCIES } from "@/lib/reports-data";
import { useReportsStore } from "@/lib/reports-store";

/**
 * Gate shown before a user has any Financial Reports books.
 *
 * We never auto-create an opening cash balance (or any other balance) —
 * money only enters the ledger because the user stated it. This screen asks
 * for exactly the two things needed to start honest books: which currency,
 * and what the user actually has today, account by account.
 */
export function FirstTimeSetup() {
  const store = useReportsStore();
  const [currency, setCurrency] = useState<string>("");
  const [customCurrency, setCustomCurrency] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resolvedCurrency = currency === "OTHER" ? customCurrency.trim().toUpperCase() : currency;

  const openings = useMemo(() => {
    const out: Record<string, number> = {};
    for (const account of DEFAULT_REPORT_ACCOUNTS) {
      const raw = values[account.code];
      const n = raw ? Number(raw) : 0;
      out[account.code] = Number.isFinite(n) ? n : 0;
    }
    return out;
  }, [values]);

  const { debitTotal, creditTotal, balanced } = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const account of DEFAULT_REPORT_ACCOUNTS) {
      const amount = openings[account.code] ?? 0;
      if (amount < 0) continue;
      if (account.normal === "debit") debit += amount;
      else credit += amount;
    }
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      debitTotal: round(debit),
      creditTotal: round(credit),
      balanced: round(debit) === round(credit),
    };
  }, [openings]);

  const anyEntered = Object.values(openings).some((v) => v !== 0);

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
    for (const account of DEFAULT_REPORT_ACCOUNTS) {
      if ((openings[account.code] ?? 0) < 0) {
        setError(`${account.name}: opening balance can't be negative.`);
        return;
      }
    }
    if (!balanced) {
      setError(
        "Your opening balances don't balance. Total debit-side accounts (assets) must equal total credit-side accounts (liabilities + equity), same as double-entry demands anywhere else.",
      );
      return;
    }
    setSaving(true);
    try {
      await store.completeSetup(resolvedCurrency, openings);
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
    <div className="mx-auto max-w-2xl rounded-2xl border border-reserve-navy/10 bg-white p-5 shadow-sm sm:p-8 dark:border-white/10 dark:bg-reserve-navy/40">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-reserve-navy text-white dark:bg-white dark:text-reserve-navy">
          <PiggyBank className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-reserve-navy sm:text-xl dark:text-white">
            Set up your books
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-reserve-slate">
            This is a blank ledger — nothing is pre-filled. Pick the currency you'll record in, then
            enter what you actually have today for each account. If you're starting from nothing,
            leave every field at 0.
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

      <div className="mb-4">
        <p className="text-xs font-semibold tracking-[0.1em] text-reserve-slate uppercase">
          Opening balances{anyEntered ? "" : " (optional — defaults to 0)"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-reserve-slate">
          Enter each in the account's normal-balance terms. Nothing here is invented — whatever you
          don't enter starts at zero.
        </p>
      </div>

      <div className="space-y-2">
        {DEFAULT_REPORT_ACCOUNTS.map((account) => (
          <div key={account.code} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-reserve-navy dark:text-white/90">
                {account.name}
              </p>
              <p className="text-[10px] text-reserve-slate uppercase">
                {account.code} · {account.normal} normal
              </p>
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="w-32 text-right"
              value={values[account.code] ?? ""}
              placeholder="0"
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [account.code]: event.target.value }))
              }
            />
          </div>
        ))}
      </div>

      <div
        className={`mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
          balanced
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
        }`}
      >
        {balanced ? (
          <CheckCircle2 className="size-4 shrink-0" />
        ) : (
          <AlertTriangle className="size-4 shrink-0" />
        )}
        {balanced
          ? "Debits and credits balance."
          : `Out of balance: debit accounts ${debitTotal.toLocaleString()} vs credit accounts ${creditTotal.toLocaleString()}.`}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="button" className="mt-5 w-full" disabled={saving} onClick={() => void submit()}>
        {saving ? "Setting up…" : "Start my books"}
      </Button>
    </div>
  );
}
