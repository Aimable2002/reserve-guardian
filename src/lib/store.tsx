import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  INITIAL_BALANCE,
  INITIAL_MONTHLY_COST,
  INITIAL_RESERVES,
  INITIAL_TRANSACTIONS,
  INITIAL_UNALLOCATED,
  type Reserve,
  type Transaction,
} from "./reserve-data";

type State = {
  balance: number;
  unallocated: number;
  monthlyCost: number;
  reserves: Reserve[];
  transactions: Transaction[];
};

type Ctx = State & {
  setMonthlyCost: (v: number) => void;
  depositToUnallocated: (amount: number) => void;
  withdrawFromUnallocated: (amount: number) => boolean;
  depositToReserve: (reserveId: string, amount: number) => void;
  withdrawFromReserve: (reserveId: string, amount: number) => boolean;
  allocate: (reserveId: string, amount: number) => boolean;
  createReserve: (r: Omit<Reserve, "id" | "current">) => string;
  updateReserve: (id: string, patch: Partial<Pick<Reserve, "name" | "targetType" | "targetValue">>) => void;
  deleteReserve: (id: string) => boolean;
};

const StoreContext = createContext<Ctx | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [unallocated, setUnallocated] = useState(INITIAL_UNALLOCATED);
  const [monthlyCost, setMonthlyCost] = useState(INITIAL_MONTHLY_COST);
  const [reserves, setReserves] = useState<Reserve[]>(INITIAL_RESERVES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  const pushTx = (tx: Omit<Transaction, "id" | "date"> & { date?: string }) =>
    setTransactions((prev) => [
      { id: uid(), date: tx.date ?? new Date().toISOString(), ...tx },
      ...prev,
    ]);

  const value = useMemo<Ctx>(
    () => ({
      balance,
      unallocated,
      monthlyCost,
      reserves,
      transactions,
      setMonthlyCost,
      depositToUnallocated: (amount) => {
        setBalance((b) => b + amount);
        setUnallocated((u) => u + amount);
        pushTx({ kind: "deposit", amount, to: "unallocated" });
      },
      withdrawFromUnallocated: (amount) => {
        if (amount > unallocated) return false;
        setBalance((b) => b - amount);
        setUnallocated((u) => u - amount);
        pushTx({ kind: "withdraw", amount, from: "unallocated" });
        return true;
      },
      depositToReserve: (reserveId, amount) => {
        const r = reserves.find((x) => x.id === reserveId);
        if (!r) return;
        setBalance((b) => b + amount);
        setReserves((rs) => rs.map((x) => (x.id === reserveId ? { ...x, current: x.current + amount } : x)));
        pushTx({ kind: "deposit", amount, to: reserveId, reserveName: r.name });
      },
      withdrawFromReserve: (reserveId, amount) => {
        const r = reserves.find((x) => x.id === reserveId);
        if (!r || amount > r.current) return false;
        setBalance((b) => b - amount);
        setReserves((rs) => rs.map((x) => (x.id === reserveId ? { ...x, current: x.current - amount } : x)));
        pushTx({ kind: "withdraw", amount, from: reserveId, reserveName: r.name });
        return true;
      },
      allocate: (reserveId, amount) => {
        const r = reserves.find((x) => x.id === reserveId);
        if (!r || amount > unallocated) return false;
        setUnallocated((u) => u - amount);
        setReserves((rs) => rs.map((x) => (x.id === reserveId ? { ...x, current: x.current + amount } : x)));
        pushTx({ kind: "allocate", amount, from: "unallocated", to: reserveId, reserveName: r.name });
        return true;
      },
      createReserve: (r) => {
        const id = uid();
        setReserves((rs) => [...rs, { id, current: 0, ...r }]);
        return id;
      },
      updateReserve: (id, patch) => {
        setReserves((rs) => rs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      },
      deleteReserve: (id) => {
        const r = reserves.find((x) => x.id === id);
        if (!r || r.current > 0) return false;
        setReserves((rs) => rs.filter((x) => x.id !== id));
        return true;
      },
    }),
    [balance, unallocated, monthlyCost, reserves, transactions],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}