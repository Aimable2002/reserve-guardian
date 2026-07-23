import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Sparkles,
  Send,
  QrCode,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatUSD, type Transaction } from "@/lib/reserve-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History · Fortress Reserve" },
      { name: "description", content: "Full ledger of deposits, withdrawals, allocations, and yield." },
      { property: "og:title", content: "History · Fortress Reserve" },
      { property: "og:description", content: "Full transaction log across the vault." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function groupByDay(txs: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const t of txs) {
    const d = new Date(t.date);
    const key = d.toISOString().slice(0, 10);
    (groups[key] ??= []).push(t);
  }
  return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function iconFor(kind: Transaction["kind"]) {
  switch (kind) {
    case "deposit":
      return { Icon: ArrowDownRight, cls: "bg-reserve-emerald/10 text-reserve-emerald" };
    case "withdraw":
      return { Icon: ArrowUpRight, cls: "bg-destructive/10 text-destructive" };
    case "allocate":
      return { Icon: ArrowRightLeft, cls: "bg-reserve-navy/10 text-reserve-navy" };
    case "yield":
      return { Icon: Sparkles, cls: "bg-amber-500/10 text-amber-600" };
    case "send":
      return { Icon: Send, cls: "bg-destructive/10 text-destructive" };
    case "receive":
      return { Icon: QrCode, cls: "bg-reserve-emerald/10 text-reserve-emerald" };
    case "wallet_out":
    case "wallet_in":
      return { Icon: ArrowRightLeft, cls: "bg-reserve-navy/10 text-reserve-navy" };
  }
}

function labelFor(t: Transaction, reserveNames: Record<string, string>) {
  const toName = t.to === "unallocated" ? "Unallocated" : t.to ? reserveNames[t.to] ?? "Reserve" : "";
  const fromName = t.from === "unallocated" ? "Unallocated" : t.from ? reserveNames[t.from] ?? "Reserve" : "";
  switch (t.kind) {
    case "deposit":
      return `Deposit → ${toName}`;
    case "withdraw":
      return `Withdraw ← ${fromName}`;
    case "allocate":
      return `${fromName} → ${toName}`;
    case "yield":
      return `Yield → ${toName}`;
    case "send":
      return `Sent → ${t.to ?? "recipient"}`;
    case "receive":
      return `Received ← ${t.from ?? "sender"}`;
    case "wallet_out":
      return `Wallet → ${t.reserveName ?? toName}`;
    case "wallet_in":
      return `${t.reserveName ?? fromName} → Wallet`;
  }
}

function HistoryPage() {
  const store = useStore();
  const reserveNames = useMemo(
    () => Object.fromEntries(store.reserves.map((r) => [r.id, r.name])),
    [store.reserves],
  );
  const reserveTxs = useMemo(
    () =>
      store.transactions.filter((t) =>
        (["deposit", "withdraw", "allocate", "yield"] as Transaction["kind"][]).includes(t.kind),
      ),
    [store.transactions],
  );
  const walletTxs = useMemo(
    () =>
      store.transactions.filter((t) =>
        (["send", "receive", "wallet_in", "wallet_out"] as Transaction["kind"][]).includes(t.kind),
      ),
    [store.transactions],
  );
  const reserveGroups = useMemo(() => groupByDay(reserveTxs), [reserveTxs]);
  const walletGroups = useMemo(() => groupByDay(walletTxs), [walletTxs]);

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="py-6">
          <h1 className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            History
          </h1>
          <p className="text-lg font-medium">All Transactions</p>
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

          <TabsContent value="reserve" className="mt-5">
            <Ledger groups={reserveGroups} reserveNames={reserveNames} emptyLabel="No reserve activity yet." />
          </TabsContent>
          <TabsContent value="wallet" className="mt-5">
            <Ledger groups={walletGroups} reserveNames={reserveNames} emptyLabel="No wallet activity yet." />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Ledger({
  groups,
  reserveNames,
  emptyLabel,
}: {
  groups: [string, Transaction[]][];
  reserveNames: Record<string, string>;
  emptyLabel: string;
}) {
  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-reserve-navy/10 bg-white/60 p-8 text-center text-xs text-reserve-slate">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="space-y-6">
          {groups.map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-reserve-slate">
                {new Date(day).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-reserve-navy/5 bg-white shadow-sm">
                {items.map((t, i) => {
                  const meta = iconFor(t.kind);
                  if (!meta) return null;
                  const { Icon, cls } = meta;
                  const inflow =
                    t.kind === "deposit" ||
                    t.kind === "allocate" ||
                    t.kind === "yield" ||
                    t.kind === "receive" ||
                    t.kind === "wallet_in";
                  const reserveLink =
                    t.to && t.to !== "unallocated"
                      ? t.to
                      : t.from && t.from !== "unallocated"
                        ? t.from
                        : null;
                  const isReserveId = reserveLink ? reserveNames[reserveLink] != null : false;
                  const content = (
                    <div
                      className={`flex items-center justify-between gap-3 p-4 ${
                        i > 0 ? "border-t border-reserve-navy/5" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${cls}`}>
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{labelFor(t, reserveNames)}</p>
                          <p className="text-[10px] text-reserve-slate">
                            {new Date(t.date).toLocaleTimeString(undefined, {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {t.note ? ` · ${t.note}` : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 font-mono text-sm font-semibold ${
                          t.kind === "allocate"
                            ? "text-reserve-navy"
                            : inflow
                              ? "text-reserve-emerald"
                              : "text-destructive"
                        }`}
                      >
                        {t.kind === "allocate" ? "" : inflow ? "+" : "−"}
                        {formatUSD(t.amount)}
                      </span>
                    </div>
                  );
                  return reserveLink && isReserveId ? (
                    <Link key={t.id} to="/reserves/$id" params={{ id: reserveLink }} className="block active:bg-reserve-bg">
                      {content}
                    </Link>
                  ) : (
                    <div key={t.id}>{content}</div>
                  );
                })}
              </div>
            </section>
          ))}
    </div>
  );
}