alter table public.matches
  add column if not exists registration_a_id uuid references public.registrations(id) on delete set null,
  add column if not exists registration_b_id uuid references public.registrations(id) on delete set null,
  add column if not exists round_number integer not null default 1 check (round_number > 0),
  add column if not exists match_number integer not null default 1 check (match_number > 0);

with numbered as (
  select id, row_number() over (partition by tournament_id order by created_at,id)::integer as position
  from public.matches
)
update public.matches m set match_number=numbered.position from numbered where numbered.id=m.id;

create unique index if not exists matches_bracket_position_unique on public.matches(tournament_id,round_number,match_number);

create or replace function public.generate_initial_bracket(target_tournament_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare participant_ids uuid[]; participant_teams uuid[]; participant_type text; total integer; position integer; created integer := 0;
begin
  if not exists(select 1 from tournaments where id=target_tournament_id and organizer_id=auth.uid()) and not is_admin() then raise exception 'Solo el organizador puede generar el bracket.'; end if;
  if exists(select 1 from matches where tournament_id=target_tournament_id) then raise exception 'El torneo ya tiene partidos. Elimina la llave actual antes de regenerarla.'; end if;
  select t.participant_type into participant_type from tournaments t where t.id=target_tournament_id;
  select array_agg(r.id order by r.created_at), array_agg(r.team_id order by r.created_at)
  into participant_ids, participant_teams from registrations r where r.tournament_id=target_tournament_id and r.status='confirmed';
  total := coalesce(array_length(participant_ids,1),0);
  if total < 2 then raise exception 'Se necesitan al menos dos participantes confirmados.'; end if;
  position := 1;
  while position <= total loop
    insert into matches(tournament_id,round_name,round_number,match_number,registration_a_id,registration_b_id,team_a_id,team_b_id,status)
    values(target_tournament_id,'Ronda 1',1,((position+1)/2),participant_ids[position],case when position+1<=total then participant_ids[position+1] end,
      case when participant_type='team' then participant_teams[position] end,
      case when participant_type='team' and position+1<=total then participant_teams[position+1] end,'upcoming');
    created := created+1; position := position+2;
  end loop;
  return created;
end $$;

grant execute on function public.generate_initial_bracket(uuid) to authenticated;

create or replace function public.validate_match_timing()
returns trigger language plpgsql set search_path=public as $$
declare tournament_start timestamptz; tournament_end timestamptz;
begin
  if new.scheduled_at is null then return new; end if;
  select start_date,end_date into tournament_start,tournament_end from tournaments where id=new.tournament_id;
  if new.scheduled_at < tournament_start or new.scheduled_at > tournament_end then raise exception 'El partido debe programarse dentro de las fechas del torneo.'; end if;
  return new;
end $$;

drop trigger if exists matches_validate_timing on public.matches;
create trigger matches_validate_timing before insert or update of scheduled_at,tournament_id on public.matches for each row execute function public.validate_match_timing();
