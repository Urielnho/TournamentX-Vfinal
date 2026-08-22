// Permite letras de cualquier idioma (incluye tildes/ñ/ü vía \p{L}), números,
// espacios y puntuación común en español. \p{L}/\p{N} excluyen naturalmente
// los emoji (son categoría Symbol, no Letter/Number), así que no hace falta
// enumerarlos aparte.
const DISALLOWED_CHARS = /[^\p{L}\p{N}\s.,!?'"´`\-:;()/&%¡¿]/gu;

export function sanitizeText(value: string): string {
  return value.replace(DISALLOWED_CHARS, '');
}