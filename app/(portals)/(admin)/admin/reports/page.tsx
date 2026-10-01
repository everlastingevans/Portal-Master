'use client';

import { PageHeader } from '../_components/ui';
import SuperadminReportsView from '../dashboard/SuperadminReportsView';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Exportable reports on candidates, employers and AI-generated market insights." />
      <SuperadminReportsView />
    </div>
  );
}
