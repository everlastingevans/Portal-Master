'use client';

import { useAdmin } from '../AdminContext';
import SuperadminDashboard from '../dashboard/SuperadminDashboard';

export default function SuperadminReportsPage() {
  const { data, loading, fetchDashboardData, handleLogout } = useAdmin();

  if (loading || !data) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center text-slate-300 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#7145FF] border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing Operations...</span>
        </div>
      </div>
    );
  }

  return (
    <SuperadminDashboard 
      data={data} 
      user={data.user} 
      onRefresh={fetchDashboardData} 
      onLogout={handleLogout} 
      initialTab="Reports" 
    />
  );
}
