import { createFileRoute } from "@tanstack/react-router";
import { reportPeriodLabel } from "@/lib/reports-data";
import { DocumentFooter, ReportShell } from "@/components/report-ui";
import { useReportsStore } from "@/lib/reports-store";
import { CashFlowBody } from "@/components/report-statements";

export const Route = createFileRoute("/reports/cash-flow")({
  head: () => ({
    meta: [
      { title: "Cash Flow Statement — Financial Reports — Fortress Reserve" },
      {
        name: "description",
        content: "Cash flow statement across operating, investing, and financing activities.",
      },
      { property: "og:title", content: "Cash Flow Statement — Fortress Reserve" },
      {
        property: "og:description",
        content: "Cash flow with operating, investing, financing sections and net change in cash.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CashFlowPage,
});

function CashFlowPage() {
  const { entries } = useReportsStore();
  return (
    <ReportShell title="Statement of Cash Flows" subtitle={reportPeriodLabel(entries)}>
      <CashFlowBody />
      <DocumentFooter />
    </ReportShell>
  );
}
