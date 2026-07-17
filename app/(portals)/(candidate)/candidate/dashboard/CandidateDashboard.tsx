'use client';

import { useState, useEffect } from 'react';
import CandidateNavbar from '@/components/CandidateNavbar';
import { useToast } from '@/components/ToastNotification';

// Import modular subcomponents
import JobFeedTab from './components/JobFeedTab';
import ApplicationsTab from './components/ApplicationsTab';
import ProfileTab from './components/ProfileTab';
import InboxTab from './components/InboxTab';
import SettingsTab from './components/SettingsTab';

export interface CandidateDashboardProps {
  data: any;
  user: any;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function CandidateDashboard({
  data,
  user,
  onRefresh,
  onLogout,
}: CandidateDashboardProps) {
  const {
    matches = [],
    savedJobs: initialSaved = [],
    applications = [],
    allJobs = [],
  } = data || {};

  const [activeTab, setActiveTab] = useState('Jobs');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { success, error, warning, info } = useToast();

  // Saved Jobs Bookmarks State mapping
  const [savedJobsMap, setSavedJobsMap] = useState<Record<number, boolean>>(() => {
    const acc: Record<number, boolean> = {};
    initialSaved.forEach((id: number) => {
      acc[id] = true;
    });
    return acc;
  });

  // Profile Settings States
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resumeTask, setResumeTask] = useState<any>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<number, boolean>>({});
  const [hasInitializedTask, setHasInitializedTask] = useState(false);

  // Profile editable details states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileTitle, setProfileTitle] = useState(user?.professional_title || '');
  const [profileExp, setProfileExp] = useState(user?.experience_level || '');
  const [profileResumeText, setProfileResumeText] = useState(user?.resume_text || '');
  const [profileLinkedin, setProfileLinkedin] = useState(user?.linkedin_url || '');
  const [profileGithub, setProfileGithub] = useState(user?.github_url || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileQualifications, setProfileQualifications] = useState(user?.qualifications || '');
  const [profileSkills, setProfileSkills] = useState(user?.skills || '');
  const [profileInterests, setProfileInterests] = useState(user?.interests || '');
  const [profileCareerDirection, setProfileCareerDirection] = useState(user?.career_direction || '');
  const [profileWorkExperience, setProfileWorkExperience] = useState(user?.work_experience || '');
  const [profilePortfolioUrl, setProfilePortfolioUrl] = useState(user?.portfolio_url || '');
  const [profileCvUrl, setProfileCvUrl] = useState(user?.cv_url || '');
  const [profileStudyInstitution, setProfileStudyInstitution] = useState(user?.study_institution || '');
  const [profileStudySpecialisation, setProfileStudySpecialisation] = useState(user?.study_specialisation || '');
  const [profileSeekingRoles, setProfileSeekingRoles] = useState(user?.seeking_roles || '');
  const [profileCertificatesUrl, setProfileCertificatesUrl] = useState(user?.certificates_url || '');
  const [profilePoliceClearanceUrl, setProfilePoliceClearanceUrl] = useState(user?.police_clearance_url || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);

  // Synced state on user prop update
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileTitle(user.professional_title || '');
      setProfileExp(user.experience_level || '');
      setProfileResumeText(user.resume_text || '');
      setProfileLinkedin(user.linkedin_url || '');
      setProfileGithub(user.github_url || '');
      setProfilePhone(user.phone || '');
      setEmail(user.email || '');
      setProfileQualifications(user.qualifications || '');
      setProfileSkills(user.skills || '');
      setProfileInterests(user.interests || '');
      setProfileCareerDirection(user.career_direction || '');
      setProfileWorkExperience(user.work_experience || '');
      setProfilePortfolioUrl(user.portfolio_url || '');
      setProfileCvUrl(user.cv_url || '');
      setProfileStudyInstitution(user.study_institution || '');
      setProfileStudySpecialisation(user.study_specialisation || '');
      setProfileSeekingRoles(user.seeking_roles || '');
      setProfileCertificatesUrl(user.certificates_url || '');
      setProfilePoliceClearanceUrl(user.police_clearance_url || '');
    }
  }, [user]);

  // Fetch In-App Notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/candidate/notifications');
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  // Mark single notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch('/api/candidate/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/candidate/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        success('All notifications marked as read.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  // Initialize tabs from search query params
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (
        tabParam &&
        ['Jobs', 'AllJobs', 'Saved', 'Applications', 'Profile', 'Inbox', 'Settings'].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Update search query params on tab change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.pushState(null, '', url.pathname + url.search);
    }
  }, [activeTab, mounted]);

  // LinkedIn OAuth event message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        success('LinkedIn Profile Synced Successfully! Syncing matching pipeline...');
        onRefresh();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRefresh, success]);

  const [syncingLinkedIn, setSyncingLinkedIn] = useState(false);

  // Trigger LinkedIn OAuth popup flow
  const handleLinkedInConnect = async () => {
    try {
      setSyncingLinkedIn(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`/api/auth/linkedin/url?origin=${encodeURIComponent(origin)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch auth url');
      }
      const { url } = await response.json();

      const authWindow = window.open(url, 'linkedin_oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        warning('Please allow popups for this site to connect your LinkedIn account.');
      }
    } catch (err: any) {
      console.error(err);
      error('Error fetching LinkedIn Auth URL: ' + err.message);
    } finally {
      setSyncingLinkedIn(false);
    }
  };

  // Poll background CV status task queue
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchTaskStatus = async () => {
      try {
        const res = await fetch('/api/candidate/resume-status');
        if (res.ok) {
          const { task } = await res.json();
          if (task) {
            const isFinished = task.status === 'COMPLETED' || task.status === 'FAILED';

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
              success('Resume analyzed and match scores updated!');
              setTimeout(() => {
                setResumeTask(null);
                onRefresh();
              }, 3000);
            } else if (task.status === 'FAILED') {
              setResumeTask(task);
              setCompletedTaskIds((prev) => ({ ...prev, [task.id]: true }));
              error('Failed to parse resume document.');
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
    } else if (!resumeTask && !hasInitializedTask) {
      fetchTaskStatus();
    }

    return () => clearInterval(interval);
  }, [resumeTask, completedTaskIds, hasInitializedTask, onRefresh, success, error]);

  // Handle physical CV PDF file uploading
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
        const d = await res.json();
        setResumeTask({ status: 'PROCESSING', progress: 0, id: d.taskId });
        success('Resume uploaded. Analyzing file structure...');
      } else {
        const errorData = await res.json();
        error('Error uploading resume: ' + errorData.error);
      }
    } catch (err: any) {
      error('Error uploading resume: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Submit job application
  const handleApply = async (jobId: number) => {
    try {
      const res = await fetch('/api/candidate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        success('Application submitted successfully!');
        onRefresh();
      } else {
        error('Failed to apply. You may have already applied.');
      }
    } catch (err) {
      error('Error submitting application.');
    }
  };

  // Toggle saving bookmark
  const handleSaveJob = async (e: React.MouseEvent, jobId: number) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/candidate/save-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        const d = await res.json();
        setSavedJobsMap((prev) => ({ ...prev, [jobId]: d.saved }));
        if (d.saved) {
          success('Job bookmarked!');
        } else {
          info('Bookmark removed.');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save account details settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      warning('New passwords do not match!');
      return;
    }

    try {
      const res = await fetch('/api/candidate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      if (res.ok) {
        success('Account settings saved! Reloading profile credentials...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const d = await res.json();
        error('Failed to update settings: ' + d.error);
      }
    } catch (e) {
      error('Error updating settings.');
    }
  };

  // Save candidate profile description
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          professional_title: profileTitle,
          experience_level: profileExp,
          resume_text: profileResumeText,
          linkedin_url: profileLinkedin,
          github_url: profileGithub,
          phone: profilePhone,
          qualifications: profileQualifications,
          skills: profileSkills,
          interests: profileInterests,
          career_direction: profileCareerDirection,
          work_experience: profileWorkExperience,
          portfolio_url: profilePortfolioUrl,
          cv_url: profileCvUrl,
          study_institution: profileStudyInstitution,
          study_specialisation: profileStudySpecialisation,
          seeking_roles: profileSeekingRoles,
          certificates_url: profileCertificatesUrl,
          police_clearance_url: profilePoliceClearanceUrl,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        success('Profile saved successfully!');
        setIsEditingProfile(false);
        setIsEditingResume(false);
        if (result.taskId) {
          setResumeTask({ status: 'PROCESSING', progress: 0, id: result.taskId });
        }
        onRefresh();
      } else {
        const err = await res.json();
        error('Failed to save profile: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      error('Error updating profile details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Update interview propose slots
  const handleUpdateInterview = async (interviewId: number, status: string) => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        success(`Interview status updated to '${status}'.`);
        onRefresh();
      } else {
        error('Failed to update interview.');
      }
    } catch (e) {
      error('Error updating interview.');
    }
  };

  return (
    <div className="w-full h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <CandidateNavbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        applicationsCount={applications?.length || 0}
        unreadNotificationsCount={unreadNotificationsCount}
        onLogout={onLogout}
        onTabChange={() => setSelectedJob(null)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {/* TAB 1: JOB BROWSER & SAVED JOBS */}
          {(activeTab === 'Jobs' || activeTab === 'Saved' || activeTab === 'AllJobs') && (
            <JobFeedTab
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              matches={matches}
              allJobs={allJobs}
              savedJobsMap={savedJobsMap}
              selectedJob={selectedJob}
              setSelectedJob={setSelectedJob}
              handleSaveJob={handleSaveJob}
              handleApply={handleApply}
              applications={applications}
              user={user}
            />
          )}

          {/* TAB 2: APPLICATIONS STATUS */}
          {activeTab === 'Applications' && (
            <ApplicationsTab
              applications={applications}
              handleUpdateInterview={handleUpdateInterview}
            />
          )}

          {/* TAB 3: PROFILE MANAGEMENT */}
          {activeTab === 'Profile' && (
            <ProfileTab
              user={user}
              isEditingProfile={isEditingProfile}
              setIsEditingProfile={setIsEditingProfile}
              isSavingProfile={isSavingProfile}
              isEditingResume={isEditingResume}
              setIsEditingResume={setIsEditingResume}
              profileName={profileName}
              setProfileName={setProfileName}
              profileTitle={profileTitle}
              setProfileTitle={setProfileTitle}
              profileExp={profileExp}
              setProfileExp={setProfileExp}
              profilePhone={profilePhone}
              setProfilePhone={setProfilePhone}
              profileLinkedin={profileLinkedin}
              setProfileLinkedin={setProfileLinkedin}
              profileGithub={profileGithub}
              setProfileGithub={setProfileGithub}
              profilePortfolioUrl={profilePortfolioUrl}
              setProfilePortfolioUrl={setProfilePortfolioUrl}
              profileCvUrl={profileCvUrl}
              setProfileCvUrl={setProfileCvUrl}
              profileStudyInstitution={profileStudyInstitution}
              setProfileStudyInstitution={setProfileStudyInstitution}
              profileStudySpecialisation={profileStudySpecialisation}
              setProfileStudySpecialisation={setProfileStudySpecialisation}
              profileSeekingRoles={profileSeekingRoles}
              setProfileSeekingRoles={setProfileSeekingRoles}
              profileCertificatesUrl={profileCertificatesUrl}
              setProfileCertificatesUrl={setProfileCertificatesUrl}
              profilePoliceClearanceUrl={profilePoliceClearanceUrl}
              setProfilePoliceClearanceUrl={setProfilePoliceClearanceUrl}
              profileQualifications={profileQualifications}
              setProfileQualifications={setProfileQualifications}
              profileSkills={profileSkills}
              setProfileSkills={setProfileSkills}
              profileInterests={profileInterests}
              setProfileInterests={setProfileInterests}
              profileCareerDirection={profileCareerDirection}
              setProfileCareerDirection={setProfileCareerDirection}
              profileWorkExperience={profileWorkExperience}
              setProfileWorkExperience={setProfileWorkExperience}
              profileResumeText={profileResumeText}
              setProfileResumeText={setProfileResumeText}
              handleSaveProfile={handleSaveProfile}
              handleLinkedInConnect={handleLinkedInConnect}
              syncingLinkedIn={syncingLinkedIn}
              resumeTask={resumeTask}
              uploading={uploading}
              handleResumeUpload={handleResumeUpload}
            />
          )}

          {/* TAB 4: MAILBOX & NOTIFICATIONS */}
          {activeTab === 'Inbox' && (
            <InboxTab
              notifications={notifications}
              markAllAsRead={markAllAsRead}
              markAsRead={markAsRead}
            />
          )}

          {/* TAB 5: SECURITY SETTINGS */}
          {activeTab === 'Settings' && (
            <SettingsTab
              email={email}
              setEmail={setEmail}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              handleUpdateSettings={handleUpdateSettings}
            />
          )}
        </div>
      </main>
    </div>
  );
}
