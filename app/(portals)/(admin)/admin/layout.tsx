'use client';

import { ReactNode } from 'react';
import { AdminProvider } from './AdminContext';
import AdminShell from './_components/AdminShell';

// The shell (sidebar, top bar, data) persists across admin routes,
// so navigating between pages never reloads data or flashes a loader.
export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
