import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { JOURNAL_ENTRIES, type JournalEntry } from "@/lib/reports-data";

interface ReportsStoreValue {
  entries: JournalEntry[];
  addEntry: (entry: JournalEntry) => void;
  updateEntry: (originalRef: string, entry: JournalEntry) => void;
  deleteEntry: (ref: string) => void;
  hasReference: (ref: string, excludingRef?: string) => boolean;
}

const ReportsStoreContext = createContext<ReportsStoreValue | null>(null);

export function ReportsStoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>(() => JOURNAL_ENTRIES.map((entry) => ({
    ...entry,
    lines: entry.lines.map((line) => ({ ...line })),
  })));

  const value = useMemo<ReportsStoreValue>(() => ({
    entries,
    addEntry: (entry) => setEntries((current) => [...current, entry].sort(compareEntries)),
    updateEntry: (originalRef, entry) => setEntries((current) =>
      current.map((item) => item.ref === originalRef ? entry : item).sort(compareEntries)),
    deleteEntry: (ref) => setEntries((current) => current.filter((entry) => entry.ref !== ref)),
    hasReference: (ref, excludingRef) => entries.some((entry) => entry.ref === ref && entry.ref !== excludingRef),
  }), [entries]);

  return <ReportsStoreContext.Provider value={value}>{children}</ReportsStoreContext.Provider>;
}

export function useReportsStore() {
  const value = useContext(ReportsStoreContext);
  if (!value) throw new Error("useReportsStore must be used inside ReportsStoreProvider");
  return value;
}

function compareEntries(a: JournalEntry, b: JournalEntry) {
  return a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref);
}