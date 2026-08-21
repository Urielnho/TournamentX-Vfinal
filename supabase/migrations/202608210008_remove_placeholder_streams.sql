update public.tournaments
set stream = null
where stream->>'url' = 'https://twitch.tv/tournamentx_live'
   or lower(coalesce(stream->>'channelName', '')) = 'tournamentx_official';
