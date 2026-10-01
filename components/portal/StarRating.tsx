'use client';

import { KeyboardEvent, useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { cx } from './ui';

const LABELS = ['Poor', 'Below expectations', 'Meets expectations', 'Strong', 'Exceptional'];

/** Interactive 1–5 star input. Arrow keys move, click the selected star again to clear. */
export function StarRatingInput({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const current = value ?? 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, current + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(current <= 1 ? null : current - 1);
    } else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '0') {
      e.preventDefault();
      onChange(null);
    } else if (/^[1-5]$/.test(e.key)) {
      e.preventDefault();
      onChange(Number(e.key));
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
      <span className="text-sm font-medium text-brand-navy">{label}</span>
      <div className="flex items-center gap-3">
        <div
          role="radiogroup"
          aria-label={`${label} rating`}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={onKeyDown}
          onMouseLeave={() => setHover(null)}
          className="flex items-center gap-0.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= shown;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                tabIndex={-1}
                aria-checked={value === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}: ${LABELS[n - 1]}`}
                disabled={disabled}
                onMouseEnter={() => setHover(n)}
                onClick={() => onChange(value === n ? null : n)}
                className="cursor-pointer p-0.5 disabled:cursor-not-allowed"
              >
                <motion.span animate={{ scale: hover === n ? 1.18 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }} className="block">
                  <Star
                    className={cx('h-[22px] w-[22px] transition-colors', filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300')}
                    strokeWidth={1.75}
                  />
                </motion.span>
              </button>
            );
          })}
        </div>
        <span className="w-32 text-xs text-slate-500" aria-live="polite">
          {shown ? LABELS[shown - 1] : 'Not rated'}
        </span>
      </div>
    </div>
  );
}

/** Read-only stars, supports fractional averages (e.g. 3.7). */
export function StarRatingDisplay({ value, size = 'sm' }: { value: number | null; size?: 'sm' | 'md' }) {
  const dims = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  if (value === null) return <span className="text-xs text-slate-400">Not rated</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`} role="img">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className={cx('relative inline-block', dims)}>
            <Star className={cx('absolute inset-0 fill-slate-100 text-slate-200', dims)} strokeWidth={1.75} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cx('fill-amber-400 text-amber-400', dims)} strokeWidth={1.75} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
