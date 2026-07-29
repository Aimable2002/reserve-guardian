import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, can, type MemberRole } from "@/lib/reserve-data";
import {
  changeMemberRole,
  generateInvite,
  listInvites,
  listMembers,
  listProfiles,
  removeMember,
  revokeInvite,
  transferOwnership,
  type ReserveInvite,
  type ReserveMember,
} from "@/lib/shared-reserves";

export const Route = createFileRoute("/reserve-settings/$id")({
  head: () => ({
    meta: [
      { title: "Reserve settings · Fortress Reserve" },
      { name: "description", content: "Manage members, roles and invitations for a shared reserve." },
      { property: "og:title", content: "Reserve settings · Fortress Reserve" },
      { property: "og:description", content: "Members, roles, invites and ownership transfer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReserveSettings,
});

const INVITABLE: MemberRole[] = ["co_owner", "contributor", "viewer", "beneficiary"];
const ASSIGNABLE: MemberRole[] = ["co_owner", "contributor", "viewer", "beneficiary"];

function defaultExpiry() {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

function ReserveSettings() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const store = useStore();
  const navigate = useNavigate();
  const reserve = store.reserves.find((r) => r.id === id);

  const [members, setMembers] = useState<ReserveMember[]>([]);
  const [invites, setInvites] = useState<ReserveInvite[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [inviteRole, setInviteRole] = useState<MemberRole>("contributor");
  const [inviteExpiry, setInviteExpiry] = useState(defaultExpiry);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const role = reserve?.role ?? "viewer";
  const myMembership = useMemo(
    () => members.find((m) => m.user_id === user?.id),
    [members, user],
  );
  const others = members.filter((m) => m.user_id !== reserve?.ownerId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ms, invs] = await Promise.all([
        listMembers(id),
        can.invite(role) ? listInvites(id) : Promise.resolve([] as ReserveInvite[]),
      ]);
      setMembers(ms);
      setInvites(invs);
      setNames(await listProfiles(ms.map((m) => m.user_id)));
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load members.");
    } finally {
      setLoading(false);
    }
  }, [id, role]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!reserve) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-reserve-bg px-6 text-reserve-navy">
        <p className="text-sm text-reserve-slate">Reserve not found.</p>
        <Link to="/" className="mt-4 rounded-lg bg-reserve-navy px-4 py-2 text-xs font-semibold text-white">
          Back to Vault
        </Link>
      </div>
    );
  }

  const createInvite = async () => {
    if (!user) return;
    const when = new Date(inviteExpiry);
    if (!inviteExpiry || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      return toast.error("Pick an expiry in the future.");
    }
    setBusy(true);
    try {
      const token = await generateInvite({
        reserveId: id,
        role: inviteRole,
        createdBy: user.id,
        expiresAt: when.toISOString(),
      });
      const link = `${window.location.origin}/invite/${token}`;
      setLastLink(link);
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Invite link copied to clipboard.");
      } catch {
        toast.success("Invite link created.");
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create the invite.");
    } finally {
      setBusy(false);
    }
  };

  const doRevoke = async (inviteId: string) => {
    if (!user) return;
    try {
      await revokeInvite(inviteId, user.id);
      toast.success("Invite revoked.");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not revoke that invite.");
    }
  };

  const setRole = async (memberId: string, next: MemberRole) => {
    try {
      await changeMemberRole(memberId, next);
      toast.success("Role updated.");
      await load();
      await store.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not change that role.");
    }
  };

  const doRemove = async (memberId: string) => {
    try {
      await removeMember(memberId);
      toast.success("Member removed.");
      await load();
      await store.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not remove that member.");
    }
  };

  const doTransfer = async (m: ReserveMember) => {
    if (!myMembership) return toast.error("Owner membership row missing.");
    setBusy(true);
    try {
      await transferOwnership({
        reserveId: id,
        currentOwnerMemberId: myMembership.id,
        newOwnerMemberId: m.id,
        newOwnerUserId: m.user_id,
      });
      toast.success(`${names[m.user_id] ?? "Member"} is now the owner.`);
      await load();
      await store.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not transfer ownership.");
    } finally {
      setBusy(false);
    }
  };

  const doLeave = async () => {
    if (!myMembership) return;
    if (role === "owner") {
      return toast.error("Transfer ownership before leaving this reserve.");
    }
    try {
      await removeMember(myMembership.id);
      toast.success("You left this reserve.");
      await store.refresh();
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not leave the reserve.");
    }
  };

  const ownerBlocked = role === "owner" && others.length > 0;

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="flex items-center justify-between py-6">
          <Link
            to="/reserves/$id"
            params={{ id }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-reserve-slate active:opacity-70"
          >
            <ArrowLeft className="size-4" /> {reserve.name}
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            Settings
          </span>
        </header>

        <h1 className="text-xl font-medium">Members &amp; access</h1>
        <p className="mt-1 text-xs text-reserve-slate">
          You are {ROLE_LABELS[role].toLowerCase()} on this reserve.
        </p>

        <section className="mt-6 space-y-2">
          {loading && <Loader2 className="size-5 animate-spin text-reserve-slate" />}
          {members.map((m) => {
            const isOwner = m.user_id === reserve.ownerId;
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-reserve-navy/5 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {names[m.user_id] ?? "Member"}
                      {m.user_id === user?.id && (
                        <span className="ml-1 text-[11px] text-reserve-slate">(you)</span>
                      )}
                    </p>
                    <p className="text-[11px] text-reserve-slate">
                      Joined{" "}
                      {new Date(m.joined_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {isOwner || !can.manage(role) ? (
                    <span className="shrink-0 rounded-full bg-reserve-navy/5 px-3 py-1 text-[11px] font-semibold">
                      {ROLE_LABELS[m.role]}
                    </span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => setRole(m.id, e.target.value as MemberRole)}
                      className="shrink-0 rounded-lg border border-reserve-navy/10 bg-white p-2 text-xs"
                    >
                      {ASSIGNABLE.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-reserve-slate">
                  {ROLE_DESCRIPTIONS[m.role]}
                </p>
                {can.manage(role) && !isOwner && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.role === "co_owner" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => doTransfer(m)}
                        className="text-[11px]"
                      >
                        Transfer ownership
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => doRemove(m.id)}
                      className="border-destructive/20 text-[11px] text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {!loading && members.length === 0 && (
            <p className="rounded-2xl border border-dashed border-reserve-navy/10 bg-white/60 p-6 text-center text-xs text-reserve-slate">
              No members yet — invite someone below.
            </p>
          )}
        </section>

        {can.invite(role) && (
          <section className="mt-8 space-y-4 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="size-4" /> Invite someone
            </h2>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                className="mt-2 w-full rounded-lg border border-reserve-navy/10 bg-white p-3 text-sm"
              >
                {INVITABLE.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] leading-relaxed text-reserve-slate">
                {ROLE_DESCRIPTIONS[inviteRole]}
              </p>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                Link expires
              </Label>
              <Input
                type="datetime-local"
                value={inviteExpiry}
                onChange={(e) => setInviteExpiry(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button
              onClick={createInvite}
              disabled={busy}
              className="w-full bg-reserve-navy text-white hover:bg-reserve-navy/90"
            >
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create invite link
            </Button>
            {lastLink && (
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(lastLink);
                  toast.success("Copied.");
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-reserve-navy/5 p-3 text-left text-[11px] break-all"
              >
                <Copy className="size-3 shrink-0" />
                {lastLink}
              </button>
            )}

            <div className="space-y-2 border-t border-reserve-navy/5 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-reserve-slate">
                Outstanding invites
              </p>
              {invites.filter((i) => !i.used_at && !i.revoked_at).length === 0 && (
                <p className="text-[11px] text-reserve-slate">None right now.</p>
              )}
              {invites
                .filter((i) => !i.used_at && !i.revoked_at)
                .map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-reserve-navy/5 p-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium">{ROLE_LABELS[i.role]}</p>
                      <p className="text-[10px] leading-relaxed text-reserve-slate">
                        {ROLE_DESCRIPTIONS[i.role]}
                      </p>
                      <p className="text-[10px] text-reserve-slate">
                        Expires {new Date(i.expires_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => doRevoke(i.id)}
                      className="shrink-0 rounded-lg border border-destructive/20 px-2 py-1 text-[10px] font-semibold text-destructive"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          {role === "owner" ? (
            <p className="rounded-xl bg-reserve-navy/5 p-3 text-[11px] leading-relaxed text-reserve-slate">
              {ownerBlocked
                ? "You own this reserve and it still has other members. Transfer ownership, or remove everyone else, before deleting or leaving."
                : "You're the only member — you can delete this reserve from its detail page once it's empty."}
            </p>
          ) : (
            <Button
              variant="outline"
              onClick={doLeave}
              className="w-full border-destructive/20 text-destructive"
            >
              <Trash2 className="mr-2 size-4" /> Leave this reserve
            </Button>
          )}
        </section>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}