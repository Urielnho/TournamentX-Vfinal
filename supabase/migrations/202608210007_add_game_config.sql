alter table public.tournaments
  add column if not exists game_config jsonb not null default '{}'::jsonb;

alter table public.tournaments
  drop constraint if exists tournaments_game_config_object;

alter table public.tournaments
  add constraint tournaments_game_config_object
  check (jsonb_typeof(game_config) = 'object');

comment on column public.tournaments.game_config is
  'Configuracion estructurada y especifica de la disciplina; por ejemplo sets, personajes, kameos y plataforma para Mortal Kombat 1.';

update public.tournaments
set participant_type = 'individual',
    min_players_per_team = 1,
    game_mode = 'Individual (1v1)',
    format = case when format in ('single_elim', 'double_elim', 'group_stage', 'groups_elim', 'round_robin') then format else 'double_elim' end,
    game_config = jsonb_build_object(
      'initialSetFormat', 'bo3', 'finalSetFormat', 'bo5', 'roundTimeSeconds', 60,
      'stageSelection', 'random', 'characterPolicy', 'all', 'restrictedCharacters', '[]'::jsonb,
      'kameoPolicy', 'all', 'restrictedKameos', '[]'::jsonb, 'dlcAllowed', true,
      'winnerCharacterRule', 'keep_character_and_kameo',
      'loserCharacterRule', 'may_change_character_and_or_kameo',
      'platform', 'PC', 'crossplay', true
    ),
    rules = case when jsonb_array_length(rules) = 0 then jsonb_build_array(
      'Macros y Turbo: prohibidos.', 'Cheats y Bots: prohibidos.',
      'Coaching durante el combate: prohibido.',
      'Las pausas reciben penalizacion segun las reglas del torneo.',
      'El abandono del combate cuenta como derrota.'
    ) else rules end
where game = 'Mortal Kombat 1' and game_config = '{}'::jsonb;

alter table public.tournaments
  drop constraint if exists tournaments_mk1_configuration;

alter table public.tournaments
  add constraint tournaments_mk1_configuration check (
    game <> 'Mortal Kombat 1' or (
      participant_type = 'individual' and min_players_per_team = 1 and
      format in ('single_elim', 'double_elim', 'group_stage', 'groups_elim', 'round_robin') and
      game_config->>'initialSetFormat' in ('bo1', 'bo3', 'bo5') and
      game_config->>'finalSetFormat' in ('bo1', 'bo3', 'bo5') and
      (game_config->>'roundTimeSeconds')::integer between 30 and 300 and
      game_config->>'stageSelection' in ('random', 'manual') and
      game_config->>'characterPolicy' in ('all', 'restricted') and
      game_config->>'kameoPolicy' in ('all', 'restricted') and
      game_config->>'platform' in ('PC', 'PlayStation 5', 'Xbox Series X|S') and
      jsonb_typeof(game_config->'dlcAllowed') = 'boolean' and
      jsonb_typeof(game_config->'crossplay') = 'boolean'
    )
  );
