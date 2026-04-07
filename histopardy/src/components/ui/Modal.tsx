import { motion, AnimatePresence } from 'framer-motion';
import React, { useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function Modal({ open, onClose, children, title }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  function handleInputFocus() {
    // Scroll la modal dans la zone visible quand le clavier apparaît
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 11, 20, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            ref={contentRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-bright)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 20px',
              width: '100%',
              maxWidth: 420,
              // Remonter la modal quand le clavier est ouvert
              marginBottom: 'env(keyboard-inset-height, 0px)',
            }}
            onClick={e => e.stopPropagation()}
            onFocus={handleInputFocus}
          >
            {title && (
              <h3 style={{ marginBottom: 16, textAlign: 'center' }}>{title}</h3>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
