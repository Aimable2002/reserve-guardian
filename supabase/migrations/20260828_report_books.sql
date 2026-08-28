-- Financial Reports — manual bookkeeping tables (per-user private books).
-- Run this once in the Supabase SQL editor.

create table if not exists public.report_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null check (type in ('asset','liability','equity','revenue','expense')),
  subtype text check (subtype in ('current','non-current','operating','other','contra-equity')),
  normal text not null check (normal in ('debit','credit')),
  opening_balance numeric(14,2) not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists public.report_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ref text not null,
  entry_date date not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ref)
);

create table if not exists public.report_journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.report_journal_entries(id) on delete cascade,
  account_id uuid not null references public.report_accounts(id) on delete restrict,
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  line_order integer not null default 0,
  constraint report_journal_lines_one_side check ((debit > 0) <> (credit > 0))
);

create index if not exists report_accounts_user_idx on public.report_accounts (user_id, sort_order, code);
create index if not exists report_journal_entries_user_idx on public.report_journal_entries (user_id, entry_date, ref);
create index if not exists report_journal_lines_entry_idx on public.report_journal_lines (entry_id);

grant select, insert, update, delete on public.report_accounts to authenticated;
grant select, insert, update, delete on public.report_journal_entries to authenticated;
grant select, insert, update, delete on public.report_journal_lines to authenticated;
grant all on public.report_accounts to service_role;
grant all on public.report_journal_entries to service_role;
grant all on public.report_journal_lines to service_role;

alter table public.report_accounts enable row level security;
alter table public.report_journal_entries enable row level security;
alter table public.report_journal_lines enable row level security;

drop policy if exists "own report accounts" on public.report_accounts;
create policy "own report accounts" on public.report_accounts
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own report entries" on public.report_journal_entries;
create policy "own report entries" on public.report_journal_entries
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own report lines" on public.report_journal_lines;
create policy "own report lines" on public.report_journal_lines
  for all to authenticated
  using (exists (
    select 1 from public.report_journal_entries e
    where e.id = report_journal_lines.entry_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.report_journal_entries e
    where e.id = report_journal_lines.entry_id and e.user_id = auth.uid()
  ));
