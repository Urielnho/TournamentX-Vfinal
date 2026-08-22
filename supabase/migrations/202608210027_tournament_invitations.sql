-- Invitaciones a torneos privados: el organizador invita usuarios o equipos
-- específicos; deben aceptar para ocupar un cupo (no hay auto-inscripción ni
-- whitelist pasiva). Sigue el mismo patrón que team_invitations.

create table if not exists public.tournament_invitations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  invited_user_id uuid references public.profiles(id) on delete cascade,
  invited_team_id uuid references public.teams(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','expired')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (
    (invited_user_id is not null and invited_team_id is null) or
    (invited_user_id is null and invited_team_id is not null)
  )
);

create index if not exists tournament_invitations_tournament_idx on public.tournament_invitations(tournament_id);
create index if not exists tournament_invitations_user_idx on public.tournament_invitations(invited_user_id);
create index if not exists tournament_invitations_team_idx on public.tournament_invitations(invited_team_id);
create unique index if not exists tournament_invitations_user_pending_unique on public.tournament_invitations(tournament_id, invited_user_id) where status = 'pending' and invited_user_id is not null;
create unique index if not exists tournament_invitations_team_pending_unique on public.tournament_invitations(tournament_id, invited_team_id) where status = 'pending' and invited_team_id is not null;

alter table public.tournament_invitations enable row level security;
revoke insert, update, delete on public.tournament_invitations from anon, authenticated;

create policy "involved parties read tournament invitations" on public.tournament_invitations for select to authenticated using (
  invited_user_id = auth.uid()
  or invited_by = auth.uid()
  or exists(select 1 from public.teams t where t.id = invited_team_id and t.captain_id = auth.uid())
  or exists(select 1 from public.tournaments t where t.id = tournament_id and t.organizer_id = auth.uid())
  or public.is_admin()
);

-- Un torneo privado también debe ser visible para quien tiene una invitación
-- pendiente o aceptada; sin esto no podría verlo para aceptarla/rechazarla.
drop policy if exists "public tournaments are readable" on public.tournaments;
create policy "public tournaments are readable" on public.tournaments for select using (
  (access_type = 'public' and status <> 'draft')
  or organizer_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.tournament_invitations ti
    where ti.tournament_id = tournaments.id
      and ti.status in ('pending','accepted')
      and (
        ti.invited_user_id = auth.uid()
        or exists(select 1 from public.teams t where t.id = ti.invited_team_id and t.captain_id = auth.uid())
      )
  )
);

create or replace function public.search_eligible_users(search_query text)
returns table (id uuid, full_name text, gamer_tag text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.gamer_tag
  from public.profiles p
  where auth.uid() is not null
    and btrim(coalesce(search_query, '')) <> ''
    and (p.gamer_tag ilike '%' || btrim(search_query) || '%' or p.full_name ilike '%' || btrim(search_query) || '%')
    and p.id <> auth.uid()
  order by p.gamer_tag asc
  limit 20;
$$;
revoke all on function public.search_eligible_users(text) from public;
grant execute on function public.search_eligible_users(text) to authenticated;

create or replace function public.search_eligible_teams(search_query text, min_roster integer default 1)
returns table (id uuid, name text, tag text, members_count bigint)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.tag, count(tm.user_id) as members_count
  from public.teams t
  join public.team_members tm on tm.team_id = t.id
  where auth.uid() is not null
    and t.archived_at is null
    and btrim(coalesce(search_query, '')) <> ''
    and (t.name ilike '%' || btrim(search_query) || '%' or t.tag ilike '%' || btrim(search_query) || '%')
  group by t.id, t.name, t.tag
  having count(tm.user_id) >= greatest(coalesce(min_roster, 1), 1)
  order by t.name asc
  limit 20;
$$;
revoke all on function public.search_eligible_teams(text, integer) from public;
grant execute on function public.search_eligible_teams(text, integer) to authenticated;

create or replace function public.invite_tournament_participant(target_tournament_id uuid, target_user_id uuid default null, target_team_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  tournament_row public.tournaments%rowtype;
  invitation_id uuid;
  team_roster_count integer;
begin
  if (target_user_id is null) = (target_team_id is null) then
    raise exception 'Debes indicar exactamente un usuario o un equipo para invitar.';
  end if;

  select * into tournament_row from public.tournaments where id = target_tournament_id;
  if tournament_row.id is null then raise exception 'El torneo no existe.'; end if;
  if tournament_row.organizer_id <> auth.uid() and not public.is_admin() then
    raise exception 'Solo el organizador puede invitar participantes.';
  end if;
  if tournament_row.access_type <> 'private' then
    raise exception 'Solo los torneos privados usan invitaciones.';
  end if;

  if target_user_id is not null then
    if tournament_row.participant_type <> 'individual' then raise exception 'Este torneo requiere invitar equipos, no usuarios individuales.'; end if;
    if not exists(select 1 from public.profiles where id = target_user_id) then raise exception 'No encontramos ese usuario.'; end if;
    insert into public.tournament_invitations(tournament_id, invited_user_id, invited_by)
    values (target_tournament_id, target_user_id, auth.uid())
    on conflict (tournament_id, invited_user_id) where status = 'pending' and invited_user_id is not null
      do update set created_at = now()
    returning id into invitation_id;
    perform queue_email(target_user_id, 'Invitación a ' || tournament_row.title, 'Te invitaron a participar en el torneo privado "' || tournament_row.title || '". Acepta la invitación desde TournamentX para inscribirte.', 'tournament_invitation');
  else
    if tournament_row.participant_type <> 'team' then raise exception 'Este torneo requiere invitar usuarios individuales, no equipos.'; end if;
    if not exists(select 1 from public.teams where id = target_team_id and archived_at is null) then raise exception 'El equipo no existe o fue eliminado.'; end if;
    select count(*) into team_roster_count from public.team_members where team_id = target_team_id;
    if team_roster_count < tournament_row.min_players_per_team then
      raise exception 'El equipo no cumple el mínimo de % jugadores requerido.', tournament_row.min_players_per_team;
    end if;
    insert into public.tournament_invitations(tournament_id, invited_team_id, invited_by)
    values (target_tournament_id, target_team_id, auth.uid())
    on conflict (tournament_id, invited_team_id) where status = 'pending' and invited_team_id is not null
      do update set created_at = now()
    returning id into invitation_id;
    perform queue_email((select captain_id from public.teams where id = target_team_id), 'Invitación a ' || tournament_row.title, 'Invitaron a tu equipo a participar en el torneo privado "' || tournament_row.title || '". Acepta la invitación desde TournamentX para inscribir a tu equipo.', 'tournament_invitation');
  end if;

  return invitation_id;
end $$;
revoke all on function public.invite_tournament_participant(uuid, uuid, uuid) from public;
grant execute on function public.invite_tournament_participant(uuid, uuid, uuid) to authenticated;

create or replace function public.accept_tournament_invitation(target_invitation_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  invitation public.tournament_invitations%rowtype;
  tournament_row public.tournaments%rowtype;
  acting_user uuid := auth.uid();
  new_registration_id uuid;
  roster uuid[];
begin
  if acting_user is null then raise exception 'Inicia sesión para aceptar la invitación.'; end if;
  select * into invitation from public.tournament_invitations where id = target_invitation_id and status = 'pending' for update;
  if invitation.id is null then raise exception 'La invitación no existe o ya fue respondida.'; end if;
  select * into tournament_row from public.tournaments where id = invitation.tournament_id;

  if invitation.invited_user_id is not null then
    if invitation.invited_user_id <> acting_user then raise exception 'Esta invitación pertenece a otro usuario.'; end if;
    new_registration_id := public.create_free_registration(invitation.tournament_id, null, '{}'::uuid[], 'confirmed');
  else
    if not exists(select 1 from public.teams where id = invitation.invited_team_id and captain_id = acting_user) then
      raise exception 'Solo el capitán del equipo puede aceptar esta invitación.';
    end if;
    select array_agg(user_id) into roster from public.team_members where team_id = invitation.invited_team_id;
    new_registration_id := public.create_free_registration(invitation.tournament_id, invitation.invited_team_id, coalesce(roster, '{}'::uuid[]), 'confirmed');
  end if;

  update public.tournament_invitations set status = 'accepted', responded_at = now() where id = target_invitation_id;
  perform queue_email(tournament_row.organizer_id, 'Invitación aceptada: ' || tournament_row.title, 'Un participante aceptó tu invitación a "' || tournament_row.title || '" y quedó inscrito.', 'tournament_invitation_accepted');
  return new_registration_id;
end $$;
revoke all on function public.accept_tournament_invitation(uuid) from public;
grant execute on function public.accept_tournament_invitation(uuid) to authenticated;

create or replace function public.reject_tournament_invitation(target_invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare invitation public.tournament_invitations%rowtype;
begin
  select * into invitation from public.tournament_invitations where id = target_invitation_id and status = 'pending' for update;
  if invitation.id is null then raise exception 'La invitación no existe o ya fue respondida.'; end if;
  if invitation.invited_user_id is not null and invitation.invited_user_id <> auth.uid() then raise exception 'Esta invitación pertenece a otro usuario.'; end if;
  if invitation.invited_team_id is not null and not exists(select 1 from public.teams where id = invitation.invited_team_id and captain_id = auth.uid()) then
    raise exception 'Solo el capitán del equipo puede rechazar esta invitación.';
  end if;
  update public.tournament_invitations set status = 'rejected', responded_at = now() where id = target_invitation_id;
end $$;
revoke all on function public.reject_tournament_invitation(uuid) from public;
grant execute on function public.reject_tournament_invitation(uuid) to authenticated;

notify pgrst, 'reload schema';
