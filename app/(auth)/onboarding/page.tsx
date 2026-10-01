'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, Check, Briefcase, Phone, Linkedin, Github, User, X, Sparkles } from 'lucide-react';
import LaunchPathLogo from '@/components/LaunchPathLogo';
import PortalLoader from '@/components/PortalLoader';
import { Alert, Button, Card, Field, Input, Select, cx } from '@/components/portal/ui';
import { AVAILABILITY_OPTIONS, CANDIDATE_LOCATIONS } from '@/lib/talent';

const EXPERIENCE_LEVELS = [
  { value: 'Junior', label: 'Graduate or junior (0–2 years)' },
  { value: 'Mid-Level', label: 'Mid-level (3–5 years)' },
  { value: 'Senior', label: 'Senior (5+ years)' },
  { value: 'Lead', label: 'Lead or manager' },
];

const STEPS = ['Your profile', 'Your CV'];
const MAX_MB = 10;

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Junior');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Must be a signed-in candidate; prefill anything we already know
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const { user } = await res.json();
        if (!user) return router.replace('/login?next=/onboarding');
        if (String(user.role).toUpperCase() !== 'CANDIDATE') return router.replace('/');
        setName(user.name || '');
        setPhone(user.phone || '');
        setProfessionalTitle(user.professional_title || '');
        if (EXPERIENCE_LEVELS.some((l) => l.value === user.experience_level)) setExperienceLevel(user.experience_level);
        setLinkedinUrl(user.linkedin_url || '');
        setGithubUrl(user.github_url || '');
        setLocation(user.location || '');
        setAvailability(user.availability || '');
        setChecking(false);
      } catch {
        router.replace('/login?next=/onboarding');
      }
    })();
  }, [router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/candidate/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          professional_title: professionalTitle,
          experience_level: experienceLevel,
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
          phone,
          location,
          availability,
        }),
      });
      if (!res.ok) throw new Error('We couldn’t save your profile. Please try again.');
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: (files) => {
      setError('');
      if (files[0]) setResumeFile(files[0]);
    },
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: MAX_MB * 1024 * 1024,
  });

  const rejection = fileRejections[0]?.errors[0];
  const rejectionMessage = rejection
    ? rejection.code === 'file-too-large'
      ? `That file is larger than ${MAX_MB} MB.`
      : 'Please upload your CV as a PDF.'
    : '';

  const handleResumeSubmit = async () => {
    if (!resumeFile) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const res = await fetch('/api/candidate/resume', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'We couldn’t upload your CV. Please try again.');
      }
      setDone(true);
      setTimeout(() => router.push('/candidate/dashboard?tab=Jobs'), 1400);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (checking) return <PortalLoader portal="CANDIDATE" title="Setting up your profile" />;

  return (
    <div className="min-h-screen bg-canvas font-sans antialiased">
      <header className="bg-brand-navy">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <LaunchPathLogo className="h-8" />
          {!done && (
            <Link href="/candidate/dashboard" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              Skip for now
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-10 sm:py-14">
        {!done && (
          <ol className="mb-8 flex items-center gap-3" aria-label="Progress">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const state = step > n ? 'done' : step === n ? 'current' : 'todo';
              return (
                <li key={label} className="flex flex-1 items-center gap-3">
                  <span
                    className={cx(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      state === 'done' && 'bg-brand-lime text-brand-navy',
                      state === 'current' && 'bg-brand-navy text-white',
                      state === 'todo' && 'bg-white text-slate-400 ring-1 ring-inset ring-slate-200',
                    )}
                    aria-current={state === 'current' ? 'step' : undefined}
                  >
                    {state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
                  </span>
                  <span className={cx('text-sm font-medium', state === 'todo' ? 'text-slate-400' : 'text-brand-navy')}>{label}</span>
                  {n < STEPS.length && <span className={cx('h-px flex-1', step > n ? 'bg-brand-navy/30' : 'bg-slate-200')} />}
                </li>
              );
            })}
          </ol>
        )}

        {step === 1 && !done && (
          <Card className="p-6 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-navy">Tell us about yourself</h1>
            <p className="mt-1.5 text-sm text-slate-500">This helps us match you with the right roles. You can change it anytime.</p>

            <form onSubmit={handleProfileSubmit} className="mt-7 space-y-5">
              {error && <Alert>{error}</Alert>}
              <Field label="Full name" htmlFor="ob-name">
                <Input id="ob-name" icon={User} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
              </Field>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="What role are you after?" htmlFor="ob-title">
                  <Input
                    id="ob-title"
                    icon={Briefcase}
                    value={professionalTitle}
                    onChange={(e) => setProfessionalTitle(e.target.value)}
                    placeholder="e.g. Junior Data Analyst"
                    required
                  />
                </Field>
                <Field label="Experience" htmlFor="ob-exp">
                  <Select id="ob-exp" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                    {EXPERIENCE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Where are you based?" htmlFor="ob-location">
                  <Select id="ob-location" value={location} onChange={(e) => setLocation(e.target.value)}>
                    <option value="">Select a province</option>
                    {CANDIDATE_LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l === 'Remote' ? 'Remote (anywhere in SA)' : l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="When can you start?" htmlFor="ob-availability">
                  <Select id="ob-availability" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                    <option value="">Select</option>
                    {AVAILABILITY_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Mobile number" htmlFor="ob-phone" optional>
                <Input id="ob-phone" type="tel" icon={Phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 82 123 4567" autoComplete="tel" />
              </Field>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="LinkedIn" htmlFor="ob-li" optional>
                  <Input id="ob-li" type="url" icon={Linkedin} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/you" />
                </Field>
                <Field label="GitHub or portfolio" htmlFor="ob-gh" optional>
                  <Input id="ob-gh" type="url" icon={Github} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="github.com/you" />
                </Field>
              </div>
              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                Continue
              </Button>
            </form>
          </Card>
        )}

        {step === 2 && !done && (
          <Card className="p-6 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-navy">Upload your CV</h1>
            <p className="mt-1.5 text-sm text-slate-500">We’ll read your skills and experience, then rank open roles by how well they fit you.</p>

            <div className="mt-7 space-y-5">
              {(error || rejectionMessage) && <Alert>{error || rejectionMessage}</Alert>}

              {!resumeFile ? (
                <div
                  {...getRootProps()}
                  className={cx(
                    'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
                    isDragActive ? 'border-brand-navy bg-brand-navy/[0.03]' : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <input {...getInputProps()} />
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-navy shadow-sm ring-1 ring-slate-200">
                    <UploadCloud className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-sm font-medium text-brand-navy">{isDragActive ? 'Drop your CV here' : 'Drag and drop your CV, or click to browse'}</p>
                  <p className="mt-1 text-xs text-slate-500">PDF only, up to {MAX_MB} MB</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-lime">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-navy">{resumeFile.name}</p>
                    <p className="text-xs text-slate-500">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    disabled={loading}
                    aria-label="Remove file"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-navy disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy" />
                Employers can discover your profile in the LaunchPath talent pool. Your contact details and CV file are only shared when you apply.
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button type="button" variant="ghost" size="lg" onClick={() => setStep(1)} disabled={loading} className="sm:w-auto">
                  Back
                </Button>
                <Button type="button" variant="primary" size="lg" fullWidth onClick={handleResumeSubmit} disabled={!resumeFile} loading={loading}>
                  {loading ? 'Uploading…' : 'Find my matches'}
                </Button>
              </div>
              <p className="text-center text-sm">
                <Link href="/candidate/dashboard?tab=Profile" className="text-slate-500 hover:text-brand-navy">
                  I’ll upload my CV later
                </Link>
              </p>
            </div>
          </Card>
        )}

        {done && (
          <Card className="flex flex-col items-center p-10 text-center animate-scale-in">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-brand-navy">You’re all set</h1>
            <p className="mt-2 text-sm text-slate-500">We’re reading your CV now. Taking you to your matches…</p>
            <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-2/5 rounded-full bg-brand-navy animate-loader-bar" />
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
