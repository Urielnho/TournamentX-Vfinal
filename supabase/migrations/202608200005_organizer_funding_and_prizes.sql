-- Organizer-funded prize pools and configurable prize-place distribution.

alter table public.tournaments drop constraint if exists tournaments_status_check;
alter table public.tournaments add constraint tournaments_status_check
  check (status in ('draft','upcoming','open','live','completed','cancelled','suspended'));

alter table public.tournaments
  add column if not exists prize_distribution jsonb not null default '[{"place":"1er Lugar","percentage":100}]'::jsonb,
  add column if not exists organizer_funding_status text not null default 'not_required'
    check (organizer_funding_status in ('not_required','pending','paid','failed','refunded')),
  add column if not exists organizer_payment_intent_id text unique,
  add column if not exists published_at timestamptz;

alter table public.transactions drop constraint if exists transactions_fee_type_check;
alter table public.transactions add constraint transactions_fee_type_check
  check (fee_type in ('entry_fee','organizer_contribution','sponsor_contribution','prize_payout'));

drop policy if exists "public tournaments are readable" on public.tournaments;
create policy "public tournaments are readable" on public.tournaments for select using (
  (access_type = 'public' and status <> 'draft') or organizer_id = auth.uid() or public.is_admin()
);

drop function if exists public.tournament_financial_summary(uuid);
create function public.tournament_financial_summary(target_tournament_id uuid)
returns table (
  registration_gross_minor bigint,
  sponsor_gross_minor bigint,
  organizer_seed_gross_minor bigint,
  stripe_fees_minor bigint,
  refundable_adjustments_minor bigint,
  distributable_net_minor bigint,
  organizer_amount_minor bigint,
  prize_amount_minor bigint,
  currency text
)
language sql stable security definer set search_path = '' as $$
  with paid as (
    select
      coalesce(sum(case when fee_type = 'entry_fee' and status = 'PAID' then amount_minor else 0 end), 0)::bigint registrations,
      coalesce(sum(case when fee_type = 'sponsor_contribution' and status = 'PAID' then amount_minor else 0 end), 0)::bigint sponsors,
      coalesce(sum(case when fee_type = 'organizer_contribution' and status = 'PAID' then amount_minor else 0 end), 0)::bigint organizer_seed,
      coalesce(sum(case when status = 'PAID' then stripe_fee_minor else 0 end), 0)::bigint fees,
      coalesce(sum(refunded_amount_minor), 0)::bigint refunds
    from public.transactions where tournament_id = target_tournament_id
  ), totals as (
    select *, greatest(registrations + sponsors + organizer_seed - fees - refunds, 0)::bigint net from paid
  )
  select totals.registrations, totals.sponsors, totals.organizer_seed, totals.fees, totals.refunds, totals.net,
    floor(totals.net * (t.organizer_percentage / 100.0))::bigint,
    (totals.net - floor(totals.net * (t.organizer_percentage / 100.0)))::bigint, 'mxn'::text
  from totals cross join public.tournaments t where t.id = target_tournament_id;
$$;

revoke all on function public.tournament_financial_summary(uuid) from public;
grant execute on function public.tournament_financial_summary(uuid) to anon, authenticated;
notify pgrst, 'reload schema';
