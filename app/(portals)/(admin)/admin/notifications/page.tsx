'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Smartphone, Send, CheckCircle2, XCircle, AlertTriangle, LucideIcon } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { PageHeader, Card, Field, Input, Textarea, Button, cx } from '../_components/ui';

type Channel = 'email' | 'sms' | 'whatsapp';

const CHANNELS: { id: Channel; label: string; description: string; icon: LucideIcon; defaultBody: string }[] = [
  {
    id: 'email',
    label: 'Email',
    description: 'Transactional email',
    icon: Mail,
    defaultBody: 'This is a test email from the LaunchPath admin console.',
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Transactional SMS',
    icon: Smartphone,
    defaultBody: 'LaunchPath: this is a test SMS from the admin console.',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'WhatsApp message',
    icon: MessageSquare,
    defaultBody: 'LaunchPath: this is a test WhatsApp message from the admin console.',
  },
];

type Result = { success: boolean; isMock: boolean; message: string };

export default function AdminNotificationsPage() {
  const { user } = useAdmin();
  const [channel, setChannel] = useState<Channel>('email');
  const [recipient, setRecipient] = useState<string>(user?.email || '');
  const [subject, setSubject] = useState('LaunchPath test email');
  const [body, setBody] = useState(CHANNELS[0].defaultBody);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const selectChannel = (next: Channel) => {
    if (next === channel) return;
    setChannel(next);
    setBody(CHANNELS.find((c) => c.id === next)!.defaultBody);
    // An email address isn't a valid phone number and vice versa
    if (next === 'email') setRecipient(user?.email || '');
    else if (recipient.includes('@')) setRecipient('');
    setResult(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/superadmin/test-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, to: recipient, subject, body }),
      });
      const json = await res.json();
      setResult(
        res.ok
          ? { success: json.success, isMock: json.isMock, message: json.message || 'Test sent.' }
          : { success: false, isMock: false, message: json.error || 'The test could not be sent.' },
      );
    } catch (err: any) {
      setResult({ success: false, isMock: false, message: err.message || 'The test could not be sent.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Send a test message through Brevo to confirm email, SMS and WhatsApp delivery are working."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <form onSubmit={handleSend} className="space-y-5">
            <div role="radiogroup" aria-label="Channel" className="grid grid-cols-3 gap-2">
              {CHANNELS.map(({ id, label, description, icon: Icon }) => {
                const active = channel === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => selectChannel(id)}
                    className={cx(
                      'flex cursor-pointer flex-col items-start gap-3 rounded-xl p-4 text-left ring-1 ring-inset transition-colors',
                      active ? 'bg-brand-lime/[0.06] ring-brand-lime/40' : 'bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.04]',
                    )}
                  >
                    <Icon className={cx('h-5 w-5', active ? 'text-brand-lime' : 'text-slate-500')} />
                    <span>
                      <span className="block text-sm font-medium text-white">{label}</span>
                      <span className="hidden text-xs text-slate-500 sm:block">{description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <Field
              label={channel === 'email' ? 'Recipient email' : 'Recipient phone number'}
              hint={channel === 'email' ? undefined : 'International format with country code, e.g. +27821234567'}
              htmlFor="test-recipient"
            >
              <Input
                id="test-recipient"
                type={channel === 'email' ? 'email' : 'tel'}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={channel === 'email' ? 'name@company.com' : '+27821234567'}
                required
              />
            </Field>

            {channel === 'email' && (
              <Field label="Subject" htmlFor="test-subject">
                <Input id="test-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </Field>
            )}

            <Field label="Message" htmlFor="test-body">
              <Textarea id="test-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" icon={Send} loading={sending}>
                {sending ? 'Sending…' : 'Send test'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {result ? (
            <Card className={cx('animate-fade-in', result.success ? 'border-emerald-400/20' : 'border-rose-400/20')}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{result.success ? 'Test sent' : 'Test failed'}</p>
                  <p className="mt-1 text-sm text-slate-400">{result.message}</p>
                </div>
              </div>
              {result.isMock && (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-400/[0.06] p-3.5 ring-1 ring-inset ring-amber-400/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <p className="text-xs leading-relaxed text-amber-100/80">
                    Brevo isn’t configured, so nothing was actually delivered. The message was logged to the server console instead. Set{' '}
                    <code className="rounded bg-black/30 px-1 py-0.5 text-amber-200">BREVO_API_KEY</code> to send for real.
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <p className="text-sm font-medium text-white">How this works</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>Messages go through the same Brevo integration the platform uses for real notifications.</li>
                <li>If Brevo isn’t configured, the message is logged on the server instead of being sent.</li>
                <li>SMS and WhatsApp numbers must include the country code.</li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
