create or replace function public.schedule_tournament_match(
  target_match_id uuid,
  target_scheduled_at timestamptz,
  target_stream_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tournament_id uuid;
  tournament_start timestamptz;
  tournament_end timestamptz;
begin
  select m.tournament_id, t.start_date, t.end_date
  into target_tournament_id, tournament_start, tournament_end
  from matches m
  join tournaments t on t.id = m.tournament_id
  where m.id = target_match_id;

  if target_tournament_id is null then
    raise exception 'El partido no existe o ya fue eliminado.';
  end if;
  if not exists (
    select 1 from tournaments
    where id = target_tournament_id
      and (organizer_id = auth.uid() or is_admin())
  ) then
    raise exception 'Solo el organizador puede programar este partido.';
  end if;
  if target_scheduled_at is null then
    raise exception 'Selecciona la fecha y hora del partido.';
  end if;
  if target_scheduled_at < tournament_start or target_scheduled_at > tournament_end then
    raise exception 'El partido debe programarse entre el inicio y la finalización del torneo.';
  end if;
  if nullif(btrim(target_stream_url), '') is not null and target_stream_url !~* '^https://[^[:space:]]+$' then
    raise exception 'La transmisión debe usar una URL HTTPS válida.';
  end if;

  update matches
  set scheduled_at = target_scheduled_at,
      stream_url = nullif(btrim(target_stream_url), '')
  where id = target_match_id;
end;
$$;

revoke all on function public.schedule_tournament_match(uuid,timestamptz,text) from public;
grant execute on function public.schedule_tournament_match(uuid,timestamptz,text) to authenticated;
