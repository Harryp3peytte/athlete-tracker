'use client';

import { ReactNode } from 'react';
import BottomSheet from './BottomSheet';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <BottomSheet isOpen={open} onClose={onClose} title={title}>
      {children}
    </BottomSheet>
  );
}
