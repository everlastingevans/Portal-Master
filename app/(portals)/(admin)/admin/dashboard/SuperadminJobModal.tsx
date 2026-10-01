'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { Modal } from '../_components/overlay';
import { Button, Field, Input, Select } from '../_components/ui';
import { useToast } from '@/components/ToastNotification';

interface SuperadminJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingJob: any;
  employers: any[];
  onSubmit: (action: string, payload: any) => Promise<any>;
}

const FORM_ID = 'superadmin-job-form';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-white">{children}</h3>;
}

export default function SuperadminJobModal({
  isOpen,
  onClose,
  editingJob,
  employers,
  onSubmit
}: SuperadminJobModalProps) {
  const toast = useToast();
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSalaryMin, setJobSalaryMin] = useState('');
  const [jobSalaryMax, setJobSalaryMax] = useState('');
  const [jobEmployerId, setJobEmployerId] = useState('');
  const [jobYearsExperience, setJobYearsExperience] = useState('');
  const [jobMandatorySkills, setJobMandatorySkills] = useState('');
  const [jobTechStack, setJobTechStack] = useState('');
  const [jobStatus, setJobStatus] = useState('ACTIVE');

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingJob) {
      setJobTitle(editingJob.title || '');
      setJobCompany(editingJob.company || '');
      setJobLocation(editingJob.location || '');
      setJobDescription(editingJob.description || '');
      setJobSalaryMin(editingJob.salary_min ? String(editingJob.salary_min) : '');
      setJobSalaryMax(editingJob.salary_max ? String(editingJob.salary_max) : '');
      setJobEmployerId(editingJob.employer_id ? String(editingJob.employer_id) : '');
      setJobYearsExperience(editingJob.years_experience || '');
      setJobMandatorySkills(Array.isArray(editingJob.mandatory_skills) ? editingJob.mandatory_skills.join(', ') : '');
      setJobTechStack(Array.isArray(editingJob.tech_stack) ? editingJob.tech_stack.join(', ') : '');
      setJobStatus(editingJob.status || 'ACTIVE');
    } else {
      setJobTitle('');
      setJobCompany('');
      setJobLocation('');
      setJobDescription('');
      setJobSalaryMin('');
      setJobSalaryMax('');
      setJobEmployerId(employers[0]?.id ? String(employers[0].id) : '');
      setJobYearsExperience('');
      setJobMandatorySkills('');
      setJobTechStack('');
      setJobStatus('ACTIVE');
    }
    setSubmitError('');
  }, [editingJob, isOpen, employers]);

  // Auto pre-fill company name if employer is selected
  useEffect(() => {
    if (jobEmployerId) {
      const matchedEmployer = employers.find((e: any) => String(e.id) === String(jobEmployerId));
      if (matchedEmployer) {
        setJobCompany(matchedEmployer.name || '');
      }
    }
  }, [jobEmployerId, employers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobLocation || !jobDescription) {
      setSubmitError('Title, location and description are required.');
      return;
    }

    const payload = {
      id: editingJob?.id,
      title: jobTitle,
      company: jobCompany || 'Strategic Client Partner',
      location: jobLocation,
      description: jobDescription,
      salary_min: jobSalaryMin ? parseInt(jobSalaryMin) : null,
      salary_max: jobSalaryMax ? parseInt(jobSalaryMax) : null,
      employer_id: jobEmployerId ? parseInt(jobEmployerId) : null,
      years_experience: jobYearsExperience,
      mandatory_skills: jobMandatorySkills,
      tech_stack: jobTechStack,
      status: jobStatus
    };

    const action = editingJob ? 'UPDATE_JOB' : 'CREATE_JOB';
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await onSubmit(action, payload);
      if (result.success) {
        toast.success(result.data?.message || (editingJob ? 'Job updated' : 'Job created'));
        onClose();
      } else {
        setSubmitError(result.error || 'Please check the fields and try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="xl"
      title={editingJob ? 'Edit job' : 'New job'}
      description={editingJob ? `${editingJob.title || 'Untitled'} · #${editingJob.id}` : 'Create a job posting for an employer.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={isSubmitting}>
            {editingJob ? 'Save changes' : 'Create job'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-3.5 py-3 text-xs leading-relaxed text-rose-200">
            <AlertCircle className="mt-px h-4 w-4 shrink-0 text-rose-300" />
            <span>{submitError}</span>
          </div>
        )}

        <section className="space-y-4">
          <SectionLabel>Basics</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Job title" htmlFor="job-title">
              <Input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </Field>
            <Field label="Employer" htmlFor="job-employer">
              <Select id="job-employer" value={jobEmployerId} onChange={(e) => setJobEmployerId(e.target.value)}>
                <option value="">No employer</option>
                {employers.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.email})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Company name" htmlFor="job-company" hint="Filled in from the selected employer.">
              <Input
                id="job-company"
                type="text"
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
                placeholder="Company shown on the posting"
              />
            </Field>
            <Field label="Location" htmlFor="job-location">
              <Input
                id="job-location"
                type="text"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                placeholder="e.g. Johannesburg / Hybrid"
              />
            </Field>
            <Field label="Status" htmlFor="job-status">
              <Select id="job-status" value={jobStatus} onChange={(e) => setJobStatus(e.target.value)}>
                <option value="ACTIVE">Active (open to applications)</option>
                <option value="PENDING">Pending (draft)</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </Field>
          </div>
        </section>

        <section className="space-y-4 border-t border-white/[0.06] pt-6">
          <SectionLabel>Compensation and requirements</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Minimum salary (ZAR)" htmlFor="job-salary-min">
              <Input
                id="job-salary-min"
                type="number"
                value={jobSalaryMin}
                onChange={(e) => setJobSalaryMin(e.target.value)}
                placeholder="e.g. 60000"
              />
            </Field>
            <Field label="Maximum salary (ZAR)" htmlFor="job-salary-max">
              <Input
                id="job-salary-max"
                type="number"
                value={jobSalaryMax}
                onChange={(e) => setJobSalaryMax(e.target.value)}
                placeholder="e.g. 110000"
              />
            </Field>
            <Field label="Experience" htmlFor="job-experience">
              <Input
                id="job-experience"
                type="text"
                value={jobYearsExperience}
                onChange={(e) => setJobYearsExperience(e.target.value)}
                placeholder="e.g. 5+ years"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Required skills" htmlFor="job-skills" hint="Separate with commas.">
              <Input
                id="job-skills"
                type="text"
                value={jobMandatorySkills}
                onChange={(e) => setJobMandatorySkills(e.target.value)}
                placeholder="React, Node.js, SQL"
              />
            </Field>
            <Field label="Other tech stack" htmlFor="job-stack" hint="Separate with commas.">
              <Input
                id="job-stack"
                type="text"
                value={jobTechStack}
                onChange={(e) => setJobTechStack(e.target.value)}
                placeholder="Tailwind, Docker, AWS"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-1.5 border-t border-white/[0.06] pt-6">
          <p className="text-xs font-medium text-slate-300">Description</p>
          <RichTextEditor
            content={jobDescription}
            onChange={(val) => setJobDescription(val)}
            showAIAssistant={true}
            variant="dark"
          />
        </section>
      </form>
    </Modal>
  );
}
