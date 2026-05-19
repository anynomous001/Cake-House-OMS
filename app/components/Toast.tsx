'use client';

import React, { useEffect } from 'react';
import { ToastMessage } from '../types/order';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toast({ toasts, removeToast }: ToastProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const cfg = {
    success: { bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]', border: 'border-[#3B6D11]/30', icon: '✓' },
    error:   { bg: 'bg-[#FCEBEB]', text: 'text-[#A32D2D]', border: 'border-[#A32D2D]/30', icon: '✕' },
    warning: { bg: 'bg-[#FAEEDA]', text: 'text-[#854F0B]', border: 'border-[#854F0B]/30', icon: '⚠' },
    info:    { bg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]', border: 'border-[#185FA5]/30', icon: 'ℹ' },
  }[toast.type];

  return (
    <div className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg border ${cfg.bg} ${cfg.text} ${cfg.border} animate-in`}>
      <span className="text-base font-bold mt-0.5 shrink-0">{cfg.icon}</span>
      <span className="flex-1 text-sm font-medium leading-snug">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-50 hover:opacity-100 text-lg leading-none mt-0.5 shrink-0"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
