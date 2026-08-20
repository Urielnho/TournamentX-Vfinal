import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';

type Accent = 'cyan' | 'purple' | 'amber' | 'emerald';

export const LuxeGlowCard: React.FC<React.PropsWithChildren<{
  className?: string;
  glowColor?: Accent;
  onClick?: () => void;
  interactive?: boolean;
}>> = ({ children, className = '', glowColor = 'cyan', onClick, interactive = false }) => {
  const glowStyles: Record<Accent, string> = {
    cyan: 'hover:border-[#00dbe7] hover:shadow-[0_0_20px_rgba(0,219,231,0.15)]',
    purple: 'hover:border-[#d0bcff] hover:shadow-[0_0_20px_rgba(208,188,255,0.15)]',
    amber: 'hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
    emerald: 'hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  };
  return <div onClick={onClick} className={`relative overflow-hidden border border-[#2e3c3e] bg-[#181819] transition-all duration-200 ${interactive ? `cursor-pointer ${glowStyles[glowColor]}` : ''} ${className}`}>
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00dbe7]/30 to-transparent" />
    {children}
  </div>;
};

type LuxeShimmerButtonProps = Omit<React.ComponentProps<typeof motion.button>, 'ref'> & {
  variant?: 'primary' | 'secondary';
};

export const LuxeShimmerButton: React.FC<LuxeShimmerButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => (
  <motion.button whileTap={{ scale: 0.98 }} className={`${variant === 'primary' ? 'bg-white text-black' : 'border border-white/20 bg-transparent text-white'} px-4 py-2 text-xs font-bold transition hover:opacity-80 ${className}`} {...props}>{children}</motion.button>
);

export const LuxeStatusBadge: React.FC<{ label: string; color?: Accent | 'red'; pulse?: boolean }> = ({ label, color = 'cyan', pulse = false }) => {
  const colors = { cyan: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-400', purple: 'border-purple-400/50 bg-purple-500/10 text-purple-300', amber: 'border-amber-400/50 bg-amber-500/10 text-amber-400', emerald: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-400', red: 'border-red-400/50 bg-red-500/10 text-red-400' };
  return <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-bold uppercase ${colors[color]}`}>{pulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}{label}</span>;
};

export const LuxeCopyValue: React.FC<{ value: string; className?: string }> = ({ value, className = '' }) => {
  const [copied, setCopied] = useState(false);
  return <button className={`inline-flex items-center gap-2 ${className}`} onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>{value}{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</button>;
};

export const LuxeTabs: React.FC<{ tabs: { id: string; label: string; badge?: number }[]; activeTab: string; onChange: (id: string) => void; className?: string }> = ({ tabs, activeTab, onChange, className = '' }) => <div className={`flex gap-2 ${className}`}>{tabs.map(tab => <button key={tab.id} onClick={() => onChange(tab.id)} className={`px-4 py-2 text-xs font-bold ${activeTab === tab.id ? 'bg-white text-black' : 'border border-white/10 text-gray-400'}`}>{tab.label}{tab.badge !== undefined && <span className="ml-2">{tab.badge}</span>}</button>)}</div>;
