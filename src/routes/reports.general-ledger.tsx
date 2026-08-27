import { createFileRoute } from "@tanstack/react-router";
import {
  REPORT_ACCOUNTS,
  REPORT_PERIOD_LABEL,
  closingBalance,
  fmtReportDate,
  ledgerForAccount,
} from "@/lib/reports-data";
import { DocumentFooter, Money, ReportShell } from "@/components/report-ui";
import { cn } from "@/lib/utils";
import { useReportsStore } from "@/lib/reports-store";

export const Route = createFileRoute("/reports/general-ledger")({
  head: () => ({
    meta: [
      { title: "General Ledger — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Chronological mock transaction history and running balance per account." },
      { property: "og:title", content: "General Ledger — Fortress Reserve" },
      { property: "og:description", content: "Mock general ledger with per-account running balances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GeneralLedgerPage,
});

const TYPE_BADGE: Record<string, string> = {
  asset: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  liability: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  equity: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  revenue: "bg-reserve-emerald/10 text-emerald-700 dark:text-emerald-300",
  expense: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

function GeneralLedgerPage() {
  const { entries } = useReportsStore();
  return (
    <ReportShell title="General Ledger" subtitle={REPORT_PERIOD_LABEL}>
      <div className="space-y-8">
        {REPORT_ACCOUNTS.map((acc) => {
          const rows = ledgerForAccount(acc.code, entries);
          const closing = closingBalance(acc.code, entries);
          return (
            <section
              key={acc.code}
              aria-label={`${acc.name} ledger`}
              className="overflow-hidden rounded-xl border border-reserve-navy/10 dark:border-white/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-reserve-navy/10 bg-reserve-navy/[0.03] px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-reserve-slate">{acc.code}</span>
                  <h3 className="text-sm font-bold text-reserve-navy dark:text-white">{acc.name}</h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                      TYPE_BADGE[acc.type],
                    )}
                  >
                    {acc.type}
                  </span>
                </div>
                <div className="text-xs text-reserve-slate">
                  Closing: <Money value={closing} className="font-semibold text-reserve-navy dark:text-white" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-reserve-navy/10 text-[10px] tracking-[0.12em] text-reserve-slate uppercase dark:border-white/10">
                      <th className="px-4 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-left font-semibold">Ref</th>
                      <th className="px-3 py-2 text-left font-semibold">Description</th>
                      <th className="px-3 py-2 text-right font-semibold">Debit</th>
                      <th className="px-3 py-2 text-right font-semibold">Credit</th>
                      <th className="px-4 py-2 text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-reserve-navy/5 text-reserve-slate italic dark:border-white/5">
                      <td className="px-4 py-2">Jul 1, 2026</td>
                      <td className="px-3 py-2 font-mono text-xs">OPEN</td>
                      <td className="px-3 py-2">Opening balance</td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-4 py-2 text-right">
                        <Money value={acc.opening} className="text-reserve-slate" />
                      </td>
                    </tr>
                    {rows.map((r, i) => (
                      <tr key={`${r.ref}-${i}`} className="border-b border-reserve-navy/5 dark:border-white/5">
                        <td className="px-4 py-2 whitespace-nowrap text-reserve-navy dark:text-white/90">
                          {fmtReportDate(r.date)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-reserve-slate">{r.ref}</td>
                        <td className="px-3 py-2 text-reserve-navy dark:text-white/90">{r.description}</td>
                        <td className="px-3 py-2 text-right">
                          {r.debit !== 0 && <Money value={r.debit} className="text-reserve-navy dark:text-white/90" />}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.credit !== 0 && <Money value={r.credit} className="text-reserve-navy dark:text-white/90" />}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Money value={r.balance} className="font-medium text-reserve-navy dark:text-white" />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-reserve-navy/[0.03] font-semibold dark:bg-white/5">
                      <td className="px-4 py-2 text-xs tracking-wide text-reserve-navy uppercase dark:text-white" colSpan={5}>
                        Closing balance, Jul 31, 2026
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Money value={closing} className="font-bold text-reserve-navy dark:text-white" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
      <DocumentFooter />
    </ReportShell>
  );
}
