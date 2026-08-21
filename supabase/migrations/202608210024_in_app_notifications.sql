create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  event_type text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
alter table public.notifications enable row level security;
create policy "users read own notifications" on public.notifications for select to authenticated using(user_id=auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke insert,delete on public.notifications from anon,authenticated;

create or replace function public.queue_email(target_user uuid,mail_subject text,mail_body text,mail_event text)
returns void language plpgsql security definer set search_path=public as $$
declare target_email text;
begin
  select email into target_email from profiles where id=target_user;
  if target_email is not null and target_email ~* '^[^@ ]+@[^@ ]+\.[^@ ]+$' then
    insert into email_outbox(recipient,subject,body,event_type) values(target_email,left(mail_subject,160),left(mail_body,5000),mail_event);
  end if;
  if target_user is not null then
    insert into notifications(user_id,title,body,event_type) values(target_user,left(mail_subject,160),left(mail_body,5000),mail_event);
  end if;
end $$;
revoke all on function public.queue_email(uuid,text,text,text) from public;

create or replace function public.email_on_verified_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare display_name text; welcome_title text := '¡Bienvenido a TournamentX!'; welcome_body text;
begin
  if new.email_confirmed_at is null then return new; end if;
  if tg_op='UPDATE' and old.email_confirmed_at is not null then return new; end if;
  select coalesce(nullif(full_name,''),nullif(gamer_tag,''),'competidor') into display_name from profiles where id=new.id;
  welcome_body := 'Hola '||coalesce(display_name,'competidor')||'. Tu cuenta ya está verificada y lista. Puedes crear equipos, inscribirte en torneos o comenzar a organizar tu propia competencia.';
  insert into email_outbox(recipient,subject,body,event_type,dedupe_key) values(new.email,welcome_title,welcome_body,'welcome','welcome:'||new.id::text)
  on conflict (dedupe_key) where dedupe_key is not null do nothing;
  insert into notifications(user_id,title,body,event_type) values(new.id,welcome_title,welcome_body,'welcome');
  return new;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
