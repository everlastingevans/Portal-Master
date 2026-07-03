'use client';

import { useState, useEffect } from 'react';
import LaunchpathMuxPlayer from '@/components/LaunchpathMuxPlayer';
const LAUNCHPATH_POSTER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNDUwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ2xvdyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxZTFiNGIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI0MCUiIHN0b3AtY29sb3I9IiMwZjE3MmEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDIwNjE3Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJicmFuZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNzE0NUZGIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzhiNWNmNiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9InVybCgjZ2xvdykiLz4KICAKICA8IS0tIFN1YnRsZSBmdXR1cmlzdGljIGxpbmVzIC0tPgogIDxnIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSI+CiAgICA8bGluZSB4MT0iMTAwIiB5MT0iMCIgeDI9IjEwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjIwMCIgeTE9IjAiIHgyPSIyMDAiIHkyPSI0NTAiLz4KICAgIDxsaW5lIHgxPSIzMDAiIHkxPSIwIiB4Mj0iMzAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iNDAwIiB5MT0iMCIgeDI9IjQwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjUwMCIgeTE9IjAiIHgyPSI1MDAiIHkyPSI0NTAiLz4KICAgIDxsaW5lIHgxPSI2MDAiIHkxPSIwIiB4Mj0iNjAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iNzAwIiB5MT0iMCIgeDI9IjcwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjAiIHkxPSIxMDAiIHgyPSI4MDAiIHkyPSIxMDAiLz4KICAgIDxsaW5lIHgxPSIwIiB5MT0iMjAwIiB4Mj0iODAwIiB5Mj0iMjAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iMzAwIiB4Mj0iODAwIiB5Mj0iMzAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iNDAwIiB4Mj0iODAwIiB5Mj0iNDAwIi8+CiAgPC9nPgogIDxjaXJjbGUgY3g9IjQwMCIgY3k9IjIyNSIgcj0iMTQwIiBmaWxsPSIjNzE0NUZGIiBmaWxsLW9wYWNpdHk9IjAuMTUiIGZpbHRlcj0iYmx1cig2MHB4KSIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiMzYjgyZjYiIGZpbGwtb3BhY2l0eT0iMC4xIiBmaWx0ZXI9ImJsdXIoNDBweCkiLz4KICA8cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSI3MDAiIGhlaWdodD0iMzUwIiByeD0iMjAiIGZpbGw9IiMwZjE3MmEiIGZpbGwtb3BhY2l0eT0iMC41IiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Utb3BhY2l0eT0iMC40Ii8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTkwIiByPSI0NSIgZmlsbD0iIzcxNDVGRiIgZmlsbC1vcGFjaXR5PSIwLjIiIHN0cm9rZT0iIzcxNDVGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTkwIiByPSIzNSIgZmlsbD0idXJsKCNicmFuZCkiLz4KICA8cG9seWdvbiBwb2ludHM9IjM5MiwxNzcgNDE1LDE5MCAzOTIsMjAzIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHJlY3QgeD0iMzEwIiB5PSIyNzAiIHdpZHRoPSIxODAiIGhlaWdodD0iMjQiIHJ4PSIxMiIgZmlsbD0iIzcxNDVGRiIgZmlsbC1vcGFjaXR5PSIwLjE1IiBzdHJva2U9IiM3MTQ1RkYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMyIvPgogIDx0ZXh0IHg9IjQwMCIgeT0iMjg1IiBmaWxsPSIjYTc4YmZhIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Db2wsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9IjkwMCIgbGV0dGVyLXNwYWNpbmc9IjEuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgdGV4dC10cmFuc2Zvcm09InVwcGVyY2FzZSI+TEFVTkNIUEFUSCBWRVJJRklFRDwvdGV4dD4KICA8dGV4dCB4PSI0MDAiIHk9IjMyNSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtQ29sLCAnU2Vnb2UgVUknLCBSb2JvdG8sIE91dGZpdCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9IjgwMCIgbGV0dGVyLXNwYWNpbmc9Ii0wLjUiIHRleHQtYW5jaG9yPSJuYXR1cmFsIj5BSSBSRUFESU5FU1MgVklERU8gSU5URVJWSUVXPC90ZXh0PgogIDx0ZXh0IHg9IjQwMCIgeT0iMzQ3IiBmaWxsPSIjOTRhM2I4IiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Db2wsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9IjUwMCIgdHJhY2tpbmc9IjAuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VjdXJlIFdlYlJUQyBUaW1lZCBFeGVjdXRpdmUgUHJlc2VudGF0aW9uPC90ZXh0PgogIDx0ZXh0IHg9IjgwIiB5PSI5MCIgZmlsbD0iIzY0NzQ4YiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMSIgZm9udC13ZWlnaHQ9IjcwMCI+RkVFRF9TVFJFQU06IEFDVElWRTwvdGV4dD4KICA8Y2lyY2xlIGN4PSIyMTUiIGN5PSI4NiIgcj0iNCIgZmlsbD0iIzEwYjk4MSIvPgogIDx0ZXh0IHg9IjcyMCIgeT0iOTAiIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTEiIHRleHQtYW5jaG9yPSJlbmQiPjQvNCBNT0RVTEVTIENPTVBMRVRFRDwvdGV4dD4KPC9zdmc+";

import Link from 'next/link';
import { Clock, Search, Sun, Moon, PlusCircle, Briefcase, Users, CheckCircle, ShieldAlert, Video, Sparkles, Play, Lock, Building, CheckCircle2, XCircle } from 'lucide-react';
import { useTheme } from 'next-themes';

import RichTextEditor from '@/components/RichTextEditor';
import PortalSidebar from '@/components/PortalSidebar';
import ThemeToggle from '@/components/ThemeToggle';

export default function EmployerDashboard({ data, user, onRefresh, onLogout }: { data: any, user: any, onRefresh: () => void, onLogout: () => void }) {
  const { jobs, applications } = data;

  const isJobUnlocked = (jobId: number | string | null) => {
    if (!jobId) return false;
    const numericId = parseInt(String(jobId), 10);
    if (isNaN(numericId)) return false;
    if (user?.tenant?.plan === 'premium') return true;
    try {
      const features = JSON.parse(user?.tenant?.features || '{}');
      if (Array.isArray(features.unlockedJobIds) && features.unlockedJobIds.includes(numericId)) {
        return true;
      }
    } catch (e) {}
    return false;
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
          logo: profileLogo
        })
      });
      if (res.ok) {
        alert('Profile updated successfully!');
        onRefresh();
      } else {
        alert('Failed to update profile.');
      }
    } catch (err: any) {
      alert('Error saving profile: ' + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: number, status: 'Accepted' | 'Rejected') => {
    try {
      const res = await fetch('/api/employer/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status }),
      });
      if (res.ok) {
        alert(`Candidate successfully ${status.toLowerCase()}!`);
        if (selectedApplicant && selectedApplicant.id === applicationId) {
          setSelectedApplicant((prev: any) => ({ ...prev, status }));
        }
        onRefresh();
      } else {
        const d = await res.json();
        alert(d.error || `Failed to update status to ${status}.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating candidate application status.');
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
    setEditMandatorySkills(Array.isArray(job.mandatory_skills) ? job.mandatory_skills.join(', ') : String(job.mandatory_skills || ''));
    setEditTechStack(Array.isArray(job.tech_stack) ? job.tech_stack.join(', ') : String(job.tech_stack || ''));
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
**Salary Range:** ${editSalaryMin && editSalaryMax ? `R${editSalaryMin} - R${editSalaryMax}` : editSalaryMin ? `From R${editSalaryMin}` : editSalaryMax ? `Up to R${editSalaryMax}` : 'Negotiable'}
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
          status: editStatus
        })
      });

      if (res.ok) {
        alert('Job posting updated successfully!');
        setEditingJob(null);
        onRefresh();
      } else {
        const err = await res.json();
        alert('Failed to update job: ' + (err.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error updating job: ' + err.message);
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
        if (filterExperience === 'Mid' && !candidateExp.includes('mid') && !candidateExp.includes('intermediate') && !candidateExp.includes('3-5') && !candidateExp.includes('mid-level')) return false;
        if (filterExperience === 'Senior' && !candidateExp.includes('senior') && !candidateExp.includes('5-8') && !candidateExp.includes('8+')) return false;
        if (filterExperience === 'Executive' && !candidateExp.includes('executive') && !candidateExp.includes('lead') && !candidateExp.includes('director') && !candidateExp.includes('10+')) return false;
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
       alert('Please select date and time');
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
          notes: interviewNotes
        })
      });
      if (res.ok) {
        alert('Interview proposed successfully');
        setInterviewDate('');
        setInterviewTime('');
        setInterviewNotes('');
        setSelectedApplicant(null);
        onRefresh();
      } else {
        alert('Failed to schedule interview');
      }
    } catch (err) {
       alert('Error scheduling interview');
    }
  };

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'Applicants' && !selectedJobFilter && (jobs || []).length === 1) {
      setSelectedJobFilter(jobs[0].id);
    }
  }, [activeTab, selectedJobFilter, jobs]);

  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = async (action: 'checkout' | 'bypass', jobIdToUnlock?: any) => {
    const targetJobId = jobIdToUnlock || selectedJobFilter;
    if (!targetJobId) {
      alert('Please select a specific job posting to unlock.');
      return;
    }
    setUnlocking(true);
    try {
      const res = await fetch('/api/employer/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, jobId: targetJobId })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.bypassed) {
          alert('Demo Bypass success! Candidate Pipeline for this role unlocked.');
          onRefresh();
        } else if (result.payfast) {
          const { url, data } = result.payfast;
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
        alert('Failed to process unlock: ' + errorData.error);
      }
    } catch (err: any) {
      alert('Error unlocking pipeline: ' + err.message);
    } finally {
      setUnlocking(false);
    }
  };

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [mandatorySkills, setMandatorySkills] = useState('');
  const [techStack, setTechStack] = useState('');
  const [duration, setDuration] = useState('30');

  const [aiLoading, setAiLoading] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const handleAiAutofill = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!title) return alert('Please enter a job title first.');
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
    } catch (err: any) {
      alert('AI Autofill failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    setSavingJob(true);
    try {
      // Create comprehensive description avoiding schema changes for now structure wise we append details
      const fullDesc = `
${description}

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
          description: fullDesc,
          years_experience: yearsExperience,
          mandatory_skills: mandatorySkills,
          tech_stack: techStack 
        }),
      });
      if (res.ok) {
        const resetData = await res.json();
        
        if (resetData.bypassed || !resetData.payfast) {
          alert('Job post created successfully!');
          setTitle('');
          setDescription('');
          setYearsExperience('');
          setMandatorySkills('');
          setTechStack('');
          setSavingJob(false);
          onRefresh();
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
        alert('Failed to initiate checkout: ' + errorData.error);
        setSavingJob(false);
      }
    } catch (error: any) {
      alert('Error creating job: ' + error.message);
      setSavingJob(false);
    }
  };

  const filteredJobs = (jobs || []).filter((job: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      (job.years_experience && String(job.years_experience).toLowerCase().includes(q)) ||
      (job.mandatory_skills && Array.isArray(job.mandatory_skills) && job.mandatory_skills.some((s: string) => s.toLowerCase().includes(q))) ||
      (job.tech_stack && Array.isArray(job.tech_stack) && job.tech_stack.some((s: string) => s.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="w-full h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Sidebar */}
      <PortalSidebar
        role="EMPLOYER"
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        jobsCount={jobs?.length || 0}
        applicationsCount={applications?.length || 0}
        onLogout={onLogout}
        onTabChange={() => setSelectedApplicant(null)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between pl-14 pr-4 md:px-8 flex-shrink-0 transition-colors">
          <h1 className="text-xl font-bold dark:text-white">{activeTab === 'Overview' ? 'Job Posts Overview' : 'Review Applicants'}</h1>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-[#5D3FD3]/10 dark:bg-[#5D3FD3]/20 text-[#5D3FD3] dark:text-violet-300 px-3 py-1 rounded-full text-sm font-semibold border border-[#5D3FD3]/20 dark:border-[#5D3FD3]/30">
              <span className="w-2 h-2 bg-[#5D3FD3] dark:bg-[#5D3FD3] rounded-full animate-pulse"></span>
              {user?.role || 'EMPLOYER'}
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'Overview' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Top Dashboard Header & Stats Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold dark:text-white">Active Postings</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage your active recruitment drives, see applicant volumes, and post new vacancies.</p>
              </div>
              <Link 
                href="/employer/new" 
                className="bg-[#5D3FD3] hover:bg-[#5b32e6] dark:bg-[#5D3FD3] dark:hover:bg-[#5b32e6] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 self-start md:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Post
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm transition-colors">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Job Postings</p>
                <p className="text-3xl font-bold dark:text-white">{jobs?.length || 0}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm transition-colors">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Received Applications</p>
                <p className="text-3xl font-bold dark:text-white">{applications?.length || 0}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm transition-colors">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Unscheduled Pipeline</p>
                <p className="text-3xl font-bold dark:text-white">
                  {(applications || []).filter((a: any) => !a.interviews || a.interviews.length === 0).length}
                </p>
              </div>
            </div>

            {/* Search & Filter section */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search postings by role title, description, skills, or tech stack..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Jobs list */}
            {(!filteredJobs || filteredJobs.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-center transition-colors">
                <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Job Postings Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-sm">
                  {searchQuery ? "No job roles match your current search criteria. Try a different query or clear the filter." : "Get started by posting your first role to LaunchPath and find the perfect candidate today."}
                </p>
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-sm font-bold px-4 py-2 rounded-lg transition">
                    Clear Search
                  </button>
                ) : (
                  <Link href="/employer/new" className="bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-bold px-5 py-2.5 rounded-lg text-sm transition shadow-sm flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Create New Post
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job: any) => {
                  const jobAppsCount = (applications || []).filter((app: any) => app.job_id === job.id).length;
                  
                  // Helper to safely render badges from any shape (array, comma-string)
                  const renderBadges = (fieldVal: any, bgClass: string, textClass: string, borderClass: string) => {
                    if (!fieldVal) return null;
                    let list: string[] = [];
                    if (Array.isArray(fieldVal)) {
                      list = fieldVal;
                    } else if (typeof fieldVal === 'string') {
                      list = fieldVal.split(',').map((s: string) => s.trim()).filter(Boolean);
                    }
                    if (list.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {list.slice(0, 8).map((item, idx) => (
                          <span key={idx} className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${bgClass} ${textClass} ${borderClass} border`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    );
                  };

                  return (
                    <div 
                      key={job.id} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-205 flex flex-col md:flex-row md:items-start justify-between gap-6"
                    >
                      <div className="flex-1 space-y-4">
                        {/* Title & Status */}
                        <div className="flex items-start justify-between sm:justify-start gap-3 flex-wrap">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{job.title}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            job.status === 'ACTIVE' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30'
                          }`}>
                            {job.status || 'ACTIVE'}
                          </span>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {job.company && (
                            <>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{job.company}</span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                            </>
                          )}
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {job.years_experience ? `${job.years_experience} Experience` : 'No experience limit'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="flex-shrink-0">{job.location || 'Remote'}</span>
                          {(job.salary_min || job.salary_max) && (
                            <>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex-shrink-0">
                                {job.salary_min && job.salary_max 
                                  ? `R${Number(job.salary_min).toLocaleString()} - R${Number(job.salary_max).toLocaleString()}` 
                                  : job.salary_min 
                                    ? `From R${Number(job.salary_min).toLocaleString()}` 
                                    : `Up to R${Number(job.salary_max).toLocaleString()}`
                                }
                              </span>
                            </>
                          )}
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="flex-shrink-0">Job ID: #{job.id}</span>
                        </div>

                        {/* Rich HTML Description snippet */}
                        <div 
                          className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 prose prose-slate prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: job.description }}
                        />

                        {/* Skills / Tech stacks block */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {((job.mandatory_skills && job.mandatory_skills.length > 0) || (typeof job.mandatory_skills === 'string' && job.mandatory_skills)) && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mandatory Skills</span>
                              {renderBadges(job.mandatory_skills, 'bg-[#5D3FD3]/10 dark:bg-[#5D3FD3]/20', 'text-[#5D3FD3] dark:text-violet-300', 'border-[#5D3FD3]/10 dark:border-[#5D3FD3]/20')}
                            </div>
                          )}
                          {((job.tech_stack && job.tech_stack.length > 0) || (typeof job.tech_stack === 'string' && job.tech_stack)) && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tech Stack / Tools</span>
                              {renderBadges(job.tech_stack, 'bg-purple-50 dark:bg-purple-900/10', 'text-purple-700 dark:text-purple-300', 'border-purple-100 dark:border-purple-900/30')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Hand Actions & Stats */}
                      <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:items-end gap-4 min-w-[150px] border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                        {/* Match Counts */}
                        <div className="text-left md:text-right">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Matches</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            {jobAppsCount} {jobAppsCount === 1 ? 'Candidate' : 'Candidates'}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button 
                            onClick={() => handleStartEdit(job)}
                            className="bg-[#5D3FD3]/10 hover:bg-[#5D3FD3]/20 text-[#5D3FD3] dark:text-[#a385ff] dark:bg-[#5D3FD3]/20 dark:hover:bg-[#5D3FD3]/30 font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer border-none"
                          >
                            Edit Posting
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedJobFilter(job.id);
                              setActiveTab('Applicants');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-lg transition cursor-pointer border-none"
                          >
                            View Applicants
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {activeTab === 'Applicants' && (
          !selectedJobFilter && (jobs || []).length > 1 ? (
            <div className="max-w-5xl mx-auto py-8 space-y-6">
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Review Applicants by Job Posting</h2>
                <p className="text-sm text-slate-500">
                  Select one of your open roles below to review matched candidate profiles, view AI fit scores, and schedule interviews.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {(jobs || []).map((j: any) => {
                  const appCount = (applications || []).filter((a: any) => a.job_id === j.id).length;
                  const unlocked = isJobUnlocked(j.id);
                  return (
                    <div key={j.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-[#5D3FD3]/30 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${unlocked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-405'}`}>
                            {unlocked ? 'Unlocked 🔓' : 'Locked 🔒'}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">{appCount} {appCount === 1 ? 'Candidate' : 'Candidates'}</span>
                        </div>
                        <h3 className="font-extrabold text-md text-slate-900 dark:text-white line-clamp-1">{j.title}</h3>
                        <p className="text-xs text-slate-500">{j.company} • {j.location}</p>
                      </div>
                      <button
                        onClick={() => setSelectedJobFilter(j.id)}
                        className="mt-6 w-full text-center bg-slate-100 hover:bg-[#5D3FD3] hover:text-white dark:bg-slate-800 dark:hover:bg-[#5D3FD3] text-slate-700 dark:text-slate-350 font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                      >
                        View Applicants
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedJobFilter && !isJobUnlocked(selectedJobFilter) && (applications || []).filter((a: any) => a.job_id === selectedJobFilter).length > 0 ? (
            <div className="max-w-3xl mx-auto py-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 md:p-12 text-center space-y-6 transition-all">
                
                <div className="mx-auto w-20 h-20 bg-[#5D3FD3]/10 dark:bg-[#5D3FD3]/20 rounded-full flex items-center justify-center animate-pulse">
                  <Lock className="w-10 h-10 text-[#5D3FD3]" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Candidate Pipeline Locked 🔒
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-extrabold tracking-wider">
                    Role: <span className="text-[#5D3FD3] dark:text-violet-400">{(jobs || []).find((j: any) => j.id === selectedJobFilter)?.title || 'Selected Role'}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm md:text-md leading-relaxed">
                    Great news! You have <span className="font-extrabold text-[#5D3FD3] dark:text-violet-400">{(applications || []).filter((a: any) => a.job_id === selectedJobFilter).length} matched candidates</span> aligned and waiting for this specific role. Unlock this pipeline to review matches, view assessment details, and schedule interviews.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto py-4 text-left">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Unlock All Candidate Profiles</h4>
                      <p className="text-[11px] text-slate-500">Access names, contact data, resumes, and full experience summaries.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800">
                    <Sparkles className="w-5 h-5 text-[#5D3FD3] mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Role-Fit Index</h4>
                      <p className="text-[11px] text-slate-500">See direct matching score, tool breakdown, and AI recruiter analysis.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 animate-pulse">
                    <Video className="w-5 h-5 text-sky-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-extrabold text-indigo-600 dark:text-indigo-400 font-sans">Practice Pitch Recordings</h4>
                      <p className="text-[11px] text-slate-500">Listen to candidate&apos;s verified answers with active playback.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800">
                    <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Direct Interview Proposals</h4>
                      <p className="text-[11px] text-slate-500">Schedule video conferences, dates, times, and send virtual links natively.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-150 dark:border-slate-800 pt-6">
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                      onClick={() => handleUnlock('checkout', selectedJobFilter)}
                      disabled={unlocking}
                      className="w-full sm:w-auto bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-extrabold px-8 py-3 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {unlocking ? 'Connecting...' : 'Unlock Candidate Pipeline (R499.00 once-off)'}
                    </button>
                    <button
                      onClick={() => handleUnlock('bypass', selectedJobFilter)}
                      disabled={unlocking}
                      className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Bypass & Unlock (Demo)
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3">
                    Unlock allows lifetime views of applicants matching this specific job vacancy. Secured by Payfast.
                  </p>

                  {(jobs || []).length > 1 && (
                    <button
                      onClick={() => setSelectedJobFilter(null)}
                      className="text-xs text-slate-500 hover:text-[#5D3FD3] hover:underline font-bold flex items-center gap-1 mx-auto mt-4 cursor-pointer"
                    >
                      ← Back to Job Postings
                    </button>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* Sidebar Column: Sorting & Filtering Sidebar */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5 shadow-sm sticky top-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">Filter Applicants</h3>
                <button
                  type="button"
                  onClick={() => {
                    setFilterScore('All');
                    setFilterExperience('All');
                    setFilterSkill('All');
                    setSortBy('applied_at_desc');
                  }}
                  className="text-xs text-[#5D3FD3] hover:underline font-bold cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 focus:ring-2 focus:ring-[#5D3FD3] focus:border-transparent outline-none transition"
                >
                  <option value="applied_at_desc">Applied Date (Newest)</option>
                  <option value="score_desc">AI Match Score (High-Low)</option>
                  <option value="readiness_desc">Practice Readiness (High-Low)</option>
                  <option value="name_asc">Name (A-Z)</option>
                </select>
              </div>

              {/* AI Match Score Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Min AI Job Match</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['All', 70, 80, 90].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterScore(s as any)}
                      className={`px-2 py-1.5 rounded-lg text-center text-xs font-semibold border transition cursor-pointer ${
                        filterScore === s
                          ? 'bg-[#5D3FD3]/10 border-[#5D3FD3] text-[#5D3FD3]'
                          : 'border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {s === 'All' ? 'All Scores' : `${s}%+ Match`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Experience Level</label>
                <div className="flex flex-col gap-1">
                  {['All', 'Junior', 'Mid', 'Senior', 'Executive'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFilterExperience(level)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition flex items-center justify-between cursor-pointer ${
                        filterExperience === level
                          ? 'bg-[#5D3FD3]/10 border-[#5D3FD3]/30 text-[#5D3FD3] font-bold'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <span>{level === 'All' ? 'Any Experience' : `${level} Level`}</span>
                      {filterExperience === level && <span className="h-1.5 w-1.5 bg-[#5D3FD3] rounded-full"></span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Verified Skill Set */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Verified Skillset</label>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'React', 'TypeScript', 'NodeJS', 'Python', 'SQL', 'DevOps'].map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setFilterSkill(skill === 'NodeJS' ? 'Node' : skill)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                        (skill === 'NodeJS' && filterSkill === 'Node') || (skill !== 'NodeJS' && filterSkill === skill)
                          ? 'bg-[#5D3FD3]/15 border-[#5D3FD3]/40 text-[#5D3FD3]'
                          : 'border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Main Candidates Column */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Applicant Pipeline ({filteredApplicants.length})
                </h2>
                {selectedJobFilter && (
                  <button
                    onClick={() => setSelectedJobFilter(null)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Show All Postings
                  </button>
                )}
              </div>

              {selectedJobFilter && (
                <div className="px-6 py-3 bg-[#5D3FD3]/5 dark:bg-[#5D3FD3]/10 border-b border-[#5D3FD3]/15 dark:border-[#5D3FD3]/25 flex items-center justify-between text-xs text-[#5D3FD3] dark:text-violet-300">
                  <span>
                    Filtering applicants for role: <span className="font-bold underline">{(jobs || []).find((j: any) => j.id === selectedJobFilter)?.title || 'Selected Job'}</span>
                  </span>
                  <button 
                    onClick={() => setSelectedJobFilter(null)} 
                    className="font-semibold hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950/20">
                     <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                       <th className="px-6 py-3">Candidate</th>
                       <th className="px-6 py-3">Applied Role</th>
                       <th className="px-6 py-3">AI Match Score</th>
                       <th className="px-6 py-3">Fit Summary</th>
                       <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {filteredApplicants.length === 0 && (
                       <tr>
                         <td colSpan={5} className="p-10 text-center text-slate-500 text-sm">
                            No candidates found matching the active filters or job postings.
                         </td>
                       </tr>
                     )}
                     {filteredApplicants.map((app: any) => (
                       <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                         <td className="px-6 py-4">
                           <p className="font-bold text-slate-900 dark:text-white text-sm">{app.candidate.name}</p>
                           <p className="text-xs text-slate-500 mt-0.5">{app.candidate.professional_title} • <span className="italic">{app.candidate.experience_level || 'General'}</span></p>
                         </td>
                         <td className="px-6 py-4">
                           <span className="bg-[#5D3FD3]/10 text-[#5D3FD3] dark:text-violet-300 px-2.5 py-1 rounded-md text-xs font-semibold border border-[#5D3FD3]/20">
                             {app.job.title}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           {app.matchContext ? (
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${app.matchContext.match_score >= 80 ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/30'}`}>
                                  {app.matchContext.match_score}%
                                </span>
                                {app.matchContext.match_score >= 80 && <CheckCircle className="w-4 h-4 text-green-500" />}
                              </div>
                           ) : (
                              <span className="text-xs text-slate-500 italic">Not calculated</span>
                           )}
                         </td>
                         <td className="px-6 py-4">
                           <p className="text-xs text-slate-650 dark:text-slate-400 line-clamp-2 max-w-sm">
                             {app.matchContext?.fit_summary || 'N/A'}
                           </p>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button onClick={() => setSelectedApplicant(app)} className="text-[#5D3FD3] hover:text-[#5b32e6] font-bold text-xs bg-[#5D3FD3]/10 hover:bg-[#5D3FD3]/20 dark:bg-[#5D3FD3]/20 dark:hover:bg-[#5D3FD3]/30 px-3.5 py-1.5 rounded transition cursor-pointer">
                             Manage
                           </button>
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>

                {selectedApplicant && (() => {
                  const readiness = selectedApplicant.candidate.video_interviews?.[0];
                  return (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                      <div className={`bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl ${readiness ? 'max-w-4xl' : 'max-w-lg'} w-full overflow-hidden flex flex-col transition-all duration-300`}>
                         <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                           <div>
                             <h3 className="font-bold text-lg">Manage Candidate: {selectedApplicant.candidate.name}</h3>
                             <p className="text-xs text-slate-500 mt-1">{selectedApplicant.candidate.professional_title || 'Software Candidate'}
                              </p>
                              <div className="flex flex-wrap items-center gap-3.5 mt-2.5 text-xs text-slate-500 font-sans">
                                <span className="flex items-center gap-1">
                                  <span>📧</span> {selectedApplicant.candidate.email}
                                </span>
                                {selectedApplicant.candidate.phone && (
                                  <span className="flex items-center gap-1 font-bold text-[#5D3FD3] dark:text-[#a385ff]">
                                    <span>📞</span> {selectedApplicant.candidate.phone}
                                  </span>
                                )}
                                {selectedApplicant.candidate.linkedin_url && (
                                  <a href={selectedApplicant.candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-605 hover:underline">
                                    LinkedIn ↗
                                  </a>
                                )}
                                {selectedApplicant.candidate.github_url && (
                                  <a href={selectedApplicant.candidate.github_url} target="_blank" rel="noopener noreferrer" className="text-slate-605 dark:text-slate-400 hover:underline">
                                    GitHub ↗
                                  </a>
                                )}
                              </div>
                               {/* Contact info links displayed */}
                           </div>
                           <button onClick={() => setSelectedApplicant(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 text-2xl font-bold leading-none cursor-pointer border-none bg-transparent">
                             &times;
                           </button>
                         </div>
                       <div className={`overflow-y-auto max-h-[80vh] p-6 ${readiness ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'space-y-6'}`}>
                           
                           {/* Left column: Scheduling & Actions */}
                           <div className="space-y-6">
                             {/* Application Decision Actions */}
                             <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 mb-6">
                               <div className="flex items-center justify-between">
                                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Application Status</span>
                                 <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                   selectedApplicant.status === 'Accepted'
                                     ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/60'
                                     : selectedApplicant.status === 'Rejected'
                                     ? 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-800/60'
                                     : 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-800/60'
                                 }`}>
                                   {selectedApplicant.status || 'Pending'}
                                 </span>
                                </div>
                               
                               <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                                 <button
                                   onClick={() => handleUpdateApplicationStatus(selectedApplicant.id, 'Accepted')}
                                   disabled={selectedApplicant.status === 'Accepted'}
                                   className={`w-full font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5 border-none ${
                                     selectedApplicant.status === 'Accepted'
                                       ? 'bg-slate-150 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                       : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                   }`}
                                 >
                                   <CheckCircle2 className="w-3.5 h-3.5" />
                                   Accept
                                 </button>
                                 
                                 <button
                                   onClick={() => handleUpdateApplicationStatus(selectedApplicant.id, 'Rejected')}
                                   disabled={selectedApplicant.status === 'Rejected'}
                                   className={`w-full font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5 border-none ${
                                     selectedApplicant.status === 'Rejected'
                                       ? 'bg-slate-150 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                       : 'bg-rose-600 hover:bg-rose-700 text-white'
                                   }`}
                                 >
                                   <XCircle className="w-3.5 h-3.5" />
                                   Reject
                                 </button>
                               </div>
                             </div>

                         {selectedApplicant.interviews && selectedApplicant.interviews.length > 0 ? (
                           <div>
                             <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Scheduled Interviews</h4>
                             <div className="space-y-3">
                               {selectedApplicant.interviews.map((iv: any) => (
                                 <div key={iv.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950">
                                   <p className="font-bold text-sm">{new Date(iv.proposed_time).toLocaleString()}</p>
                                   <p className="text-xs text-slate-500 mt-1">Status: <span className="font-bold text-[#5D3FD3]">{iv.status}</span></p>
                                 </div>
                               ))}
                             </div>
                           </div>
                         ) : (
                           <p className="text-sm text-slate-500 italic">No interviews scheduled yet.</p>
                         )}

                         <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                           <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Propose New Interview</h4>
                           <div className="grid grid-cols-2 gap-4 mb-4">
                             <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                               <input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded" />
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1">Time</label>
                               <input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded" />
                             </div>
                           </div>
                           <div className="mb-4">
                              <label className="block text-xs font-bold text-slate-500 mb-1">Notes / Video Link</label>
                              <input type="text" value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)} placeholder="Zoom/Meet link or instructions" className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded" />
                           </div>
                           <button onClick={() => scheduleInterview(selectedApplicant)} className="w-full bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-bold py-2 rounded transition cursor-pointer border-none">
                             Send Invite
                           </button>
                         </div>
                       </div>

                       {/* Right column: Shared Job Readiness Credentials */}
                       {readiness && (
                         <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-8 space-y-6">
                         <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                           <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                             <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                             Job Readiness Credentials
                           </h4>
                           <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955 px-2.5 py-1 rounded-full border border-emerald-250 dark:border-emerald-800/60 font-sans">
                             Overall Score: {readiness.score}%
                           </span>
                         </div>

                         {/* Shared Video response stream player */}
                         <div className="space-y-2">
                           <span className="text-[10px] font-mono font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Candidate Stream Recording Output</span>
                           <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-sm">
                             <LaunchpathMuxPlayer 
                               videoUrl={readiness?.video_url as string | undefined}
                               poster={LAUNCHPATH_POSTER_SVG}
                               className="w-full h-full"
                             />
                           </div>
                         </div>

                         {/* Shared AI Experts feedback assessment */}
                         <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-250 dark:border-slate-805 space-y-1.5 font-sans">
                           <span className="text-[10px] font-mono font-bold text-slate-405 dark:text-slate-500 uppercase tracking-widest block">Recruiter Coaching Feedback</span>
                           <p className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed font-semibold">
                             {readiness.feedback}
                           </p>
                         </div>

                         {/* Question lists, transcripts, and scores */}
                         <div className="space-y-3 font-sans">
                           <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1.5">Readiness Speech Transcripts</span>
                           <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                             {(typeof readiness.questions === 'string' 
                               ? JSON.parse(readiness.questions) 
                               : (readiness.questions || [])
                             ).map((q: any) => (
                               <div key={q.id} className="p-3.5 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-805 rounded-lg space-y-2 text-xs">
                                 <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800/60 font-semibold">
                                   <span className="font-extrabold text-slate-800 dark:text-slate-200">Q0{q.id}: {q.title}</span>
                                   <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 font-mono">Score: {q.questionScore}%</span>
                                 </div>
                                 <p className="italic text-slate-650 dark:text-slate-305 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                                   &ldquo;{q.transcript}&rdquo;
                                 </p>
                               </div>
                             ))}
                           </div>
                         </div>
                       </div>
                     )}

                   </div>
                </div>
              </div>
            );
          })()}
            </div>
          </div>
          )
        )}

        {/* PROFILE TAB */}
        {activeTab === 'Profile' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-12">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
              <div className="p-2.5 bg-[#5D3FD3]/10 text-[#5D3FD3] rounded-xl">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold dark:text-white">Company Profile</h2>
                <p className="text-xs text-slate-500">Update your company details, website, overview, and branding logo.</p>
              </div>
            </div>

            {profileLoading ? (
              <div className="py-12 text-center text-slate-500">Loading company profile details...</div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                
                <h3 className="text-sm font-bold text-[#5D3FD3] uppercase tracking-wider">Contact Person Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={e => setProfileName(e.target.value)} 
                      className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Job Title</label>
                    <input 
                      type="text" 
                      value={profileTitle} 
                      onChange={e => setProfileTitle(e.target.value)} 
                      className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                      placeholder="e.g. Talent Acquisition Lead"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email Address (Read-only)</label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      disabled 
                      className="w-full text-sm p-2.5 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 text-slate-400 rounded-xl cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Contact Phone</label>
                    <input 
                      type="text" 
                      value={profilePhone} 
                      onChange={e => setProfilePhone(e.target.value)} 
                      className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                      placeholder="e.g. +27 11 123 4567"
                    />
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />
                <h3 className="text-sm font-bold text-[#5D3FD3] uppercase tracking-wider">Company Brand & Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
                    <input 
                      type="text" 
                      value={profileCompanyName} 
                      onChange={e => setProfileCompanyName(e.target.value)} 
                      className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                      placeholder="e.g. LaunchPath Inc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Company Website</label>
                    <input 
                      type="text" 
                      value={profileWebsite} 
                      onChange={e => setProfileWebsite(e.target.value)} 
                      className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                      placeholder="e.g. https://launchpath.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Location / Headquarters</label>
                    <input 
                      type="text" 
                      value={profileLocation} 
                      onChange={e => setProfileLocation(e.target.value)} 
                      className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                      placeholder="e.g. Rosebank, Johannesburg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Logo URL (Optional)</label>
                    <input 
                      type="text" 
                      value={profileLogo} 
                      onChange={e => setProfileLogo(e.target.value)} 
                      className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                      placeholder="e.g. https://domain.com/logo.png"
                    />
                  </div>
                </div>

                {/* DRAG AND DROP FILE UPLOADER FOR LOGO */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Upload Company Logo</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setProfileLogo(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#5D3FD3] dark:hover:border-[#5D3FD3] rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-950/20 transition-all flex flex-col items-center justify-center gap-3"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setProfileLogo(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    {profileLogo ? (
                      <div className="flex items-center gap-4 text-left justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profileLogo} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 bg-white" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Logo Selected & Loaded</p>
                          <p className="text-[10px] text-slate-400 mt-1">Click or drag another image to replace.</p>
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setProfileLogo(''); }} 
                            className="text-red-500 hover:text-red-600 text-xs font-bold mt-2"
                          >
                            Remove Logo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-450 text-xl font-bold">
                          📁
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop your company logo here</p>
                          <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, or SVG up to 2MB (converts to Base64 data)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Company Description</label>
                  <textarea 
                    value={profileDescription} 
                    onChange={e => setProfileDescription(e.target.value)} 
                    rows={4}
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                    placeholder="Provide a brief description of what your company does, its culture, and mission..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={profileSaving}
                  className="w-full bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-bold py-3.5 rounded-xl transition cursor-pointer"
                >
                  {profileSaving ? 'Saving Changes...' : 'Save Company Profile'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'Settings' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
             <h2 className="text-xl font-bold mb-6">Account Settings</h2>
             
             <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-blue-500" />
                 Data Privacy & POPIA
               </h3>
               <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                 In accordance with the Protection of Personal Information Act (POPIA), you have the right to request an export of your company data and applicant records, or request complete deletion of your employer account.
               </p>
               <div className="flex flex-col sm:flex-row gap-4">
                 <button className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition" onClick={() => alert('Your data export request has been submitted. Prepare for a large zip file.')}>
                   Request Data Export
                 </button>
                 <button className="px-4 py-2 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition" onClick={() => { if(confirm('Are you sure you want to delete your employer account? This action is permanent, all active job posts will be closed, and applicant data will be anonymized.')) alert('Employer account deletion requested. Our team will contact you to finalize.'); }}>
                   Delete Account & Data
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>
      </main>

      {/* EDIT JOB POSTING MODAL */}
      {editingJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 border border-slate-100 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#5D3FD3]" />
                  Edit Job Posting: {editingJob.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Update specifications and requirements for this role.</p>
              </div>
              <button 
                onClick={() => setEditingJob(null)} 
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 text-2xl font-bold leading-none cursor-pointer border-none bg-transparent"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateJobSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Job Title</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Job Description (Rich Text Builder)</label>
                <RichTextEditor 
                  content={editDescription}
                  onChange={setEditDescription}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
                  <input 
                    type="text" 
                    value={editCompany} 
                    onChange={e => setEditCompany(e.target.value)} 
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Job Location</label>
                  <input 
                    type="text" 
                    value={editLocation} 
                    onChange={e => setEditLocation(e.target.value)} 
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Minimum Salary (R)</label>
                  <input 
                    type="number" 
                    value={editSalaryMin} 
                    onChange={e => setEditSalaryMin(e.target.value)} 
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                    placeholder="e.g. 450000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Maximum Salary (R)</label>
                  <input 
                    type="number" 
                    value={editSalaryMax} 
                    onChange={e => setEditSalaryMax(e.target.value)} 
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                    placeholder="e.g. 750000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Years of Experience Required</label>
                  <input 
                    type="text" 
                    value={editYearsExperience} 
                    onChange={e => setEditYearsExperience(e.target.value)} 
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                    placeholder="e.g. 3-5 years"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Role Status</label>
                  <select 
                    value={editStatus} 
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed / Filled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Mandatory Skills (Comma separated)</label>
                  <input 
                    type="text" 
                    value={editMandatorySkills} 
                    onChange={e => setEditMandatorySkills(e.target.value)} 
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                    placeholder="e.g. React, Node, SQL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tech Stack (Comma separated)</label>
                  <input 
                    type="text" 
                    value={editTechStack} 
                    onChange={e => setEditTechStack(e.target.value)} 
                    className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                    placeholder="e.g. GitHub, GCP, Prisma"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingJob(null)} 
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updatingJob}
                  className="px-6 py-2.5 bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-bold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
                >
                  {updatingJob ? 'Saving...' : 'Save Job Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
