'use client';

import { useState, useRef, useMemo, ReactNode, DragEvent } from 'react';
import {
  CheckCircle2,
  Circle,
  FileText,
  FileUp,
  Pencil,
  Phone,
  Mail,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
  Upload,
  X,
  Briefcase,
  GraduationCap,
  Compass,
  Tags,
  FolderOpen,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
  MapPin,
  LucideIcon,
} from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { Spinner } from '@/components/PortalLoader';
import {
  Alert,
  Avatar,
  Badge,
  BadgeTone,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Section,
  Select,
  Textarea,
  cx,
} from '@/components/portal/ui';
import { getResumeStrength } from './DashboardHelpers';
import { AVAILABILITY_OPTIONS, CANDIDATE_LOCATIONS, availabilityLabel } from '@/lib/talent';

export interface ProfileTabProps {
  user: any;
  isEditingProfile: boolean;
  setIsEditingProfile: (val: boolean) => void;
  isSavingProfile: boolean;
  isEditingResume: boolean;
  setIsEditingResume: (val: boolean) => void;
  profileName: string;
  setProfileName: (val: string) => void;
  profileTitle: string;
  setProfileTitle: (val: string) => void;
  profileExp: string;
  setProfileExp: (val: string) => void;
  profilePhone: string;
  setProfilePhone: (val: string) => void;
  profileLinkedin: string;
  setProfileLinkedin: (val: string) => void;
  profileGithub: string;
  setProfileGithub: (val: string) => void;
  profilePortfolioUrl: string;
  setProfilePortfolioUrl: (val: string) => void;
  profileCvUrl: string;
  setProfileCvUrl: (val: string) => void;
  profileStudyInstitution: string;
  setProfileStudyInstitution: (val: string) => void;
  profileStudySpecialisation: string;
  setProfileStudySpecialisation: (val: string) => void;
  profileSeekingRoles: string;
  setProfileSeekingRoles: (val: string) => void;
  profileCertificatesUrl: string;
  setProfileCertificatesUrl: (val: string) => void;
  profilePoliceClearanceUrl: string;
  setProfilePoliceClearanceUrl: (val: string) => void;
  profileLocation: string;
  setProfileLocation: (val: string) => void;
  profileAvailability: string;
  setProfileAvailability: (val: string) => void;
  profileBio: string;
  setProfileBio: (val: string) => void;
  profileQualifications: string;
  setProfileQualifications: (val: string) => void;
  profileSkills: string;
  setProfileSkills: (val: string) => void;
  profileInterests: string;
  setProfileInterests: (val: string) => void;
  profileCareerDirection: string;
  setProfileCareerDirection: (val: string) => void;
  profileWorkExperience: string;
  setProfileWorkExperience: (val: string) => void;
  profileResumeText: string;
  setProfileResumeText: (val: string) => void;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
  handleLinkedInConnect: () => Promise<void>;
  syncingLinkedIn: boolean;
  resumeTask: any;
  uploading: boolean;
  handleResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

/* ----------------------------- Helpers ---------------------------------- */

const splitList = (value?: string | null) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

/** Client-side completeness checklist, ordered by how much each item helps matching. */
function getCompleteness(u: any) {
  const items = [
    { key: 'cv', label: 'Upload your CV', done: !!u?.resume_text, hint: 'Upload your CV so we can match you to the right roles.' },
    { key: 'basics', label: 'Name and headline', done: !!u?.name && !!u?.professional_title, hint: 'Add a short headline, like "BCom Accounting graduate".' },
    { key: 'skills', label: 'Skills', done: !!u?.skills, hint: 'List your key skills so employers can find you.' },
    { key: 'experience', label: 'Experience', done: !!u?.work_experience, hint: 'Add internships, projects, part-time work or volunteering.' },
    { key: 'education', label: 'Education', done: !!u?.qualifications || !!u?.study_institution, hint: 'Tell employers where and what you studied.' },
    { key: 'direction', label: 'Career direction', done: !!u?.seeking_roles || !!u?.career_direction, hint: 'Share the roles you are looking for next.' },
    { key: 'phone', label: 'Phone number', done: !!u?.phone, hint: 'Add a phone number so recruiters can reach you quickly.' },
    { key: 'links', label: 'Links', done: !!u?.linkedin_url || !!u?.github_url || !!u?.portfolio_url, hint: 'Link your LinkedIn, GitHub or portfolio.' },
  ];
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100), next: items.find((i) => !i.done) };
}

function strengthTone(score: number): { label: string; tone: BadgeTone } {
  if (score === 0) return { label: 'No CV yet', tone: 'neutral' };
  if (score >= 80) return { label: 'Strong', tone: 'success' };
  if (score >= 60) return { label: 'Good', tone: 'info' };
  if (score >= 40) return { label: 'Fair', tone: 'warning' };
  return { label: 'Needs work', tone: 'danger' };
}

/* --------------------------- Small view parts --------------------------- */

function InfoCard({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/80">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-brand-navy">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-slate-700">{children}</dd>
    </div>
  );
}

function Missing({ children, onAdd }: { children: ReactNode; onAdd: () => void }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 text-sm text-slate-400">
      {children}
      <button type="button" onClick={onAdd} className="cursor-pointer font-medium text-brand-navy underline-offset-4 hover:underline">
        Add
      </button>
    </span>
  );
}

function Chips({ items, variant = 'solid' }: { items: string[]; variant?: 'solid' | 'outline' }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item, idx) => (
        <li
          key={`${item}-${idx}`}
          className={cx(
            'rounded-lg px-2.5 py-1 text-[13px] font-medium',
            variant === 'solid' ? 'bg-brand-navy/[0.05] text-brand-navy ring-1 ring-inset ring-brand-navy/10' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200',
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function LinkRow({ icon: Icon, label, href, onAdd }: { icon: LucideIcon; label: string; href?: string | null; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/80">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-medium text-brand-navy hover:underline">
            {prettyUrl(href)}
          </a>
        ) : (
          <Missing onAdd={onAdd}>Not added</Missing>
        )}
      </div>
      {href && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
    </div>
  );
}

function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

/* ------------------------------- Component ------------------------------ */

export default function ProfileTab({
  user,
  isEditingProfile,
  setIsEditingProfile,
  isSavingProfile,
  isEditingResume,
  setIsEditingResume,
  profileName,
  setProfileName,
  profileTitle,
  setProfileTitle,
  profileExp,
  setProfileExp,
  profilePhone,
  setProfilePhone,
  profileLinkedin,
  setProfileLinkedin,
  profileGithub,
  setProfileGithub,
  profilePortfolioUrl,
  setProfilePortfolioUrl,
  profileCvUrl,
  setProfileCvUrl,
  profileStudyInstitution,
  setProfileStudyInstitution,
  profileStudySpecialisation,
  setProfileStudySpecialisation,
  profileSeekingRoles,
  setProfileSeekingRoles,
  profileCertificatesUrl,
  setProfileCertificatesUrl,
  profilePoliceClearanceUrl,
  setProfilePoliceClearanceUrl,
  profileLocation,
  setProfileLocation,
  profileAvailability,
  setProfileAvailability,
  profileBio,
  setProfileBio,
  profileQualifications,
  setProfileQualifications,
  profileSkills,
  setProfileSkills,
  profileInterests,
  setProfileInterests,
  profileCareerDirection,
  setProfileCareerDirection,
  profileWorkExperience,
  setProfileWorkExperience,
  profileResumeText,
  setProfileResumeText,
  handleSaveProfile,
  handleLinkedInConnect,
  syncingLinkedIn,
  resumeTask,
  uploading,
  handleResumeUpload,
}: ProfileTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError, success: toastSuccess } = useToast();
  const completeness = useMemo(() => getCompleteness(user), [user]);
  const strength = getResumeStrength(user?.resume_text);
  const strengthMeta = strengthTone(strength.score);

  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingClearance, setUploadingClearance] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const skills = splitList(user?.skills);
  const interests = splitList(user?.interests);
  const draftSkills = splitList(profileSkills);
  const isProcessing = resumeTask && resumeTask.status !== 'FAILED';
  const taskFailed = resumeTask?.status === 'FAILED';

  const handleFileUploadToS3 = async (file: File, category: 'documents'): Promise<string> => {
    const presignResponse = await fetch('/api/storage/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/pdf',
        category: category,
      }),
    });

    if (!presignResponse.ok) {
      const errData = await presignResponse.json();
      throw new Error(errData.error || 'Failed to obtain S3 presigned upload URL.');
    }

    const { uploadUrl, publicUrl, s3Key, filename, contentType } = await presignResponse.json();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) resolve();
        else reject(new Error('S3 upload failed'));
      };
      xhr.onerror = () => reject(new Error('S3 upload network error'));
      xhr.send(file);
    });

    try {
      await fetch('/api/storage/log-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          s3Key,
          url: publicUrl,
          name: filename,
          size: file.size,
          type: category,
          mimeType: contentType,
        }),
      });
    } catch (e) {
      console.warn('Logging upload metadata failed, but file is uploaded to S3', e);
    }

    return publicUrl;
  };

  const startEditing = () => {
    setProfileName(user?.name || '');
    setProfileTitle(user?.professional_title || '');
    setProfileExp(user?.experience_level || 'Junior');
    setProfileLinkedin(user?.linkedin_url || '');
    setProfileGithub(user?.github_url || '');
    setProfilePhone(user?.phone || '');
    setProfileQualifications(user?.qualifications || '');
    setProfileSkills(user?.skills || '');
    setProfileInterests(user?.interests || '');
    setProfileCareerDirection(user?.career_direction || '');
    setProfileWorkExperience(user?.work_experience || '');
    setProfilePortfolioUrl(user?.portfolio_url || '');
    setProfileCvUrl(user?.cv_url || '');
    setProfileStudyInstitution(user?.study_institution || '');
    setProfileStudySpecialisation(user?.study_specialisation || '');
    setProfileSeekingRoles(user?.seeking_roles || '');
    setProfileCertificatesUrl(user?.certificates_url || '');
    setProfilePoliceClearanceUrl(user?.police_clearance_url || '');
    setProfileLocation(user?.location || '');
    setProfileAvailability(user?.availability || '');
    setProfileBio(user?.bio || '');
    setIsEditingProfile(true);
  };

  const onResumeInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    await handleResumeUpload(e);
    input.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (uploading || isProcessing) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toastError('Please upload your CV as a PDF.');
      return;
    }
    const syntheticEvent = {
      preventDefault: () => {},
      target: { files: e.dataTransfer.files },
      currentTarget: { files: e.dataTransfer.files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleResumeUpload(syntheticEvent);
  };

  const uploadDocument = async (
    file: File | undefined,
    setBusy: (v: boolean) => void,
    setUrl: (v: string) => void,
    label: string,
  ) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await handleFileUploadToS3(file, 'documents');
      setUrl(url);
      toastSuccess(`${label} uploaded. Save your profile to keep it.`);
    } catch (err: any) {
      toastError(`We couldn't upload your ${label.toLowerCase()}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const contactItems = [
    user?.email && { icon: Mail, label: user.email, href: `mailto:${user.email}` },
    user?.phone && { icon: Phone, label: user.phone, href: `tel:${user.phone}` },
    user?.linkedin_url && { icon: Linkedin, label: 'LinkedIn', href: user.linkedin_url, external: true },
    user?.github_url && { icon: Github, label: 'GitHub', href: user.github_url, external: true },
    user?.portfolio_url && { icon: Globe, label: 'Portfolio', href: user.portfolio_url, external: true },
  ].filter(Boolean) as { icon: LucideIcon; label: string; href: string; external?: boolean }[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ------------------------------ Header ------------------------------ */}
      <Card padded={false} className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <Avatar name={user?.name} src={user?.avatar_url || user?.image} size="lg" />
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-brand-navy sm:text-2xl">{user?.name || 'Your profile'}</h1>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {user?.professional_title || <span className="text-slate-400">Add a headline so employers know what you do</span>}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{user?.experience_level || 'Entry level'}</Badge>
                    {user?.location && (
                      <Badge>
                        <MapPin className="h-3 w-3" /> {user.location}
                      </Badge>
                    )}
                    {availabilityLabel(user?.availability) && <Badge tone="success">{availabilityLabel(user?.availability)}</Badge>}
                    {user?.study_institution && <Badge>{user.study_institution}</Badge>}
                  </div>
                </div>
              </div>
              {!isEditingProfile && (
                <Button variant="secondary" icon={Pencil} onClick={startEditing} className="self-start">
                  Edit profile
                </Button>
              )}
            </div>

            {contactItems.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-5">
                {contactItems.map(({ icon: Icon, label, href, external }) => (
                  <li key={href} className="min-w-0">
                    <a
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="inline-flex max-w-full items-center gap-1.5 text-sm text-slate-600 transition-colors hover:text-brand-navy"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Completeness meter */}
          <div className="flex flex-col justify-center gap-4 bg-brand-navy p-6 text-white sm:p-8">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-white/70">Profile strength</p>
              <p className="text-2xl font-semibold tabular-nums text-white">{completeness.percent}%</p>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Profile completeness"
              aria-valuemin={0}
              aria-valuemax={completeness.total}
              aria-valuenow={completeness.done}
            >
              <div className="h-full rounded-full bg-brand-lime transition-all duration-700 ease-out" style={{ width: `${completeness.percent}%` }} />
            </div>
            <p className="text-xs text-white/60">
              {completeness.done} of {completeness.total} complete
            </p>
            {completeness.next ? (
              <div className="rounded-xl bg-white/[0.06] p-3 ring-1 ring-inset ring-white/10">
                <p className="flex items-center gap-1.5 text-xs font-medium text-brand-lime">
                  <ArrowRight className="h-3.5 w-3.5" /> Next step
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{completeness.next.hint}</p>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-white/80">
                <CheckCircle2 className="h-4 w-4 text-brand-lime" /> Your profile is complete. Nice work.
              </p>
            )}
          </div>
        </div>
      </Card>

      {isEditingProfile ? (
        /* ---------------------------- Edit mode ---------------------------- */
        <form onSubmit={handleSaveProfile} className="relative">
          <Card className="sm:p-8">
            <Section title="The basics" description="How you appear to employers across LaunchPath.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="pf-name">
                  <Input id="pf-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required autoComplete="name" />
                </Field>
                <Field label="Headline" htmlFor="pf-title" optional>
                  <Input id="pf-title" value={profileTitle} onChange={(e) => setProfileTitle(e.target.value)} placeholder="e.g. Junior software developer" />
                </Field>
                <Field label="Experience level" htmlFor="pf-exp">
                  <Select id="pf-exp" value={profileExp} onChange={(e) => setProfileExp(e.target.value)}>
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Executive">Executive</option>
                  </Select>
                </Field>
                <Field label="Phone number" htmlFor="pf-phone" optional>
                  <Input
                    id="pf-phone"
                    type="tel"
                    icon={Phone}
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. 082 123 4567"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Location" htmlFor="pf-location" hint="Employers filter the talent pool by location.">
                  <Select id="pf-location" value={profileLocation} onChange={(e) => setProfileLocation(e.target.value)}>
                    <option value="">Not specified</option>
                    {CANDIDATE_LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l === 'Remote' ? 'Remote (anywhere in SA)' : l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="When can you start?" htmlFor="pf-availability">
                  <Select id="pf-availability" value={profileAvailability} onChange={(e) => setProfileAvailability(e.target.value)}>
                    <option value="">Not specified</option>
                    {AVAILABILITY_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="About & career direction" description="Tell us what you're looking for so we can find the right matches.">
              <Field label="Short bio" htmlFor="pf-bio" hint={`${profileBio.length}/600 · Shown to employers browsing the talent pool.`} optional>
                <Textarea
                  id="pf-bio"
                  rows={3}
                  maxLength={600}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Two or three sentences about you, what you’re good at and what you want to do next."
                />
              </Field>
              <Field label="Roles you're looking for" htmlFor="pf-roles" hint="Separate roles with commas." optional>
                <Input
                  id="pf-roles"
                  value={profileSeekingRoles}
                  onChange={(e) => setProfileSeekingRoles(e.target.value)}
                  placeholder="e.g. Graduate trainee, Junior data analyst"
                />
              </Field>
              <Field label="Career direction" htmlFor="pf-direction" optional>
                <Textarea
                  id="pf-direction"
                  rows={3}
                  value={profileCareerDirection}
                  onChange={(e) => setProfileCareerDirection(e.target.value)}
                  placeholder="Where do you want your career to go in the next few years?"
                />
              </Field>
            </Section>

            <Section title="Experience" description="Internships, part-time work, projects and volunteering all count.">
              <Field label="Work experience" htmlFor="pf-work" optional>
                <Textarea
                  id="pf-work"
                  rows={6}
                  value={profileWorkExperience}
                  onChange={(e) => setProfileWorkExperience(e.target.value)}
                  placeholder="e.g. Vacation work at a Johannesburg audit firm (Dec 2024): reconciled supplier accounts and..."
                />
              </Field>
            </Section>

            <Section title="Education" description="Your qualifications and where you studied.">
              <Field label="Qualifications" htmlFor="pf-quals" optional>
                <Textarea
                  id="pf-quals"
                  rows={3}
                  value={profileQualifications}
                  onChange={(e) => setProfileQualifications(e.target.value)}
                  placeholder="e.g. BSc Computer Science, University of Cape Town (2021 to 2024)"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Institution" htmlFor="pf-inst" optional>
                  <Input
                    id="pf-inst"
                    icon={GraduationCap}
                    value={profileStudyInstitution}
                    onChange={(e) => setProfileStudyInstitution(e.target.value)}
                    placeholder="e.g. University of Pretoria"
                  />
                </Field>
                <Field label="Field of study" htmlFor="pf-spec" optional>
                  <Input
                    id="pf-spec"
                    value={profileStudySpecialisation}
                    onChange={(e) => setProfileStudySpecialisation(e.target.value)}
                    placeholder="e.g. Information systems"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Skills & interests" description="Skills power your job matches. Separate each one with a comma.">
              <Field label="Skills" htmlFor="pf-skills" optional>
                <Input
                  id="pf-skills"
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="e.g. Excel, SQL, Customer service, Python"
                />
              </Field>
              {draftSkills.length > 0 && <Chips items={draftSkills} />}
              <Field label="Interests" htmlFor="pf-interests" optional>
                <Input
                  id="pf-interests"
                  value={profileInterests}
                  onChange={(e) => setProfileInterests(e.target.value)}
                  placeholder="e.g. Fintech, renewable energy, education"
                />
              </Field>
            </Section>

            <Section title="Documents & links" description="Verified documents and links help you stand out.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="LinkedIn" htmlFor="pf-linkedin" optional>
                  <Input
                    id="pf-linkedin"
                    icon={Linkedin}
                    value={profileLinkedin}
                    onChange={(e) => setProfileLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/your-name"
                  />
                </Field>
                <Field label="GitHub" htmlFor="pf-github" optional>
                  <Input
                    id="pf-github"
                    icon={Github}
                    value={profileGithub}
                    onChange={(e) => setProfileGithub(e.target.value)}
                    placeholder="github.com/your-name"
                  />
                </Field>
              </div>
              <Field label="Portfolio website" htmlFor="pf-portfolio" optional>
                <Input
                  id="pf-portfolio"
                  type="url"
                  icon={Globe}
                  value={profilePortfolioUrl}
                  onChange={(e) => setProfilePortfolioUrl(e.target.value)}
                  placeholder="https://your-portfolio.co.za"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DocumentUpload
                  id="cert-file-input"
                  title="Degree or certificates"
                  description="PDF of your degree, diploma or certificates."
                  url={profileCertificatesUrl}
                  busy={uploadingCert}
                  onRemove={() => setProfileCertificatesUrl('')}
                  onFile={(file) => uploadDocument(file, setUploadingCert, setProfileCertificatesUrl, 'Certificate')}
                />
                <DocumentUpload
                  id="clearance-file-input"
                  title="Police clearance"
                  description="PDF of your police clearance certificate."
                  url={profilePoliceClearanceUrl}
                  busy={uploadingClearance}
                  onRemove={() => setProfilePoliceClearanceUrl('')}
                  onFile={(file) => uploadDocument(file, setUploadingClearance, setProfilePoliceClearanceUrl, 'Police clearance')}
                />
              </div>
            </Section>
          </Card>

          {/* Sticky save bar */}
          <div className="sticky bottom-4 z-20 mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_32px_-12px_rgba(10,27,61,0.25)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500">Editing your profile. Save to update your matches.</p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSavingProfile} className="flex-1 sm:flex-none">
                Save profile
              </Button>
            </div>
          </div>
        </form>
      ) : (
        /* ---------------------------- View mode ---------------------------- */
        <>
          {/* CV card */}
          <Card padded={false} className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
              <div className="p-6">
                <CardHeader
                  title="Your CV"
                  description={user?.resume_text ? 'We use your CV to match you with roles. Upload a newer version any time.' : 'Upload your CV and we’ll start matching you with roles.'}
                />

                {taskFailed && (
                  <div className="mb-4">
                    <Alert tone="danger">We couldn&apos;t read your last upload. Please try again with a text-based PDF.</Alert>
                  </div>
                )}

                {isProcessing ? (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-5" role="status" aria-live="polite">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-navy ring-1 ring-inset ring-slate-200">
                        <Spinner className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-brand-navy">
                          {resumeTask.progress >= 100 || resumeTask.status === 'COMPLETED' ? 'Finishing up your matches' : 'Reading your CV'}
                        </p>
                        <p className="text-xs text-slate-500">This usually takes under a minute. You can keep browsing.</p>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-slate-600">{Math.round(resumeTask.progress || 0)}%</span>
                    </div>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                      <div
                        className="h-full rounded-full bg-brand-navy transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(4, resumeTask.progress || 0)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload your CV as a PDF"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={onDrop}
                    className={cx(
                      'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30',
                      dragActive ? 'border-brand-navy bg-brand-navy/[0.03]' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-navy shadow-sm ring-1 ring-inset ring-slate-200">
                      {uploading ? <Spinner className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
                    </span>
                    <p className="mt-3 text-sm font-medium text-brand-navy">
                      {uploading ? 'Uploading your CV' : user?.resume_text ? 'Drop a newer CV here, or browse' : 'Drop your CV here, or browse'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">PDF only. Text-based PDFs work best.</p>
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={onResumeInputChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]">
                      <LinkedInGlyph className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-brand-navy">Import from LinkedIn</p>
                      <p className="text-xs text-slate-500">Pull your latest LinkedIn details into your profile.</p>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" size="sm" loading={syncingLinkedIn} onClick={handleLinkedInConnect}>
                    {syncingLinkedIn ? 'Connecting' : 'Sync LinkedIn'}
                  </Button>
                </div>
              </div>

              {/* CV strength */}
              <div className="border-t border-slate-100 bg-slate-50/60 p-6 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-brand-navy">CV strength</p>
                  <Badge tone={strengthMeta.tone}>{strengthMeta.label}</Badge>
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-brand-navy">
                  {strength.score}
                  <span className="text-base font-medium text-slate-400">/100</span>
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                  <div className="h-full rounded-full bg-brand-navy transition-all duration-700 ease-out" style={{ width: `${strength.score}%` }} />
                </div>
                <ul className="mt-5 space-y-2">
                  {[
                    { label: 'Contact details', filled: strength.checks.contact },
                    { label: 'Skills section', filled: strength.checks.skills },
                    { label: 'Work history', filled: strength.checks.experience },
                    { label: 'Education', filled: strength.checks.education },
                    { label: 'Measurable results', filled: strength.checks.metrics },
                  ].map((check) => (
                    <li key={check.label} className="flex items-center gap-2 text-sm">
                      {check.filled ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Included" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-300" aria-label="Missing" />
                      )}
                      <span className={check.filled ? 'text-slate-700' : 'text-slate-500'}>{check.label}</span>
                    </li>
                  ))}
                </ul>
                {strength.tips.length > 0 && (
                  <div className="mt-5 border-t border-slate-200/70 pt-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Lightbulb className="h-3.5 w-3.5" /> Ways to improve
                    </p>
                    <ul className="mt-2 space-y-2">
                      {strength.tips.slice(0, 3).map((tip, idx) => (
                        <li key={idx} className="text-xs leading-relaxed text-slate-600">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Grouped sections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <InfoCard icon={Compass} title="About & career direction">
                <dl className="space-y-4">
                  <DetailRow label="Bio">
                    {user?.bio ? <span className="whitespace-pre-line">{user.bio}</span> : <Missing onAdd={startEditing}>Add a short bio employers will see.</Missing>}
                  </DetailRow>
                  <DetailRow label="Roles you're looking for">
                    {splitList(user?.seeking_roles).length > 0 ? (
                      <Chips items={splitList(user?.seeking_roles)} variant="outline" />
                    ) : (
                      <Missing onAdd={startEditing}>Not added yet.</Missing>
                    )}
                  </DetailRow>
                  <DetailRow label="Career direction">
                    {user?.career_direction ? (
                      <span className="whitespace-pre-line">{user.career_direction}</span>
                    ) : (
                      <Missing onAdd={startEditing}>Not added yet.</Missing>
                    )}
                  </DetailRow>
                </dl>
              </InfoCard>

              <InfoCard icon={Briefcase} title="Experience" description="Work, internships, projects and volunteering">
                {user?.work_experience ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{user.work_experience}</p>
                ) : (
                  <Missing onAdd={startEditing}>No experience added yet.</Missing>
                )}
              </InfoCard>

              <InfoCard icon={GraduationCap} title="Education">
                {user?.qualifications ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{user.qualifications}</p>
                ) : (
                  <Missing onAdd={startEditing}>No qualifications added yet.</Missing>
                )}
                <dl className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <DetailRow label="Institution">{user?.study_institution || <span className="text-slate-400">Not specified</span>}</DetailRow>
                  <DetailRow label="Field of study">{user?.study_specialisation || <span className="text-slate-400">Not specified</span>}</DetailRow>
                </dl>
              </InfoCard>
            </div>

            <div className="space-y-6">
              <InfoCard icon={Tags} title="Skills & interests">
                <dl className="space-y-4">
                  <DetailRow label="Skills">
                    {skills.length > 0 ? <Chips items={skills} /> : <Missing onAdd={startEditing}>No skills yet.</Missing>}
                  </DetailRow>
                  <DetailRow label="Interests">
                    {interests.length > 0 ? <Chips items={interests} variant="outline" /> : <Missing onAdd={startEditing}>None added.</Missing>}
                  </DetailRow>
                </dl>
              </InfoCard>

              <InfoCard icon={FolderOpen} title="Documents & links">
                <div className="space-y-3">
                  <DocumentRow icon={FileText} label="Degree or certificates" href={user?.certificates_url} onAdd={startEditing} />
                  <DocumentRow icon={ShieldCheck} label="Police clearance" href={user?.police_clearance_url} onAdd={startEditing} />
                </div>
                <div className="divide-y divide-slate-100 border-t border-slate-100 pt-4">
                  <LinkRow icon={Linkedin} label="LinkedIn" href={user?.linkedin_url} onAdd={startEditing} />
                  <LinkRow icon={Github} label="GitHub" href={user?.github_url} onAdd={startEditing} />
                  <LinkRow icon={Globe} label="Portfolio" href={user?.portfolio_url} onAdd={startEditing} />
                </div>
              </InfoCard>
            </div>
          </div>

          {/* CV text */}
          <Card>
            <CardHeader
              title="CV text"
              description="This is the text we read from your CV. Fix anything we got wrong to improve your matches."
              action={
                user?.resume_text && !isEditingResume ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Pencil}
                    onClick={() => {
                      setProfileResumeText(user?.resume_text || '');
                      setIsEditingResume(true);
                    }}
                  >
                    Edit
                  </Button>
                ) : undefined
              }
            />
            {isEditingResume ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Field label="CV text" htmlFor="pf-resume-text" hint="Saving will re-score your job matches.">
                  <Textarea
                    id="pf-resume-text"
                    value={profileResumeText}
                    onChange={(e) => setProfileResumeText(e.target.value)}
                    required
                    rows={14}
                    className="font-mono text-xs"
                    placeholder="Paste or edit your CV text here"
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditingResume(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={isSavingProfile}>
                    Save and re-score
                  </Button>
                </div>
              </form>
            ) : user?.resume_text ? (
              <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600 ring-1 ring-inset ring-slate-200/80">
                {user.resume_text}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-inset ring-slate-200/80">
                <Upload className="h-4 w-4 shrink-0 text-slate-400" />
                Upload your CV above and the text we extract will appear here.
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/* --------------------------- Document helpers --------------------------- */

function DocumentRow({ icon: Icon, label, href, onAdd }: { icon: LucideIcon; label: string; href?: string | null; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50/70 p-3 ring-1 ring-inset ring-slate-200/70">
      <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', href ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-400 ring-1 ring-inset ring-slate-200')}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand-navy">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-600 underline-offset-4 hover:text-brand-navy hover:underline">
            View PDF
          </a>
        ) : (
          <button type="button" onClick={onAdd} className="cursor-pointer text-xs text-slate-500 underline-offset-4 hover:text-brand-navy hover:underline">
            Not uploaded. Add it
          </button>
        )}
      </div>
      {href && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Uploaded" />}
    </div>
  );
}

function DocumentUpload({
  id,
  title,
  description,
  url,
  busy,
  onRemove,
  onFile,
}: {
  id: string;
  title: string;
  description: string;
  url: string;
  busy: boolean;
  onRemove: () => void;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-700">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
        {url && (
          <Badge tone="success" dot>
            Uploaded
          </Badge>
        )}
      </div>

      {url && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-navy hover:underline">
            <FileText className="h-3.5 w-3.5" /> View current file
          </a>
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto inline-flex cursor-pointer items-center gap-1 font-medium text-rose-600 hover:text-rose-700"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      )}

      <input
        type="file"
        accept="application/pdf"
        id={id}
        className="peer sr-only"
        disabled={busy}
        onChange={(e) => {
          const input = e.target;
          onFile(input.files?.[0]);
          input.value = '';
        }}
      />
      <label
        htmlFor={id}
        className={cx(
          'mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-brand-navy ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-navy/30',
          busy && 'pointer-events-none opacity-60',
        )}
      >
        {busy ? (
          <>
            <Spinner className="h-4 w-4" /> Uploading
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 text-slate-500" /> {url ? 'Replace PDF' : 'Choose PDF'}
          </>
        )}
      </label>
    </div>
  );
}
