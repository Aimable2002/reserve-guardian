import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileBarChart2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportsStoreProvider, useReportsStore } from "@/lib/reports-store";
import { JournalEntryDialog } from "@/components/journal-entry-dialog";
import { FirstTimeSetup } from "@/components/first-time-setup";
import { Button } from "@/components/ui/button";

const reportNav = [
  { to: "/reports/general-ledger", label: "General Ledger" },
  { to: "/reports/journal", label: "Journal" },
  { to: "/reports/trial-balance", label: "Trial Balance" },
  { to: "/reports/income-statement", label: "Income Statement" },
  { to: "/reports/balance-sheet", label: "Balance Sheet" },
  { to: "/reports/cash-flow", label: "Cash Flow" },
  { to: "/reports/equity", label: "Changes in Equity" },
  { to: "/reports/financial-report", label: "Financial Report" },
  { to: "/reports/accounts", label: "Chart of Accounts" },
] as const;

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Financial Reports — Fortress Reserve" },
      {
        name: "description",
        content: "Accounting-standard financial reports prototype with mock data.",
      },
    ],
  }),
  component: ReportsLayout,
});

function ReportsLayout() {
  return (
    <ReportsStoreProvider>
      <ReportsLayoutInner />
    </ReportsStoreProvider>
  );
}

function ReportsLayoutInner() {
  const [entryOpen, setEntryOpen] = useState(false);
  const store = useReportsStore();

  return (
    <div className="min-h-screen bg-reserve-bg text-reserve-navy dark:bg-reserve-navy dark:text-white">
      <header className="border-b border-reserve-navy/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-reserve-navy/60">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-reserve-navy text-white dark:bg-white dark:text-reserve-navy">
            <FileBarChart2 className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight">Financial Reports</h1>
            <p className="text-[11px] text-reserve-slate">
              Manual bookkeeping · your private books{store.currency ? ` · ${store.currency}` : ""}
            </p>
          </div>
          {!store.needsSetup && !store.error && (
            <Button
              type="button"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => setEntryOpen(true)}
            >
              <Plus /> <span className="hidden sm:inline">New journal entry</span>
              <span className="sm:hidden">Record</span>
            </Button>
          )}
        </div>
      </header>
      <JournalEntryDialog open={entryOpen} onOpenChange={setEntryOpen} />

      <div className="mx-auto max-w-5xl gap-8 px-4 py-6 sm:px-6 md:flex">
        {store.error ? (
          // Never fall through to a "normal" view with an empty chart of
          // accounts — that's how a broken load (e.g. a migration that
          // hasn't been run yet) looks identical to a healthy empty state.
          // Fail loudly instead.
          <div className="mx-auto w-full max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-8">
            <h2 className="text-lg font-bold text-destructive">Couldn't load your books</h2>
            <p className="mt-2 text-sm text-reserve-slate">{store.error}</p>
            <p className="mt-2 text-xs text-reserve-slate">
              If this is a new setup, check that the <code>report_settings</code> migration has been
              run on the database.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void store.reload()}
            >
              Try again
            </Button>
          </div>
        ) : store.needsSetup ? (
          <div className="w-full">
            <FirstTimeSetup />
          </div>
        ) : (
          <>
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
                    className:
                      "bg-reserve-navy text-white hover:bg-reserve-navy dark:bg-white dark:text-reserve-navy dark:hover:bg-white",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <main className="min-w-0 flex-1 pb-32">
              <Outlet />
            </main>
          </>
        )}
      </div>
    </div>
  );
}
