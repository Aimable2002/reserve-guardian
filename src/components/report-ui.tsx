import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fmtReportMoney } from "@/lib/reports-data";
import { useReportsStore } from "@/lib/reports-store";

/**
 * Presentational primitives shared by every Financial Reports document.
 * Currency and entity name come from the live store — never hardcoded.
 */

export function ReportShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { entityName } = useReportsStore();
  return (
    <div className="rounded-2xl border border-reserve-navy/10 bg-white p-5 shadow-sm sm:p-8 dark:border-white/10 dark:bg-reserve-navy/40">
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-reserve-slate uppercase">
          {entityName}
        </p>
        <h2 className="mt-1 text-xl font-bold text-reserve-navy sm:text-2xl dark:text-white">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-reserve-slate">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function Money({ value, className }: { value: number; className?: string }) {
  // Currency is per-user (set during first-time setup) — never a fixed default.
  const { currency } = useReportsStore();
  return (
    <span className={cn("font-mono text-[13px] tabular-nums", className)}>
      {fmtReportMoney(value, currency ?? "USD")}
    </span>
  );
}

/** Section band inside a statement, e.g. "Assets" / "Operating Activities". */
export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 mb-2 border-b-2 border-reserve-navy/80 pb-1 text-xs font-bold tracking-[0.14em] text-reserve-navy uppercase first:mt-0 dark:border-white/70 dark:text-white">
      {children}
    </div>
  );
}

export function SubSectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 mb-1 text-[11px] font-semibold tracking-[0.1em] text-reserve-slate uppercase">
      {children}
    </div>
  );
}

export function StatementRow({
  label,
  amount,
  indent,
  negative,
}: {
  label: string;
  amount: number;
  indent?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className={cn("text-sm text-reserve-navy dark:text-white/90", indent && "pl-5")}>
        {label}
      </span>
      <Money value={negative ? -amount : amount} className="text-reserve-navy dark:text-white/90" />
    </div>
  );
}

/** Bold totals row — single top rule. */
export function TotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-reserve-navy/30 py-2 dark:border-white/30">
      <span className="text-sm font-semibold text-reserve-navy dark:text-white">{label}</span>
      <Money value={amount} className="font-semibold text-reserve-navy dark:text-white" />
    </div>
  );
}

/** Grand-total row — double rule, the accounting "bottom line". */
export function GrandTotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="mt-1 flex items-baseline justify-between gap-4 border-t-2 border-reserve-navy py-2.5 dark:border-white">
      <span className="text-sm font-bold tracking-wide text-reserve-navy uppercase dark:text-white">
        {label}
      </span>
      <Money value={amount} className="text-[15px] font-bold text-reserve-navy dark:text-white" />
    </div>
  );
}

export function DocumentFooter({ note }: { note?: string }) {
  return (
    <p className="mt-8 border-t border-reserve-navy/10 pt-3 text-center text-[11px] text-reserve-slate dark:border-white/10">
      {note ?? "Manually recorded books — not connected to wallet or reserve activity."}
    </p>
  );
}
