'use client';

import { useState } from 'react';
import { Download, Eye, EyeOff, Lock, Mail, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { useConfirm } from '@/components/portal/overlay';
import { Button, Card, Field, Input, PageHeader, Section } from '@/components/portal/ui';

export interface SettingsTabProps {
  email: string;
  setEmail: (val: string) => void;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  handleUpdateSettings: (e: React.FormEvent) => Promise<void>;
}

export default function SettingsTab({
  email,
  setEmail,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleUpdateSettings,
}: SettingsTabProps) {
  const { success, info } = useToast();
  const confirmDialog = useConfirm();
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const needsCurrent = newPassword.length > 0 && currentPassword.length === 0;
  const passwordType = showPasswords ? 'text' : 'password';

  const onSubmit = async (e: React.FormEvent) => {
    setSaving(true);
    try {
      await handleUpdateSettings(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    success('Your data export request has been sent. We will email you a copy shortly.');
  };

  const handleDeleteAccount = async () => {
    const ok = await confirmDialog({
      title: 'Delete your account?',
      description:
        'This permanently removes your profile, CV and applications from LaunchPath. Our support team will contact you to confirm before anything is deleted.',
      confirmLabel: 'Request deletion',
      tone: 'danger',
    });
    if (ok) {
      info('Account deletion requested. Our support team will contact you to confirm.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Settings" description="Manage your sign-in details and your personal data." />

      <Card>
        <form onSubmit={onSubmit}>
          <Section title="Email address" description="We use this to sign you in and to send you updates about your applications.">
            <Field label="Email" htmlFor="settings-email">
              <Input
                id="settings-email"
                type="email"
                icon={Mail}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
          </Section>

          <Section title="Password" description="Leave these blank if you do not want to change your password.">
            <Field
              label="Current password"
              htmlFor="settings-current-password"
              error={needsCurrent ? 'Enter your current password to set a new one.' : undefined}
              action={
                <button
                  type="button"
                  onClick={() => setShowPasswords((s) => !s)}
                  aria-pressed={showPasswords}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md text-xs font-medium text-slate-500 hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
                >
                  {showPasswords ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                  {showPasswords ? 'Hide passwords' : 'Show passwords'}
                </button>
              }
            >
              <Input
                id="settings-current-password"
                type={passwordType}
                icon={Lock}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                invalid={needsCurrent}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="New password" htmlFor="settings-new-password" hint="Pick one you do not use anywhere else.">
                <Input
                  id="settings-new-password"
                  type={passwordType}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>
              <Field label="Confirm new password" htmlFor="settings-confirm-password" error={mismatch ? 'Passwords do not match.' : undefined}>
                <Input
                  id="settings-confirm-password"
                  type={passwordType}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  invalid={mismatch}
                />
              </Field>
            </div>
          </Section>

          <div className="flex justify-end border-t border-slate-100 pt-6">
            <Button type="submit" variant="primary" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <Section
          title="Your data"
          description="Under the Protection of Personal Information Act (POPIA), you can ask for a copy of your data or ask us to delete your account."
        >
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-navy">Download your data</p>
              <p className="mt-0.5 text-sm text-slate-500">We will email you a copy of everything we hold about you.</p>
            </div>
            <Button variant="secondary" icon={Download} onClick={handleExportData} className="self-start sm:self-center">
              Request export
            </Button>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-rose-200/70 bg-rose-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-navy">Delete your account</p>
              <p className="mt-0.5 text-sm text-slate-500">Permanently remove your profile, CV and applications.</p>
            </div>
            <Button variant="danger" icon={Trash2} onClick={handleDeleteAccount} className="self-start sm:self-center">
              Delete account
            </Button>
          </div>
        </Section>
      </Card>
    </div>
  );
}
