-- Teams are reusable identities. A tournament participation lives in registrations.
alter table public.teams alter column tournament_id drop not null;

create table if not exists public.registration_members (
  registration_id uuid not null references public.registrations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (registration_id, user_id)
);

create index if not exists registration_members_user_idx on public.registration_members(user_id);
create unique index if not exists registrations_active_team_unique
  on public.registrations(tournament_id, team_id)
  where team_id is not null and status not in ('rejected', 'cancelled');

alter table public.registration_members enable row level security;
create policy "registration rosters are readable" on public.registration_members for select using (true);
create policy "captains create registration rosters" on public.registration_members for insert to authenticated
with check (exists (
  select 1 from public.registrations r
  join public.teams t on t.id = r.team_id
  where r.id = registration_id and r.user_id = auth.uid() and t.captain_id = auth.uid()
));

create or replace function public.validate_registration_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_type text;
  linked_captain uuid;
begin
  select participant_type into expected_type from public.tournaments where id = new.tournament_id;
  if expected_type = 'individual' and new.team_id is not null then
    raise exception 'Los torneos individuales no aceptan equipos.';
  end if;
  if expected_type = 'team' and new.team_id is null then
    raise exception 'Los torneos por equipos requieren un equipo.';
  end if;
  if new.team_id is not null then
    select captain_id into linked_captain from public.teams where id = new.team_id;
    if linked_captain is null then raise exception 'El equipo no existe.'; end if;
    if linked_captain is distinct from new.user_id then
      raise exception 'Solo el capitán puede inscribir al equipo.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.validate_registration_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_team uuid;
  target_tournament uuid;
begin
  select team_id, tournament_id into target_team, target_tournament
  from public.registrations where id = new.registration_id;
  if target_team is null then raise exception 'La inscripción no corresponde a un equipo.'; end if;
  if not exists (select 1 from public.team_members where team_id = target_team and user_id = new.user_id) then
    raise exception 'El jugador no pertenece a este equipo.';
  end if;
  if exists (
    select 1 from public.registration_members rm
    join public.registrations r on r.id = rm.registration_id
    where rm.user_id = new.user_id
      and r.tournament_id = target_tournament
      and r.id <> new.registration_id
      and r.status not in ('rejected', 'cancelled')
  ) then
    raise exception 'El jugador ya está inscrito en este torneo con otro equipo.';
  end if;
  return new;
end;
$$;

drop trigger if exists registration_members_validate on public.registration_members;
create trigger registration_members_validate
before insert or update on public.registration_members
for each row execute function public.validate_registration_member();

-- Preserve existing team registrations as roster snapshots.
insert into public.registration_members (registration_id, user_id)
select r.id, tm.user_id
from public.registrations r
join public.team_members tm on tm.team_id = r.team_id
where r.team_id is not null and r.status not in ('rejected', 'cancelled')
on conflict do nothing;

create or replace function public.create_free_registration(
  target_tournament_id uuid,
  target_team_id uuid default null,
  selected_member_ids uuid[] default '{}'::uuid[],
  requested_status text default 'confirmed'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_registration_id uuid;
  current_user_id uuid := auth.uid();
  team_captain_id uuid;
begin
  if current_user_id is null then raise exception 'Debes iniciar sesión.'; end if;
  if requested_status not in ('pending', 'confirmed') then raise exception 'Estado de inscripción inválido.'; end if;
  if target_team_id is not null then
    select captain_id into team_captain_id from public.teams where id = target_team_id;
    if team_captain_id is distinct from current_user_id then raise exception 'Solo el capitán puede inscribir al equipo.'; end if;
    if not (current_user_id = any(selected_member_ids)) then raise exception 'El capitán debe formar parte del roster inscrito.'; end if;
  end if;
  insert into public.registrations(tournament_id, user_id, team_id, status)
  values (target_tournament_id, current_user_id, target_team_id, requested_status)
  returning id into new_registration_id;
  if target_team_id is not null then
    insert into public.registration_members(registration_id, user_id)
    select new_registration_id, member_id from unnest(selected_member_ids) member_id;
  end if;
  return new_registration_id;
end;
$$;

grant execute on function public.create_free_registration(uuid, uuid, uuid[], text) to authenticated;
