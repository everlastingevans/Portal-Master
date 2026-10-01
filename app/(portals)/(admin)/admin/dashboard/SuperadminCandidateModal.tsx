'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../_components/overlay';
import { Button, Field, Input, Select, Textarea } from '../_components/ui';
import { useToast } from '@/components/ToastNotification';

interface SuperadminCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCand: any;
  onSubmit: (action: string, payload: any) => Promise<any>;
}

const FORM_ID = 'superadmin-candidate-form';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-white">{children}</h3>;
}

export default function SuperadminCandidateModal({
  isOpen,
  onClose,
  editingCand,
  onSubmit
}: SuperadminCandidateModalProps) {
  const toast = useToast();
  const [candEmail, setCandEmail] = useState('');
  const [candPassword, setCandPassword] = useState('');
  const [candName, setCandName] = useState('');
  const [candProfessionalTitle, setCandProfessionalTitle] = useState('');
  const [candExperienceLevel, setCandExperienceLevel] = useState('INTERMEDIATE');
  const [candResumeText, setCandResumeText] = useState('');
  const [candLinkedinUrl, setCandLinkedinUrl] = useState('');
  const [candGithubUrl, setCandGithubUrl] = useState('');
  const [candPhone, setCandPhone] = useState('');

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCand) {
      setCandEmail(editingCand.email || '');
      setCandPassword(''); // Leave blank to skip password change
      setCandName(editingCand.name || '');
      setCandProfessionalTitle(editingCand.professional_title || '');
      setCandExperienceLevel(editingCand.experience_level || 'INTERMEDIATE');
      setCandResumeText(editingCand.resume_text || '');
      setCandLinkedinUrl(editingCand.linkedin_url || '');
      setCandGithubUrl(editingCand.github_url || '');
      setCandPhone(editingCand.phone || '');
    } else {
      setCandEmail('');
      setCandPassword('');
      setCandName('');
      setCandProfessionalTitle('');
      setCandExperienceLevel('INTERMEDIATE');
      setCandResumeText('');
      setCandLinkedinUrl('');
      setCandGithubUrl('');
      setCandPhone('');
    }
    setSubmitError('');
  }, [editingCand, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candEmail || (!editingCand && !candPassword)) {
      setSubmitError('Email and password are required.');
      return;
    }

    const payload = {
      id: editingCand?.id,
      email: candEmail,
      password: candPassword,
      name: candName,
      professional_title: candProfessionalTitle,
      experience_level: candExperienceLevel,
      resume_text: candResumeText,
      linkedin_url: candLinkedinUrl,
      github_url: candGithubUrl,
      phone: candPhone
    };

    const action = editingCand ? 'UPDATE_CANDIDATE' : 'CREATE_CANDIDATE';
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await onSubmit(action, payload);
      if (result.success) {
        toast.success(result.data?.message || (editingCand ? 'Candidate updated' : 'Candidate added'));
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
      size="lg"
      title={editingCand ? 'Edit candidate' : 'Add candidate'}
      description={editingCand ? editingCand.name || editingCand.email : 'Create a candidate account and profile.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={isSubmitting}>
            {editingCand ? 'Save changes' : 'Add candidate'}
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
          <SectionLabel>Account</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Email" htmlFor="cand-email">
              <Input
                id="cand-email"
                type="email"
                autoComplete="off"
                value={candEmail}
                onChange={(e) => setCandEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <Field
              label="Password"
              htmlFor="cand-password"
              hint={editingCand ? 'Leave blank to keep the current password.' : undefined}
            >
              <Input
                id="cand-password"
                type="password"
                autoComplete="new-password"
                value={candPassword}
                onChange={(e) => setCandPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 border-t border-white/[0.06] pt-6">
          <SectionLabel>Profile</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name" htmlFor="cand-name">
              <Input
                id="cand-name"
                type="text"
                value={candName}
                onChange={(e) => setCandName(e.target.value)}
                placeholder="e.g. Jane Foster"
              />
            </Field>
            <Field label="Job title" htmlFor="cand-title">
              <Input
                id="cand-title"
                type="text"
                value={candProfessionalTitle}
                onChange={(e) => setCandProfessionalTitle(e.target.value)}
                placeholder="e.g. Senior React Developer"
              />
            </Field>
            <Field label="Experience level" htmlFor="cand-experience">
              <Select
                id="cand-experience"
                value={candExperienceLevel}
                onChange={(e) => setCandExperienceLevel(e.target.value)}
              >
                <option value="ENTRY">Entry (0-2 years)</option>
                <option value="INTERMEDIATE">Intermediate (2-5 years)</option>
                <option value="SENIOR">Senior (5-8 years)</option>
                <option value="LEAD">Lead / principal (8+ years)</option>
              </Select>
            </Field>
            <Field label="Phone" htmlFor="cand-phone">
              <Input
                id="cand-phone"
                type="tel"
                value={candPhone}
                onChange={(e) => setCandPhone(e.target.value)}
                placeholder="e.g. +27 82 123 4567"
              />
            </Field>
            <Field label="LinkedIn URL" htmlFor="cand-linkedin">
              <Input
                id="cand-linkedin"
                type="text"
                value={candLinkedinUrl}
                onChange={(e) => setCandLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </Field>
            <Field label="GitHub URL" htmlFor="cand-github">
              <Input
                id="cand-github"
                type="text"
                value={candGithubUrl}
                onChange={(e) => setCandGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 border-t border-white/[0.06] pt-6">
          <Field label="Resume text" htmlFor="cand-resume" hint="Used for job matching.">
            <Textarea
              id="cand-resume"
              rows={5}
              value={candResumeText}
              onChange={(e) => setCandResumeText(e.target.value)}
              placeholder="Paste the candidate's resume text"
            />
          </Field>
        </section>
      </form>
    </Modal>
  );
}
