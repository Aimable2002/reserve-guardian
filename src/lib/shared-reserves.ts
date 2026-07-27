import { supabase } from "./supabase";
import type { MemberRole } from "./reserve-data";

export type ReserveMember = {
  id: string;
  reserve_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string | null;
  joined_at: string;
};

export type ReserveInvite = {
  id: string;
  reserve_id: string;
  token: string;
  role: MemberRole;
  created_by: string;
  expires_at: string;
  revoked_at: string | null;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
};

export type WithdrawalRequest = {
  id: string;
  reserve_id: string;
  requested_by: string;
  amount: number | string;
  currency: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | string;
  reviewed_by: string | null;
  reference: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/* ---------- Members ---------- */

export async function listMembers(reserveId: string): Promise<ReserveMember[]> {
  return (
    unwrap(
      await supabase
        .from("reserve_members")
        .select("*")
        .eq("reserve_id", reserveId)
        .order("joined_at", { ascending: true }),
    ) ?? []
  );
}

export async function listProfiles(userIds: string[]) {
  if (userIds.length === 0) return {} as Record<string, string>;
  const rows =
    unwrap(
      await supabase.from("profiles").select("id, display_name").in("id", userIds),
    ) ?? [];
  return Object.fromEntries(
    (rows as { id: string; display_name: string | null }[]).map((p) => [
      p.id,
      p.display_name || "Member",
    ]),
  ) as Record<string, string>;
}

/** Owner-only. No SQL function exists for this, so it goes through RLS. */
export async function changeMemberRole(memberId: string, role: MemberRole) {
  unwrap(await supabase.from("reserve_members").update({ role }).eq("id", memberId).select("id"));
}

export async function removeMember(memberId: string) {
  unwrap(await supabase.from("reserve_members").delete().eq("id", memberId).select("id"));
}

/**
 * Owner picks a co-owner; the two roles swap and `reserves.user_id` moves to
 * the new owner. Three writes, no transaction available from the client — the
 * reserve row is updated last so a partial failure leaves ownership intact.
 */
export async function transferOwnership(opts: {
  reserveId: string;
  currentOwnerMemberId: string;
  newOwnerMemberId: string;
  newOwnerUserId: string;
}) {
  await changeMemberRole(opts.newOwnerMemberId, "owner");
  await changeMemberRole(opts.currentOwnerMemberId, "co_owner");
  unwrap(
    await supabase
      .from("reserves")
      .update({ user_id: opts.newOwnerUserId })
      .eq("id", opts.reserveId)
      .select("id"),
  );
}

/* ---------- Invites ---------- */

export async function listInvites(reserveId: string): Promise<ReserveInvite[]> {
  return (
    unwrap(
      await supabase
        .from("reserve_invites")
        .select("*")
        .eq("reserve_id", reserveId)
        .order("created_at", { ascending: false }),
    ) ?? []
  );
}

/** Returns the raw single-use token. */
export async function generateInvite(opts: {
  reserveId: string;
  role: MemberRole;
  createdBy: string;
  expiresAt: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("generate_reserve_invite", {
    p_reserve_id: opts.reserveId,
    p_role: opts.role,
    p_created_by: opts.createdBy,
    p_expires_at: opts.expiresAt,
  });
  if (error) {
    if (error.message.includes("gen_random_bytes")) {
      throw new Error(
        "Invite links are unavailable: the database is missing the pgcrypto extension.",
      );
    }
    throw new Error(error.message);
  }
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const token = obj.token ?? obj.p_token ?? Object.values(obj)[0];
    if (typeof token === "string") return token;
  }
  throw new Error("Could not read the invite token.");
}

export async function revokeInvite(inviteId: string, callerId: string) {
  const { error } = await supabase.rpc("revoke_reserve_invite", {
    p_invite_id: inviteId,
    p_caller_id: callerId,
  });
  if (error) throw new Error(error.message);
}

export type AcceptOutcome =
  | { ok: true; reserveId: string | null }
  | { ok: false; reason: "used" | "revoked" | "expired" | "not_found" | "other"; message: string };

export async function acceptInvite(token: string, userId: string): Promise<AcceptOutcome> {
  const { data, error } = await supabase.rpc("accept_reserve_invite", {
    p_token: token,
    p_user_id: userId,
  });
  if (error) {
    const m = error.message.toLowerCase();
    const reason = m.includes("already been used") || m.includes("used")
      ? "used"
      : m.includes("revok")
        ? "revoked"
        : m.includes("expir")
          ? "expired"
          : m.includes("invalid") || m.includes("not found")
            ? "not_found"
            : "other";
    return { ok: false, reason, message: error.message };
  }
  let reserveId: string | null = null;
  if (typeof data === "string") reserveId = data;
  else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const v = obj.reserve_id ?? obj.reserveId;
    if (typeof v === "string") reserveId = v;
  }
  return { ok: true, reserveId };
}

/* ---------- Withdrawal requests ---------- */

export async function listWithdrawalRequests(reserveId: string): Promise<WithdrawalRequest[]> {
  return (
    unwrap(
      await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("reserve_id", reserveId)
        .order("created_at", { ascending: false }),
    ) ?? []
  );
}

export async function submitWithdrawalRequest(opts: {
  reserveId: string;
  userId: string;
  amount: number;
  currency: string;
  reason: string;
}): Promise<{ status: string }> {
  const { data, error } = await supabase.rpc("submit_withdrawal_request", {
    p_reserve_id: opts.reserveId,
    p_user_id: opts.userId,
    p_amount: opts.amount,
    p_currency: opts.currency,
    p_reason: opts.reason,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  const status =
    row && typeof row === "object" && typeof (row as any).status === "string"
      ? (row as any).status
      : "pending";
  return { status };
}

export async function reviewWithdrawalRequest(
  requestId: string,
  ownerId: string,
  decision: "approved" | "rejected",
) {
  const { error } = await supabase.rpc("review_withdrawal_request", {
    p_request_id: requestId,
    p_owner_id: ownerId,
    p_decision: decision,
  });
  if (error) throw new Error(error.message);
}