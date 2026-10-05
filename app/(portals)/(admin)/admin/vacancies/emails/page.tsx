'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge, Card, PageHeader, Segmented } from '../../_components/ui';

const LABELS: Record<string, string> = {
  vacancy_confirmation: 'Employer confirmation',
  ops_new_vacancy: 'Ops: new vacancy',
  shortlist_ready: 'Employer: shortlist ready',
  ops_interview_request: 'Ops: interview request',
};

// Development preview of transactional emails with fictional data. Nothing is sent from this page.
export default function EmailPreviewPage() {
  const [template, setTemplate] = useState('vacancy_confirmation');
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/superadmin/email-preview')
      .then((r) => r.json())
      .then((j) => setConfigured(Boolean(j.providerConfigured)))
      .catch(() => setConfigured(null));
  }, []);

  return (
    <div className="space-y-6">
      <Link href="/admin/vacancies" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Vacancies
      </Link>
      <PageHeader title="Email previews" description="LaunchPath Hire emails rendered with fictional sample data. Previewing never sends anything." />
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={template} onChange={setTemplate} options={Object.entries(LABELS).map(([value, label]) => ({ value, label }))} />
        {configured !== null && (
          <Badge tone={configured ? 'success' : 'warning'}>{configured ? 'Email provider configured on this server' : 'Email provider not configured: emails are recorded as not sent'}</Badge>
        )}
      </div>
      <Card padded={false} className="overflow-hidden">
        <iframe title="Email preview" src={`/api/superadmin/email-preview?template=${template}`} className="h-[720px] w-full bg-white" sandbox="" />
      </Card>
      <p className="text-xs text-slate-500">
        Plain-text version:{' '}
        <a className="text-slate-300 underline" href={`/api/superadmin/email-preview?template=${template}&format=text`} target="_blank" rel="noreferrer">
          open
        </a>
      </p>
    </div>
  );
}
