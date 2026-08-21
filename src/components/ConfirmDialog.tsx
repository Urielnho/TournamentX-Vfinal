import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props { open:boolean; message:string; title?:string; confirmLabel?:string; destructive?:boolean; onConfirm:()=>void; onCancel:()=>void; }

export const ConfirmDialog: React.FC<Props> = ({open,message,title='Confirmar acción',confirmLabel='Confirmar',destructive=false,onConfirm,onCancel}) => {
  if(!open) return null;
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${destructive?'bg-red-50 text-red-600':'bg-gray-100'}`}><AlertTriangle className="h-5 w-5"/></div><button onClick={onCancel} aria-label="Cerrar" className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-black"><X className="h-5 w-5"/></button></div><h2 id="confirm-title" className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{message}</p><div className="mt-6 flex justify-end gap-2"><button onClick={onCancel} className="rounded-full border px-5 py-2.5 text-xs font-bold">Cancelar</button><button onClick={onConfirm} className={`rounded-full px-5 py-2.5 text-xs font-bold text-white ${destructive?'bg-red-600 hover:bg-red-700':'bg-black hover:bg-gray-800'}`}>{confirmLabel}</button></div></div></div>;
};
