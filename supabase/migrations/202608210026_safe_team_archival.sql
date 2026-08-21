alter table public.teams add column if not exists archived_at timestamptz;

drop index if exists public.teams_name_unique_ci;
drop index if exists public.teams_tag_unique_ci;
create unique index teams_name_unique_ci on public.teams(lower(btrim(name))) where archived_at is null;
create unique index teams_tag_unique_ci on public.teams(lower(btrim(tag))) where archived_at is null;

create or replace function public.archive_team(target_team_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare target_name text; member_record record;
begin
  select name into target_name from teams where id=target_team_id and archived_at is null;
  if target_name is null then raise exception 'El equipo no existe o ya fue eliminado.'; end if;
  if not exists(select 1 from teams where id=target_team_id and (captain_id=auth.uid() or is_admin())) then raise exception 'Solo el capitán o un administrador puede eliminar el equipo.'; end if;
  if exists(select 1 from registrations r join tournaments t on t.id=r.tournament_id where r.team_id=target_team_id and r.status not in ('rejected','cancelled') and t.status in ('upcoming','open','live')) then raise exception 'No puedes eliminar un equipo inscrito en un torneo activo.'; end if;
  for member_record in select user_id from team_members where team_id=target_team_id and user_id<>auth.uid() loop
    perform queue_email(member_record.user_id,'El equipo '||target_name||' fue eliminado','El capitán eliminó el equipo "'||target_name||'". Tu historial de torneos y resultados se conserva.','team_archived');
  end loop;
  update teams set archived_at=now() where id=target_team_id;
end $$;
revoke all on function public.archive_team(uuid) from public;
grant execute on function public.archive_team(uuid) to authenticated;
