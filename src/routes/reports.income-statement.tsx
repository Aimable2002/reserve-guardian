import { createFileRoute } from "@tanstack/react-router";
import { REPORT_PERIOD_LABEL } from "@/lib/reports-data";
import { DocumentFooter, ReportShell } from "@/components/report-ui";
import { IncomeStatementBody } from "@/components/report-statements";

export const Route = createFileRoute("/reports/income-statement")({
  head: () => ({
    meta: [
      { title: "Income Statement — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Mock profit and loss statement with revenue, expenses, and net income." },
      { property: "og:title", content: "Income Statement — Fortress Reserve" },
      { property: "og:description", content: "Mock P&L for July 2026 with revenue, expense breakdown, and net income." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IncomeStatementPage,
});

function IncomeStatementPage() {
  return (
    <ReportShell title="Income Statement" subtitle={REPORT_PERIOD_LABEL}>
      <IncomeStatementBody />
      <DocumentFooter />
    </ReportShell>
  );
}
