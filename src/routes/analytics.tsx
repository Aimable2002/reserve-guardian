import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { formatUSD, reserveProgress, computeRunway, type Transaction } from "@/lib/reserve-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Fortress Reserve" },
      { name: "description", content: "Trends for balance, runway, and per-reserve progress." },
      { property: "og:title", content: "Analytics · Fortress Reserve" },
      { property: "og:description", content: "Trends for balance, runway, and per-reserve progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

// Build a 12-point series (weekly) by walking transactions backward from now.
function buildSeries(store: ReturnType<typeof useStore>) {
  const points = 12;
  const stepMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const allocatedNow = store.reserves.reduce((s, r) => s + r.current, 0);
  let total = store.balance;
  let unallocated = store.unallocated;
  let allocated = allocatedNow;
  const series: { t: number; total: number; allocated: number; unallocated: number }[] = [];
  series.push({ t: now, total, allocated, unallocated });
  const txs = [...store.transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  let idx = 0;
  for (let i = 1; i < points; i++) {
    const boundary = now - i * stepMs;
    while (idx < txs.length && +new Date(txs[idx].date) > boundary) {
      const t = txs[idx];
      // Reverse the transaction to walk backwards
      if (t.kind === "deposit") {
        total -= t.amount;
        if (t.to === "unallocated") unallocated -= t.amount;
        else allocated -= t.amount;
      } else if (t.kind === "withdraw") {
        total += t.amount;
        if (t.from === "unallocated") unallocated += t.amount;
        else allocated += t.amount;
      } else if (t.kind === "allocate") {
        unallocated += t.amount;
        allocated -= t.amount;
      } else if (t.kind === "yield") {
        total -= t.amount;
        unallocated -= t.amount;
      }
      idx++;
    }
    series.push({ t: boundary, total, allocated, unallocated });
  }
  return series.reverse();
}

function Sparkline<T>({
  series,
  accessor,
  color,
  fill,
}: {
  series: T[];
  accessor: (p: T) => number;
  color: string;
  fill?: string;
}) {
  const w = 300;
  const h = 80;
  const values = series.map(accessor);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full">
      {fill && <path d={area} fill={fill} />}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyticsPage() {
  const store = useStore();
  const series = useMemo(() => buildSeries(store), [store]);
  const runwaySeries = series.map((p) => ({
    ...p,
    runwayDays: store.monthlyCost > 0 ? (p.total / store.monthlyCost) * 30 : 0,
  }));
  const currentRunway = computeRunway(store.balance, store.monthlyCost);

  const ranked = [...store.reserves]
    .map((r) => ({ r, pct: reserveProgress(r, store.monthlyCost) }))
    .sort((a, b) => b.pct - a.pct);

  const wallet = useMemo(() => buildWalletSeries(store), [store]);

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="py-6">
          <h1 className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            Analytics
          </h1>
          <p className="text-lg font-medium">Trends & Progress</p>
        </header>

        <Tabs defaultValue="reserve" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-reserve-navy/5 p-1">
            <TabsTrigger value="reserve" className="rounded-full text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Reserve
            </TabsTrigger>
            <TabsTrigger value="wallet" className="rounded-full text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reserve" className="mt-5 space-y-6">
        {/* Balance trend */}
        <section className="rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Total Balance</h2>
            <span className="font-mono text-sm font-semibold">{formatUSD(store.balance)}</span>
          </div>
          <p className="text-[11px] text-reserve-slate">Last 12 weeks</p>
          <div className="mt-3">
            <Sparkline
              series={series}
              accessor={(p) => p.total}
              color="oklch(0.208 0.042 265.755)"
              fill="oklch(0.208 0.042 265.755 / 0.08)"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-reserve-navy/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-reserve-slate">Allocated</p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {formatUSD(store.reserves.reduce((s, r) => s + r.current, 0))}
              </p>
              <div className="mt-1">
                <Sparkline
                  series={series}
                  accessor={(p) => p.allocated}
                  color="oklch(0.208 0.042 265.755)"
                />
              </div>
            </div>
            <div className="rounded-xl bg-reserve-emerald/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-reserve-slate">Unallocated</p>
              <p className="mt-1 font-mono text-sm font-semibold">{formatUSD(store.unallocated)}</p>
              <div className="mt-1">
                <Sparkline
                  series={series}
                  accessor={(p) => p.unallocated}
                  color="oklch(0.62 0.14 158)"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Runway trend */}
        <section className="rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Runway</h2>
            <span className="font-mono text-sm font-semibold">
              {currentRunway.months}m · {currentRunway.days}d
            </span>
          </div>
          <p className="text-[11px] text-reserve-slate">
            At {formatUSD(store.monthlyCost)} / month
          </p>
          <div className="mt-3">
            <Sparkline
              series={runwaySeries}
              accessor={(p) => p.runwayDays}
              color="oklch(0.62 0.14 158)"
              fill="oklch(0.62 0.14 158 / 0.1)"
            />
          </div>
        </section>

        {/* Per-reserve comparison */}
        <section>
          <h2 className="mb-3 text-sm font-semibold">Reserve Progress</h2>
          <div className="space-y-3">
            {ranked.map(({ r, pct }) => (
              <div key={r.id} className="rounded-2xl border border-reserve-navy/5 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">{r.name}</span>
                  <span
                    className={`shrink-0 font-mono text-xs font-semibold ${
                      pct >= 100 ? "text-reserve-emerald" : "text-reserve-navy/70"
                    }`}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-reserve-bg">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 100 ? "bg-reserve-emerald" : "bg-reserve-navy/70"
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            ))}
            {ranked.length === 0 && (
              <p className="rounded-2xl border border-dashed border-reserve-navy/10 bg-white/60 p-6 text-center text-xs text-reserve-slate">
                No reserves to compare yet.
              </p>
            )}
          </div>
        </section>
          </TabsContent>

          <TabsContent value="wallet" className="mt-5 space-y-6">
            <WalletAnalytics wallet={wallet} balance={store.wallet} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function buildWalletSeries(store: ReturnType<typeof useStore>) {
  const points = 12;
  const stepMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const walletTxs = store.transactions
    .filter((t) => (["send", "receive", "wallet_in", "wallet_out"] as Transaction["kind"][]).includes(t.kind))
    .slice()
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const buckets = new Array(points).fill(0).map((_, i) => ({
    t: now - (points - 1 - i) * stepMs,
    income: 0,
    spend: 0,
    net: 0,
  }));

  for (const t of walletTxs) {
    const ts = +new Date(t.date);
    const diffWeeks = Math.floor((now - ts) / stepMs);
    const idx = points - 1 - diffWeeks;
    if (idx < 0 || idx >= points) continue;
    const isIn = t.kind === "receive" || t.kind === "wallet_in";
    if (isIn) buckets[idx].income += t.amount;
    else buckets[idx].spend += t.amount;
  }
  let cum = 0;
  for (const b of buckets) {
    cum += b.income - b.spend;
    b.net = cum;
  }

  // Category breakdown by note keyword
  const categories: Record<string, number> = {};
  for (const t of walletTxs) {
    if (t.kind !== "send" && t.kind !== "wallet_out") continue;
    const key = (t.kind === "wallet_out" ? "Reserves" : (t.note ?? t.to ?? "Other")).toString();
    categories[key] = (categories[key] ?? 0) + t.amount;
  }
  const breakdown = Object.entries(categories)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return { buckets, breakdown };
}

function WalletAnalytics({
  wallet,
  balance,
}: {
  wallet: ReturnType<typeof buildWalletSeries>;
  balance: number;
}) {
  const totalSpend = wallet.breakdown.reduce((s, b) => s + b.value, 0);
  return (
    <>
      <section className="rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Wallet Balance</h2>
          <span className="font-mono text-sm font-semibold">{formatUSD(balance)}</span>
        </div>
        <p className="text-[11px] text-reserve-slate">Net cash flow · last 12 weeks</p>
        <div className="mt-3">
          <Sparkline
            series={wallet.buckets}
            accessor={(p) => p.net}
            color="oklch(0.208 0.042 265.755)"
            fill="oklch(0.208 0.042 265.755 / 0.08)"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-reserve-emerald/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-reserve-slate">Income</p>
            <p className="mt-1 font-mono text-sm font-semibold">
              {formatUSD(wallet.buckets.reduce((s, b) => s + b.income, 0))}
            </p>
            <div className="mt-1">
              <Sparkline
                series={wallet.buckets}
                accessor={(p) => p.income}
                color="oklch(0.62 0.14 158)"
              />
            </div>
          </div>
          <div className="rounded-xl bg-destructive/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-reserve-slate">Spending</p>
            <p className="mt-1 font-mono text-sm font-semibold">
              {formatUSD(wallet.buckets.reduce((s, b) => s + b.spend, 0))}
            </p>
            <div className="mt-1">
              <Sparkline
                series={wallet.buckets}
                accessor={(p) => p.spend}
                color="oklch(0.577 0.245 27.325)"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Spending Breakdown</h2>
        <p className="text-[11px] text-reserve-slate">Where wallet outflows went</p>
        {wallet.breakdown.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-reserve-navy/10 bg-white/60 p-4 text-center text-xs text-reserve-slate">
            No wallet spending yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {wallet.breakdown.map((b) => {
              const pct = totalSpend > 0 ? (b.value / totalSpend) * 100 : 0;
              return (
                <li key={b.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-medium capitalize">{b.label}</span>
                    <span className="shrink-0 font-mono text-[11px] font-semibold">
                      {formatUSD(b.value)}{" "}
                      <span className="text-reserve-slate">· {pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-reserve-bg">
                    <div
                      className="h-full rounded-full bg-reserve-navy/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}