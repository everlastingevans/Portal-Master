'use client';

import { useAdmin } from '../AdminContext';
import SuperadminDashboard from './SuperadminDashboard';
import PortalLoader from '@/components/PortalLoader';

export default function SuperadminDashboardPage() {
  const { data, loading, fetchDashboardData, handleLogout } = useAdmin();

  if (loading || !data) {
    return <PortalLoader portal="ADMIN" title="Loading LaunchPath Admin" />;
  }


  return (
    <SuperadminDashboard 
      data={data} 
      user={data.user} 
      onRefresh={fetchDashboardData} 
      onLogout={handleLogout} 
      initialTab="Analytics" 
    />
  );
}

