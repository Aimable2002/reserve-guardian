import { createFileRoute } from "@tanstack/react-router";
import { reportAsOfLabel } from "@/lib/reports-data";
import { DocumentFooter, ReportShell } from "@/components/report-ui";
import { BalanceSheetBody } from "@/components/report-statements";

export const Route = createFileRoute("/reports/balance-sheet")({
  head: () => ({
    meta: [
      { title: "Balance Sheet — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Your assets, liabilities, and equity as of today." },
      { property: "og:title", content: "Balance Sheet — Fortress Reserve" },
      {
        property: "og:description",
        content:
          "Balance sheet with current and non-current splits; assets equal liabilities plus equity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BalanceSheetPage,
});

function BalanceSheetPage() {
  return (
    <ReportShell title="Balance Sheet" subtitle={reportAsOfLabel()}>
      <BalanceSheetBody />
      <DocumentFooter />
    </ReportShell>
  );
}
