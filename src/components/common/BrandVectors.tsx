import React from 'react';

export const TournamentXMark: React.FC<{ className?: string }> = ({ className = '' }) => <span className={`inline-flex font-black tracking-tight ${className}`}>TOURNAMENTX</span>;
export const VersusMark: React.FC<{ className?: string }> = ({ className = '' }) => <span className={`font-black italic ${className}`}>VS</span>;
export const TrophyMark: React.FC<{ className?: string }> = ({ className = '' }) => <span aria-hidden="true" className={className}>🏆</span>;
