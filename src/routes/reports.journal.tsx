import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { REPORT_PERIOD_LABEL, fmtReportDate, getAccount, type JournalEntry } from "@/lib/reports-data";
import { DocumentFooter, Money, ReportShell } from "@/components/report-ui";
import { cn } from "@/lib/utils";
import { useReportsStore } from "@/lib/reports-store";
import { JournalEntryDialog } from "@/components/journal-entry-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/reports/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Raw double-entry journal of mock transactions with debit and credit lines." },
      { property: "og:title", content: "Journal — Fortress Reserve" },
      { property: "og:description", content: "Mock transaction record: every entry as debit plus matching credit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  const store = useReportsStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();
  const [deletingEntry, setDeletingEntry] = useState<JournalEntry | undefined>();

  const createEntry = () => {
    setEditingEntry(undefined);
    setEditorOpen(true);
  };

  const editEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditorOpen(true);
  };

  return (
    <ReportShell title="Journal — Transaction Record" subtitle={REPORT_PERIOD_LABEL}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-reserve-navy/10 pb-4 dark:border-white/10">
        <p className="max-w-xl text-xs leading-relaxed text-reserve-slate">
          This manual journal is the only source for every financial report. App wallet and reserve activity is never recorded here automatically.
        </p>
        <Button type="button" onClick={createEntry}><Plus /> New journal entry</Button>
      </div>
      <div className="space-y-5">
        {store.entries.map((entry) => {
          const total = entry.lines.reduce((s, l) => s + l.debit, 0);
          return (
            <article
              key={entry.ref}
              className="overflow-hidden rounded-xl border border-reserve-navy/10 dark:border-white/10"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-reserve-navy/10 bg-reserve-navy/[0.03] px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-semibold text-reserve-navy dark:text-white">{entry.ref}</span>
                  <span className="text-xs text-reserve-slate">{fmtReportDate(entry.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <p className="mr-2 text-xs font-medium text-reserve-navy dark:text-white/90">{entry.description}</p>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${entry.ref}`} onClick={() => editEntry(entry)}><Pencil /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${entry.ref}`} onClick={() => setDeletingEntry(entry)}><Trash2 /></Button>
                </div>
              </header>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-reserve-navy/10 text-[10px] tracking-[0.12em] text-reserve-slate uppercase dark:border-white/10">
                    <th className="px-4 py-2 text-left font-semibold">Account</th>
                    <th className="px-3 py-2 text-right font-semibold">Debit</th>
                    <th className="px-4 py-2 text-right font-semibold">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.lines.map((line, i) => {
                    const acc = getAccount(line.account);
                    const isCredit = line.credit > 0;
                    return (
                      <tr key={i} className="border-b border-reserve-navy/5 dark:border-white/5">
                        <td className={cn("px-4 py-2 text-reserve-navy dark:text-white/90", isCredit && "pl-9")}>
                          <span className="mr-2 font-mono text-xs text-reserve-slate">{acc.code}</span>
                          {acc.name}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {line.debit !== 0 && <Money value={line.debit} className="text-reserve-navy dark:text-white/90" />}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {line.credit !== 0 && <Money value={line.credit} className="text-reserve-navy dark:text-white/90" />}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-reserve-navy/[0.03] dark:bg-white/5">
                    <td className="px-4 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-reserve-slate uppercase">
                      Entry total
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <Money value={total} className="font-semibold text-reserve-navy dark:text-white" />
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      <Money value={total} className="font-semibold text-reserve-navy dark:text-white" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>
          );
        })}
      </div>
      <DocumentFooter />
      <JournalEntryDialog open={editorOpen} onOpenChange={setEditorOpen} entry={editingEntry} />
      <AlertDialog open={Boolean(deletingEntry)} onOpenChange={(open) => !open && setDeletingEntry(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete journal entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting {deletingEntry?.ref} will recalculate every financial statement. This prototype action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingEntry) store.deleteEntry(deletingEntry.ref);
                setDeletingEntry(undefined);
              }}
            >
              Delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ReportShell>
  );
}
