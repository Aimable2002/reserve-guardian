import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmtReportMoney, REPORT_ACCOUNTS, type JournalEntry, type JournalLine } from "@/lib/reports-data";
import { useReportsStore } from "@/lib/reports-store";

const entrySchema = z.object({
  ref: z.string().trim().min(1, "Reference is required.").max(40, "Reference must be 40 characters or fewer."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
  description: z.string().trim().min(1, "Description is required.").max(200, "Description must be 200 characters or fewer."),
  lines: z.array(z.object({
    account: z.string().refine((code) => REPORT_ACCOUNTS.some((account) => account.code === code), "Choose an account."),
    debit: z.number().min(0),
    credit: z.number().min(0),
  }).refine((line) => (line.debit > 0) !== (line.credit > 0), "Enter either a debit or a credit." )).min(2, "Add at least two account lines."),
});

const emptyLine = (): JournalLine => ({ account: "", debit: 0, credit: 0 });

export function JournalEntryDialog({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: JournalEntry;
}) {
  const store = useReportsStore();
  const [ref, setRef] = useState("");
  const [date, setDate] = useState("2026-07-31");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRef(entry?.ref ?? `JE-2026-${String(store.entries.length + 1).padStart(3, "0")}`);
    setDate(entry?.date ?? "2026-07-31");
    setDescription(entry?.description ?? "");
    setLines(entry?.lines.map((line) => ({ ...line })) ?? [emptyLine(), emptyLine()]);
    setError("");
  }, [open, entry, store.entries.length]);

  const totals = useMemo(() => lines.reduce((sum, line) => ({
    debit: sum.debit + (Number.isFinite(line.debit) ? line.debit : 0),
    credit: sum.credit + (Number.isFinite(line.credit) ? line.credit : 0),
  }), { debit: 0, credit: 0 }), [lines]);
  const difference = Math.round(Math.abs(totals.debit - totals.credit) * 100) / 100;

  const updateLine = (index: number, patch: Partial<JournalLine>) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  const submit = () => {
    const parsed = entrySchema.safeParse({ ref, date, description, lines });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the entry details.");
      return;
    }
    if (totals.debit <= 0 || difference !== 0) {
      setError("Total debits and credits must be equal and greater than zero.");
      return;
    }
    if (store.hasReference(parsed.data.ref, entry?.ref)) {
      setError("That reference number is already in use.");
      return;
    }
    const cleanEntry: JournalEntry = {
      ...parsed.data,
      ref: parsed.data.ref.trim(),
      description: parsed.data.description.trim(),
    };
    if (entry) store.updateEntry(entry.ref, cleanEntry);
    else store.addEntry(cleanEntry);
    toast.success(entry ? "Journal entry updated" : "Journal entry posted");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit journal entry" : "New journal entry"}</DialogTitle>
          <DialogDescription>Record this transaction manually. It will not connect to wallet or reserve activity.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="journal-date">Date</Label>
            <Input id="journal-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="journal-ref">Reference</Label>
            <Input id="journal-ref" maxLength={40} value={ref} onChange={(event) => setRef(event.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="journal-description">Description</Label>
            <Textarea id="journal-description" maxLength={200} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Account lines</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((current) => [...current, emptyLine()])}>
              <Plus /> Add line
            </Button>
          </div>
          {lines.map((line, index) => (
            <div key={index} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_8rem_8rem_auto]">
              <Select value={line.account} onValueChange={(account) => updateLine(index, { account })}>
                <SelectTrigger aria-label={`Account line ${index + 1}`}><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {REPORT_ACCOUNTS.map((account) => <SelectItem key={account.code} value={account.code}>{account.code} · {account.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input aria-label={`Debit line ${index + 1}`} type="number" min="0" step="0.01" placeholder="Debit" value={line.debit || ""} onChange={(event) => updateLine(index, { debit: Number(event.target.value), credit: event.target.value ? 0 : line.credit })} />
              <Input aria-label={`Credit line ${index + 1}`} type="number" min="0" step="0.01" placeholder="Credit" value={line.credit || ""} onChange={(event) => updateLine(index, { credit: Number(event.target.value), debit: event.target.value ? 0 : line.debit })} />
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove line ${index + 1}`} disabled={lines.length <= 2} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}>
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-md bg-muted p-3 text-sm">
          <div><span className="block text-xs text-muted-foreground">Debits</span><strong className="font-mono">{fmtReportMoney(totals.debit)}</strong></div>
          <div><span className="block text-xs text-muted-foreground">Credits</span><strong className="font-mono">{fmtReportMoney(totals.credit)}</strong></div>
          <div><span className="block text-xs text-muted-foreground">Difference</span><strong className="font-mono">{fmtReportMoney(difference)}</strong></div>
        </div>
        {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={submit}>{entry ? "Save changes" : "Post entry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}