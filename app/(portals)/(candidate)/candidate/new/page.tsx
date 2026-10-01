'use client';

import { useState, useRef, useEffect, useCallback, useMemo, DragEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileUp, FileText, Sparkles, Target, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import PortalLoader, { Spinner } from '@/components/PortalLoader';
import { useToast } from '@/components/ToastNotification';
import { Alert, Button, Card, PageHeader, buttonClasses, cx } from '@/components/portal/ui';

const NEXT_STEPS = [
  { icon: FileUp, title: 'Upload your CV', description: 'A PDF of your latest CV.' },
  { icon: Sparkles, title: 'We read it for you', description: 'Our AI picks out your skills, studies and experience.' },
  { icon: Target, title: 'See your matches', description: 'We rank open roles by how well they fit you.' },
];

export default function CandidateNewPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resumeTask, setResumeTask] = useState<any>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<number, boolean>>({});
  const [hasInitializedTask, setHasInitializedTask] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = useMemo(
    () => [
      { text: 'Checking your session...' },
      { text: 'Loading your profile...' },
      { text: 'Looking at open roles...' },
      { text: 'Getting things ready...' },
    ],
    [],
  );

  // Dynamic status text update
  useEffect(() => {
    if (!loading && user) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading, user, loadingSteps.length]);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const role = String(data.user?.role || '').toUpperCase();
        if (!data.user || role !== 'CANDIDATE') {
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchTaskStatus = async () => {
      try {
        const res = await fetch('/api/candidate/resume-status');
        if (res.ok) {
          const { task } = await res.json();
          if (task) {
            const isFinished = task.status === 'COMPLETED' || task.status === 'FAILED';

            // On initial mount, if the task is already finished, mark it as handled so we don't redirect
            if (!hasInitializedTask && isFinished) {
              setCompletedTaskIds((prev) => ({ ...prev, [task.id]: true }));
              setHasInitializedTask(true);
              setResumeTask(null);
              return;
            }

            setHasInitializedTask(true);

            if (isFinished && completedTaskIds[task.id]) {
              setResumeTask(null);
              return;
            }

            if (task.status === 'COMPLETED') {
              setResumeTask(task);
              setCompletedTaskIds((prev) => ({ ...prev, [task.id]: true }));
              setTimeout(() => {
                setResumeTask(null);
                router.push('/candidate/dashboard'); // take them back to dashboard to see results
              }, 3000);
            } else if (task.status === 'FAILED') {
              setResumeTask(task);
              setCompletedTaskIds((prev) => ({ ...prev, [task.id]: true }));
            } else {
              setResumeTask(task);
            }
          } else {
            setHasInitializedTask(true);
            setResumeTask(null);
          }
        }
      } catch (err) {}
    };

    if (resumeTask && (resumeTask.status === 'PROCESSING' || resumeTask.status === 'QUEUED')) {
      interval = setInterval(fetchTaskStatus, 2000);
    } else if (!resumeTask && !hasInitializedTask && user) {
      fetchTaskStatus();
    }

    return () => clearInterval(interval);
  }, [resumeTask, completedTaskIds, hasInitializedTask, user, router]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/candidate/resume', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setResumeTask({ status: 'PROCESSING', progress: 0, id: data.taskId });
        toastSuccess('CV uploaded. We’re reading it now.');
      } else {
        const errorData = await res.json();
        toastError('We couldn’t upload your CV: ' + errorData.error);
      }
    } catch (err: any) {
      toastError('We couldn’t upload your CV: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toastError('Please upload your CV as a PDF.');
      return;
    }
    handleResumeUpload({ preventDefault: () => {}, target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  if (loading || !user) {
    return <PortalLoader portal="CANDIDATE" title="Loading LaunchPath" subtitle={loadingSteps[loadingStep].text} />;
  }

  const status = resumeTask?.status;
  const isComplete = status === 'COMPLETED';
  const isFailed = status === 'FAILED';
  const isProcessing = !!resumeTask && !isComplete && !isFailed;
  const progress = isComplete ? 100 : Math.round(resumeTask?.progress || 0);
  const activeStep = isComplete ? 3 : isProcessing ? 1 : 0;

  return (
    <PortalShell portal="candidate" user={user} onLogout={handleLogout} title="Upload your CV">
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Upload your CV"
          description="Add your latest CV and we'll match you with roles that fit your skills and studies. It only takes a minute."
        />

        <Card className="sm:p-8">
          {isComplete ? (
            /* ---------------------------- Success ---------------------------- */
            <div className="flex flex-col items-center py-6 text-center animate-scale-in" role="status" aria-live="polite">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-brand-lime">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-brand-navy">Your CV is ready</h2>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                We&apos;ve read your CV and lined up roles that suit you. Taking you to your matches now.
              </p>
              <Link href="/candidate/dashboard?tab=Jobs" className={cx(buttonClasses({ variant: 'accent', size: 'lg' }), 'mt-6')}>
                See your matches <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : isProcessing ? (
            /* --------------------------- Processing -------------------------- */
            <div className="py-4" role="status" aria-live="polite">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-brand-navy ring-1 ring-inset ring-slate-200">
                  <Spinner className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-brand-navy">
                    {progress >= 100 ? 'Finishing up your matches' : 'Reading your CV'}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">This usually takes under a minute. Feel free to stay on this page.</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{progress < 40 ? 'Extracting your details' : progress < 80 ? 'Understanding your skills' : 'Ranking open roles'}</span>
                  <span className="font-medium tabular-nums text-brand-navy">{progress}%</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label="CV processing progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div className="h-full rounded-full bg-brand-navy transition-all duration-500 ease-out" style={{ width: `${Math.max(4, progress)}%` }} />
                </div>
              </div>
            </div>
          ) : (
            /* ------------------------------ Idle ----------------------------- */
            <div className="space-y-4">
              {isFailed && (
                <Alert tone="danger">
                  We couldn&apos;t read that CV. Please try again with a text-based PDF (not a scanned image).
                </Alert>
              )}
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
                onDrop={handleDrop}
                className={cx(
                  'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30',
                  dragActive ? 'border-brand-navy bg-brand-navy/[0.03]' : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-navy shadow-sm ring-1 ring-inset ring-slate-200">
                  {uploading ? <Spinner className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                </span>
                <p className="mt-4 text-[15px] font-semibold text-brand-navy">
                  {uploading ? 'Uploading your CV' : dragActive ? 'Drop it here' : 'Drag and drop your CV here'}
                </p>
                <p className="mt-1 text-sm text-slate-500">or choose a file from your device</p>
                <Button
                  type="button"
                  variant="accent"
                  icon={FileUp}
                  loading={uploading}
                  className="mt-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {uploading ? 'Uploading' : 'Choose a PDF'}
                </Button>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleResumeUpload}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" /> PDF format only. Your CV is stored securely.
              </p>
            </div>
          )}
        </Card>

        {/* What happens next */}
        <Card>
          <h2 className="text-sm font-semibold text-brand-navy">What happens next</h2>
          <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {NEXT_STEPS.map((step, idx) => {
              const done = idx < activeStep;
              const current = idx === activeStep;
              return (
                <li key={step.title} className="flex gap-3 sm:flex-col sm:gap-2">
                  <span
                    className={cx(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                      done ? 'bg-brand-lime text-brand-navy' : current ? 'bg-brand-navy text-brand-lime' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-brand-navy">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </PortalShell>
  );
}
