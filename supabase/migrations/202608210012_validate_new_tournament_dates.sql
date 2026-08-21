create or replace function public.validate_tournament_dates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.registration_deadline::date < current_date then
    raise exception 'El cierre de inscripciones no puede estar en un dia anterior a la creacion.';
  end if;
  if new.registration_deadline > new.start_date then
    raise exception 'El cierre de inscripciones no puede ser posterior al inicio.';
  end if;
  if new.end_date < new.start_date then
    raise exception 'La finalizacion no puede ser anterior al inicio.';
  end if;
  return new;
end;
$$;

drop trigger if exists tournaments_validate_dates on public.tournaments;
create trigger tournaments_validate_dates
before insert or update of registration_deadline, start_date, end_date on public.tournaments
for each row execute function public.validate_tournament_dates();
