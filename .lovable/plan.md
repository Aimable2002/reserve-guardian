# Manual Financial Reports Ledger

## Goal
Make the Financial Reports module a standalone manual bookkeeping prototype. Wallet, reserve, deposit, withdrawal, send, receive, and transfer actions will never create report records automatically.

## Data flow
```text
Manual journal-entry form
          |
          v
Standalone reports journal state (mock, client-only)
          |
          +--> Journal
          +--> General Ledger
          +--> Trial Balance
          +--> Income Statement
          +--> Balance Sheet
          +--> Cash Flow
          +--> Changes in Equity
          +--> Bundled Financial Report
```

The existing sample journal remains only as initial mock records for UI review. New records can enter the reports module only through its manual journal-entry form. Prototype changes remain local and reset on refresh; no database, backend, wallet store, or reserve store is involved.

## What to build
- Add a clear **New journal entry** action to the Journal page.
- Build a professional manual-entry form with date, reference, description, and editable debit/credit lines.
- Let users add and remove account lines and choose accounts only from the report chart of accounts.
- Require at least two lines, positive amounts, and equal debit/credit totals before posting.
- Show live debit, credit, and out-of-balance totals in the form.
- Add manual edit and delete controls for report journal entries, with confirmation where destructive.
- Put the standalone journal into a reports-only React context so all eight documents update from the same manually maintained source.
- Refactor report calculations to accept the journal from that context instead of reading a fixed module-level array.
- Keep the existing report routes, visual design, navigation, and mock opening balances unchanged.

## Isolation guarantees
- No listeners, imports, calls, triggers, or synchronization from wallet/reserve transaction logic.
- No calls to the existing app backend or database.
- No report entry is created as a side effect of any money movement elsewhere in the app.
- The manual journal form is the only creation path inside Financial Reports.

## Validation
- Verify an unbalanced entry cannot be posted.
- Post a balanced entry and confirm the Journal, General Ledger, Trial Balance, and statements update consistently.
- Edit and delete a manual entry and confirm all dependent reports recalculate.
- Verify wallet and reserve flows do not change report records.
