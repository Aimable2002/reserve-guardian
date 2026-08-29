import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { DocumentFooter, Money, ReportShell } from "@/components/report-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { type ReportAccount, type ReportAccountType } from "@/lib/reports-data";
import { useReportsStore, type AccountInput } from "@/lib/reports-store";

export const Route = createFileRoute("/reports/accounts")({
  head: () => ({
    meta: [
      { title: "Chart of Accounts — Financial Reports — Fortress Reserve" },
      { name: "description", content: "Manage the accounts your manual journal entries post to." },
      { property: "og:title", content: "Chart of Accounts — Fortress Reserve" },
      {
        property: "og:description",
        content: "Add, edit and deactivate the accounts used by your financial reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChartOfAccountsPage,
});

const TYPES: ReportAccountType[] = ["asset", "liability", "equity", "revenue", "expense"];
const SUBTYPES = ["none", "current", "non-current", "operating", "other", "contra-equity"] as const;

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required.")
    .max(12, "Code must be 12 characters or fewer."),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(80, "Name must be 80 characters or fewer."),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  normal: z.enum(["debit", "credit"]),
  opening: z.number().min(0, "Opening balance cannot be negative."),
});

function ChartOfAccountsPage() {
  const store = useReportsStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReportAccount | undefined>();
  const [deleting, setDeleting] = useState<ReportAccount | undefined>();

  return (
    <ReportShell
      title="Chart of Accounts"
      subtitle="Accounts available to your manual journal entries"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-reserve-navy/10 pb-4 dark:border-white/10">
        <p className="max-w-xl text-xs leading-relaxed text-reserve-slate">
          Every journal line posts to one of these accounts. Opening balances are stated in each
          account&apos;s normal-balance terms.
        </p>
        <Button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setEditorOpen(true);
          }}
        >
          <Plus /> New account
        </Button>
      </div>

      {store.loading && (
        <p className="py-8 text-center text-sm text-reserve-slate">
          Loading your chart of accounts…
        </p>
      )}
      {store.error && (
        <p role="alert" className="py-4 text-sm font-medium text-destructive">
          {store.error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b-2 border-reserve-navy/80 text-[10px] tracking-[0.12em] text-reserve-slate uppercase dark:border-white/70">
              <th className="px-2 py-2 text-left font-semibold">Code</th>
              <th className="px-3 py-2 text-left font-semibold">Account</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Normal</th>
              <th className="px-3 py-2 text-right font-semibold">Opening</th>
              <th className="px-2 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.allAccounts.map((account) => (
              <tr
                key={account.id ?? account.code}
                className="border-b border-reserve-navy/5 dark:border-white/5"
              >
                <td className="px-2 py-2 font-mono text-xs text-reserve-slate">{account.code}</td>
                <td className="px-3 py-2 text-reserve-navy dark:text-white/90">
                  {account.name}
                  {account.isActive === false && (
                    <span className="ml-2 rounded-full bg-reserve-navy/5 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-reserve-slate dark:bg-white/10">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs capitalize text-reserve-slate">
                  {account.type}
                  {account.subtype ? ` · ${account.subtype}` : ""}
                </td>
                <td className="px-3 py-2 text-xs capitalize text-reserve-slate">
                  {account.normal}
                </td>
                <td className="px-3 py-2 text-right">
                  <Money value={account.opening} className="text-reserve-navy dark:text-white/90" />
                </td>
                <td className="px-2 py-2 text-right whitespace-nowrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${account.name}`}
                    onClick={() => {
                      setEditing(account);
                      setEditorOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${account.name}`}
                    onClick={() => setDeleting(account)}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DocumentFooter />

      <AccountDialog open={editorOpen} onOpenChange={setEditorOpen} account={editing} />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} can only be deleted while no journal line uses it. If it is already
              posted to, mark it inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const target = deleting;
                setDeleting(undefined);
                if (target?.id) {
                  store
                    .deleteAccount(target.id)
                    .then(() => toast.success("Account deleted"))
                    .catch((deleteError: unknown) =>
                      toast.error(
                        deleteError instanceof Error &&
                          deleteError.message.includes("violates foreign key")
                          ? "This account is used by journal entries — mark it inactive instead."
                          : deleteError instanceof Error
                            ? deleteError.message
                            : "Could not delete this account.",
                      ),
                    );
                }
              }}
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ReportShell>
  );
}

export function AccountDialog({
  open,
  onOpenChange,
  account,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: ReportAccount;
  /** Fires right after a successful create/update, with the saved input — lets a caller (e.g. the journal entry dialog) auto-select the account it just created. */
  onSaved?: (input: AccountInput) => void;
}) {
  const store = useReportsStore();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<ReportAccountType>("asset");
  const [subtype, setSubtype] = useState<(typeof SUBTYPES)[number]>("none");
  const [normal, setNormal] = useState<"debit" | "credit">("debit");
  const [opening, setOpening] = useState("0");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode(account?.code ?? "");
    setName(account?.name ?? "");
    setType(account?.type ?? "asset");
    setSubtype((account?.subtype ?? "none") as (typeof SUBTYPES)[number]);
    setNormal(account?.normal ?? "debit");
    setOpening(String(account?.opening ?? 0));
    setActive(account?.isActive !== false);
    setError("");
  }, [open, account]);

  const submit = async () => {
    const parsed = schema.safeParse({ code, name, type, normal, opening: Number(opening) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the account details.");
      return;
    }
    const input: AccountInput = {
      code: parsed.data.code,
      name: parsed.data.name,
      type: parsed.data.type,
      subtype: subtype === "none" ? null : subtype,
      normal: parsed.data.normal,
      opening: parsed.data.opening,
      isActive: active,
    };
    setSaving(true);
    try {
      if (account?.id) await store.updateAccount(account.id, input);
      else await store.createAccount(input);
      toast.success(account ? "Account updated" : "Account added");
      onSaved?.(input);
      onOpenChange(false);
    } catch (saveError) {
      const message =
        saveError instanceof Error && saveError.message.includes("duplicate key")
          ? "That account code is already in use."
          : saveError instanceof Error
            ? saveError.message
            : "Could not save this account.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? "Edit account" : "New account"}</DialogTitle>
          <DialogDescription>
            Accounts belong only to your Financial Reports books.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="account-code">Code</Label>
            <Input
              id="account-code"
              maxLength={12}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(next) => setType(next as ReportAccountType)}>
              <SelectTrigger aria-label="Account type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((option) => (
                  <SelectItem key={option} value={option} className="capitalize">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sub-classification</Label>
            <Select
              value={subtype}
              onValueChange={(next) => setSubtype(next as (typeof SUBTYPES)[number])}
            >
              <SelectTrigger aria-label="Account sub-classification">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBTYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "none" ? "None" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Normal balance</Label>
            <Select value={normal} onValueChange={(next) => setNormal(next as "debit" | "credit")}>
              <SelectTrigger aria-label="Normal balance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-opening">Opening balance</Label>
            <Input
              id="account-opening"
              type="number"
              min="0"
              step="0.01"
              value={opening}
              onChange={(event) => setOpening(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <div>
              <Label htmlFor="account-active">Active</Label>
              <p className="text-xs text-reserve-slate">
                Inactive accounts stay on past entries but cannot be selected.
              </p>
            </div>
            <Switch id="account-active" checked={active} onCheckedChange={setActive} />
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
            {saving ? "Saving…" : account ? "Save changes" : "Add account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
