create or replace function public.validate_registration_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_type text;
  linked_tournament uuid;
begin
  select participant_type into expected_type from public.tournaments where id = new.tournament_id;
  if expected_type = 'individual' and new.team_id is not null then
    raise exception 'Los torneos individuales no aceptan equipos.';
  end if;
  if expected_type = 'team' and new.team_id is null then
    raise exception 'Los torneos por equipos requieren un equipo.';
  end if;
  if new.team_id is not null then
    select tournament_id into linked_tournament from public.teams where id = new.team_id;
    if linked_tournament is distinct from new.tournament_id then
      raise exception 'El equipo no pertenece a este torneo.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_validate_type on public.registrations;
create trigger registrations_validate_type
before insert or update of tournament_id, team_id on public.registrations
for each row execute function public.validate_registration_type();
