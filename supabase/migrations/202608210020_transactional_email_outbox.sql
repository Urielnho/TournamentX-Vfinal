create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  body text not null,
  event_type text not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;

create or replace function public.queue_email(target_user uuid, mail_subject text, mail_body text, mail_event text)
returns void language plpgsql security definer set search_path=public as $$
declare target_email text;
begin
  select email into target_email from profiles where id=target_user;
  if target_email is not null and target_email ~* '^[^@ ]+@[^@ ]+\.[^@ ]+$' then
    insert into email_outbox(recipient,subject,body,event_type) values(target_email,left(mail_subject,160),left(mail_body,5000),mail_event);
  end if;
end $$;
revoke all on function public.queue_email(uuid,text,text,text) from public;

create or replace function public.email_on_tournament() returns trigger language plpgsql security definer set search_path=public as $$
begin perform queue_email(new.organizer_id,'Tu torneo fue creado: '||new.title,'Tu torneo "'||new.title||'" quedó creado en TournamentX. Estado actual: '||new.status||'. Ya puedes administrarlo desde tu panel.','tournament_created'); return new; end $$;
create or replace function public.email_on_team() returns trigger language plpgsql security definer set search_path=public as $$
begin perform queue_email(new.captain_id,'Creaste el equipo '||new.name,'Tu equipo "'||new.name||'" ('||new.tag||') fue creado. Tú eres el capitán y puedes invitar miembros desde TournamentX.','team_created'); return new; end $$;
create or replace function public.email_on_registration() returns trigger language plpgsql security definer set search_path=public as $$
declare tournament_title text; organizer uuid;
begin
  if new.status='confirmed' and (tg_op='INSERT' or old.status is distinct from new.status) then
    select title,organizer_id into tournament_title,organizer from tournaments where id=new.tournament_id;
    perform queue_email(new.user_id,'Inscripción confirmada: '||tournament_title,'Tu inscripción a "'||tournament_title||'" fue confirmada. Si registraste un equipo, tú permaneces como capitán y responsable del roster.','registration_confirmed');
    perform queue_email(organizer,'Nueva inscripción en '||tournament_title,'Se confirmó una nueva inscripción en tu torneo "'||tournament_title||'". Revísala desde Participantes.','organizer_new_registration');
  end if; return new;
end $$;
create or replace function public.email_on_join_request() returns trigger language plpgsql security definer set search_path=public as $$
declare captain uuid; team_name text; player_name text;
begin select captain_id,name into captain,team_name from teams where id=new.team_id; select coalesce(gamer_tag,full_name,'Jugador') into player_name from profiles where id=new.user_id; perform queue_email(captain,'Solicitud para unirse a '||team_name,player_name||' solicitó unirse a tu equipo "'||team_name||'". Puedes aceptar o rechazar la solicitud en Equipos.','team_join_request'); return new; end $$;
create or replace function public.email_on_invitation() returns trigger language plpgsql security definer set search_path=public as $$
declare team_name text;
begin if new.invited_user_id is not null then select name into team_name from teams where id=new.team_id; perform queue_email(new.invited_user_id,'Invitación al equipo '||team_name,'Te invitaron a unirte al equipo "'||team_name||'". La invitación vence en 7 días y debes aceptarla desde TournamentX.','team_invitation'); end if; return new; end $$;
create or replace function public.email_on_member_added() returns trigger language plpgsql security definer set search_path=public as $$
declare captain uuid; team_name text; player_name text;
begin if new.member_role<>'captain' then select captain_id,name into captain,team_name from teams where id=new.team_id; select coalesce(gamer_tag,full_name,'Jugador') into player_name from profiles where id=new.user_id; perform queue_email(new.user_id,'Ya perteneces a '||team_name,'Tu ingreso al equipo "'||team_name||'" fue confirmado.','team_joined'); perform queue_email(captain,player_name||' se unió a '||team_name,player_name||' ya forma parte de tu equipo "'||team_name||'".','captain_member_joined'); end if; return new; end $$;
create or replace function public.email_on_member_removed() returns trigger language plpgsql security definer set search_path=public as $$
declare team_name text;
begin if old.member_role<>'captain' then select name into team_name from teams where id=old.team_id; perform queue_email(old.user_id,'Ya no perteneces a '||coalesce(team_name,'un equipo'),'Tu membresía en "'||coalesce(team_name,'el equipo')||'" terminó. Puedes consultar otros equipos en TournamentX.','team_member_removed'); end if; return old; end $$;
create or replace function public.email_on_payment() returns trigger language plpgsql security definer set search_path=public as $$
declare tournament_title text; organizer uuid;
begin
  if new.status='PAID' and (tg_op='INSERT' or old.status is distinct from new.status) then
    select title,organizer_id into tournament_title,organizer from tournaments where id=new.tournament_id;
    perform queue_email(new.user_id,'Pago confirmado: '||tournament_title,'Recibimos tu pago de $'||to_char(new.amount,'FM999G999G990D00')||' '||new.currency||' para "'||tournament_title||'". Transacción: '||coalesce(new.provider_reference,new.id::text)||'.','payment_confirmed');
    if new.fee_type='entry_fee' then perform queue_email(organizer,'Pago de inscripción recibido','TournamentX confirmó un pago de inscripción de $'||to_char(new.amount,'FM999G999G990D00')||' '||new.currency||' para "'||tournament_title||'".','organizer_payment_received'); end if;
  end if; return new;
end $$;

create trigger email_tournament_created after insert on public.tournaments for each row execute function public.email_on_tournament();
create trigger email_team_created after insert on public.teams for each row execute function public.email_on_team();
create trigger email_registration_confirmed after insert or update of status on public.registrations for each row execute function public.email_on_registration();
create trigger email_team_join_request after insert or update of created_at on public.team_join_requests for each row execute function public.email_on_join_request();
create trigger email_team_invitation after insert or update of expires_at on public.team_invitations for each row execute function public.email_on_invitation();
create trigger email_team_member_added after insert on public.team_members for each row execute function public.email_on_member_added();
create trigger email_team_member_removed after delete on public.team_members for each row execute function public.email_on_member_removed();
create trigger email_payment_confirmed after insert or update of status on public.transactions for each row execute function public.email_on_payment();
