drop policy if exists "captains manage team members" on public.team_members;

create policy "captain creates own membership" on public.team_members
for insert to authenticated with check (
  user_id = auth.uid() and exists(select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid())
);

create policy "noncaptains leave teams" on public.team_members
for delete to authenticated using (
  user_id = auth.uid() and not exists(select 1 from public.teams t where t.id = team_id and t.captain_id = auth.uid())
);
