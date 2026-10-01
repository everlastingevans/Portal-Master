'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../_components/overlay';
import { Button, Field, Input } from '../_components/ui';
import { useToast } from '@/components/ToastNotification';

interface SuperadminEmployerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEmp: any;
  onSubmit: (action: string, payload: any) => Promise<any>;
}

const FORM_ID = 'superadmin-employer-form';

export default function SuperadminEmployerModal({
  isOpen,
  onClose,
  editingEmp,
  onSubmit
}: SuperadminEmployerModalProps) {
  const toast = useToast();
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empName, setEmpName] = useState('');

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEmp) {
      setEmpEmail(editingEmp.email || '');
      setEmpPassword('');
      setEmpName(editingEmp.name || '');
    } else {
      setEmpEmail('');
      setEmpPassword('');
      setEmpName('');
    }
    setSubmitError('');
  }, [editingEmp, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empEmail || (!editingEmp && !empPassword)) {
      setSubmitError('Email and password are required.');
      return;
    }

    const payload = {
      id: editingEmp?.id,
      email: empEmail,
      password: empPassword,
      name: empName
    };

    const action = editingEmp ? 'UPDATE_EMPLOYER' : 'CREATE_EMPLOYER';
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await onSubmit(action, payload);
      if (result.success) {
        toast.success(result.data?.message || (editingEmp ? 'Employer updated' : 'Employer added'));
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
      size="sm"
      title={editingEmp ? 'Edit employer' : 'Add employer'}
      description={editingEmp ? editingEmp.name || editingEmp.email : 'Create an employer account with sign-in details.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={isSubmitting}>
            {editingEmp ? 'Save changes' : 'Add employer'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-3.5 py-3 text-xs leading-relaxed text-rose-200">
            <AlertCircle className="mt-px h-4 w-4 shrink-0 text-rose-300" />
            <span>{submitError}</span>
          </div>
        )}

        <Field label="Company name" htmlFor="emp-name">
          <Input
            id="emp-name"
            type="text"
            value={empName}
            onChange={(e) => setEmpName(e.target.value)}
            placeholder="e.g. Standard Bank Group"
          />
        </Field>

        <Field label="Work email" htmlFor="emp-email">
          <Input
            id="emp-email"
            type="email"
            autoComplete="off"
            value={empEmail}
            onChange={(e) => setEmpEmail(e.target.value)}
            placeholder="recruitment@company.com"
          />
        </Field>

        <Field
          label="Password"
          htmlFor="emp-password"
          hint={editingEmp ? 'Leave blank to keep the current password.' : undefined}
        >
          <Input
            id="emp-password"
            type="password"
            autoComplete="new-password"
            value={empPassword}
            onChange={(e) => setEmpPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
      </form>
    </Modal>
  );
}
