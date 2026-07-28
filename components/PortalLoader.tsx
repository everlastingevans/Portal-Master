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
          src="/logos/logo.png" 
          alt="Company Logo" 
          className="w-30 h-30 animate-pulse"
        />
        <p className="text-[14px] font-bold font-mono uppercase tracking-[0.25em] text-[#0A1B3D]">
          {title || 'Loading...'}
        </p>
      </div>
    </div>
  );
}

