import { createFileRoute } from "@tanstack/react-router";
import { REPORT_PERIOD_LABEL } from "@/lib/reports-data";
import { DocumentFooter, ReportShell } from "@/components/report-ui";
import { EquityStatementBody } from "@/components/report-statements";

export const Route = createFileRoute("/reports/equity")({
  head: () => ({
    meta: [
      { title: "Statement of Changes in Equity — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Mock statement of changes in equity: opening equity, net income, draws, contributions, closing equity." },
      { property: "og:title", content: "Statement of Changes in Equity — Fortress Reserve" },
      { property: "og:description", content: "Mock equity roll-forward from opening to closing balance for July 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EquityPage,
});

function EquityPage() {
  return (
    <ReportShell title="Statement of Changes in Equity" subtitle={REPORT_PERIOD_LABEL}>
      <EquityStatementBody />
      <DocumentFooter />
    </ReportShell>
  );
}
