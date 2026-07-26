export type ReserveTargetType = "days" | "amount";

export const DEFAULT_CURRENCY = "RWF";
export const DEFAULT_MONTHLY_COST = 300000;

export type Reserve = {
  id: string;
  name: string;
  targetType: ReserveTargetType;
  targetValue: number; // days or currency units
  current: number; // balance from the reserve_balance RPC
  currency: string;
  archived?: boolean;
};

export type TxKind =
  | "deposit"
  | "withdraw"
  | "allocate"
  | "yield"
  | "send"
  | "receive"
  | "wallet_out"
  | "wallet_in";

export type Transaction = {
  id: string;
  kind: TxKind;
  amount: number;
  // "unallocated" or a reserve id
  from?: string;
  to?: string;
  reserveName?: string;
  date: string; // ISO
  note?: string;
  currency: string;
  status: string;
  reference?: string;
};

/** A raw row from the `ledger_entries` table. */
export type LedgerEntry = {
  id: string;
  user_id: string;
  account_type: "wallet" | "reserve" | string;
  reserve_id: string | null;
  entry_kind: string;
  amount: number | string;
  currency: string | null;
  status: string;
  reference: string | null;
  provider: string | null;
  provider_tx_id: string | null;
  counterparty: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

/** A raw row from the `reserves` table. */
export type ReserveRow = {
  id: string;
  name: string;
  target_type: string | null;
  target_value: number | string | null;
  currency: string | null;
  archived: boolean | null;
  created_at: string;
};

export function mapReserveRow(row: ReserveRow, balance: number): Reserve {
  return {
    id: row.id,
    name: row.name,
    targetType: row.target_type === "days" ? "days" : "amount",
    targetValue: Number(row.target_value ?? 0),
    current: balance,
    currency: row.currency ?? DEFAULT_CURRENCY,
    archived: !!row.archived,
  };
}

/** Maps a ledger row onto the transaction shape the UI already renders. */
export function mapLedgerEntry(
  e: LedgerEntry,
  reserveNames: Record<string, string>,
): Transaction {
  const reserveId = e.reserve_id ?? undefined;
  const reserveName = reserveId ? reserveNames[reserveId] : undefined;
  const note =
    (typeof e.meta?.note === "string" ? (e.meta.note as string) : undefined) ??
    e.counterparty ??
    undefined;

  const base = {
    id: e.id,
    amount: Math.abs(Number(e.amount ?? 0)),
    date: e.created_at,
    currency: e.currency ?? DEFAULT_CURRENCY,
    status: e.status,
    reference: e.reference ?? undefined,
    reserveName,
    note,
  };

  switch (e.entry_kind) {
    case "deposit":
      return { ...base, kind: "deposit", to: reserveId ?? "unallocated" };
    case "withdrawal":
      return { ...base, kind: "withdraw", from: reserveId ?? "unallocated" };
    case "send":
      return { ...base, kind: "send", from: "wallet", to: e.counterparty ?? "recipient" };
    case "receive":
      return { ...base, kind: "receive", from: e.counterparty ?? "sender", to: "wallet" };
    case "move_to_reserve":
      return { ...base, kind: "wallet_out", from: "wallet", to: reserveId };
    case "move_from_reserve":
      return { ...base, kind: "wallet_in", from: reserveId, to: "wallet" };
    default:
      return { ...base, kind: "yield", to: reserveId ?? "unallocated" };
  }
}

export function targetAmount(r: Reserve, monthlyCost: number): number {
  return r.targetType === "amount"
    ? r.targetValue
    : (r.targetValue / 30) * monthlyCost;
}

export function reserveProgress(r: Reserve, monthlyCost: number): number {
  const target = targetAmount(r, monthlyCost);
  if (target <= 0) return 0;
  return Math.min(100, (r.current / target) * 100);
}

/** Formats using each row's own currency, defaulting to NGN. */
export function formatMoney(n: number, currency: string = DEFAULT_CURRENCY): string {
  const value = Number.isFinite(n) ? n : 0;
  try {
    return value.toLocaleString(undefined, {
      style: "currency",
      currency: currency || DEFAULT_CURRENCY,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    });
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function computeRunway(balance: number, monthlyCost: number) {
  if (monthlyCost <= 0) return { months: 0, days: 0, totalDays: 0 };
  const totalDays = (balance / monthlyCost) * 30;
  const months = Math.floor(totalDays / 30);
  const days = Math.round(totalDays - months * 30);
  return { months, days, totalDays };
}