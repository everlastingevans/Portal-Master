'use client';

import { ReactNode } from 'react';
import { AdminProvider } from './AdminContext';

export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  );
}
