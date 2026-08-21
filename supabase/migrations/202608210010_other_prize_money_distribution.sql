update public.tournaments
set prize_distribution = jsonb_build_array(jsonb_build_object('place', '1.er Lugar', 'percentage', 100))
where prize_type = 'other'
  and entry_fee_type <> 'free'
  and entry_fee_amount > 0
  and coalesce(jsonb_array_length(prize_distribution), 0) = 0;
