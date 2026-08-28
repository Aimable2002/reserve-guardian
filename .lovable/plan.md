# Financial Reports — real database tables

Move the manual bookkeeping module off client-only state and onto real, saved data. Each signed-in user gets their own private set of books.

## Tables

```text
report_accounts        report_journal_entries        report_journal_lines
-------------------    ----------------------        --------------------
id                     id                            id
user_id                user_id                       entry_id -> entries
code ("1000")          ref ("JE-2026-001")           account_id -> accounts
name                   entry_date                    debit
type (asset/…)         description                   credit
subtype                created_at                    line_order
normal (debit/credit)  updated_at
opening_balance
is_active
sort_order
```

- `report_accounts`: user-editable chart of accounts (add, rename, change type/opening balance, deactivate). Unique `(user_id, code)`.
- `report_journal_entries`: one row per manual journal entry. Unique `(user_id, ref)` so reference numbers stay unique per user.
- `report_journal_lines`: the debit/credit lines of an entry, deleted automatically when the entry is deleted.

A balance check (each line has either a debit or a credit, never both, and never negative) is enforced in the database as well as in the form.

## Access rules

Row-level security on all three tables: a user can read and write only rows where `user_id` is their own. Journal lines are protected through the entry they belong to. No public/anonymous access.

## First-run seeding

When a signed-in user opens Financial Reports for the first time and has no accounts, the app creates the existing 13-account chart of accounts (Cash, Accounts Receivable, Equipment, Accounts Payable, Loan Payable, Owner's Capital, Owner's Draws, Rent Income, Service Income, Salaries/Utilities/Supplies expense, Bank Charges) with today's opening balances so the reports are usable immediately. The 13 sample journal entries are no longer auto-loaded — the books start empty and are filled only through the manual entry form.

## Wiring the UI

- `src/lib/reports-store.tsx` becomes a data-backed store: loads accounts and entries for the current user, and exposes create/update/delete that write to the database and refresh state.
- The manual journal form (`journal-entry-dialog.tsx`) saves to the database, with a saving state and an error toast on failure.
- All eight report views keep their current look and keep deriving every figure from the loaded journal — no calculation changes.
- Add a **Chart of accounts** screen inside Reports to add, edit, deactivate, and set opening balances for accounts, since accounts are now user-editable.
- Reports pages get a loading state and an empty state ("No journal entries yet — record your first entry").
- Financial Reports requires sign-in (it already sits inside the app shell); signed-out users are sent to the existing auth screen.

## Isolation

Unchanged: nothing in the wallet, reserve, deposit, withdrawal, send, receive or transfer flows writes to these tables. The manual journal form is still the only way a record enters the reports module. The new tables are separate from `ledger_entries` and are never read by the rest of the app.

## Technical notes

This project points at your own Supabase project (`src/lib/supabase.ts`), not Lovable Cloud, so I cannot run migrations from here. I will produce a single SQL migration file in the repo (tables + indexes + grants + RLS policies) for you to paste into your Supabase SQL editor, and I will wire the frontend against it in the same change. Reads and writes go through the existing browser Supabase client under RLS — no new backend routes.
