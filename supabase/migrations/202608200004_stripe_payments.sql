-- Stripe test payments: ledger, registration state and server-calculated balances.

alter table public.registrations
  add column if not exists payment_status text not null default 'not_required'
    check (payment_status in ('not_required','pending','paid','failed','refunded')),
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists paid_at timestamptz;

create unique index if not exists registrations_stripe_checkout_session_uidx
  on public.registrations(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.transactions
  add column if not exists registration_id uuid references public.registrations(id) on delete set null,
  add column if not exists amount_minor bigint,
  add column if not exists stripe_fee_minor bigint not null default 0,
  add column if not exists refunded_amount_minor bigint not null default 0,
  add column if not exists net_amount_minor bigint,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists payment_method text not null default 'Stripe',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.transactions
set amount_minor = round(amount * 100)::bigint
where amount_minor is null;

update public.transactions
set net_amount_minor = greatest(amount_minor - stripe_fee_minor, 0)
where net_amount_minor is null;

alter table public.transactions alter column amount_minor set not null;
alter table public.transactions alter column net_amount_minor set not null;

create unique index if not exists transactions_checkout_session_uidx
  on public.transactions(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create unique index if not exists transactions_payment_intent_uidx
  on public.transactions(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at before update on public.transactions
for each row execute function public.set_updated_at();

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

create table if not exists public.sponsor_contributions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete restrict,
  sponsor_name text not null check (char_length(btrim(sponsor_name)) between 2 and 100),
  contributor_user_id uuid references public.profiles(id) on delete set null,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'mxn' check (currency ~ '^[a-z]{3}$'),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sponsor_contributions enable row level security;
create policy "paid sponsor contributions are readable" on public.sponsor_contributions
for select using (status = 'paid');
create policy "organizers read tournament contributions" on public.sponsor_contributions
for select to authenticated using (
  exists(select 1 from public.tournaments t where t.id = tournament_id and t.organizer_id = auth.uid())
  or public.is_admin()
);

drop trigger if exists sponsor_contributions_set_updated_at on public.sponsor_contributions;
create trigger sponsor_contributions_set_updated_at before update on public.sponsor_contributions
for each row execute function public.set_updated_at();

alter table public.profiles
  add column if not exists stripe_connect_account_id text unique,
  add column if not exists stripe_connect_onboarding_complete boolean not null default false;

create or replace function public.tournament_financial_summary(target_tournament_id uuid)
returns table (
  registration_gross_minor bigint,
  sponsor_gross_minor bigint,
  stripe_fees_minor bigint,
  refundable_adjustments_minor bigint,
  distributable_net_minor bigint,
  organizer_amount_minor bigint,
  prize_amount_minor bigint,
  currency text
)
language sql
stable
security definer
set search_path = ''
as $$
  with paid as (
    select
      coalesce(sum(case when fee_type = 'entry_fee' and status = 'PAID' then amount_minor else 0 end), 0)::bigint as registrations,
      coalesce(sum(case when fee_type = 'sponsor_contribution' and status = 'PAID' then amount_minor else 0 end), 0)::bigint as sponsors,
      coalesce(sum(case when status = 'PAID' then stripe_fee_minor else 0 end), 0)::bigint as fees,
      coalesce(sum(refunded_amount_minor), 0)::bigint as refunds
    from public.transactions
    where tournament_id = target_tournament_id
  ), totals as (
    select *, greatest(registrations + sponsors - fees - refunds, 0)::bigint as net from paid
  )
  select
    totals.registrations,
    totals.sponsors,
    totals.fees,
    totals.refunds,
    totals.net,
    floor(totals.net * (t.organizer_percentage / 100.0))::bigint,
    (totals.net - floor(totals.net * (t.organizer_percentage / 100.0)))::bigint,
    'mxn'::text
  from totals cross join public.tournaments t
  where t.id = target_tournament_id;
$$;

revoke all on function public.tournament_financial_summary(uuid) from public;
grant execute on function public.tournament_financial_summary(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
