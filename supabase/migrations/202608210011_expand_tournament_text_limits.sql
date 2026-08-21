alter table public.tournaments drop constraint if exists tournaments_title_check;
alter table public.tournaments drop constraint if exists tournaments_description_check;

alter table public.tournaments
  add constraint tournaments_title_check check (char_length(title) between 1 and 50),
  add constraint tournaments_description_check check (char_length(description) between 1 and 80);
