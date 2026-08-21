-- Preserve existing records while resolving historical duplicates created by rapid double submissions.
with duplicates as (
  select id, row_number() over (partition by lower(btrim(name)) order by created_at,id) as position
  from public.teams
)
update public.teams t set name=left(t.name,31)||' #'||substr(t.id::text,1,6)
from duplicates d where d.id=t.id and d.position>1;

with duplicates as (
  select id, row_number() over (partition by lower(btrim(tag)) order by created_at,id) as position
  from public.teams
)
update public.teams t set tag=upper(substr(regexp_replace(t.tag,'[^a-zA-Z0-9]','','g'),1,2)||substr(replace(t.id::text,'-',''),1,6))
from duplicates d where d.id=t.id and d.position>1;

with duplicates as (
  select id, row_number() over (partition by lower(btrim(gamer_tag)) order by created_at,id) as position
  from public.profiles
)
update public.profiles p set gamer_tag=left(coalesce(nullif(regexp_replace(p.gamer_tag,'[^a-zA-Z0-9_]','','g'),''),'Jugador'),20)||'_'||substr(replace(p.id::text,'-',''),1,6)
from duplicates d where d.id=p.id and (d.position>1 or btrim(p.gamer_tag)='');

create unique index if not exists teams_name_unique_ci on public.teams(lower(btrim(name)));
create unique index if not exists teams_tag_unique_ci on public.teams(lower(btrim(tag)));
create unique index if not exists profiles_gamer_tag_unique_ci on public.profiles(lower(btrim(gamer_tag)));

create or replace function public.is_gamer_tag_available(candidate text)
returns boolean language sql stable security definer set search_path=public as $$
  select candidate ~ '^[a-zA-Z0-9_]{3,20}$'
    and not exists(select 1 from profiles where lower(btrim(gamer_tag))=lower(btrim(candidate)));
$$;
grant execute on function public.is_gamer_tag_available(text) to anon, authenticated;
