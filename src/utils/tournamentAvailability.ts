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

export function registrationClosedReason(tournament: Tournament, now = Date.now()) {
  if (tournament.participantsCount >= tournament.maxParticipants) return 'Se completaron todos los cupos.';
  if (new Date(tournament.registrationDeadline).getTime() <= now) return 'La fecha límite de inscripción terminó.';
  return 'Las inscripciones ya no están disponibles.';
}
