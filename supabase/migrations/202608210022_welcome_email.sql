alter table public.email_outbox add column if not exists dedupe_key text;
create unique index if not exists email_outbox_dedupe_key_unique on public.email_outbox(dedupe_key) where dedupe_key is not null;

create or replace function public.email_on_verified_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare display_name text;
begin
  if new.email_confirmed_at is null then return new; end if;
  if tg_op='UPDATE' and old.email_confirmed_at is not null then return new; end if;
  select coalesce(nullif(full_name,''),nullif(gamer_tag,''),'competidor') into display_name from profiles where id=new.id;
  insert into email_outbox(recipient,subject,body,event_type,dedupe_key)
  values(new.email,'¡Bienvenido a TournamentX!','Hola '||coalesce(display_name,'competidor')||'. Tu cuenta ya está verificada y lista. Puedes crear equipos, inscribirte en torneos o comenzar a organizar tu propia competencia.','welcome','welcome:'||new.id::text)
  on conflict (dedupe_key) where dedupe_key is not null do nothing;
  return new;
end $$;

drop trigger if exists z_email_verified_user on auth.users;
create trigger z_email_verified_user after insert or update of email_confirmed_at on auth.users for each row execute function public.email_on_verified_user();
