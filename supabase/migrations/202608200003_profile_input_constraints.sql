-- Restricciones de integridad para perfiles creados con OAuth o correo/contraseña.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_full_name_length') then
    alter table public.profiles add constraint profiles_full_name_length
      check (char_length(btrim(full_name)) between 2 and 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_gamer_tag_length') then
    alter table public.profiles add constraint profiles_gamer_tag_length
      check (char_length(btrim(gamer_tag)) between 3 and 30);
  end if;
end $$;

notify pgrst, 'reload schema';
