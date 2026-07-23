import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Send, QrCode, ArrowDownToLine, ArrowUpFromLine, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatUSD, type Transaction } from "@/lib/reserve-data";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet · Fortress Reserve" },
      { name: "description", content: "Your spendable wallet: send, receive, and move funds to reserves." },
      { property: "og:title", content: "Wallet · Fortress Reserve" },
      { property: "og:description", content: "Send, receive, and move funds between wallet and reserves." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WalletHome,
});

const walletKinds: Transaction["kind"][] = ["send", "receive", "wallet_in", "wallet_out"];

function txMeta(t: Transaction) {
  switch (t.kind) {
    case "receive":
      return { label: `Received · ${t.note ?? "Incoming"}`, sign: "+", tone: "text-reserve-emerald", Icon: ArrowDownRight, iconCls: "bg-reserve-emerald/10 text-reserve-emerald" };
    case "send":
      return { label: `Sent · ${t.note ?? t.to}`, sign: "−", tone: "text-destructive", Icon: ArrowUpRight, iconCls: "bg-destructive/10 text-destructive" };
    case "wallet_in":
      return { label: `From ${t.reserveName ?? "Reserve"}`, sign: "+", tone: "text-reserve-emerald", Icon: ArrowRightLeft, iconCls: "bg-reserve-navy/10 text-reserve-navy" };
    case "wallet_out":
      return { label: `To ${t.reserveName ?? "Reserve"}`, sign: "−", tone: "text-reserve-navy", Icon: ArrowRightLeft, iconCls: "bg-reserve-navy/10 text-reserve-navy" };
    default:
      return { label: t.kind, sign: "", tone: "", Icon: ArrowRightLeft, iconCls: "" };
  }
}

function WalletHome() {
  const store = useStore();
  const recent = useMemo(
    () => store.transactions.filter((t) => walletKinds.includes(t.kind)).slice(0, 5),
    [store.transactions],
  );

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="py-6">
          <h1 className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            Wallet
          </h1>
          <p className="text-lg font-medium">Spendable Balance</p>
        </header>

        {/* Balance Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-reserve-navy p-7 text-white shadow-2xl shadow-reserve-navy/20">
          <div className="relative z-10">
            <p className="mb-1 text-sm text-white/60">Available to Spend</p>
            <h2 className="mb-6 font-mono text-4xl font-semibold tracking-tight">
              {formatUSD(store.wallet)}
            </h2>
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-white/60">
                  Reserved Elsewhere
                </p>
                <p className="font-mono text-lg font-semibold">{formatUSD(store.balance)}</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                <span className="font-mono text-[10px] font-bold text-reserve-emerald">CASH</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 -mr-16 -mt-16 size-48 bg-reserve-emerald/20 blur-3xl" />
        </section>

        {/* Quick actions */}
        <section className="mt-8 grid grid-cols-2 gap-3">
          <QuickAction to="/wallet/send" Icon={Send} title="Send" hint="Pay someone" />
          <QuickAction to="/wallet/receive" Icon={QrCode} title="Receive" hint="Share code" />
          <QuickAction to="/wallet/move-out" Icon={ArrowUpFromLine} title="Move to Reserve" hint="Save into a vault" />
          <QuickAction to="/wallet/move-in" Icon={ArrowDownToLine} title="Move from Reserve" hint="Pull to wallet" />
        </section>

        {/* Recent activity */}
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            <Link to="/history" className="text-[11px] font-semibold text-reserve-slate active:opacity-70">
              See all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-reserve-navy/10 bg-white/60 p-6 text-center text-xs text-reserve-slate">
              No wallet activity yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-reserve-navy/5 bg-white shadow-sm">
              {recent.map((t, i) => {
                const m = txMeta(t);
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between gap-3 p-4 ${
                      i > 0 ? "border-t border-reserve-navy/5" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${m.iconCls}`}>
                        <m.Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{m.label}</p>
                        <p className="text-[10px] text-reserve-slate">
                          {new Date(t.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 font-mono text-sm font-semibold ${m.tone}`}>
                      {m.sign}
                      {formatUSD(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  Icon,
  title,
  hint,
}: {
  to: "/wallet/send" | "/wallet/receive" | "/wallet/move-in" | "/wallet/move-out";
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-[76px] flex-col items-start justify-center rounded-2xl border border-reserve-navy/5 bg-white p-4 shadow-sm transition-transform active:scale-95"
    >
      <Icon className="mb-2 size-4 text-reserve-navy" />
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-[10px] uppercase text-reserve-slate">{hint}</span>
    </Link>
  );
}