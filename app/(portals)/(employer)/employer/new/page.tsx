'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, Briefcase, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import RichTextEditor from '@/components/RichTextEditor';
import PortalSidebar from '@/components/PortalSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import PortalLoader from '@/components/PortalLoader';

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setLocation(aiData.location || 'Remote');
      setSalaryMin(aiData.salaryMin ? String(aiData.salaryMin) : '');
      setSalaryMax(aiData.salaryMax ? String(aiData.salaryMax) : '');
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
          salary_max: salaryMax
        }),
      });
      if (res.ok) {
        const resetData = await res.json();
        
        if (resetData.bypassed || !resetData.payfast) {
          alert('Job post created successfully!');
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
        alert('Failed to initiate checkout: ' + errorData.error);
        setSavingJob(false);
      }
    } catch (error: any) {
      alert('Error creating job: ' + error.message);
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
    return <PortalLoader portal="EMPLOYER" title="Loading Employer Workspace" />;
  }

  return (
    <div className="w-full h-screen bg-[#F5F6F8] flex overflow-hidden font-sans text-[#0A1B3D] transition-colors">
      
      {/* Sidebar navigation */}
      <PortalSidebar
        role="EMPLOYER"
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between pl-14 pr-4 md:px-8 flex-shrink-0 transition-colors">
          <h1 className="text-xl font-bold text-[#0A1B3D]">Create New Job Posting</h1>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-[#A6F23C]/15 text-[#0A1B3D] px-3 py-1 rounded-full text-sm font-semibold border border-[#A6F23C]/30">
              <span className="w-2 h-2 bg-[#A6F23C] rounded-full animate-pulse"></span>
              {user?.role || 'EMPLOYER'}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 transition-colors">
              <h2 className="text-xl font-bold text-[#0A1B3D] mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#0A1B3D]" /> Post a New Role
              </h2>
              
              <form onSubmit={handleCreateJob} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Job Title</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Senior Full Stack Engineer" 
                      className="flex-1 p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleAiAutofill}
                      disabled={aiLoading}
                      className="bg-[#A6F23C]/15 hover:bg-[#A6F23C]/25 text-[#0A1B3D] px-4 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {aiLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      AI Autofill
                    </button>
                  </div>
                </div>

                {aiLoading ? (
                  <div className="space-y-4 animate-pulse p-4 bg-[#A6F23C]/5 rounded-xl border border-[#A6F23C]/20">
                    <div className="flex items-center gap-2 mb-4 text-[#0A1B3D] font-medium text-sm">
                      <Clock className="w-5 h-5 animate-spin" />
                      Generating description, requirements, and tech stack...
                    </div>
                    <div className="h-4 bg-[#A6F23C]/20 rounded-full w-1/4 mb-2"></div>
                    <div className="h-32 bg-[#A6F23C]/10 rounded-xl w-full"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Job Description (Rich Text Builder)</label>
                      <RichTextEditor 
                        content={description}
                        onChange={setDescription}
                      />
                    </div>

                    {/* Company and Location group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Company Name</label>
                        <input 
                          type="text"
                          value={company}
                          onChange={e => setCompany(e.target.value)}
                          className="w-full p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                          placeholder="e.g. LaunchPath Corp"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Job Location</label>
                        <input 
                          type="text"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          className="w-full p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                          placeholder="e.g. Johannesburg, GP or Remote"
                          required
                        />
                      </div>
                    </div>

                    {/* Salary Range group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Minimum Salary (e.g. Annual or Monthly value)</label>
                        <input 
                          type="number"
                          value={salaryMin}
                          onChange={e => setSalaryMin(e.target.value)}
                          className="w-full p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                          placeholder="e.g. 450000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Maximum Salary</label>
                        <input 
                          type="number"
                          value={salaryMax}
                          onChange={e => setSalaryMax(e.target.value)}
                          className="w-full p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                          placeholder="e.g. 750000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Years of Experience</label>
                        <input 
                          type="text"
                          value={yearsExperience}
                          onChange={e => setYearsExperience(e.target.value)}
                          className="w-full p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                          placeholder="e.g. 5+ years"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Mandatory Skills</label>
                        <input 
                          type="text"
                          value={mandatorySkills}
                          onChange={e => setMandatorySkills(e.target.value)}
                          className="w-full p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                          placeholder="e.g. React, Node, SQL"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Tech Stack</label>
                        <input 
                          type="text"
                          value={techStack}
                          onChange={e => setTechStack(e.target.value)}
                          className="w-full p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                          placeholder="e.g. GitHub, GCP, Prisma"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Listing Duration</label>
                        <select 
                          value={duration}
                          onChange={e => setDuration(e.target.value)}
                          className="w-full p-2.5 px-4 border border-slate-300 rounded-full text-sm bg-transparent focus:ring-2 focus:ring-[#A6F23C] outline-none text-[#0A1B3D]"
                        >
                          <option value="30">30 Days</option>
                          <option value="60">60 Days</option>
                          <option value="90">90 Days</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={savingJob || !title || !description}
                  className="w-full bg-[#A6F23C] hover:bg-[#C8FF7A] text-[#0A1B3D] font-bold py-3.5 rounded-full transition disabled:opacity-50 text-base cursor-pointer shadow-lg shadow-[#A6F23C]/20"
                >
                  {savingJob ? 'Publishing...' : 'Publish Job Posting'}
                </button>
              </form>
          </div>
        </div>
      </main>
    </div>
  );
}
