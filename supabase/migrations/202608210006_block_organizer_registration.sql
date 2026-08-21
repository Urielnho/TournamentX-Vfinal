-- Tournament organizers administer their events and cannot register as participants.
create or replace function public.prevent_organizer_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.tournaments t
    where t.id = new.tournament_id and t.organizer_id = new.user_id
  ) then
    raise exception 'El organizador no puede inscribirse en su propio torneo.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_prevent_organizer on public.registrations;
create trigger registrations_prevent_organizer
before insert or update of tournament_id, user_id on public.registrations
for each row execute function public.prevent_organizer_registration();
