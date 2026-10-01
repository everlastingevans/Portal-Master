'use client';

import Link from 'next/link';
import Image from 'next/image';
import LaunchPathMark from '@/assets/logo/launchpath-main.png';

interface LaunchPathLogoProps {
  href?: string; // where the logo links to
  className?: string; // controls the rendered height, e.g. "h-10 sm:h-12"
  priority?: boolean;
}

// Single source of truth for the LaunchPath logo. The mark is white,
// so it is designed to sit on the brand navy (#0A1B3D) or other dark surfaces.
export default function LaunchPathLogo({
  href = '/',
  className = 'h-10 sm:h-12',
  priority = true,
}: LaunchPathLogoProps) {
  return (
    <Link href={href} className="group inline-flex items-center" aria-label="LaunchPath home">
      <Image
        src={LaunchPathMark}
        alt="LaunchPath"
        priority={priority}
        className={`w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] ${className}`}
      />
    </Link>
  );
}
