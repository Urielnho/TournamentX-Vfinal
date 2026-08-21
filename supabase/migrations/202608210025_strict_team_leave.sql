create or replace function public.leave_team(target_team_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if exists(select 1 from teams where id=target_team_id and captain_id=auth.uid()) then raise exception 'El capitán no puede abandonar el equipo sin transferir la capitanía.'; end if;
  if not exists(select 1 from team_members where team_id=target_team_id and user_id=auth.uid()) then raise exception 'No perteneces a este equipo.'; end if;
  if exists(select 1 from registration_members rm join registrations r on r.id=rm.registration_id join tournaments t on t.id=r.tournament_id where r.team_id=target_team_id and rm.user_id=auth.uid() and r.status not in ('rejected','cancelled') and t.end_date>now()) then raise exception 'No puedes abandonar el equipo mientras estás en un roster activo.'; end if;
  delete from team_members where team_id=target_team_id and user_id=auth.uid();
end $$;
grant execute on function public.leave_team(uuid) to authenticated;
