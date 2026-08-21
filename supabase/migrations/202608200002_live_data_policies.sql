-- Ajustes para que el frontend use datos reales sin permitir elevar roles desde el navegador.

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (full_name, gamer_tag, avatar_url) on public.profiles to authenticated;

create or replace function public.tournament_registration_counts()
returns table (tournament_id uuid, participants_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select registrations.tournament_id, count(*)
  from public.registrations
  where registrations.status in ('pending', 'confirmed')
  group by registrations.tournament_id;
$$;

revoke all on function public.tournament_registration_counts() from public;
grant execute on function public.tournament_registration_counts() to anon, authenticated;

drop policy if exists "confirmed registrations are readable" on public.registrations;
create policy "confirmed registrations are readable" on public.registrations
for select to anon, authenticated
using (status = 'confirmed');

notify pgrst, 'reload schema';
