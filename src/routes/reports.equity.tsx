import { createFileRoute } from "@tanstack/react-router";
import { reportPeriodLabel } from "@/lib/reports-data";
import { DocumentFooter, ReportShell } from "@/components/report-ui";
import { useReportsStore } from "@/lib/reports-store";
import { EquityStatementBody } from "@/components/report-statements";

export const Route = createFileRoute("/reports/equity")({
  head: () => ({
    meta: [
      { title: "Statement of Changes in Equity — Financial Reports — Fortress Reserve" },
      {
        name: "description",
        content:
          "Statement of changes in equity: opening equity, net income, draws, contributions, closing equity.",
      },
      { property: "og:title", content: "Statement of Changes in Equity — Fortress Reserve" },
      {
        property: "og:description",
        content: "Equity roll-forward from opening to closing balance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EquityPage,
});

function EquityPage() {
  const { entries } = useReportsStore();
  return (
    <ReportShell title="Statement of Changes in Equity" subtitle={reportPeriodLabel(entries)}>
      <EquityStatementBody />
      <DocumentFooter />
    </ReportShell>
  );
}
