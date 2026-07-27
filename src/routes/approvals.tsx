import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/reserve-data";
import {
  listProfiles,
  listWithdrawalRequests,
  reviewWithdrawalRequest,
  type WithdrawalRequest,
} from "@/lib/shared-reserves";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Withdrawal approvals · Fortress Reserve" },
      { name: "description", content: "Approve or reject withdrawal requests on reserves you own." },
      { property: "og:title", content: "Withdrawal approvals · Fortress Reserve" },
      { property: "og:description", content: "Review pending withdrawals across your shared reserves." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { user } = useAuth();
  const store = useStore();
  const owned = store.reserves.filter((r) => r.role === "owner");
  const ownedKey = owned.map((r) => r.id).join(",");

  const [rows, setRows] = useState<(WithdrawalRequest & { reserveName: string })[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const lists = await Promise.all(
        owned.map(async (r) =>
          (await listWithdrawalRequests(r.id)).map((w) => ({ ...w, reserveName: r.name })),
        ),
      );
      // The owner's own requests never sit in `pending` — they execute
      // immediately — so this queue is by definition other members' requests.
      const pending = lists.flat().filter((w) => w.status === "pending" && w.requested_by !== user.id);
      setRows(pending);
      setNames(await listProfiles([...new Set(pending.map((w) => w.requested_by))]));
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load approvals.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ownedKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    if (!user) return;
    setBusy(id);
    try {
      await reviewWithdrawalRequest(id, user.id, decision);
      toast.success(decision === "approved" ? "Withdrawal approved." : "Request rejected.");
      setRows((rs) => rs.filter((r) => r.id !== id));
      await store.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not process that request.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-reserve-slate active:opacity-70">
            <ArrowLeft className="size-4" /> Vault
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            Approvals
          </span>
        </header>

        <h1 className="text-xl font-medium">Pending withdrawals</h1>
        <p className="mt-1 text-xs text-reserve-slate">
          Requests from members of reserves you own. Approving executes the withdrawal.
        </p>

        <div className="mt-6 space-y-3">
          {loading && <Loader2 className="size-5 animate-spin text-reserve-slate" />}
          {!loading && rows.length === 0 && (
            <p className="rounded-2xl border border-dashed border-reserve-navy/10 bg-white/60 p-6 text-center text-xs text-reserve-slate">
              Nothing waiting on you.
            </p>
          )}
          {rows.map((w) => (
            <div key={w.id} className="rounded-2xl border border-reserve-navy/5 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{w.reserveName}</p>
                  <p className="text-[11px] text-reserve-slate">
                    {names[w.requested_by] ?? "Member"} ·{" "}
                    {new Date(w.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold">
                  {formatMoney(Number(w.amount), w.currency ?? undefined)}
                </span>
              </div>
              {w.reason && <p className="mt-2 text-[11px] text-reserve-slate">“{w.reason}”</p>}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={busy === w.id}
                  onClick={() => decide(w.id, "rejected")}
                  className="border-destructive/20 text-destructive"
                >
                  <X className="mr-1 size-4" /> Reject
                </Button>
                <Button
                  disabled={busy === w.id}
                  onClick={() => decide(w.id, "approved")}
                  className="bg-reserve-navy text-white hover:bg-reserve-navy/90"
                >
                  {busy === w.id ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-1 size-4" />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}