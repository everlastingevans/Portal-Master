'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, MapPin, Building2, Check, X, Wallet, Clock3, Briefcase } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import PortalLoader from '@/components/PortalLoader';
import PortalShell from '@/components/portal/PortalShell';
import { useToast } from '@/components/ToastNotification';
import { Badge, Button, Card, Field, Input, PageHeader, Section, Segmented, Skeleton, buttonClasses, cx } from '@/components/portal/ui';

/** Comma-separated string <-> list of chips. The API still receives the comma-separated string. */
const toList = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const isEmptyHtml = (html: string) => !html || html.replace(/<[^>]*>/g, '').trim() === '';

const formatRand = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) && value !== '' ? `R${n.toLocaleString('en-ZA')}` : '';
};

function ChipInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const items = toList(value);

  const commit = (raw: string) => {
    const additions = toList(raw).filter((s) => !items.some((i) => i.toLowerCase() === s.toLowerCase()));
    if (additions.length) onChange([...items, ...additions].join(', '));
    setDraft('');
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index).join(', '));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && !draft && items.length) {
      remove(items.length - 1);
    }
  };

  return (
    <div className="flex min-h-[44px] w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-[0_1px_1px_rgba(10,27,61,0.03)] transition-colors focus-within:border-brand-navy/40 focus-within:ring-4 focus-within:ring-brand-navy/[0.06]">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 py-1 pl-2.5 pr-1 text-xs font-medium text-brand-navy">
          {item}
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={`Remove ${item}`}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-brand-navy"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          if (next.includes(',')) commit(next);
          else setDraft(next);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => draft && commit(draft)}
        placeholder={items.length ? 'Add another' : placeholder}
        className="h-8 min-w-[120px] flex-1 bg-transparent px-1.5 text-sm text-brand-navy placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  );
}

function RandInput(props: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; invalid?: boolean }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">R</span>
      <Input
        id={props.id}
        type="number"
        inputMode="numeric"
        min={0}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        invalid={props.invalid}
        className="pl-8 tabular-nums"
      />
    </div>
  );
}

export default function EmployerNewPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [mandatorySkills, setMandatorySkills] = useState('');
  const [techStack, setTechStack] = useState('');
  const [duration, setDuration] = useState('30');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const router = useRouter();
  const toast = useToast();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !company) {
      setCompany(user.tenant?.name || user.name || '');
    }
  }, [user, company]);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const role = String(data.user?.role || '').toUpperCase();
        if (!data.user || (role !== 'EMPLOYER' && role !== 'CLIENT')) {
          router.push('/login');
          return;
        }
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleAiAutofill = async () => {
    if (!title.trim()) {
      toast.warning('Add a job title first, then we can draft the rest.');
      titleRef.current?.focus();
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/jobs/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const aiData = await res.json();
      if (aiData.error) throw new Error(aiData.error);

      setDescription(aiData.description || '');
      setYearsExperience(aiData.yearsExperienceRequired ? `${aiData.yearsExperienceRequired}+ years` : '');
      setMandatorySkills((aiData.mandatorySkills || []).join(', '));
      setTechStack((aiData.techStack || []).join(', '));
      setLocation(aiData.location || 'Remote');
      setSalaryMin(aiData.salaryMin ? String(aiData.salaryMin) : '');
      setSalaryMax(aiData.salaryMax ? String(aiData.salaryMax) : '');
      toast.success('Draft ready. Review each section before you publish.');
    } catch (err: any) {
      toast.error(`We couldn't draft this post: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const salaryInvalid = salaryMin !== '' && salaryMax !== '' && Number(salaryMin) > Number(salaryMax);
  const descriptionEmpty = isEmptyHtml(description);
  const canSubmit = Boolean(title) && !descriptionEmpty && !savingJob && !aiLoading;

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    if (descriptionEmpty) {
      toast.warning('Add a job description before publishing.');
      return;
    }
    if (salaryInvalid) {
      toast.warning('The minimum salary is higher than the maximum.');
      return;
    }

    setSavingJob(true);
    try {
      const fullDesc = `
${description}

**Company:** ${company || 'My Company'}
**Location:** ${location || 'Remote'}
**Salary Range:** ${salaryMin && salaryMax ? `R${salaryMin} - R${salaryMax}` : salaryMin ? `From R${salaryMin}` : salaryMax ? `Up to R${salaryMax}` : 'Negotiable'}
**Years of Experience Required:** ${yearsExperience}
**Mandatory Skills:** ${mandatorySkills}
**Tech Stack:** ${techStack}
**Listing Duration:** ${duration} days
      `.trim();

      const res = await fetch('/api/jobs/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          company,
          location,
          description: fullDesc,
          years_experience: yearsExperience,
          mandatory_skills: mandatorySkills,
          tech_stack: techStack,
          salary_min: salaryMin,
          salary_max: salaryMax,
        }),
      });
      if (res.ok) {
        const resetData = await res.json();

        if (resetData.bypassed || !resetData.payfast) {
          toast.success('Job post created. Complete payment from your dashboard to publish it.');
          router.push('/employer/dashboard');
        } else if (resetData.payfast) {
          const { url, data } = resetData.payfast;
          const form = document.createElement('form');
          form.action = url;
          form.method = 'POST';
          form.style.display = 'none';

          for (const [key, value] of Object.entries(data)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value as string;
            form.appendChild(input);
          }

          document.body.appendChild(form);
          form.submit();
        }
      } else {
        const errorData = await res.json();
        toast.error(`We couldn't create your job post: ${errorData.error}`);
        setSavingJob(false);
      }
    } catch (error: any) {
      toast.error(`Something went wrong: ${error.message}`);
      setSavingJob(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  if (loading || !user) {
    return <PortalLoader portal="EMPLOYER" title="Loading your workspace" />;
  }

  const skills = toList(mandatorySkills);
  const tools = toList(techStack);
  const salaryLabel =
    salaryMin && salaryMax
      ? `${formatRand(salaryMin)} – ${formatRand(salaryMax)}`
      : salaryMin
        ? `From ${formatRand(salaryMin)}`
        : salaryMax
          ? `Up to ${formatRand(salaryMax)}`
          : 'Negotiable';

  const checklist = [
    { label: 'Job title', done: Boolean(title.trim()) },
    { label: 'Company and location', done: Boolean(company.trim() && location.trim()) },
    { label: 'Must-have skills', done: skills.length > 0 },
    { label: 'Job description', done: !descriptionEmpty },
  ];

  const submitLabel = savingJob ? 'Creating job post…' : 'Create job post';

  return (
    <PortalShell portal="employer" user={user} onLogout={handleLogout} title="Post a job">
      <form onSubmit={handleCreateJob} className="space-y-8">
        <PageHeader
          title="Post a job"
          description="Describe the role once. We'll match it against vetted candidates and send you a shortlist."
          actions={
            <Link href="/employer/dashboard" className={buttonClasses({ variant: 'ghost' })}>
              Cancel
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {/* AI drafting */}
            <Card className="relative overflow-hidden">
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-lime/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-lime">
                    <Sparkles className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold text-brand-navy">Start with the job title</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Add a title and we&apos;ll draft the description, skills, location and salary range. You can edit everything before publishing.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Field label="Job title" htmlFor="job-title">
                      <Input
                        ref={titleRef}
                        id="job-title"
                        icon={Briefcase}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Junior bookkeeper"
                        required
                        autoComplete="off"
                      />
                    </Field>
                  </div>
                  <Button type="button" variant="primary" size="md" icon={Sparkles} loading={aiLoading} onClick={handleAiAutofill} className="h-11 sm:w-auto">
                    {aiLoading ? 'Drafting…' : 'Draft with AI'}
                  </Button>
                </div>

                {aiLoading && (
                  <p className="mt-3 text-xs text-slate-500" role="status">
                    Writing the description, requirements and salary guide. This usually takes a few seconds.
                  </p>
                )}
              </div>
            </Card>

            {/* Main form */}
            <Card className="p-6 sm:p-8">
              <fieldset disabled={aiLoading} className={cx('min-w-0 transition-opacity', aiLoading && 'opacity-60')}>
                <Section title="Role basics" description="Who's hiring and what level of experience you need.">
                  <Field label="Company name" htmlFor="company">
                    <Input id="company" icon={Building2} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Ubuntu Logistics" required />
                  </Field>
                  <Field label="Experience required" htmlFor="experience" optional hint="For example “2+ years” or “Entry level”.">
                    <Input id="experience" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="e.g. 2+ years" />
                  </Field>
                  <Field label="Listing duration">
                    <div>
                      <Segmented
                        value={duration}
                        onChange={setDuration}
                        options={[
                          { value: '30', label: '30 days' },
                          { value: '60', label: '60 days' },
                          { value: '90', label: '90 days' },
                        ]}
                      />
                    </div>
                  </Field>
                </Section>

                <Section title="Location and pay" description="Candidates are far more likely to apply when a salary range is shown.">
                  <Field label="Location" htmlFor="location" hint="City and province, or “Remote”.">
                    <Input id="location" icon={MapPin} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Johannesburg, GP" required />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Minimum salary" htmlFor="salary-min" optional>
                      <RandInput id="salary-min" value={salaryMin} onChange={setSalaryMin} placeholder="15000" invalid={salaryInvalid} />
                    </Field>
                    <Field label="Maximum salary" htmlFor="salary-max" optional error={salaryInvalid ? 'Must be higher than the minimum.' : undefined}>
                      <RandInput id="salary-max" value={salaryMax} onChange={setSalaryMax} placeholder="25000" invalid={salaryInvalid} />
                    </Field>
                  </div>
                  <p className="-mt-1 text-xs text-slate-500">Use the same period for both, monthly or annual. Leave blank to show “Negotiable”.</p>
                </Section>

                <Section title="Requirements and skills" description="We use these to rank candidates. Press Enter or comma after each one.">
                  <Field label="Must-have skills" htmlFor="skills" optional>
                    <ChipInput id="skills" value={mandatorySkills} onChange={setMandatorySkills} placeholder="e.g. Excel, Customer service" />
                  </Field>
                  <Field label="Tools and software" htmlFor="tools" optional>
                    <ChipInput id="tools" value={techStack} onChange={setTechStack} placeholder="e.g. Sage, Xero, Google Workspace" />
                  </Field>
                </Section>

                <Section title="Job description" description="Responsibilities, what a great first 90 days looks like, and why people enjoy working with you.">
                  {aiLoading ? (
                    <div className="space-y-3" role="status" aria-label="Drafting description">
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                  ) : (
                    <RichTextEditor content={description} onChange={setDescription} />
                  )}
                </Section>
              </fieldset>
            </Card>
          </div>

          {/* Summary */}
          <aside className="min-w-0 lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-8">
              <Card>
                <p className="text-xs font-medium text-slate-500">Preview</p>
                <h3 className={cx('mt-2 break-words text-lg font-semibold tracking-tight', title ? 'text-brand-navy' : 'text-slate-400')}>
                  {title || 'Untitled role'}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">{company || 'Your company'}</p>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <dt className="sr-only">Location</dt>
                    <dd className="min-w-0 break-words text-slate-600">{location || 'Location not set'}</dd>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <dt className="sr-only">Salary</dt>
                    <dd className="text-slate-600 tabular-nums">{salaryLabel}</dd>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <dt className="sr-only">Experience and duration</dt>
                    <dd className="text-slate-600">
                      {yearsExperience || 'Any experience'} · listed for {duration} days
                    </dd>
                  </div>
                </dl>

                {(skills.length > 0 || tools.length > 0) && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {skills.slice(0, 8).map((s) => (
                      <Badge key={`s-${s}`} tone="brand">
                        {s}
                      </Badge>
                    ))}
                    {tools.slice(0, 6).map((t) => (
                      <Badge key={`t-${t}`}>{t}</Badge>
                    ))}
                    {skills.length + tools.length > 14 && <Badge>+{skills.length + tools.length - 14} more</Badge>}
                  </div>
                )}

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs font-medium text-slate-500">Checklist</p>
                  <ul className="mt-3 space-y-2">
                    {checklist.map((item) => (
                      <li key={item.label} className="flex items-center gap-2.5 text-sm">
                        <span
                          className={cx(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                            item.done ? 'bg-brand-navy text-brand-lime' : 'bg-slate-100 text-transparent ring-1 ring-inset ring-slate-200',
                          )}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span className={item.done ? 'text-brand-navy' : 'text-slate-500'}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 hidden lg:block">
                  <Button type="submit" variant="accent" size="lg" fullWidth loading={savingJob} disabled={!canSubmit}>
                    {submitLabel}
                  </Button>
                  <p className="mt-3 text-center text-xs text-slate-500">R1,999 once-off to publish. No placement fees.</p>
                </div>
              </Card>
            </div>
          </aside>
        </div>

        {/* Mobile action bar */}
        <div className="sticky bottom-0 z-20 -mx-4 -mb-8 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:hidden">
          <div className="flex items-center gap-3">
            <p className="hidden min-w-0 flex-1 text-xs text-slate-500 sm:block">R1,999 once-off to publish. No placement fees.</p>
            <Button type="submit" variant="accent" size="lg" loading={savingJob} disabled={!canSubmit} className="w-full sm:w-auto">
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </PortalShell>
  );
}
