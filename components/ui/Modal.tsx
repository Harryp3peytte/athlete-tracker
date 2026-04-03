'use client';

import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'var(--overlay-bg, rgba(0,0,0,0.5))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: visible ? 1 : 0,
        }}
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto transition-all duration-300"
        style={{
          background: 'var(--modal-bg, rgba(30, 30, 32, 0.9))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '0.5px solid var(--glass-border)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.3)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(16px)',
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 sticky top-0 z-10"
          style={{ background: 'var(--modal-bg, rgba(30, 30, 32, 0.95))', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--separator)' }}
        >
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
