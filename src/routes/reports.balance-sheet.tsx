import { createFileRoute } from "@tanstack/react-router";
import { REPORT_AS_OF_LABEL } from "@/lib/reports-data";
import { DocumentFooter, ReportShell } from "@/components/report-ui";
import { BalanceSheetBody } from "@/components/report-statements";

export const Route = createFileRoute("/reports/balance-sheet")({
  head: () => ({
    meta: [
      { title: "Balance Sheet — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Mock balance sheet: assets, liabilities, and equity balancing as of July 31, 2026." },
      { property: "og:title", content: "Balance Sheet — Fortress Reserve" },
      { property: "og:description", content: "Mock balance sheet with current and non-current splits; assets equal liabilities plus equity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BalanceSheetPage,
});

function BalanceSheetPage() {
  return (
    <ReportShell title="Balance Sheet" subtitle={REPORT_AS_OF_LABEL}>
      <BalanceSheetBody />
      <DocumentFooter />
    </ReportShell>
  );
}
