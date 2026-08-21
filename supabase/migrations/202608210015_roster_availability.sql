create or replace function public.team_roster_availability(target_team_id uuid, target_tournament_id uuid)
returns table(user_id uuid, unavailable boolean)
language sql
stable
security definer
set search_path = public
as $$
  select tm.user_id, exists (
    select 1 from public.registration_members rm
    join public.registrations r on r.id = rm.registration_id
    where rm.user_id = tm.user_id
      and r.tournament_id = target_tournament_id
      and r.status not in ('rejected', 'cancelled')
  )
  from public.team_members tm
  where tm.team_id = target_team_id
    and exists (select 1 from public.teams t where t.id = target_team_id and t.captain_id = auth.uid());
$$;

revoke all on function public.team_roster_availability(uuid, uuid) from public;
grant execute on function public.team_roster_availability(uuid, uuid) to authenticated;
