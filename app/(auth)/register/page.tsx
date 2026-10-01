'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, User, Phone, GraduationCap, Building2 } from 'lucide-react';
import AuthLayout, { AuthHeading, AuthTopLink, PasswordInput, PasswordStrength, safeNext } from '@/components/auth/AuthLayout';
import { Alert, Button, ChoiceCard, Field, Input } from '@/components/portal/ui';

type AccountType = 'talent' | 'client';

function parseType(value: string | null): AccountType {
  return value === 'client' || value === 'employer' ? 'client' : 'talent';
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const [accountType, setAccountType] = useState<AccountType>(parseType(params.get('type')));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; exists?: boolean } | null>(null);

  const isEmployer = accountType === 'client';

  const selectType = (type: AccountType) => {
    setAccountType(type);
    setError(null);
    // Keep the URL shareable and in sync with the choice
    const url = new URL(window.location.href);
    url.searchParams.set('type', type);
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError({ message: 'Your password needs at least 8 characters.' });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
          role: isEmployer ? 'CLIENT' : 'CANDIDATE',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const exists = /already exists/i.test(data.error || '');
        throw Object.assign(new Error(data.error || 'We couldn’t create your account.'), { exists });
      }
      router.push(next || (isEmployer ? '/employer/dashboard' : '/onboarding'));
    } catch (err: any) {
      setError({ message: err.message, exists: err.exists });
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      audience={isEmployer ? 'employer' : 'talent'}
      topRight={
        <>
          <span className="hidden sm:inline">Already have an account? </span>
          <AuthTopLink href="/login">Log in</AuthTopLink>
        </>
      }
    >
      <AuthHeading
        title="Create your account"
        description={isEmployer ? 'Start hiring in minutes. No credit card needed to sign up.' : 'Free for job seekers, always. Takes less than a minute.'}
      />

      <form onSubmit={handleRegister} className="space-y-5">
        <div role="radiogroup" aria-label="Account type" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ChoiceCard
            selected={!isEmployer}
            onSelect={() => selectType('talent')}
            icon={GraduationCap}
            title="I’m looking for work"
            description="Find roles matched to you"
          />
          <ChoiceCard
            selected={isEmployer}
            onSelect={() => selectType('client')}
            icon={Building2}
            title="I’m hiring"
            description="Post jobs and find talent"
          />
        </div>

        {error && (
          <Alert>
            {error.message}
            {error.exists && (
              <>
                {' '}
                <Link href={`/login?email=${encodeURIComponent(email.trim())}`} className="font-semibold underline underline-offset-2">
                  Log in instead
                </Link>
              </>
            )}
          </Alert>
        )}

        <Field label={isEmployer ? 'Your name' : 'Full name'} htmlFor="name">
          <Input
            id="name"
            icon={User}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isEmployer ? 'e.g. Thandi Mokoena' : 'e.g. Sipho Dlamini'}
            required
          />
        </Field>

        <Field label={isEmployer ? 'Work email' : 'Email'} htmlFor="email">
          <Input
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isEmployer ? 'you@company.co.za' : 'you@example.com'}
            required
          />
        </Field>

        <Field
          label="Mobile number"
          htmlFor="phone"
          optional
          hint={isEmployer ? 'For interview and applicant alerts.' : 'We’ll send interview updates by SMS or WhatsApp.'}
        >
          <Input id="phone" type="tel" icon={Phone} autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 82 123 4567" />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            minLength={8}
            required
          />
          <div className="pt-1">
            <PasswordStrength password={password} />
          </div>
        </Field>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          {loading ? 'Creating your account…' : isEmployer ? 'Create employer account' : 'Create account'}
        </Button>

        <p className="text-center text-xs leading-relaxed text-slate-400">
          By creating an account you agree to LaunchPath’s{' '}
          <a href="#" className="underline underline-offset-2 hover:text-slate-600">
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="underline underline-offset-2 hover:text-slate-600">
            Privacy Policy
          </a>
          , and to how we handle your data under POPIA.
        </p>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
