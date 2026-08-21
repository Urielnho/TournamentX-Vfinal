create or replace function public.tournament_financial_summary(target_tournament_id uuid)
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
      coalesce(sum(case when fee_type = 'entry_fee' and status in ('PAID','REFUNDED') then amount_minor else 0 end), 0)::bigint registrations,
      coalesce(sum(case when fee_type = 'sponsor_contribution' and status in ('PAID','REFUNDED') then amount_minor else 0 end), 0)::bigint sponsors,
      coalesce(sum(case when fee_type = 'organizer_contribution' and status in ('PAID','REFUNDED') then amount_minor else 0 end), 0)::bigint organizer_seed,
      coalesce(sum(case when status in ('PAID','REFUNDED') then stripe_fee_minor else 0 end), 0)::bigint fees,
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
