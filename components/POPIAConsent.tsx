'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export function POPIAConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    if (!localStorage.getItem('popia_consent')) setIsVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('popia_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className="fixed inset-x-3 bottom-3 z-50 animate-fade-in sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-sm"
    >
      <div className="rounded-2xl bg-brand-navy p-5 text-white shadow-[0_16px_40px_-12px_rgba(10,27,61,0.55)] ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-lime/15 text-brand-lime">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Your privacy matters</p>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              We use cookies and personal data to match you with jobs and candidates, in line with POPIA. You can manage your data in your account settings.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAccept}
            className="h-9 cursor-pointer rounded-xl bg-brand-lime px-4 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-lime-soft"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
