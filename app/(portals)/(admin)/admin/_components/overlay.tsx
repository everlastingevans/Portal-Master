'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button, cx } from './ui';

/* --------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={cx(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/[0.08] bg-ink-900 shadow-2xl shadow-black/50 animate-scale-in sm:rounded-2xl',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-ink-950/30 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ----------------------------- Confirm dialog ---------------------------- */

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>();

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(options)}
        onClose={() => settle(false)}
        size="sm"
        title={
          <span className="flex items-center gap-3">
            {options?.tone === 'danger' && (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300">
                <AlertTriangle className="h-4 w-4" />
              </span>
            )}
            {options?.title}
          </span>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => settle(false)}>
              Cancel
            </Button>
            <Button variant={options?.tone === 'danger' ? 'danger' : 'primary'} onClick={() => settle(true)} autoFocus>
              {options?.confirmLabel || 'Confirm'}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-300">{options?.description}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
