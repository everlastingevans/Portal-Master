'use client';

import React from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { PageHeader, Card, Section, Field, Input, Button, Alert } from '@/components/portal/ui';
import { useConfirm } from '@/components/portal/overlay';
import { useToast } from '@/components/ToastNotification';

interface SettingsTabProps {
  user: any;
}

export default function SettingsTab({ user }: SettingsTabProps) {
  const askConfirm = useConfirm();
  const toast = useToast();

  const requestExport = () => {
    toast.success('Data export requested. Our team will be in touch.');
  };

  const requestDeletion = async () => {
    const ok = await askConfirm({
      title: 'Delete your employer account?',
      description:
        'This is permanent. All your live job listings will be closed and applicant data will be anonymised. Our team will contact you to finalise the request.',
      confirmLabel: 'Request deletion',
      tone: 'danger',
    });
    if (ok) toast.info('Account deletion requested. Our team will contact you to finalise it.');
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account and your data." />

      <Card>
        <Section title="Account" description="The details you sign in with.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="st-name">
              <Input id="st-name" value={user?.name || ''} disabled />
            </Field>
            <Field label="Email" htmlFor="st-email">
              <Input id="st-email" value={user?.email || ''} placeholder="Not available" disabled />
            </Field>
          </div>
          <p className="text-xs text-slate-500">Update your name and contact details on the Company profile page.</p>
        </Section>

        <Section
          title="Privacy and POPIA"
          description="Under the Protection of Personal Information Act you can request a copy of your data, or ask us to delete your account."
        >
          <Alert tone="info" icon={ShieldCheck}>
            Requests are reviewed by the LaunchPath team, who will contact you to confirm the details.
          </Alert>
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-navy">Export your data</p>
              <p className="mt-0.5 text-sm text-slate-500">Your company details, job listings and applicant records.</p>
            </div>
            <Button icon={Download} onClick={requestExport}>
              Request export
            </Button>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-rose-200 bg-rose-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-rose-700">Delete account</p>
              <p className="mt-0.5 text-sm text-slate-600">Closes all listings and anonymises applicant data. This can&apos;t be undone.</p>
            </div>
            <Button variant="danger" icon={Trash2} onClick={requestDeletion}>
              Delete account
            </Button>
          </div>
        </Section>
      </Card>
    </div>
  );
}
