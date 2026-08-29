import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmtReportMoney, type JournalEntry, type JournalLine } from "@/lib/reports-data";
import { describeError, useReportsStore } from "@/lib/reports-store";
import { AccountDialog } from "@/routes/reports.accounts";

const ADD_ACCOUNT_VALUE = "__add_new_account__";

const buildSchema = (codes: string[]) =>
  z.object({
    ref: z
      .string()
      .trim()
      .min(1, "Reference is required.")
      .max(40, "Reference must be 40 characters or fewer."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
    description: z
      .string()
      .trim()
      .min(1, "Description is required.")
      .max(200, "Description must be 200 characters or fewer."),
    lines: z
      .array(
        z
          .object({
            account: z.string().refine((code) => codes.includes(code), "Choose an account."),
            debit: z.number().min(0),
            credit: z.number().min(0),
          })
          .refine(
            (line) => line.debit > 0 !== line.credit > 0,
            "Enter either a debit or a credit.",
          ),
      )
      .min(2, "Add at least two account lines."),
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [pendingLineIndex, setPendingLineIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const year = new Date().getFullYear();
    setRef(entry?.ref ?? `JE-${year}-${String(store.entries.length + 1).padStart(3, "0")}`);
    setDate(entry?.date ?? new Date().toISOString().slice(0, 10));
    setDescription(entry?.description ?? "");
    setLines(entry?.lines.map((line) => ({ ...line })) ?? [emptyLine(), emptyLine()]);
    setError("");
  }, [open, entry, store.entries.length]);

  const totals = useMemo(
    () =>
      lines.reduce(
        (sum, line) => ({
          debit: sum.debit + (Number.isFinite(line.debit) ? line.debit : 0),
          credit: sum.credit + (Number.isFinite(line.credit) ? line.credit : 0),
        }),
        { debit: 0, credit: 0 },
      ),
    [lines],
  );
  const difference = Math.round(Math.abs(totals.debit - totals.credit) * 100) / 100;

  const updateLine = (index: number, patch: Partial<JournalLine>) => {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    );
  };

  const submit = async () => {
    const parsed = buildSchema(store.accounts.map((account) => account.code)).safeParse({
      ref,
      date,
      description,
      lines,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the entry details.");
      return;
    }
    if (totals.debit <= 0 || difference !== 0) {
      setError("Total debits and credits must be equal and greater than zero.");
      return;
    }
    if (store.hasReference(parsed.data.ref.trim(), entry?.id)) {
      setError("That reference number is already in use.");
      return;
    }
    const cleanEntry: JournalEntry = {
      ...parsed.data,
      ref: parsed.data.ref.trim(),
      description: parsed.data.description.trim(),
    };
    setSaving(true);
    try {
      if (entry?.id) await store.updateEntry(entry.id, cleanEntry);
      else await store.addEntry(cleanEntry);
      toast.success(entry ? "Journal entry updated" : "Journal entry posted");
      onOpenChange(false);
    } catch (saveError) {
      const message = describeError(saveError);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit journal entry" : "New journal entry"}</DialogTitle>
          <DialogDescription>
            Record this transaction manually. It will not connect to wallet or reserve activity.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="journal-date">Date</Label>
            <Input
              id="journal-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="journal-ref">Reference</Label>
            <Input
              id="journal-ref"
              maxLength={40}
              value={ref}
              onChange={(event) => setRef(event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="journal-description">Description</Label>
            <Textarea
              id="journal-description"
              maxLength={200}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Account lines</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLines((current) => [...current, emptyLine()])}
            >
              <Plus /> Add line
            </Button>
          </div>
          {lines.map((line, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_8rem_8rem_auto]"
            >
              <Select
                value={line.account}
                onValueChange={(account) => {
                  if (account === ADD_ACCOUNT_VALUE) {
                    setPendingLineIndex(index);
                    setAddAccountOpen(true);
                    return;
                  }
                  updateLine(index, { account });
                }}
              >
                <SelectTrigger aria-label={`Account line ${index + 1}`}>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {store.accounts.map((account) => (
                    <SelectItem key={account.code} value={account.code}>
                      {account.code} · {account.name}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={ADD_ACCOUNT_VALUE}>
                    <span className="flex items-center gap-1.5 text-reserve-navy dark:text-white">
                      <Plus className="size-3.5" /> Add new account…
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                aria-label={`Debit line ${index + 1}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="Debit"
                value={line.debit || ""}
                onChange={(event) =>
                  updateLine(index, {
                    debit: Number(event.target.value),
                    credit: event.target.value ? 0 : line.credit,
                  })
                }
              />
              <Input
                aria-label={`Credit line ${index + 1}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="Credit"
                value={line.credit || ""}
                onChange={(event) =>
                  updateLine(index, {
                    credit: Number(event.target.value),
                    debit: event.target.value ? 0 : line.debit,
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove line ${index + 1}`}
                disabled={lines.length <= 2}
                onClick={() =>
                  setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-md bg-muted p-3 text-sm">
          <div>
            <span className="block text-xs text-muted-foreground">Debits</span>
            <strong className="font-mono">
              {fmtReportMoney(totals.debit, store.currency ?? "USD")}
            </strong>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">Credits</span>
            <strong className="font-mono">
              {fmtReportMoney(totals.credit, store.currency ?? "USD")}
            </strong>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">Difference</span>
            <strong className="font-mono">
              {fmtReportMoney(difference, store.currency ?? "USD")}
            </strong>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving ? "Saving…" : entry ? "Save changes" : "Post entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <AccountDialog
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        onSaved={(input) => {
          if (pendingLineIndex !== null) {
            updateLine(pendingLineIndex, { account: input.code });
            setPendingLineIndex(null);
          }
        }}
      />
    </Dialog>
  );
}
