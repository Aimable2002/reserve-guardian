import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import {
  api,
  type DepositRequest,
  type DepositResponse,
  type Recipient,
  type TransferResponse,
} from "./backend";
import {
  DEFAULT_CURRENCY,
  DEFAULT_MONTHLY_COST,
  mapLedgerEntry,
  mapReserveRow,
  toDbTargetType,
  type LedgerEntry,
  type MemberRole,
  type Reserve,
  type ReserveRow,
  type Transaction,
} from "./reserve-data";

const MONTHLY_COST_KEY = "fortress.monthlyCost";

type State = {
  balance: number;
  unallocated: number;
  monthlyCost: number;
  wallet: number;
  currency: string;
  reserves: Reserve[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
};

type Ctx = State & {
  refresh: () => Promise<void>;
  setMonthlyCost: (v: number) => void;

  /** Fund the wallet via mobile money (async, settles via webhook). */
  deposit: (input: Omit<DepositRequest, "currency"> & { currency?: string }) => Promise<DepositResponse>;
  /** Pay someone from the wallet. */
  walletSend: (input: { amount: number; currency?: string; recipient: Recipient }) => Promise<TransferResponse>;
  /** Cash out of the wallet to a bank / mobile money account. */
  walletWithdraw: (input: { amount: number; currency?: string; recipient: Recipient }) => Promise<TransferResponse>;
  /** Wallet -> reserve (instant). */
  walletToReserve: (reserveId: string, amount: number) => Promise<void>;
  /** Reserve -> wallet (instant). */
  reserveToWallet: (reserveId: string, amount: number) => Promise<void>;

  createReserve: (r: { name: string; targetType: "days" | "amount"; targetValue: number; currency?: string }) => Promise<string>;
  updateReserve: (
    id: string,
    patch: Partial<Pick<Reserve, "name" | "targetType" | "targetValue">>,
  ) => Promise<void>;
  deleteReserve: (id: string) => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState(0);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyCost, setMonthlyCostState] = useState(DEFAULT_MONTHLY_COST);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = Number(window.localStorage.getItem(MONTHLY_COST_KEY));
    if (Number.isFinite(stored) && stored > 0) setMonthlyCostState(stored);
  }, []);

  const setMonthlyCost = useCallback((v: number) => {
    setMonthlyCostState(v);
    if (typeof window !== "undefined") window.localStorage.setItem(MONTHLY_COST_KEY, String(v));
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setReserves([]);
      setTransactions([]);
      setWallet(0);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [profileRes, reservesRes, ledgerRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("default_currency").eq("id", userId).maybeSingle(),
        supabase.from("reserves").select("*").order("created_at", { ascending: true }),
        supabase.from("ledger_entries").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.rpc("wallet_balance", { p_user_id: userId }),
      ]);

      if (reservesRes.error) throw reservesRes.error;
      if (ledgerRes.error) throw ledgerRes.error;
      if (walletRes.error) throw walletRes.error;

      const defaultCurrency = profileRes.data?.default_currency ?? DEFAULT_CURRENCY;
      setCurrency(defaultCurrency);
      setWallet(Number(walletRes.data ?? 0));

      const rows = ((reservesRes.data ?? []) as ReserveRow[]).filter((r) => !r.archived);

      // Roles + member counts for every visible reserve (owned OR joined).
      const memberRows = rows.length
        ? (
            await supabase
              .from("reserve_members")
              .select("reserve_id, user_id, role")
              .in(
                "reserve_id",
                rows.map((r) => r.id),
              )
          ).data ?? []
        : [];
      const counts: Record<string, number> = {};
      const myRole: Record<string, MemberRole> = {};
      for (const m of memberRows as { reserve_id: string; user_id: string; role: MemberRole }[]) {
        counts[m.reserve_id] = (counts[m.reserve_id] ?? 0) + 1;
        if (m.user_id === userId) myRole[m.reserve_id] = m.role;
      }

      const balances = await Promise.all(
        rows.map((r) => supabase.rpc("reserve_balance", { p_reserve_id: r.id })),
      );
      const mapped = rows.map((r, i) =>
        mapReserveRow(
          r,
          Number(balances[i]?.data ?? 0),
          r.user_id === userId ? "owner" : (myRole[r.id] ?? "viewer"),
          Math.max(counts[r.id] ?? 1, 1),
        ),
      );
      setReserves(mapped);

      const names = Object.fromEntries(mapped.map((r) => [r.id, r.name]));
      setTransactions(
        ((ledgerRes.data ?? []) as LedgerEntry[]).map((e) => mapLedgerEntry(e, names)),
      );
    } catch (e: any) {
      setError(e?.message ?? "Could not load your account.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  // Only funds the user actually controls count toward their own runway.
  const allocated = reserves
    .filter((r) => r.role === "owner" || r.role === "co_owner")
    .reduce((s, r) => s + r.current, 0);
  const balance = wallet + allocated;

  const value = useMemo<Ctx>(
    () => ({
      balance,
      // The wallet *is* the unallocated pool — there is no separate account type.
      unallocated: wallet,
      wallet,
      monthlyCost,
      currency,
      reserves,
      transactions,
      loading,
      error,
      refresh,
      setMonthlyCost,

      deposit: async (input) => {
        const res = await api.depositInitiate({
          ...input,
          currency: input.currency || currency,
        });
        void refresh();
        return res;
      },

      walletSend: async ({ amount, currency: c, recipient }) => {
        const res = await api.walletSend({ amount, currency: c || currency, recipient });
        void refresh();
        return res;
      },

      walletWithdraw: async ({ amount, currency: c, recipient }) => {
        const res = await api.walletWithdraw({ amount, currency: c || currency, recipient });
        void refresh();
        return res;
      },

      walletToReserve: async (reserveId, amount) => {
        const res = await api.moveToReserve({ reserve_id: reserveId, amount });
        setWallet(Number(res.wallet_balance));
        setReserves((rs) =>
          rs.map((r) => (r.id === reserveId ? { ...r, current: Number(res.reserve_balance) } : r)),
        );
        void refresh();
      },

      reserveToWallet: async (reserveId, amount) => {
        const res = await api.moveFromReserve({ reserve_id: reserveId, amount });
        setWallet(Number(res.wallet_balance));
        setReserves((rs) =>
          rs.map((r) => (r.id === reserveId ? { ...r, current: Number(res.reserve_balance) } : r)),
        );
        void refresh();
      },

      createReserve: async (r) => {
        if (!userId) throw new Error("Please sign in first.");
        const { data, error: err } = await supabase
          .from("reserves")
          .insert({
            user_id: userId,
            name: r.name,
            target_type: toDbTargetType(r.targetType),
            target_value: r.targetValue,
            currency: r.currency ?? currency,
          })
          .select("id")
          .single();
        if (err) throw err;
        await refresh();
        return data.id as string;
      },

      updateReserve: async (id, patch) => {
        const { error: err } = await supabase
          .from("reserves")
          .update({
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.targetType !== undefined
              ? { target_type: toDbTargetType(patch.targetType) }
              : {}),
            ...(patch.targetValue !== undefined ? { target_value: patch.targetValue } : {}),
          })
          .eq("id", id);
        if (err) throw err;
        await refresh();
      },

      deleteReserve: async (id) => {
        // The DB trigger rejects deletes when the balance isn't zero.
        const { error: err } = await supabase.from("reserves").delete().eq("id", id);
        if (err) throw err;
        await refresh();
      },
    }),
    [balance, wallet, monthlyCost, currency, reserves, transactions, loading, error, refresh, setMonthlyCost, userId],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}