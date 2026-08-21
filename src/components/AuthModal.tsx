import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthModalProps { onClose: () => void; }
type AuthMode = 'login' | 'register';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const gamerTagPattern = /^[a-zA-Z0-9_]{3,20}$/;

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [gamerTag, setGamerTag] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const validate = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 254) return 'Ingresa un correo electrónico válido.';
    if (!password) return 'Ingresa tu contraseña.';
    if (mode === 'login') return '';
    if (fullName.trim().length < 2 || fullName.trim().length > 60) return 'El nombre debe tener entre 2 y 60 caracteres.';
    if (!gamerTagPattern.test(gamerTag.trim())) return 'El gamer tag debe tener entre 3 y 20 caracteres y usar solo letras, números o guion bajo.';
    if (password.length < 8 || password.length > 72) return 'La contraseña debe tener entre 8 y 72 caracteres.';
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return 'La contraseña debe incluir mayúscula, minúscula y número.';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    return '';
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) { setError('Supabase todavía no está configurado.'); return; }
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === 'login') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (authError) setError(authError.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : authError.message);
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), gamer_tag: gamerTag.trim() },
      },
    });
    if (authError) {
      setError(authError.message);
    } else if (!data.session) {
      setSuccess('Cuenta creada. Revisa tu correo y confirma el enlace antes de iniciar sesión.');
    } else {
      setSuccess('Cuenta creada correctamente.');
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    if (!supabase) { setError('Supabase todavía no está configurado.'); return; }
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (authError) { setError(authError.message); setLoading(false); }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 shadow-2xl">
      <button aria-label="Cerrar" onClick={onClose} className="absolute right-5 top-5 rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-black"><X className="h-5 w-5" /></button>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-gray-400">TournamentX</p>
      <h2 id="auth-title" className="text-2xl font-black">{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-500">{mode === 'login' ? 'Accede para crear torneos, administrar equipos y conservar tu progreso.' : 'Regístrate como jugador; podrás organizar o capitanear según el contexto.'}</p>

      <div className="mt-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-xs font-bold">
        <button onClick={() => changeMode('login')} className={`rounded-lg px-3 py-2 ${mode === 'login' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>Iniciar sesión</button>
        <button onClick={() => changeMode('register')} className={`rounded-lg px-3 py-2 ${mode === 'register' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>Registrarme</button>
      </div>

      {!isSupabaseConfigured && <div className="mt-4 flex gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>Faltan las variables públicas de Supabase.</span></div>}
      {error && <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
      {success && <div role="status" className="mt-4 flex gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-gray-700"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</div>}

      <form onSubmit={handleEmailAuth} className="mt-5 space-y-3" noValidate>
        {mode === 'register' && <>
          <AuthInput label="Nombre completo" value={fullName} onChange={setFullName} autoComplete="name" minLength={2} maxLength={60} placeholder="Tu nombre" />
          <AuthInput label="Gamer tag" value={gamerTag} onChange={value => setGamerTag(value.replace(/[^a-zA-Z0-9_]/g, ''))} autoComplete="nickname" minLength={3} maxLength={20} placeholder="Jugador_01" />
        </>}
        <AuthInput label="Correo electrónico" type="email" value={email} onChange={setEmail} autoComplete="email" maxLength={254} placeholder="nombre@correo.com" />
        <AuthInput label="Contraseña" type="password" value={password} onChange={setPassword} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : undefined} maxLength={72} placeholder="••••••••" />
        {mode === 'register' && <><AuthInput label="Confirmar contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={8} maxLength={72} placeholder="••••••••" /><p className="text-[10px] leading-4 text-gray-400">8–72 caracteres, con al menos una mayúscula, una minúscula y un número.</p></>}
        <button type="submit" disabled={loading || !isSupabaseConfigured} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-black text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">{loading && <LoaderCircle className="h-4 w-4 animate-spin" />}{mode === 'login' ? 'Entrar con correo' : 'Crear cuenta'}</button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase text-gray-400"><span className="h-px flex-1 bg-gray-200" />o<span className="h-px flex-1 bg-gray-200" /></div>
      <button onClick={signInWithGoogle} disabled={loading || !isSupabaseConfigured} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-black transition hover:border-black disabled:opacity-50"><span className="grid h-5 w-5 place-items-center rounded-full bg-black text-xs font-black text-white">G</span>Continuar con Google</button>
      <p className="mt-5 text-center text-[11px] leading-5 text-gray-400">Al continuar aceptas las reglas de la plataforma y su política de privacidad.</p>
    </div>
  </div>;
};

interface AuthInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  autoComplete: string;
  placeholder: string;
  minLength?: number;
  maxLength: number;
}

const AuthInput: React.FC<AuthInputProps> = ({ label, value, onChange, type = 'text', autoComplete, placeholder, minLength, maxLength }) => <label className="block text-xs font-bold text-gray-600"><span className="mb-1.5 block">{label}</span><input required type={type} value={value} onChange={event => onChange(event.target.value)} autoComplete={autoComplete} placeholder={placeholder} minLength={minLength} maxLength={maxLength} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 font-normal text-black outline-none transition focus:border-black" /></label>;
