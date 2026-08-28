/**
 * Standalone mock data for the Financial Reports prototype module.
 *
 * IMPORTANT: this module is intentionally disconnected from the rest of the
 * app — no Supabase, no backend, no shared store. Every figure below is
 * hardcoded mock data for UI/UX review only.
 *
 * Internal consistency is guaranteed by construction: every statement is
 * derived from the same chart of accounts (REPORT_ACCOUNTS) and the same
 * journal (JOURNAL_ENTRIES), so the P&L net income, trial balance totals,
 * balance sheet, cash flow, and equity statement can never drift apart.
 */

export type ReportAccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export interface ReportAccount {
  /** Database id when the account is loaded from Supabase. */
  id?: string;
  code: string;
  name: string;
  type: ReportAccountType;
  /** current / non-current (assets & liabilities), operating / other (income statement), contra-equity */
  subtype: "current" | "non-current" | "operating" | "other" | "contra-equity" | null;
  normal: "debit" | "credit";
  /** Opening balance, expressed in the account's normal-balance terms. */
  opening: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface JournalLine {
  account: string; // account code
  debit: number;
  credit: number;
}

export interface JournalEntry {
  /** Database id when the entry is loaded from Supabase. */
  id?: string;
  ref: string;
  date: string; // ISO date
  description: string;
  lines: JournalLine[];
}

/* ------------------------------------------------------------------ */
/* Period labels                                                       */
/* ------------------------------------------------------------------ */

export const REPORT_ENTITY = "Fortress Reserve — Demo Entity";
export const REPORT_PERIOD_LABEL = "For the month ended July 31, 2026";
export const REPORT_AS_OF_LABEL = "As of July 31, 2026";
export const REPORT_OPENING_LABEL = "Opening balance, July 1, 2026";

/* ------------------------------------------------------------------ */
/* Chart of accounts (mock)                                            */
/* ------------------------------------------------------------------ */

export const REPORT_ACCOUNTS: ReportAccount[] = [
  { code: "1000", name: "Cash", type: "asset", subtype: "current", normal: "debit", opening: 20000 },
  { code: "1100", name: "Accounts Receivable", type: "asset", subtype: "current", normal: "debit", opening: 0 },
  { code: "1500", name: "Equipment", type: "asset", subtype: "non-current", normal: "debit", opening: 15000 },
  { code: "2100", name: "Accounts Payable", type: "liability", subtype: "current", normal: "credit", opening: 0 },
  { code: "2200", name: "Loan Payable", type: "liability", subtype: "non-current", normal: "credit", opening: 10000 },
  { code: "3000", name: "Owner's Capital", type: "equity", subtype: null, normal: "credit", opening: 25000 },
  { code: "3100", name: "Owner's Draws", type: "equity", subtype: "contra-equity", normal: "debit", opening: 0 },
  { code: "4000", name: "Rent Income", type: "revenue", subtype: "operating", normal: "credit", opening: 0 },
  { code: "4100", name: "Service Income", type: "revenue", subtype: "operating", normal: "credit", opening: 0 },
  { code: "5000", name: "Salaries Expense", type: "expense", subtype: "operating", normal: "debit", opening: 0 },
  { code: "5100", name: "Utilities Expense", type: "expense", subtype: "operating", normal: "debit", opening: 0 },
  { code: "5200", name: "Supplies Expense", type: "expense", subtype: "operating", normal: "debit", opening: 0 },
  { code: "5900", name: "Bank Charges", type: "expense", subtype: "other", normal: "debit", opening: 0 },
];

/** Seed chart of accounts used the first time a user opens Financial Reports. */
export const DEFAULT_REPORT_ACCOUNTS = REPORT_ACCOUNTS;

const UNKNOWN_ACCOUNT: ReportAccount = {
  code: "----",
  name: "Unknown account",
  type: "asset",
  subtype: null,
  normal: "debit",
  opening: 0,
};

/** Look up an account by code within the supplied chart of accounts. */
export function getAccount(code: string, accounts: ReportAccount[] = REPORT_ACCOUNTS): ReportAccount {
  return accounts.find((a) => a.code === code) ?? { ...UNKNOWN_ACCOUNT, code };
}

/* ------------------------------------------------------------------ */
/* General journal (mock) — every entry balances                       */
/* ------------------------------------------------------------------ */

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    ref: "JE-2026-001",
    date: "2026-07-02",
    description: "Received monthly rent from tenant — Unit 4B",
    lines: [
      { account: "1000", debit: 3500, credit: 0 },
      { account: "4000", debit: 0, credit: 3500 },
    ],
  },
  {
    ref: "JE-2026-002",
    date: "2026-07-05",
    description: "Consulting services billed to Acme Co. on account",
    lines: [
      { account: "1100", debit: 2200, credit: 0 },
      { account: "4100", debit: 0, credit: 2200 },
    ],
  },
  {
    ref: "JE-2026-003",
    date: "2026-07-08",
    description: "Payroll run — first half of July",
    lines: [
      { account: "5000", debit: 4800, credit: 0 },
      { account: "1000", debit: 0, credit: 4800 },
    ],
  },
  {
    ref: "JE-2026-004",
    date: "2026-07-10",
    description: "Partial payment received from Acme Co.",
    lines: [
      { account: "1000", debit: 1200, credit: 0 },
      { account: "1100", debit: 0, credit: 1200 },
    ],
  },
  {
    ref: "JE-2026-005",
    date: "2026-07-12",
    description: "Paid electricity and water utility bill",
    lines: [
      { account: "5100", debit: 620, credit: 0 },
      { account: "1000", debit: 0, credit: 620 },
    ],
  },
  {
    ref: "JE-2026-006",
    date: "2026-07-15",
    description: "Owner withdrawal for personal use",
    lines: [
      { account: "3100", debit: 1500, credit: 0 },
      { account: "1000", debit: 0, credit: 1500 },
    ],
  },
  {
    ref: "JE-2026-007",
    date: "2026-07-18",
    description: "Cash consulting engagement — Northgate Ltd.",
    lines: [
      { account: "1000", debit: 2800, credit: 0 },
      { account: "4100", debit: 0, credit: 2800 },
    ],
  },
  {
    ref: "JE-2026-008",
    date: "2026-07-20",
    description: "Office supplies purchased on account — Staples",
    lines: [
      { account: "5200", debit: 450, credit: 0 },
      { account: "2100", debit: 0, credit: 450 },
    ],
  },
  {
    ref: "JE-2026-009",
    date: "2026-07-22",
    description: "Received monthly rent from tenant — Unit 2A",
    lines: [
      { account: "1000", debit: 3500, credit: 0 },
      { account: "4000", debit: 0, credit: 3500 },
    ],
  },
  {
    ref: "JE-2026-010",
    date: "2026-07-25",
    description: "Settled Staples payable in full",
    lines: [
      { account: "2100", debit: 450, credit: 0 },
      { account: "1000", debit: 0, credit: 450 },
    ],
  },
  {
    ref: "JE-2026-011",
    date: "2026-07-28",
    description: "Additional capital contributed by owner",
    lines: [
      { account: "1000", debit: 5000, credit: 0 },
      { account: "3000", debit: 0, credit: 5000 },
    ],
  },
  {
    ref: "JE-2026-012",
    date: "2026-07-30",
    description: "Payroll run — second half of July",
    lines: [
      { account: "5000", debit: 4800, credit: 0 },
      { account: "1000", debit: 0, credit: 4800 },
    ],
  },
  {
    ref: "JE-2026-013",
    date: "2026-07-30",
    description: "Monthly bank service charges",
    lines: [
      { account: "5900", debit: 95, credit: 0 },
      { account: "1000", debit: 0, credit: 95 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** Consistent mock currency formatting used across every report. */
export function fmtReportMoney(value: number): string {
  return usd.format(value);
}

export function fmtReportDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Derivations — everything below is computed, never hardcoded         */
/* ------------------------------------------------------------------ */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** All journal lines touching an account, in chronological order. */
export function linesForAccount(code: string, entries: JournalEntry[] = JOURNAL_ENTRIES) {
  const out: { entry: JournalEntry; line: JournalLine }[] = [];
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.account === code) out.push({ entry, line });
    }
  }
  return out;
}

/** Closing balance of an account, expressed in its normal-balance terms. */
export function closingBalance(code: string, entries: JournalEntry[] = JOURNAL_ENTRIES, accounts: ReportAccount[] = REPORT_ACCOUNTS): number {
  const acc = getAccount(code, accounts);
  let bal = acc.opening;
  for (const { line } of linesForAccount(code, entries)) {
    bal += acc.normal === "debit" ? line.debit - line.credit : line.credit - line.debit;
  }
  return round2(bal);
}

export interface LedgerRow {
  date: string;
  ref: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

/** General-ledger view for one account: opening row + running balance. */
export function ledgerForAccount(code: string, entries: JournalEntry[] = JOURNAL_ENTRIES, accounts: ReportAccount[] = REPORT_ACCOUNTS): LedgerRow[] {
  const acc = getAccount(code, accounts);
  let bal = acc.opening;
  return linesForAccount(code, entries).map(({ entry, line }) => {
    bal += acc.normal === "debit" ? line.debit - line.credit : line.credit - line.debit;
    return {
      date: entry.date,
      ref: entry.ref,
      description: entry.description,
      debit: line.debit,
      credit: line.credit,
      balance: round2(bal),
    };
  });
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

/** Trial balance: every account with a non-zero closing balance, in its normal column. */
export function trialBalanceRows(entries: JournalEntry[] = JOURNAL_ENTRIES, accounts: ReportAccount[] = REPORT_ACCOUNTS): { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number } {
  const rows: TrialBalanceRow[] = [];
  let totalDebit = 0;
  let totalCredit = 0;
  for (const acc of accounts) {
    const bal = closingBalance(acc.code, entries, accounts);
    if (bal === 0) continue;
    const debit = acc.normal === "debit" ? bal : 0;
    const credit = acc.normal === "credit" ? bal : 0;
    rows.push({ code: acc.code, name: acc.name, debit, credit });
    totalDebit += debit;
    totalCredit += credit;
  }
  return { rows, totalDebit: round2(totalDebit), totalCredit: round2(totalCredit) };
}

/* --------------------------- Income statement --------------------- */

export interface StatementLine {
  code: string;
  name: string;
  amount: number;
}

export function incomeStatement(entries: JournalEntry[] = JOURNAL_ENTRIES, accounts: ReportAccount[] = REPORT_ACCOUNTS) {
  const revenue: StatementLine[] = [];
  const operatingExpenses: StatementLine[] = [];
  const otherExpenses: StatementLine[] = [];
  for (const acc of accounts) {
    const bal = closingBalance(acc.code, entries, accounts);
    if (acc.type === "revenue" && bal !== 0) {
      revenue.push({ code: acc.code, name: acc.name, amount: bal });
    } else if (acc.type === "expense" && bal !== 0) {
      (acc.subtype === "other" ? otherExpenses : operatingExpenses).push({
        code: acc.code,
        name: acc.name,
        amount: bal,
      });
    }
  }
  const totalRevenue = round2(revenue.reduce((s, l) => s + l.amount, 0));
  const totalOperating = round2(operatingExpenses.reduce((s, l) => s + l.amount, 0));
  const totalOther = round2(otherExpenses.reduce((s, l) => s + l.amount, 0));
  const totalExpenses = round2(totalOperating + totalOther);
  const netIncome = round2(totalRevenue - totalExpenses);
  return { revenue, operatingExpenses, otherExpenses, totalRevenue, totalOperating, totalOther, totalExpenses, netIncome };
}

/* --------------------------- Balance sheet ------------------------- */

export function balanceSheet(entries: JournalEntry[] = JOURNAL_ENTRIES, accounts: ReportAccount[] = REPORT_ACCOUNTS) {
  const currentAssets: StatementLine[] = [];
  const nonCurrentAssets: StatementLine[] = [];
  const currentLiabilities: StatementLine[] = [];
  const nonCurrentLiabilities: StatementLine[] = [];
  for (const acc of accounts) {
    const bal = closingBalance(acc.code, entries, accounts);
    if (acc.type === "asset" && bal !== 0) {
      (acc.subtype === "current" ? currentAssets : nonCurrentAssets).push({ code: acc.code, name: acc.name, amount: bal });
    } else if (acc.type === "liability" && bal !== 0) {
      (acc.subtype === "current" ? currentLiabilities : nonCurrentLiabilities).push({ code: acc.code, name: acc.name, amount: bal });
    }
  }
  const totalCurrentAssets = round2(currentAssets.reduce((s, l) => s + l.amount, 0));
  const totalNonCurrentAssets = round2(nonCurrentAssets.reduce((s, l) => s + l.amount, 0));
  const totalAssets = round2(totalCurrentAssets + totalNonCurrentAssets);
  const totalCurrentLiabilities = round2(currentLiabilities.reduce((s, l) => s + l.amount, 0));
  const totalNonCurrentLiabilities = round2(nonCurrentLiabilities.reduce((s, l) => s + l.amount, 0));
  const totalLiabilities = round2(totalCurrentLiabilities + totalNonCurrentLiabilities);

  // Equity section: capital account closing balance + retained net income − draws.
  const capital = closingBalance("3000", entries, accounts);
  const draws = closingBalance("3100", entries, accounts);
  const { netIncome } = incomeStatement(entries, accounts);
  const totalEquity = round2(capital + netIncome - draws);

  return {
    currentAssets,
    nonCurrentAssets,
    totalCurrentAssets,
    totalNonCurrentAssets,
    totalAssets,
    currentLiabilities,
    nonCurrentLiabilities,
    totalCurrentLiabilities,
    totalNonCurrentLiabilities,
    totalLiabilities,
    capital,
    draws,
    netIncome,
    totalEquity,
    totalLiabilitiesAndEquity: round2(totalLiabilities + totalEquity),
  };
}

/* --------------------------- Cash flow ----------------------------- */

export function cashFlowStatement(entries: JournalEntry[] = JOURNAL_ENTRIES, accounts: ReportAccount[] = REPORT_ACCOUNTS) {
  const { netIncome } = incomeStatement(entries, accounts);
  // Working-capital movements, derived from opening vs closing balances.
  const arIncrease = round2(closingBalance("1100", entries, accounts) - getAccount("1100", accounts).opening);
  const apIncrease = round2(closingBalance("2100", entries, accounts) - getAccount("2100", accounts).opening);

  const operating = [
    { name: "Net income", amount: netIncome },
    { name: "Increase in accounts receivable", amount: -arIncrease },
    { name: "Increase in accounts payable", amount: apIncrease },
  ].filter((l) => l.amount !== 0);
  const netOperating = round2(operating.reduce((s, l) => s + l.amount, 0));

  const investing = [{ name: "Purchase of equipment", amount: 0 }];
  const netInvesting = round2(investing.reduce((s, l) => s + l.amount, 0));

  // Financing movements: owner contributions in / draws out, from the journal.
  const contributions = round2(
    linesForAccount("3000", entries).reduce((s, { line }) => s + line.credit - line.debit, 0),
  );
  const draws = closingBalance("3100", entries, accounts);
  const financing = [
    { name: "Owner capital contribution", amount: contributions },
    { name: "Owner's draws", amount: -draws },
  ].filter((l) => l.amount !== 0);
  const netFinancing = round2(financing.reduce((s, l) => s + l.amount, 0));

  const netChange = round2(netOperating + netInvesting + netFinancing);
  const beginningCash = getAccount("1000", accounts).opening;
  const endingCash = round2(beginningCash + netChange);

  return { operating, netOperating, investing, netInvesting, financing, netFinancing, netChange, beginningCash, endingCash };
}

/* --------------------- Statement of changes in equity -------------- */

export function equityStatement(entries: JournalEntry[] = JOURNAL_ENTRIES, accounts: ReportAccount[] = REPORT_ACCOUNTS) {
  const openingCapital = getAccount("3000", accounts).opening;
  const contributions = round2(
    linesForAccount("3000", entries).reduce((s, { line }) => s + line.credit - line.debit, 0),
  );
  const { netIncome } = incomeStatement(entries, accounts);
  const draws = closingBalance("3100", entries, accounts);
  const closingEquity = round2(openingCapital + contributions + netIncome - draws);
  return { openingCapital, contributions, netIncome, draws, closingEquity };
}
