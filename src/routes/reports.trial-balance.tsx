import { createFileRoute } from "@tanstack/react-router";
import { REPORT_AS_OF_LABEL, trialBalanceRows } from "@/lib/reports-data";
import { DocumentFooter, Money, ReportShell } from "@/components/report-ui";
import { useReportsStore } from "@/lib/reports-store";

export const Route = createFileRoute("/reports/trial-balance")({
  head: () => ({
    meta: [
      { title: "Trial Balance — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Mock trial balance proving total debits equal total credits." },
      { property: "og:title", content: "Trial Balance — Fortress Reserve" },
      { property: "og:description", content: "Mock trial balance with debit and credit columns and balancing totals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrialBalancePage,
});

function TrialBalancePage() {
  const { entries } = useReportsStore();
  const { rows, totalDebit, totalCredit } = trialBalanceRows(entries);
  return (
    <ReportShell title="Trial Balance" subtitle={REPORT_AS_OF_LABEL}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b-2 border-reserve-navy/80 text-[10px] tracking-[0.12em] text-reserve-slate uppercase dark:border-white/70">
              <th className="px-2 py-2 text-left font-semibold">Code</th>
              <th className="px-3 py-2 text-left font-semibold">Account</th>
              <th className="px-3 py-2 text-right font-semibold">Debit</th>
              <th className="px-2 py-2 text-right font-semibold">Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-reserve-navy/5 dark:border-white/5">
                <td className="px-2 py-2 font-mono text-xs text-reserve-slate">{r.code}</td>
                <td className="px-3 py-2 text-reserve-navy dark:text-white/90">{r.name}</td>
                <td className="px-3 py-2 text-right">
                  {r.debit !== 0 && <Money value={r.debit} className="text-reserve-navy dark:text-white/90" />}
                </td>
                <td className="px-2 py-2 text-right">
                  {r.credit !== 0 && <Money value={r.credit} className="text-reserve-navy dark:text-white/90" />}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-reserve-navy font-bold dark:border-white">
              <td className="px-2 py-2.5 text-xs tracking-[0.14em] text-reserve-navy uppercase dark:text-white" colSpan={2}>
                Totals
              </td>
              <td className="px-3 py-2.5 text-right">
                <Money value={totalDebit} className="font-bold text-reserve-navy dark:text-white" />
              </td>
              <td className="px-2 py-2.5 text-right">
                <Money value={totalCredit} className="font-bold text-reserve-navy dark:text-white" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-reserve-slate">
        <span className="inline-block size-1.5 rounded-full bg-reserve-emerald" />
        In balance — total debits equal total credits.
      </p>
      <DocumentFooter />
    </ReportShell>
  );
}
