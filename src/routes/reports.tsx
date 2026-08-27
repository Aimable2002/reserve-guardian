import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { FileBarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportsStoreProvider } from "@/lib/reports-store";

const reportNav = [
  { to: "/reports/general-ledger", label: "General Ledger" },
  { to: "/reports/journal", label: "Journal" },
  { to: "/reports/trial-balance", label: "Trial Balance" },
  { to: "/reports/income-statement", label: "Income Statement" },
  { to: "/reports/balance-sheet", label: "Balance Sheet" },
  { to: "/reports/cash-flow", label: "Cash Flow" },
  { to: "/reports/equity", label: "Changes in Equity" },
  { to: "/reports/financial-report", label: "Financial Report" },
] as const;

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Financial Reports — Fortress Reserve" },
      { name: "description", content: "Accounting-standard financial reports prototype with mock data." },
    ],
  }),
  component: ReportsLayout,
});

function ReportsLayout() {
  return (
    <ReportsStoreProvider>
    <div className="min-h-screen bg-reserve-bg text-reserve-navy dark:bg-reserve-navy dark:text-white">
      <header className="border-b border-reserve-navy/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-reserve-navy/60">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-reserve-navy text-white dark:bg-white dark:text-reserve-navy">
            <FileBarChart2 className="size-4" />
          </span>
          <div>
            <h1 className="text-base font-bold tracking-tight">Financial Reports</h1>
            <p className="text-[11px] text-reserve-slate">Mock data prototype · July 2026 · USD</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl gap-8 px-4 py-6 sm:px-6 md:flex">
        {/* Sidebar on desktop, horizontal scroll tabs on mobile */}
        <nav
          aria-label="Report documents"
          className="scrollbar-none -mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:mb-0 md:w-52 md:shrink-0 md:flex-col md:overflow-visible md:px-0"
        >
          {reportNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium whitespace-nowrap text-reserve-slate transition hover:bg-reserve-navy/5 dark:hover:bg-white/5",
              )}
              activeProps={{
                className: "bg-reserve-navy text-white hover:bg-reserve-navy dark:bg-white dark:text-reserve-navy dark:hover:bg-white",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1 pb-32">
          <Outlet />
        </main>
      </div>
    </div>
    </ReportsStoreProvider>
  );
}
