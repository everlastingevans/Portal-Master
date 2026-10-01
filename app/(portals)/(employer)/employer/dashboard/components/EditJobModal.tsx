'use client';

import React from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { Modal } from '@/components/portal/overlay';
import { Button, Field, Input, Select } from '@/components/portal/ui';

interface EditJobModalProps {
  editingJob: any;
  setEditingJob: (job: any) => void;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editCompany: string;
  setEditCompany: (val: string) => void;
  editLocation: string;
  setEditLocation: (val: string) => void;
  editSalaryMin: string;
  setEditSalaryMin: (val: string) => void;
  editSalaryMax: string;
  setEditSalaryMax: (val: string) => void;
  editYearsExperience: string;
  setEditYearsExperience: (val: string) => void;
  editStatus: string;
  setEditStatus: (val: string) => void;
  editMandatorySkills: string;
  setEditMandatorySkills: (val: string) => void;
  editTechStack: string;
  setEditTechStack: (val: string) => void;
  updatingJob: boolean;
  handleUpdateJobSubmit: (e: React.FormEvent) => void;
}

const FORM_ID = 'edit-job-form';

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <div>
        <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export default function EditJobModal({
  editingJob,
  setEditingJob,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editCompany,
  setEditCompany,
  editLocation,
  setEditLocation,
  editSalaryMin,
  setEditSalaryMin,
  editSalaryMax,
  setEditSalaryMax,
  editYearsExperience,
  setEditYearsExperience,
  editStatus,
  setEditStatus,
  editMandatorySkills,
  setEditMandatorySkills,
  editTechStack,
  setEditTechStack,
  updatingJob,
  handleUpdateJobSubmit,
}: EditJobModalProps) {
  const close = () => setEditingJob(null);

  return (
    <Modal
      open={Boolean(editingJob)}
      onClose={close}
      size="xl"
      title="Edit job"
      description={editingJob ? `Changes to ${editingJob.title} are visible to candidates straight away.` : undefined}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={updatingJob}>
            Save changes
          </Button>
        </>
      }
    >
      {editingJob && (
        <form id={FORM_ID} onSubmit={handleUpdateJobSubmit} className="space-y-6">
          <Group title="Role">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <Field label="Job title" htmlFor="ej-title">
                  <Input id="ej-title" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                </Field>
              </div>
              <Field label="Status" htmlFor="ej-status">
                <Select id="ej-status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  {/* Keep a pending (unpaid) role selectable so saving doesn't silently change it. */}
                  {editStatus === 'PENDING' && <option value="PENDING">Awaiting payment</option>}
                  <option value="ACTIVE">Live</option>
                  <option value="CLOSED">Closed or filled</option>
                </Select>
              </Field>
            </div>
            <Field label="Description">
              <RichTextEditor content={editDescription} onChange={setEditDescription} />
            </Field>
          </Group>

          <Group title="Company and location">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Company name" htmlFor="ej-company">
                <Input id="ej-company" type="text" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} required />
              </Field>
              <Field label="Location" htmlFor="ej-location" hint="City, or Remote / Hybrid">
                <Input id="ej-location" type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required />
              </Field>
            </div>
          </Group>

          <Group title="Salary" description="In rand. Leave both blank to show it as negotiable.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Minimum" htmlFor="ej-min" optional>
                <Input
                  id="ej-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={editSalaryMin}
                  onChange={(e) => setEditSalaryMin(e.target.value)}
                  placeholder="450000"
                />
              </Field>
              <Field label="Maximum" htmlFor="ej-max" optional>
                <Input
                  id="ej-max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={editSalaryMax}
                  onChange={(e) => setEditSalaryMax(e.target.value)}
                  placeholder="750000"
                />
              </Field>
            </div>
          </Group>

          <Group title="Requirements" description="Used to match and score candidates.">
            <Field label="Experience required" htmlFor="ej-exp" optional>
              <Input
                id="ej-exp"
                type="text"
                value={editYearsExperience}
                onChange={(e) => setEditYearsExperience(e.target.value)}
                placeholder="e.g. 3–5 years"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Must-have skills" htmlFor="ej-skills" hint="Separate with commas">
                <Input
                  id="ej-skills"
                  type="text"
                  value={editMandatorySkills}
                  onChange={(e) => setEditMandatorySkills(e.target.value)}
                  placeholder="React, Node.js, SQL"
                />
              </Field>
              <Field label="Tools and tech stack" htmlFor="ej-stack" hint="Separate with commas" optional>
                <Input
                  id="ej-stack"
                  type="text"
                  value={editTechStack}
                  onChange={(e) => setEditTechStack(e.target.value)}
                  placeholder="GitHub, AWS, Prisma"
                />
              </Field>
            </div>
          </Group>
        </form>
      )}
    </Modal>
  );
}
