import { Tournament } from '../types';

export function isRegistrationOpen(tournament: Tournament, now = Date.now()) {
  if (tournament.status !== 'open') return false;
  if (tournament.participantsCount >= tournament.maxParticipants) return false;
  const deadline = new Date(tournament.registrationDeadline).getTime();
  return Number.isFinite(deadline) && deadline > now;
}

export function isViewOnlyTournament(tournament: Tournament, now = Date.now()) {
  if (['completed', 'cancelled', 'suspended', 'draft'].includes(tournament.status)) return false;
  return tournament.status === 'live' || !isRegistrationOpen(tournament, now);
}

// Un torneo solo puede eliminarse mientras no haya iniciado. 'live' y 'completed'
// ya arrancaron; 'suspended' se interrumpió estando en curso, así que tampoco.
const DELETABLE_STATUSES: Tournament['status'][] = ['draft', 'upcoming', 'open', 'cancelled'];

export function canDeleteTournament(tournament: Tournament) {
  return DELETABLE_STATUSES.includes(tournament.status);
}

export function deleteBlockedReason(tournament: Tournament) {
  if (tournament.status === 'live') return 'El torneo ya inició. Solo puedes eliminarlo antes de que comience.';
  if (tournament.status === 'completed') return 'El torneo ya finalizó y forma parte del historial.';
  if (tournament.status === 'suspended') return 'El torneo está suspendido. Cámbialo a cancelado si quieres eliminarlo.';
  return '';
}

export function registrationClosedReason(tournament: Tournament, now = Date.now()) {
  if (tournament.participantsCount >= tournament.maxParticipants) return 'Se completaron todos los cupos.';
  if (new Date(tournament.registrationDeadline).getTime() <= now) return 'La fecha límite de inscripción terminó.';
  return 'Las inscripciones ya no están disponibles.';
}
