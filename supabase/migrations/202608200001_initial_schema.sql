-- TournamentX: esquema inicial para Supabase/PostgreSQL.
-- Ejecuta este archivo en Supabase > SQL Editor > Run.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  gamer_tag text not null default '',
  avatar_url text,
  global_role text not null default 'user' check (global_role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 20),
  description text not null check (char_length(description) between 1 and 50),
  banner_url text,
  category text not null check (category in ('esports', 'sports')),
  game text not null,
  game_mode text not null default '',
  format text not null check (format in ('single_elim','double_elim','group_stage','groups_elim','league','round_robin','battle_royale','custom')),
  status text not null default 'open' check (status in ('upcoming','open','live','completed','cancelled','suspended')),
  access_type text not null default 'public' check (access_type in ('public','private')),
  location jsonb not null default '{"type":"online"}'::jsonb,
  stream jsonb,
  start_date timestamptz not null,
  end_date timestamptz not null,
  registration_deadline timestamptz not null,
  participant_type text not null check (participant_type in ('individual','team')),
  min_players_per_team integer not null default 1 check (min_players_per_team > 0),
  max_participants integer not null check (max_participants between 2 and 512),
  entry_fee_type text not null default 'free' check (entry_fee_type in ('free','paid_per_player','paid_per_team')),
  entry_fee_amount numeric(12,2) not null default 0 check (entry_fee_amount between 0 and 10000000),
  organizer_percentage numeric(5,2) not null default 0 check (organizer_percentage between 0 and 100),
  has_received_payments boolean not null default false,
  prize_type text not null default 'no_prize' check (prize_type in ('monetary','other','no_prize')),
  base_prize_pool numeric(12,2) not null default 0 check (base_prize_pool between 0 and 10000000),
  other_prize_description text,
  rules jsonb not null default '[]'::jsonb,
  sponsors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (registration_deadline <= start_date)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  captain_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  tag text not null check (char_length(tag) between 2 and 8),
  logo_url text,
  status text not null default 'pending_approval' check (status in ('confirmed','pending_approval','pending_payment','rejected')),
  payment_status text not null default 'unpaid' check (payment_status in ('paid','unpaid')),
  created_at timestamptz not null default now(),
  unique (tournament_id, name)
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'starter' check (member_role in ('captain','starter','substitute')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','confirmed','rejected','cancelled')),
  created_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_name text not null,
  team_a_id uuid references public.teams(id) on delete set null,
  team_b_id uuid references public.teams(id) on delete set null,
  score_a integer not null default 0 check (score_a >= 0),
  score_b integer not null default 0 check (score_b >= 0),
  status text not null default 'upcoming' check (status in ('upcoming','live','finished')),
  scheduled_at timestamptz,
  stream_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'MXN',
  status text not null default 'PENDING' check (status in ('PAID','PENDING','FAILED','REFUNDED')),
  fee_type text not null check (fee_type in ('entry_fee','sponsor_contribution','prize_payout')),
  provider_reference text unique,
  created_at timestamptz not null default now()
);

create index if not exists tournaments_organizer_idx on public.tournaments(organizer_id);
create index if not exists tournaments_status_idx on public.tournaments(status);
create index if not exists registrations_tournament_idx on public.registrations(tournament_id);
create index if not exists matches_tournament_idx on public.matches(tournament_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tournaments_set_updated_at on public.tournaments;
create trigger tournaments_set_updated_at before update on public.tournaments for each row execute function public.set_updated_at();
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at before update on public.matches for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, gamer_tag, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'preferred_username', new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.registrations enable row level security;
alter table public.matches enable row level security;
alter table public.transactions enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and global_role = 'admin');
$$;

create policy "profiles visible to authenticated users" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and global_role = (select global_role from public.profiles where id = auth.uid()));

create policy "public tournaments are readable" on public.tournaments for select using (access_type = 'public' or organizer_id = auth.uid() or public.is_admin());
create policy "authenticated users create tournaments" on public.tournaments for insert to authenticated with check (organizer_id = auth.uid());
create policy "organizers update tournaments" on public.tournaments for update to authenticated using (organizer_id = auth.uid() or public.is_admin()) with check (organizer_id = auth.uid() or public.is_admin());
create policy "organizers delete inactive tournaments" on public.tournaments for delete to authenticated using ((organizer_id = auth.uid() or public.is_admin()) and status <> 'live');

create policy "teams are readable" on public.teams for select using (true);
create policy "captains create teams" on public.teams for insert to authenticated with check (captain_id = auth.uid());
create policy "captains or organizers update teams" on public.teams for update to authenticated using (captain_id = auth.uid() or exists(select 1 from public.tournaments t where t.id = tournament_id and t.organizer_id = auth.uid()) or public.is_admin());
create policy "captains delete teams" on public.teams for delete to authenticated using (captain_id = auth.uid() or public.is_admin());

create policy "team members are readable" on public.team_members for select using (true);
create policy "captains manage team members" on public.team_members for all to authenticated using (exists(select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid())) with check (exists(select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid()));

create policy "users and organizers read registrations" on public.registrations for select to authenticated using (user_id = auth.uid() or exists(select 1 from public.tournaments t where t.id = tournament_id and t.organizer_id = auth.uid()) or public.is_admin());
create policy "users register themselves" on public.registrations for insert to authenticated with check (user_id = auth.uid());
create policy "users or organizers update registrations" on public.registrations for update to authenticated using (user_id = auth.uid() or exists(select 1 from public.tournaments t where t.id = tournament_id and t.organizer_id = auth.uid()) or public.is_admin());

create policy "matches are readable" on public.matches for select using (true);
create policy "organizers manage matches" on public.matches for all to authenticated using (exists(select 1 from public.tournaments t where t.id = tournament_id and t.organizer_id = auth.uid()) or public.is_admin()) with check (exists(select 1 from public.tournaments t where t.id = tournament_id and t.organizer_id = auth.uid()) or public.is_admin());

create policy "users and organizers read transactions" on public.transactions for select to authenticated using (user_id = auth.uid() or exists(select 1 from public.tournaments t where t.id = tournament_id and t.organizer_id = auth.uid()) or public.is_admin());

insert into storage.buckets (id, name, public)
values ('tournament-media', 'tournament-media', true)
on conflict (id) do nothing;

create policy "public tournament media" on storage.objects for select using (bucket_id = 'tournament-media');
create policy "authenticated users upload tournament media" on storage.objects for insert to authenticated with check (bucket_id = 'tournament-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners update tournament media" on storage.objects for update to authenticated using (bucket_id = 'tournament-media' and owner_id = auth.uid()::text);
create policy "owners delete tournament media" on storage.objects for delete to authenticated using (bucket_id = 'tournament-media' and owner_id = auth.uid()::text);
