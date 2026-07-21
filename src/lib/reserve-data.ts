export type ReserveTargetType = "days" | "amount";

export type Reserve = {
  id: string;
  name: string;
  targetType: ReserveTargetType;
  targetValue: number; // days or dollars
  current: number; // dollars allocated
};

export const INITIAL_BALANCE = 42850;
export const INITIAL_MONTHLY_COST = 3000;

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