'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import AuthLayout, { AuthHeading, AuthTopLink, AuthDivider, PasswordInput, safeNext, portalFor } from '@/components/auth/AuthLayout';
import { Alert, Button, Field, Input, buttonClasses } from '@/components/portal/ui';

type View = 'login' | 'forgot' | 'reset';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const switchView = (v: View) => {
    setView(v);
    setError('');
    setNotice('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(res.status === 401 ? 'That email and password don’t match. Please try again.' : data.error || 'We couldn’t log you in.');
      // Keep the button in its loading state while the portal loads
      router.push(next || portalFor(data.role));
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'We couldn’t send a reset code.');
      setNotice(data.message || 'If an account exists for that email, we’ve sent a reset code.');
      // Development only: the API returns the token directly when email isn't configured
      if (data._devToken) setResetToken(data._devToken);
      setView('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'We couldn’t reset your password.');
      setPassword('');
      setNewPassword('');
      setResetToken('');
      setView('login');
      setNotice('Your password has been reset. Log in with your new password.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      topRight={
        <>
          <span className="hidden sm:inline">New to LaunchPath? </span>
          <AuthTopLink href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>Create account</AuthTopLink>
        </>
      }
    >
      {view === 'login' && (
        <>
          <AuthHeading title="Welcome back" description="Log in to your LaunchPath account." />
          <form onSubmit={handleLogin} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            {notice && (
              <Alert tone="success" icon={CheckCircle2}>
                {notice}
              </Alert>
            )}
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                icon={Mail}
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              action={
                <button type="button" onClick={() => switchView('forgot')} className="cursor-pointer text-[13px] font-medium text-slate-500 hover:text-brand-navy">
                  Forgot password?
                </button>
              }
            >
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </Field>
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </Button>
          </form>

          <AuthDivider>New to LaunchPath?</AuthDivider>
          <Link href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true })}>
            Create an account
          </Link>
        </>
      )}

      {view === 'forgot' && (
        <>
          <button type="button" onClick={() => switchView('login')} className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm text-slate-500 hover:text-brand-navy">
            <ArrowLeft className="h-4 w-4" /> Back to log in
          </button>
          <AuthHeading title="Reset your password" description="Enter the email you signed up with and we’ll send you a reset code." />
          <form onSubmit={handleForgot} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Field label="Email" htmlFor="forgot-email">
              <Input
                id="forgot-email"
                type="email"
                icon={Mail}
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Send reset code
            </Button>
          </form>
        </>
      )}

      {view === 'reset' && (
        <>
          <button type="button" onClick={() => switchView('forgot')} className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm text-slate-500 hover:text-brand-navy">
            <ArrowLeft className="h-4 w-4" /> Use a different email
          </button>
          <AuthHeading title="Choose a new password" description={<>Enter the code we sent to <span className="font-medium text-brand-navy">{email}</span> and pick a new password.</>} />
          <form onSubmit={handleReset} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            {notice && !error && <Alert tone="info">{notice}</Alert>}
            <Field label="Reset code" htmlFor="reset-token">
              <Input
                id="reset-token"
                icon={KeyRound}
                autoComplete="one-time-code"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste the code from your email"
                className="font-mono text-[13px]"
                required
              />
            </Field>
            <Field label="New password" htmlFor="new-password" hint="Use at least 8 characters.">
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </Field>
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Save new password
            </Button>
          </form>
        </>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
        By continuing you agree to LaunchPath’s{' '}
        <a href="#" className="underline underline-offset-2 hover:text-slate-600">
          Terms
        </a>{' '}
        and{' '}
        <a href="#" className="underline underline-offset-2 hover:text-slate-600">
          Privacy Policy
        </a>
        .
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
