'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortalShell from '@/components/portal/PortalShell';
import { useToast } from '@/components/ToastNotification';

// Modularized Components
import OverviewTab from './components/OverviewTab';
import ApplicantsTab from './components/ApplicantsTab';
import ProfileTab from './components/ProfileTab';
import SettingsTab from './components/SettingsTab';
import EditJobModal from './components/EditJobModal';

export default function EmployerDashboard({
  data,
  user,
  onRefresh,
  onLogout,
}: {
  data: any;
  user: any;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { jobs = [], applications = [] } = data || {};

  const isJobUnlocked = (jobId: number | string | null) => {
    if (!jobId) return false;
    const foundJob = jobs.find((j: any) => String(j.id) === String(jobId));
    return foundJob ? foundJob.status === 'ACTIVE' : false;
  };

  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string | null>(null);

  // Sorting and filtering state variables
  const [filterScore, setFilterScore] = useState<number | 'All'>('All');
  const [filterExperience, setFilterExperience] = useState<string>('All');
  const [filterSkill, setFilterSkill] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('applied_at_desc');

  // URL search parameter synchronization for active tab deep linking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Company Profile states
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompanyName, setProfileCompanyName] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileLogo, setProfileLogo] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await fetch('/api/employer/profile');
      if (res.ok) {
        const p = await res.json();
        setProfileName(p.name || '');
        setProfileTitle(p.professional_title || '');
        setProfilePhone(p.phone || '');
        if (p.company) {
          setProfileCompanyName(p.company.name || '');
          setProfileWebsite(p.company.features?.website || '');
          setProfileDescription(p.company.features?.description || '');
          setProfileLocation(p.company.features?.location || '');
          setProfileLogo(p.company.features?.logo || '');
        }
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch('/api/employer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          professional_title: profileTitle,
          phone: profilePhone,
          companyName: profileCompanyName,
          website: profileWebsite,
          description: profileDescription,
          location: profileLocation,
          logo: profileLogo,
        }),
      });
      if (res.ok) {
        toast.success('Company profile saved.');
        onRefresh();
      } else {
        toast.error("We couldn't save your profile. Please try again.");
      }
    } catch (err: any) {
      toast.error("We couldn't save your profile: " + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateApplicationStatus = async (
    applicationId: number,
    status: 'Accepted' | 'Rejected'
  ) => {
    try {
      const res = await fetch('/api/employer/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status }),
      });
      if (res.ok) {
        toast.success(status === 'Accepted' ? 'Applicant accepted.' : 'Applicant rejected.');
        if (selectedApplicant && selectedApplicant.id === applicationId) {
          setSelectedApplicant((prev: any) => ({ ...prev, status }));
        }
        onRefresh();
      } else {
        const d = await res.json();
        toast.error(d.error || `We couldn't mark this applicant as ${status.toLowerCase()}.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("We couldn't update this application. Please try again.");
    }
  };

  useEffect(() => {
    if (activeTab === 'Profile') {
      fetchProfile();
    }
  }, [activeTab]);

  // Job Editing states
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editYearsExperience, setEditYearsExperience] = useState('');
  const [editMandatorySkills, setEditMandatorySkills] = useState('');
  const [editTechStack, setEditTechStack] = useState('');
  const [editSalaryMin, setEditSalaryMin] = useState('');
  const [editSalaryMax, setEditSalaryMax] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [updatingJob, setUpdatingJob] = useState(false);

  const handleStartEdit = (job: any) => {
    setEditingJob(job);
    setEditTitle(job.title || '');
    setEditCompany(job.company || '');
    setEditLocation(job.location || '');

    // Clean description to remove appended company block
    let rawDesc = job.description || '';
    const breakIndex = rawDesc.indexOf('\n\n**Company:**');
    if (breakIndex !== -1) {
      rawDesc = rawDesc.substring(0, breakIndex);
    }
    setEditDescription(rawDesc.trim());
    setEditYearsExperience(job.years_experience || '');
    setEditMandatorySkills(
      Array.isArray(job.mandatory_skills)
        ? job.mandatory_skills.join(', ')
        : String(job.mandatory_skills || '')
    );
    setEditTechStack(
      Array.isArray(job.tech_stack) ? job.tech_stack.join(', ') : String(job.tech_stack || '')
    );
    setEditSalaryMin(job.salary_min ? String(job.salary_min) : '');
    setEditSalaryMax(job.salary_max ? String(job.salary_max) : '');
    setEditStatus(job.status || 'ACTIVE');
  };

  const handleUpdateJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setUpdatingJob(true);
    try {
      // Structure full description nicely with custom formatting
      const fullDesc = `
${editDescription}

**Company:** ${editCompany || 'My Company'}
**Location:** ${editLocation || 'Remote'}
**Salary Range:** ${
        editSalaryMin && editSalaryMax
          ? `R${editSalaryMin} - R${editSalaryMax}`
          : editSalaryMin
          ? `From R${editSalaryMin}`
          : editSalaryMax
          ? `Up to R${editSalaryMax}`
          : 'Negotiable'
      }
**Years of Experience Required:** ${editYearsExperience}
**Mandatory Skills:** ${editMandatorySkills}
**Tech Stack:** ${editTechStack}
      `.trim();

      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingJob.id,
          title: editTitle,
          company: editCompany,
          location: editLocation,
          description: fullDesc,
          years_experience: editYearsExperience,
          mandatory_skills: editMandatorySkills,
          tech_stack: editTechStack,
          salary_min: editSalaryMin,
          salary_max: editSalaryMax,
          status: editStatus,
        }),
      });

      if (res.ok) {
        toast.success('Job updated.');
        setEditingJob(null);
        onRefresh();
      } else {
        const err = await res.json();
        toast.error("We couldn't update the job: " + (err.error || 'unknown error'));
      }
    } catch (err: any) {
      toast.error("We couldn't update the job: " + err.message);
    } finally {
      setUpdatingJob(false);
    }
  };

  const filteredApplicants = (applications || [])
    .filter((app: any) => {
      // Job Posting filter (existing filter)
      if (selectedJobFilter && app.job_id !== selectedJobFilter) return false;

      // AI Match score filter
      if (filterScore !== 'All') {
        const score = app.matchContext?.match_score || 0;
        if (score < filterScore) return false;
      }

      // Experience level filter
      if (filterExperience !== 'All') {
        const candidateExp = String(app.candidate.experience_level || '').toLowerCase();
        if (filterExperience === 'Junior' && !candidateExp.includes('junior') && !candidateExp.includes('1-3')) return false;
        if (
          filterExperience === 'Mid' &&
          !candidateExp.includes('mid') &&
          !candidateExp.includes('intermediate') &&
          !candidateExp.includes('3-5') &&
          !candidateExp.includes('mid-level')
        )
          return false;
        if (
          filterExperience === 'Senior' &&
          !candidateExp.includes('senior') &&
          !candidateExp.includes('5-8') &&
          !candidateExp.includes('8+')
        )
          return false;
        if (
          filterExperience === 'Executive' &&
          !candidateExp.includes('executive') &&
          !candidateExp.includes('lead') &&
          !candidateExp.includes('director') &&
          !candidateExp.includes('10+')
        )
          return false;
      }

      // Skill set filter
      if (filterSkill !== 'All') {
        const searchSkill = filterSkill.toLowerCase();
        const resumeText = String(app.candidate.resume_text || '').toLowerCase();
        const titleText = String(app.candidate.professional_title || '').toLowerCase();
        if (!resumeText.includes(searchSkill) && !titleText.includes(searchSkill)) return false;
      }

      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'score_desc') {
        const aScore = a.matchContext?.match_score || 0;
        const bScore = b.matchContext?.match_score || 0;
        return bScore - aScore;
      }
      if (sortBy === 'name_asc') {
        return String(a.candidate.name || '').localeCompare(String(b.candidate.name || ''));
      }
      if (sortBy === 'readiness_desc') {
        const aRad = a.candidate.video_interviews?.[0]?.score || 0;
        const bRad = b.candidate.video_interviews?.[0]?.score || 0;
        return bRad - aRad;
      }
      // default: applied_at_desc
      return new Date(b.applied_at || 0).getTime() - new Date(a.applied_at || 0).getTime();
    });

  const scheduleInterview = async (app: any) => {
    if (!interviewDate || !interviewTime) {
      toast.warning('Choose a date and time for the interview.');
      return;
    }
    const combined = new Date(`${interviewDate}T${interviewTime}`);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: app.id,
          candidate_id: app.candidate_id,
          proposed_time: combined.toISOString(),
          notes: interviewNotes,
        }),
      });
      if (res.ok) {
        toast.success('Interview invite sent.');
        setInterviewDate('');
        setInterviewTime('');
        setInterviewNotes('');
        setSelectedApplicant(null);
        onRefresh();
      } else {
        toast.error("We couldn't send the interview invite.");
      }
    } catch (err) {
      toast.error("We couldn't send the interview invite. Please try again.");
    }
  };

  useEffect(() => {
    if (activeTab === 'Applicants' && !selectedJobFilter && (jobs || []).length === 1) {
      setSelectedJobFilter(jobs[0].id);
    }
  }, [activeTab, selectedJobFilter, jobs]);

  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = async (action: 'checkout' | 'bypass', jobIdToUnlock?: any) => {
    const targetJobId = jobIdToUnlock || selectedJobFilter;
    if (!targetJobId) {
      toast.warning('Choose a job to unlock first.');
      return;
    }

    if (action === 'checkout') {
      router.push(`/employer/payment?jobId=${targetJobId}`);
      return;
    }

    setUnlocking(true);
    try {
      const res = await fetch('/api/jobs/pay-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: targetJobId }),
      });
      if (res.ok) {
        toast.success('Demo payment complete. The role is live and its applicants are unlocked.');
        onRefresh();
      } else {
        const errorData = await res.json();
        toast.error("We couldn't unlock this role: " + errorData.error);
      }
    } catch (err: any) {
      toast.error("We couldn't unlock this role: " + err.message);
    } finally {
      setUnlocking(false);
    }
  };

  const filteredJobs = (jobs || []).filter((job: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      (job.years_experience && String(job.years_experience).toLowerCase().includes(q)) ||
      (job.mandatory_skills &&
        Array.isArray(job.mandatory_skills) &&
        job.mandatory_skills.some((s: string) => s.toLowerCase().includes(q))) ||
      (job.tech_stack &&
        Array.isArray(job.tech_stack) &&
        job.tech_stack.some((s: string) => s.toLowerCase().includes(q)))
    );
  });

  // Applications nobody has acted on yet (no decision, no interview) drive the sidebar badge.
  const awaitingReviewCount = (applications || []).filter(
    (a: any) => (!a.status || a.status === 'Pending') && (!a.interviews || a.interviews.length === 0)
  ).length;

  return (
    <PortalShell
      portal="employer"
      user={user}
      onLogout={onLogout}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setSelectedApplicant(null);
        setActiveTab(tab);
      }}
      badges={{ Applicants: awaitingReviewCount }}
    >
      {activeTab === 'Overview' && (
        <OverviewTab
          jobs={jobs}
          applications={applications}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredJobs={filteredJobs}
          handleStartEdit={handleStartEdit}
          setSelectedJobFilter={setSelectedJobFilter}
          setActiveTab={setActiveTab}
          setSelectedApplicant={setSelectedApplicant}
          isJobUnlocked={isJobUnlocked}
        />
      )}

      {activeTab === 'Applicants' && (
        <ApplicantsTab
          jobs={jobs}
          applications={applications}
          selectedJobFilter={selectedJobFilter}
          setSelectedJobFilter={setSelectedJobFilter}
          isJobUnlocked={isJobUnlocked}
          unlocking={unlocking}
          handleUnlock={handleUnlock}
          filterScore={filterScore}
          setFilterScore={setFilterScore}
          filterExperience={filterExperience}
          setFilterExperience={setFilterExperience}
          filterSkill={filterSkill}
          setFilterSkill={setFilterSkill}
          sortBy={sortBy}
          setSortBy={setSortBy}
          filteredApplicants={filteredApplicants}
          selectedApplicant={selectedApplicant}
          setSelectedApplicant={setSelectedApplicant}
          interviewDate={interviewDate}
          setInterviewDate={setInterviewDate}
          interviewTime={interviewTime}
          setInterviewTime={setInterviewTime}
          interviewNotes={interviewNotes}
          setInterviewNotes={setInterviewNotes}
          scheduleInterview={scheduleInterview}
          handleUpdateApplicationStatus={handleUpdateApplicationStatus}
        />
      )}

      {activeTab === 'Profile' && (
        <ProfileTab
          user={user}
          profileLoading={profileLoading}
          profileName={profileName}
          setProfileName={setProfileName}
          profileTitle={profileTitle}
          setProfileTitle={setProfileTitle}
          profilePhone={profilePhone}
          setProfilePhone={setProfilePhone}
          profileCompanyName={profileCompanyName}
          setProfileCompanyName={setProfileCompanyName}
          profileWebsite={profileWebsite}
          setProfileWebsite={setProfileWebsite}
          profileDescription={profileDescription}
          setProfileDescription={setProfileDescription}
          profileLocation={profileLocation}
          setProfileLocation={setProfileLocation}
          profileLogo={profileLogo}
          setProfileLogo={setProfileLogo}
          profileSaving={profileSaving}
          handleProfileSubmit={handleProfileSubmit}
        />
      )}

      {activeTab === 'Settings' && <SettingsTab user={user} />}

      {/* Edit job modal */}
      <EditJobModal
        editingJob={editingJob}
        setEditingJob={setEditingJob}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editCompany={editCompany}
        setEditCompany={setEditCompany}
        editLocation={editLocation}
        setEditLocation={setEditLocation}
        editSalaryMin={editSalaryMin}
        setEditSalaryMin={setEditSalaryMin}
        editSalaryMax={editSalaryMax}
        setEditSalaryMax={setEditSalaryMax}
        editYearsExperience={editYearsExperience}
        setEditYearsExperience={setEditYearsExperience}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        editMandatorySkills={editMandatorySkills}
        setEditMandatorySkills={setEditMandatorySkills}
        editTechStack={editTechStack}
        setEditTechStack={setEditTechStack}
        updatingJob={updatingJob}
        handleUpdateJobSubmit={handleUpdateJobSubmit}
      />
    </PortalShell>
  );
}
