import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_REPORT_ACCOUNTS,
  type JournalEntry,
  type ReportAccount,
  type ReportAccountType,
} from "@/lib/reports-data";

/**
 * Data-backed store for the Financial Reports module.
 *
 * Books are private per user (RLS on report_accounts / report_journal_entries /
 * report_journal_lines). Nothing in the wallet or reserve flows writes here —
 * the manual journal form is the only creation path.
 */

export interface AccountInput {
  code: string;
  name: string;
  type: ReportAccountType;
  subtype: ReportAccount["subtype"];
  normal: "debit" | "credit";
  opening: number;
  isActive?: boolean;
}

interface ReportsStoreValue {
  accounts: ReportAccount[];
  allAccounts: ReportAccount[];
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  /** True once we know this user has no report_settings row yet — books must not be seeded. */
  needsSetup: boolean;
  /** Books' currency, chosen by the user during first-time setup. Null until setup completes. */
  currency: string | null;
  reload: () => Promise<void>;
  /** First-time setup: records the user's currency choice and their own opening balances. */
  completeSetup: (currency: string, openings: Record<string, number>) => Promise<void>;
  addEntry: (entry: JournalEntry) => Promise<void>;
  updateEntry: (entryId: string, entry: JournalEntry) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  hasReference: (ref: string, excludingId?: string) => boolean;
  createAccount: (input: AccountInput) => Promise<void>;
  updateAccount: (accountId: string, input: AccountInput) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
}

const ReportsStoreContext = createContext<ReportsStoreValue | null>(null);

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: ReportAccountType;
  subtype: ReportAccount["subtype"];
  normal: "debit" | "credit";
  opening_balance: number | string;
  is_active: boolean;
  sort_order: number;
};

type EntryRow = {
  id: string;
  ref: string;
  entry_date: string;
  description: string;
  report_journal_lines: {
    account_id: string;
    debit: number | string;
    credit: number | string;
    line_order: number;
  }[];
};

const num = (value: number | string) => Number(value) || 0;

/**
 * Extract a readable message from any thrown value. Supabase's query errors
 * (PostgrestError) are plain objects, not real `Error` instances, so a naive
 * `err instanceof Error` check silently drops their message — which is
 * exactly the info needed to diagnose things like a missing table/migration
 * or an RLS policy rejection. Always prefer the underlying message.
 */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const withMessage = err as { message?: unknown; details?: unknown; hint?: unknown };
    if (typeof withMessage.message === "string" && withMessage.message) {
      const extra = [withMessage.details, withMessage.hint].filter(
        (part): part is string => typeof part === "string" && part.length > 0,
      );
      return extra.length ? `${withMessage.message} (${extra.join(" — ")})` : withMessage.message;
    }
  }
  if (typeof err === "string" && err) return err;
  return "Something went wrong.";
}

function mapAccount(row: AccountRow): ReportAccount {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    subtype: row.subtype,
    normal: row.normal,
    opening: num(row.opening_balance),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export function ReportsStoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [allAccounts, setAllAccounts] = useState<ReportAccount[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [currency, setCurrency] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setAllAccounts([]);
      setEntries([]);
      setNeedsSetup(false);
      setCurrency(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const settings = await fetchSettings(userId);
      if (!settings) {
        // No settings row yet: this user has never completed first-time setup.
        // Do NOT seed accounts or opening balances — that would put money in
        // the books the user never entered. Surface the setup gate instead.
        setCurrency(null);
        setNeedsSetup(true);
        setAllAccounts([]);
        setEntries([]);
        return;
      }
      setCurrency(settings.currency);
      setNeedsSetup(false);

      let accountRows = await fetchAccounts(userId);
      if (accountRows.length === 0) {
        // Settings exist but accounts don't (shouldn't normally happen — setup
        // writes both together). Recover the chart-of-accounts structure only,
        // still with zero opening balances; never fabricate a balance here.
        await seedAccounts(userId, {});
        accountRows = await fetchAccounts(userId);
      }
      const accounts = accountRows.map(mapAccount);
      const codeById = new Map(accounts.map((a) => [a.id as string, a.code]));

      const { data: entryData, error: entryError } = await supabase
        .from("report_journal_entries")
        .select(
          "id, ref, entry_date, description, report_journal_lines(account_id, debit, credit, line_order)",
        )
        .eq("user_id", userId)
        .order("entry_date", { ascending: true })
        .order("ref", { ascending: true });
      if (entryError) throw entryError;

      const mapped: JournalEntry[] = ((entryData ?? []) as EntryRow[]).map((row) => ({
        id: row.id,
        ref: row.ref,
        date: row.entry_date,
        description: row.description,
        lines: [...(row.report_journal_lines ?? [])]
          .sort((a, b) => a.line_order - b.line_order)
          .map((line) => ({
            account: codeById.get(line.account_id) ?? "----",
            debit: num(line.debit),
            credit: num(line.credit),
          })),
      }));

      setAllAccounts(accounts);
      setEntries(mapped);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  const accounts = useMemo(() => allAccounts.filter((a) => a.isActive !== false), [allAccounts]);

  const value = useMemo<ReportsStoreValue>(() => {
    const accountIdForCode = (code: string) => {
      const match = allAccounts.find((a) => a.code === code);
      if (!match?.id) throw new Error(`Unknown account ${code}`);
      return match.id;
    };

    const writeLines = async (entryId: string, entry: JournalEntry) => {
      const { error: lineError } = await supabase.from("report_journal_lines").insert(
        entry.lines.map((line, index) => ({
          entry_id: entryId,
          account_id: accountIdForCode(line.account),
          debit: line.debit,
          credit: line.credit,
          line_order: index,
        })),
      );
      if (lineError) throw lineError;
    };

    return {
      accounts,
      allAccounts,
      entries,
      loading,
      error,
      needsSetup,
      currency,
      reload: load,
      completeSetup: async (chosenCurrency, openings) => {
        if (!userId) throw new Error("Sign in to set up your books.");
        const { error: settingsError } = await supabase
          .from("report_settings")
          .insert({ user_id: userId, currency: chosenCurrency });
        if (settingsError) throw settingsError;
        await seedAccounts(userId, openings);
        await load();
      },
      addEntry: async (entry) => {
        if (!userId) throw new Error("Sign in to record journal entries.");
        const { data, error: insertError } = await supabase
          .from("report_journal_entries")
          .insert({
            user_id: userId,
            ref: entry.ref,
            entry_date: entry.date,
            description: entry.description,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;
        await writeLines(data.id as string, entry);
        await load();
      },
      updateEntry: async (entryId, entry) => {
        const { error: updateError } = await supabase
          .from("report_journal_entries")
          .update({
            ref: entry.ref,
            entry_date: entry.date,
            description: entry.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entryId);
        if (updateError) throw updateError;
        const { error: clearError } = await supabase
          .from("report_journal_lines")
          .delete()
          .eq("entry_id", entryId);
        if (clearError) throw clearError;
        await writeLines(entryId, entry);
        await load();
      },
      deleteEntry: async (entryId) => {
        const { error: deleteError } = await supabase
          .from("report_journal_entries")
          .delete()
          .eq("id", entryId);
        if (deleteError) throw deleteError;
        await load();
      },
      hasReference: (ref, excludingId) =>
        entries.some(
          (entry) => entry.ref.toLowerCase() === ref.toLowerCase() && entry.id !== excludingId,
        ),
      createAccount: async (input) => {
        if (!userId) throw new Error("Sign in to manage the chart of accounts.");
        const { error: insertError } = await supabase.from("report_accounts").insert({
          user_id: userId,
          code: input.code,
          name: input.name,
          type: input.type,
          subtype: input.subtype,
          normal: input.normal,
          opening_balance: input.opening,
          is_active: input.isActive ?? true,
          sort_order: allAccounts.length,
        });
        if (insertError) throw insertError;
        await load();
      },
      updateAccount: async (accountId, input) => {
        const { error: updateError } = await supabase
          .from("report_accounts")
          .update({
            code: input.code,
            name: input.name,
            type: input.type,
            subtype: input.subtype,
            normal: input.normal,
            opening_balance: input.opening,
            is_active: input.isActive ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", accountId);
        if (updateError) throw updateError;
        await load();
      },
      deleteAccount: async (accountId) => {
        const { error: deleteError } = await supabase
          .from("report_accounts")
          .delete()
          .eq("id", accountId);
        if (deleteError) throw deleteError;
        await load();
      },
    };
  }, [accounts, allAccounts, entries, loading, error, needsSetup, currency, load, userId]);

  return <ReportsStoreContext.Provider value={value}>{children}</ReportsStoreContext.Provider>;
}

export function useReportsStore() {
  const value = useContext(ReportsStoreContext);
  if (!value) throw new Error("useReportsStore must be used inside ReportsStoreProvider");
  return value;
}

async function fetchAccounts(userId: string): Promise<AccountRow[]> {
  const { data, error } = await supabase
    .from("report_accounts")
    .select("id, code, name, type, subtype, normal, opening_balance, is_active, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AccountRow[];
}

type SettingsRow = { user_id: string; currency: string };

async function fetchSettings(userId: string): Promise<SettingsRow | null> {
  const { data, error } = await supabase
    .from("report_settings")
    .select("user_id, currency")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as SettingsRow | null) ?? null;
}

/**
 * Create the standard starter chart of accounts for a user, at the opening
 * balances they entered during first-time setup (default 0 for anything they
 * left blank). This never runs on its own — it's only called from
 * completeSetup (after the user has chosen a currency and stated their
 * figures) or as structure-only recovery with an empty openings map.
 */
async function seedAccounts(userId: string, openings: Record<string, number>) {
  const { error } = await supabase.from("report_accounts").insert(
    DEFAULT_REPORT_ACCOUNTS.map((account, index) => ({
      user_id: userId,
      code: account.code,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      normal: account.normal,
      opening_balance: openings[account.code] ?? 0,
      is_active: true,
      sort_order: index,
    })),
  );
  if (error) throw error;
}
