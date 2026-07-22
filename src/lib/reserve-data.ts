export type ReserveTargetType = "days" | "amount";

export type Reserve = {
  id: string;
  name: string;
  targetType: ReserveTargetType;
  targetValue: number; // days or dollars
  current: number; // dollars allocated
};

export const INITIAL_MONTHLY_COST = 3000;
export const INITIAL_UNALLOCATED = 4200;

export const INITIAL_RESERVES: Reserve[] = [
  {
    id: "emergency",
    name: "Emergency Survival",
    targetType: "days",
    targetValue: 365,
    current: 30600,
  },
  {
    id: "sabbatical",
    name: "Winter Sabbatical",
    targetType: "amount",
    targetValue: 10000,
    current: 7250,
  },
  {
    id: "health",
    name: "Health Buffer",
    targetType: "days",
    targetValue: 180,
    current: 5000,
  },
];

export const INITIAL_BALANCE =
  INITIAL_UNALLOCATED +
  INITIAL_RESERVES.reduce((sum, r) => sum + r.current, 0);

export type TxKind = "deposit" | "withdraw" | "allocate" | "yield";

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
};

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "t1", kind: "deposit", amount: 5000, to: "unallocated", date: new Date(now - 30 * day).toISOString(), note: "Initial funding" },
  { id: "t2", kind: "allocate", amount: 30600, from: "unallocated", to: "emergency", reserveName: "Emergency Survival", date: new Date(now - 25 * day).toISOString() },
  { id: "t3", kind: "yield", amount: 220, to: "unallocated", date: new Date(now - 18 * day).toISOString(), note: "Monthly yield" },
  { id: "t4", kind: "allocate", amount: 7250, from: "unallocated", to: "sabbatical", reserveName: "Winter Sabbatical", date: new Date(now - 14 * day).toISOString() },
  { id: "t5", kind: "allocate", amount: 5000, from: "unallocated", to: "health", reserveName: "Health Buffer", date: new Date(now - 9 * day).toISOString() },
  { id: "t6", kind: "yield", amount: 180, to: "unallocated", date: new Date(now - 3 * day).toISOString(), note: "Monthly yield" },
];

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

export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

export function computeRunway(balance: number, monthlyCost: number) {
  if (monthlyCost <= 0) return { months: 0, days: 0, totalDays: 0 };
  const totalDays = (balance / monthlyCost) * 30;
  const months = Math.floor(totalDays / 30);
  const days = Math.round(totalDays - months * 30);
  return { months, days, totalDays };
}