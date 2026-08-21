// Los <input type="datetime-local"> hablan en hora local y sin zona ("2026-08-25T18:00"),
// mientras que las columnas timestamptz guardan instantes absolutos. Si se manda la cadena
// cruda, Postgres la interpreta como UTC y la fecha se adelanta tantas horas como el huso
// local. Estas dos funciones son inversas: si cambias una, cambia la otra.

export function toInstant(localDateTime: string) {
  const parsed = new Date(localDateTime);
  return Number.isNaN(parsed.getTime()) ? localDateTime : parsed.toISOString();
}

export function toLocalDateTimeInput(instant: string) {
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}
