import { supabase } from "./supabase";

export const BACKEND_URL = "https://reserve-backend-whf0.onrender.com";

export class BackendError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new BackendError("not_authenticated", "Please sign in to continue.", 401);
  return token;
}

async function request<T>(path: string, body: unknown, token: string, method: "GET" | "POST" = "POST"): Promise<{ ok: true; data: T } | { ok: false; code: string; message: string; status: number }> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (res.ok) return { ok: true, data: payload as T };
  return {
    ok: false,
    code: payload?.error ?? "request_failed",
    message: payload?.message ?? `Request failed (${res.status}).`,
    status: res.status,
  };
}

/**
 * Public (unauthenticated) request against the backend — used only for the
 * /pay/<code> routes, which by design must work for a payer with no
 * Fortress account at all. Never attaches an Authorization header.
 */
async function publicRequest<T>(path: string, body: unknown, method: "GET" | "POST" = "GET"): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (res.ok) return payload as T;
  throw new BackendError(
    payload?.error ?? "request_failed",
    payload?.message ?? `Request failed (${res.status}).`,
    res.status,
  );
}

/**
 * POST to the Reserved Fund backend with the current Supabase access token.
 * On a 401 `token_expired`, refreshes the session and retries exactly once.
 */
export async function callBackend<T>(path: string, body: unknown): Promise<T> {
  let token = await accessToken();
  let result = await request<T>(path, body, token, "POST");

  if (!result.ok && result.status === 401 && result.code === "token_expired") {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      throw new BackendError("session_expired", "Your session expired. Please sign in again.", 401);
    }
    token = data.session.access_token;
    result = await request<T>(path, body, token, "POST");
  }

  if (!result.ok) throw new BackendError(result.code, result.message, result.status);
  return result.data;
}

/**
 * GET to the Reserved Fund backend with the current Supabase access token.
 * Same token-refresh-and-retry behavior as callBackend.
 */
export async function callBackendGet<T>(path: string): Promise<T> {
  let token = await accessToken();
  let result = await request<T>(path, undefined, token, "GET");

  if (!result.ok && result.status === 401 && result.code === "token_expired") {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      throw new BackendError("session_expired", "Your session expired. Please sign in again.", 401);
    }
    token = data.session.access_token;
    result = await request<T>(path, undefined, token, "GET");
  }

  if (!result.ok) throw new BackendError(result.code, result.message, result.status);
  return result.data;
}

/* ---------- Route payload/response types ---------- */

/** Card and bank_transfer are "coming soon" — the backend only accepts
 * mobile_money right now (400 not_yet_supported for anything else). Types
 * kept here for when those come back into scope. */
export type CardPaymentMethod = {
  type: "card";
  card: {
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
  };
};

export type BankTransferPaymentMethod = {
  type: "bank_transfer";
  bank_transfer: {
    country_code: string;
    expires_in?: number;
  };
};

export type MobileMoneyPaymentMethod = {
  type: "mobile_money";
  mobile_money: {
    country_code: string;
    network: string;
    phone_number: string;
  };
};

/** Only mobile_money is live right now. */
export type PaymentMethod = MobileMoneyPaymentMethod;

export type FlutterwaveCustomer = {
  email: string;
  name: { first: string; last: string; middle?: string };
  phone?: { country_code: string; number: string };
  address?: {
    country?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    line1?: string;
  };
};

export type DepositRequest = {
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  customer: FlutterwaveCustomer;
};

export type DepositResponse = {
  reference: string;
  charge_id?: string;
  status?: string;
};

/** Only mobile_money is live right now — card/bank_transfer deposits and
 * bank/wallet payouts are "coming soon" (backend returns 400 not_yet_supported
 * for anything else), so there's nothing else to wire up yet. */
export type MobileMoneyRecipient = {
  type: "mobile_money";
  name: { first: string; last: string };
  mobile_money: { network: string; msisdn: string };
};

export type Recipient = MobileMoneyRecipient;

export type TransferRequest = { amount: number; currency?: string; recipient: Recipient };
export type TransferResponse = { reference: string; transfer_id?: string; status?: string };

export type MoveRequest = { reserve_id: string; amount: number };
export type MoveResponse = {
  reference: string;
  wallet_balance: number;
  reserve_balance: number;
};

/* ---------- Receive via link/QR (no account needed to pay) ---------- */

export type ReceiveCodeResponse = { receive_code: string };

export type PayeeInfo = { display_name: string; currency: string };

export type PayRequest = {
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  customer: FlutterwaveCustomer;
};

export type PayResponse = {
  reference: string;
  charge_id?: string;
  status?: string;
};

export const api = {
  depositInitiate: (body: DepositRequest) => callBackend<DepositResponse>("/deposit/initiate", body),
  walletSend: (body: TransferRequest) => callBackend<TransferResponse>("/wallet/send", body),
  walletWithdraw: (body: TransferRequest) => callBackend<TransferResponse>("/wallet/withdraw", body),
  moveToReserve: (body: MoveRequest) => callBackend<MoveResponse>("/reserve/move-to", body),
  moveFromReserve: (body: MoveRequest) => callBackend<MoveResponse>("/reserve/move-from", body),
  // Authenticated — belongs to whoever is logged in.
  getReceiveCode: () => callBackendGet<ReceiveCodeResponse>("/wallet/receive-code"),
  // Public — the payer never needs an account for either of these.
  resolveReceiveCode: (code: string) => publicRequest<PayeeInfo>(`/pay/${code}`, undefined, "GET"),
  payViaReceiveCode: (code: string, body: PayRequest) => publicRequest<PayResponse>(`/pay/${code}`, body, "POST"),
};
