import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { REPORT_AS_OF_LABEL, REPORT_ENTITY, REPORT_PERIOD_LABEL } from "@/lib/reports-data";
import {
  BalanceSheetBody,
  CashFlowBody,
  EquityStatementBody,
  IncomeStatementBody,
} from "@/components/report-statements";

export const Route = createFileRoute("/reports/financial-report")({
  head: () => ({
    meta: [
      { title: "Financial Report — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Bundled mock financial report: income statement, balance sheet, cash flow, and equity statement with notes." },
      { property: "og:title", content: "Financial Report — Fortress Reserve" },
      { property: "og:description", content: "Combined print-friendly mock financial statements for July 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinancialReportPage,
});

function DocPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-b border-dashed border-reserve-navy/15 py-8 first:pt-0 last:border-0 dark:border-white/15 print:break-after-page print:border-0">
      <div className="mb-5 text-center">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-reserve-slate uppercase">{REPORT_ENTITY}</p>
        <h3 className="mt-1 text-lg font-bold text-reserve-navy dark:text-white">{title}</h3>
        <p className="text-xs text-reserve-slate">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function FinancialReportPage() {
  return (
    <div className="rounded-2xl border border-reserve-navy/10 bg-white p-5 shadow-sm sm:p-10 dark:border-white/10 dark:bg-reserve-navy/40 print:border-0 print:shadow-none">
      {/* Cover header */}
      <div className="mb-8 border-b-2 border-reserve-navy pb-6 text-center dark:border-white">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-reserve-slate uppercase">{REPORT_ENTITY}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-reserve-navy sm:text-3xl dark:text-white">
          Financial Report
        </h2>
        <p className="mt-1 text-sm text-reserve-slate">{REPORT_PERIOD_LABEL}</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-reserve-navy/15 px-3 py-1.5 text-xs font-semibold text-reserve-navy transition hover:bg-reserve-navy/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10 print:hidden"
        >
          <Printer className="size-3.5" /> Print / Save as PDF
        </button>
      </div>

      <DocPage title="Income Statement" subtitle={REPORT_PERIOD_LABEL}>
        <IncomeStatementBody />
      </DocPage>

      <DocPage title="Balance Sheet" subtitle={REPORT_AS_OF_LABEL}>
        <BalanceSheetBody />
      </DocPage>

      <DocPage title="Statement of Cash Flows" subtitle={REPORT_PERIOD_LABEL}>
        <CashFlowBody />
      </DocPage>

      <DocPage title="Statement of Changes in Equity" subtitle={REPORT_PERIOD_LABEL}>
        <EquityStatementBody />
      </DocPage>

      {/* Notes */}
      <section className="pt-8 print:break-after-page">
        <div className="mb-5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-reserve-slate uppercase">{REPORT_ENTITY}</p>
          <h3 className="mt-1 text-lg font-bold text-reserve-navy dark:text-white">Notes to the Financial Statements</h3>
          <p className="text-xs text-reserve-slate">{REPORT_PERIOD_LABEL}</p>
        </div>
        <ol className="list-decimal space-y-3 pl-5 text-[13px] leading-relaxed text-reserve-navy/90 dark:text-white/85">
          <li>
            <span className="font-semibold">Basis of preparation.</span> These statements are prepared on the accrual
            basis. Revenue is recognized when earned and expenses when incurred, regardless of when cash changes hands.
          </li>
          <li>
            <span className="font-semibold">Cash and cash equivalents.</span> Cash consists solely of the operating
            checking account. No restricted cash or cash equivalents were held during the period.
          </li>
          <li>
            <span className="font-semibold">Accounts receivable.</span> Receivables are stated at invoiced amounts. No
            allowance for doubtful accounts has been recorded, as all balances are considered collectible.
          </li>
          <li>
            <span className="font-semibold">Equipment.</span> Equipment is carried at cost. No depreciation has been
            recorded in this mock period for presentation simplicity.
          </li>
          <li>
            <span className="font-semibold">Loan payable.</span> The loan balance represents a long-term note with no
            scheduled principal payments due within the next twelve months.
          </li>
          <li>
            <span className="font-semibold">Prototyping disclaimer.</span> All figures in this report are mock data
            generated for interface review. They do not represent real accounts, users, or transactions, and this
            document must not be relied upon for any financial purpose.
          </li>
        </ol>
      </section>

      <p className="mt-10 border-t border-reserve-navy/10 pt-3 text-center text-[11px] text-reserve-slate dark:border-white/10">
        Fortress Reserve — Financial Reports prototype · Mock data only · Generated for UI/UX review
      </p>
    </div>
  );
}
