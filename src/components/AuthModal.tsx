import React, { useState } from 'react';
import { AlertCircle, LoaderCircle, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signInWithGoogle = async () => {
    if (!supabase) {
      setError('Supabase todavía no está configurado. Agrega las variables del archivo .env.');
      return;
    }

    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 shadow-2xl">
      <button aria-label="Cerrar" onClick={onClose} className="absolute right-5 top-5 rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-black"><X className="h-5 w-5" /></button>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-gray-400">TournamentX</p>
      <h2 id="auth-title" className="text-2xl font-black">Inicia sesión</h2>
      <p className="mt-2 text-sm leading-6 text-gray-500">Accede con tu cuenta de Google para crear torneos, administrar equipos y conservar tu progreso.</p>

      {!isSupabaseConfigured && <div className="mt-5 flex gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>La interfaz está lista, pero faltan <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</span></div>}
      {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}

      <button onClick={signInWithGoogle} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-black px-5 py-3.5 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-wait disabled:opacity-60">
        {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-black text-black">G</span>}
        {loading ? 'Redirigiendo…' : 'Continuar con Google'}
      </button>
      <p className="mt-5 text-center text-[11px] leading-5 text-gray-400">Al continuar aceptas las reglas de la plataforma y su política de privacidad.</p>
    </div>
  </div>;
};
