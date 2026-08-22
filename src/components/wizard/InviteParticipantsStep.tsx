import React, { useState } from 'react';
import { Search, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { EligibleParticipant, searchEligibleUsers, searchEligibleTeams } from '../../services/supabaseData';

interface InviteParticipantsStepProps {
  participantType: 'individual' | 'team';
  minPlayersPerTeam: number;
  invited: EligibleParticipant[];
  onAdd: (participant: EligibleParticipant) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const InviteParticipantsStep: React.FC<InviteParticipantsStepProps> = ({
  participantType,
  minPlayersPerTeam,
  invited,
  onAdd,
  onRemove,
  disabled,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EligibleParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const found = participantType === 'team'
        ? await searchEligibleTeams(query.trim(), minPlayersPerTeam)
        : await searchEligibleUsers(query.trim());
      setResults(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la búsqueda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleSearch(); } }}
          placeholder={participantType === 'team' ? 'Buscar equipo por nombre o tag...' : 'Buscar usuario por GamerTag o nombre...'}
          disabled={disabled}
          className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-xs text-black outline-none focus:border-black disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={disabled || loading || !query.trim()}
          className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Buscar</span>
        </button>
      </div>

      {error && <div role="alert" className="flex items-center gap-2 rounded-2xl border border-black bg-[#F9FAFB] px-4 py-3 text-xs font-bold"><AlertCircle className="w-4 h-4" />{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => {
            const alreadyInvited = invited.some((p) => p.id === result.id);
            return (
              <div key={result.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs">
                <div>
                  <span className="font-bold text-black">{result.name}</span>
                  {result.tag && <span className="ml-1.5 text-gray-500">@{result.tag}</span>}
                  {typeof result.membersCount === 'number' && <span className="ml-1.5 text-gray-500">· {result.membersCount} jugadores</span>}
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(result)}
                  disabled={disabled || alreadyInvited}
                  className="rounded-full bg-black px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {alreadyInvited ? 'Invitado' : 'Invitar'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-black uppercase">
          {participantType === 'team' ? 'Equipos invitados' : 'Usuarios invitados'} ({invited.length})
        </label>
        {invited.length === 0 ? (
          <p className="text-[11px] text-gray-500">Aún no has invitado a nadie.</p>
        ) : (
          <div className="space-y-2">
            {invited.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-xs text-black">
                <span>{p.name}{p.tag ? ` (@${p.tag})` : ''}</span>
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  disabled={disabled}
                  className="text-gray-500 hover:text-black ml-2 p-1 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
