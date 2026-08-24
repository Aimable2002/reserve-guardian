import { createFileRoute } from "@tanstack/react-router";
import { REPORT_PERIOD_LABEL } from "@/lib/reports-data";
import { DocumentFooter, ReportShell } from "@/components/report-ui";
import { CashFlowBody } from "@/components/report-statements";

export const Route = createFileRoute("/reports/cash-flow")({
  head: () => ({
    meta: [
      { title: "Cash Flow Statement — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Mock cash flow statement across operating, investing, and financing activities." },
      { property: "og:title", content: "Cash Flow Statement — Fortress Reserve" },
      { property: "og:description", content: "Mock cash flow with operating, investing, financing sections and net change in cash." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CashFlowPage,
});

function CashFlowPage() {
  return (
    <ReportShell title="Statement of Cash Flows" subtitle={REPORT_PERIOD_LABEL}>
      <CashFlowBody />
      <DocumentFooter />
    </ReportShell>
  );
}
