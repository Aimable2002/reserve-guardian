import { createFileRoute } from "@tanstack/react-router";
import { reportPeriodLabel } from "@/lib/reports-data";
import { DocumentFooter, ReportShell } from "@/components/report-ui";
import { useReportsStore } from "@/lib/reports-store";
import { IncomeStatementBody } from "@/components/report-statements";

export const Route = createFileRoute("/reports/income-statement")({
  head: () => ({
    meta: [
      { title: "Income Statement — Financial Reports — Fortress Reserve" },
      {
        name: "description",
        content: "Profit and loss statement with revenue, expenses, and net income.",
      },
      { property: "og:title", content: "Income Statement — Fortress Reserve" },
      {
        property: "og:description",
        content: "P&L with revenue, expense breakdown, and net income.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IncomeStatementPage,
});

function IncomeStatementPage() {
  const { entries } = useReportsStore();
  return (
    <ReportShell title="Income Statement" subtitle={reportPeriodLabel(entries)}>
      <IncomeStatementBody />
      <DocumentFooter />
    </ReportShell>
  );
}
