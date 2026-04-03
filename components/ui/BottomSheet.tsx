'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setVisible(false);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    currentY.current = e.touches[0].clientY - startY.current;
    if (currentY.current > 0) {
      sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (currentY.current > 100) {
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    currentY.current = 0;
  }, [handleClose]);

  if (!isOpen && !closing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: visible ? 'rgba(0, 0, 0, 0.25)' : 'transparent',
          backdropFilter: visible ? 'blur(10px)' : 'blur(0px)',
          WebkitBackdropFilter: visible ? 'blur(10px)' : 'blur(0px)',
        }}
        onClick={handleClose}
      />

      {/* Sheet content */}
      <div
        ref={sheetRef}
        className="relative w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.1)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: isDragging.current ? 'none' : 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-black/15" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-3">
            <h3 className="text-lg font-semibold tracking-tight" style={{ color: '#1A1A1A' }}>{title}</h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(0, 0, 0, 0.06)' }}
            >
              <X size={16} style={{ color: '#6B5B5B' }} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))]">
          {children}
        </div>
      </div>
    </div>
  );
}
