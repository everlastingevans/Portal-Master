'use client';

interface PortalLoaderProps {
  portal: 'ADMIN' | 'EMPLOYER' | 'CANDIDATE';
  title?: string;
}

export default function PortalLoader({ portal, title }: PortalLoaderProps) {
  return (
    <div className="h-screen w-full bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 select-none transition-colors duration-500 animate-fade-in" id="portal-loader-root">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/logo.svg" 
          alt="Company Logo" 
          className="w-16 h-16 animate-pulse"
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
          {title || 'Loading...'}
        </p>
      </div>
    </div>
  );
}

