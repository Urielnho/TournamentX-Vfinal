create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  invited_user_id uuid references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.team_join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists team_join_requests_pending_unique on public.team_join_requests(team_id,user_id) where status = 'pending';
create unique index if not exists team_target_invites_pending_unique on public.team_invitations(team_id,invited_user_id) where status = 'pending' and invited_user_id is not null;

alter table public.team_invitations enable row level security;
alter table public.team_join_requests enable row level security;

create policy "users read relevant team invitations" on public.team_invitations for select to authenticated using (
  invited_user_id = auth.uid() or invited_by = auth.uid() or exists(select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid())
);
create policy "users read relevant join requests" on public.team_join_requests for select to authenticated using (
  user_id = auth.uid() or exists(select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid())
);

create or replace function public.invite_team_member(target_team_id uuid, target_gamer_tag text)
returns uuid language plpgsql security definer set search_path = public as $$
declare target_user uuid; invitation_id uuid;
begin
  if not exists(select 1 from teams where id=target_team_id and captain_id=auth.uid()) then raise exception 'Solo el capitán puede invitar jugadores.'; end if;
  select id into target_user from profiles where lower(gamer_tag)=lower(btrim(target_gamer_tag)) or lower(email)=lower(btrim(target_gamer_tag)) limit 1;
  if target_user is null then raise exception 'No encontramos ese usuario o GamerTag.'; end if;
  if exists(select 1 from team_members where team_id=target_team_id and user_id=target_user) then raise exception 'Ese usuario ya pertenece al equipo.'; end if;
  insert into team_invitations(team_id,invited_user_id,invited_by) values(target_team_id,target_user,auth.uid())
  on conflict (team_id,invited_user_id) where status='pending' and invited_user_id is not null do update set expires_at=now()+interval '7 days'
  returning id into invitation_id;
  return invitation_id;
end $$;

create or replace function public.create_team_invite_link(target_team_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare invite_token uuid;
begin
  if not exists(select 1 from teams where id=target_team_id and captain_id=auth.uid()) then raise exception 'Solo el capitán puede crear enlaces.'; end if;
  insert into team_invitations(team_id,invited_by) values(target_team_id,auth.uid()) returning token into invite_token;
  return invite_token;
end $$;

create or replace function public.accept_team_invitation(invite_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare invitation team_invitations%rowtype;
begin
  select * into invitation from team_invitations where token=invite_token and status='pending' for update;
  if invitation.id is null or invitation.expires_at <= now() then raise exception 'La invitación no existe o ya venció.'; end if;
  if invitation.invited_user_id is not null and invitation.invited_user_id <> auth.uid() then raise exception 'Esta invitación pertenece a otro usuario.'; end if;
  if auth.uid() is null then raise exception 'Inicia sesión para aceptar la invitación.'; end if;
  insert into team_members(team_id,user_id,member_role) values(invitation.team_id,auth.uid(),'starter') on conflict do nothing;
  update team_invitations set status='accepted', invited_user_id=coalesce(invited_user_id,auth.uid()) where id=invitation.id;
  return invitation.team_id;
end $$;

create or replace function public.reject_team_invitation(invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update team_invitations set status='rejected' where id=invitation_id and invited_user_id=auth.uid() and status='pending';
end $$;

create or replace function public.request_to_join_team(target_team_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare request_id uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para solicitar unirte.'; end if;
  if exists(select 1 from team_members where team_id=target_team_id and user_id=auth.uid()) then raise exception 'Ya perteneces a este equipo.'; end if;
  insert into team_join_requests(team_id,user_id) values(target_team_id,auth.uid())
  on conflict (team_id,user_id) where status='pending' do update set created_at=now()
  returning id into request_id;
  return request_id;
end $$;

create or replace function public.respond_team_join_request(target_request_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare request_row team_join_requests%rowtype;
begin
  select * into request_row from team_join_requests where id=target_request_id and status='pending' for update;
  if request_row.id is null or not exists(select 1 from teams where id=request_row.team_id and captain_id=auth.uid()) then raise exception 'Solicitud no autorizada.'; end if;
  if approve then insert into team_members(team_id,user_id,member_role) values(request_row.team_id,request_row.user_id,'starter') on conflict do nothing; end if;
  update team_join_requests set status=case when approve then 'accepted' else 'rejected' end where id=target_request_id;
end $$;

create or replace function public.remove_team_member(target_team_id uuid, target_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from teams where id=target_team_id and captain_id=auth.uid()) then raise exception 'Solo el capitán puede retirar miembros.'; end if;
  if target_user_id=auth.uid() then raise exception 'El capitán no puede expulsarse. Debe transferir la capitanía o eliminar el equipo.'; end if;
  if exists(select 1 from registration_members rm join registrations r on r.id=rm.registration_id join tournaments t on t.id=r.tournament_id where r.team_id=target_team_id and rm.user_id=target_user_id and r.status not in ('rejected','cancelled') and t.end_date > now()) then raise exception 'No puedes retirar a un jugador mientras forma parte de un roster activo.'; end if;
  delete from team_members where team_id=target_team_id and user_id=target_user_id;
end $$;

create or replace function public.leave_team(target_team_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists(select 1 from teams where id=target_team_id and captain_id=auth.uid()) then raise exception 'El capitán no puede abandonar el equipo sin transferir la capitanía.'; end if;
  delete from team_members where team_id=target_team_id and user_id=auth.uid();
end $$;

grant execute on function public.invite_team_member(uuid,text) to authenticated;
grant execute on function public.create_team_invite_link(uuid) to authenticated;
grant execute on function public.accept_team_invitation(uuid) to authenticated;
grant execute on function public.reject_team_invitation(uuid) to authenticated;
grant execute on function public.request_to_join_team(uuid) to authenticated;
grant execute on function public.respond_team_join_request(uuid,boolean) to authenticated;
grant execute on function public.remove_team_member(uuid,uuid) to authenticated;
grant execute on function public.leave_team(uuid) to authenticated;
