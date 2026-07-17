'use client';

import { useState, useRef } from 'react';
import { 
  CheckCircle2, User, Sparkles, BadgeCheck, ShieldAlert, FileText, Upload 
} from 'lucide-react';
import { getProfileCompletion, getResumeStrength } from './DashboardHelpers';

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
  const completion = getProfileCompletion(user);
  const strength = getResumeStrength(user?.resume_text);

  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingClearance, setUploadingClearance] = useState(false);

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* PROFILE COMPLETION DASHBOARD CARD */}
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Profile Completion Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete your profile details to stand out to employers and qualify for our AI recommendation matching index.
            </p>
          </div>
          <div className="text-right flex items-center gap-2 sm:flex-col sm:items-end">
            <span className="text-2xl font-black text-[#5D3FD3] dark:text-violet-400">{completion.score}%</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Complete</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 transition-all duration-500" 
            style={{ width: `${completion.score}%` }}
          />
        </div>

        {/* Checklist summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {completion.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-semibold p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800">
              {item.filled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex-shrink-0" />
              )}
              <span className={item.filled ? 'text-slate-800 dark:text-slate-200 truncate' : 'text-slate-400 dark:text-slate-505 line-through decoration-slate-250 dark:decoration-slate-800/50 truncate'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Header / Profile card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {!isEditingProfile ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex flex-shrink-0 items-center justify-center border-4 border-white dark:border-slate-800 shadow">
                  <User className="text-blue-600 dark:text-blue-400 w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">{user?.name || 'Talent'}</h2>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{user?.professional_title || 'No professional title set'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="inline-block text-xs font-bold text-[#5D3FD3] dark:text-violet-405 bg-violet-100 dark:bg-[#5D3FD3]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      {user?.experience_level || 'Entry-Level'}
                    </span>
                    {user?.linkedin_url && (
                      <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full hover:underline transition-all">
                        LinkedIn
                      </a>
                    )}
                    {user?.github_url && (
                      <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full hover:underline transition-all">
                        GitHub
                      </a>
                    )}
                    {user?.phone && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/45 px-3 py-1 rounded-full">
                        📞 {user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
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
                  setIsEditingProfile(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Edit Details
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/60 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                    Qualifications & Academic Background
                  </h4>
                  {user?.qualifications ? (
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                      {user.qualifications}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-405 dark:text-slate-500 italic">
                      No qualification or academic background added yet. Click &quot;Edit Details&quot; to include them.
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-150/80 dark:border-slate-800/60 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Institution Studied</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {user?.study_institution || <span className="text-slate-400 italic font-normal">Not specified</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Specialisation</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {user?.study_specialisation || <span className="text-slate-400 italic font-normal">Not specified</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/60 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Key Skills & Interests
                  </h4>
                  {user?.skills ? (
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.split(',').map((sk: string, idx: number) => (
                        <span key={idx} className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40">
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-405 dark:text-slate-500 italic">No skills listed yet.</p>
                  )}
                  {user?.interests && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                      <strong className="text-slate-500 dark:text-slate-500">Interests:</strong> {user.interests}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-150/80 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Roles Seeking</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                    {user?.seeking_roles || <span className="text-slate-400 italic font-normal">Not specified yet</span>}
                  </p>
                </div>

                {user?.career_direction && (
                  <div className="pt-2.5 border-t border-slate-150/80 dark:border-slate-800/60">
                    <h5 className="text-[10.5px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
                      Career Direction
                    </h5>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {user.career_direction}
                    </p>
                  </div>
                )}
              </div>

              {/* ACADEMIC CERTIFICATES & CLEARANCE */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/60 md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  Degree Certificates & Verification Clearances
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Certificates / Degree Box */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Certificates & Degree PDFs</span>
                      {user?.certificates_url ? (
                        <div className="space-y-1 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">Verified Degree / Certificates</span>
                          <a 
                            href={user.certificates_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            Download / View PDF
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic block mt-1">No certificate or degree PDF uploaded yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Police Clearance Box */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Police Clearance Certificate</span>
                      {user?.police_clearance_url ? (
                        <div className="space-y-1 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">Verified Police Clearance</span>
                          <a 
                            href={user.police_clearance_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            Download / View PDF
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic block mt-1">No police clearance certificate uploaded yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/60 md:col-span-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Work Experience, Internships, Projects & Volunteering
                </h4>
                {user?.work_experience ? (
                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                    {user.work_experience}
                  </p>
                ) : (
                  <p className="text-xs text-slate-405 dark:text-slate-500 italic">
                    No work or volunteer experience described yet. Click &quot;Edit Details&quot; to include them.
                  </p>
                )}
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/60 md:col-span-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  LinkedIn, GitHub & Portfolio Links
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn URL</span>
                    {user?.linkedin_url ? (
                      <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline truncate mt-1 block">
                        {user.linkedin_url}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-405 italic mt-1">Not linked</span>
                    )}
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GitHub URL</span>
                    {user?.github_url ? (
                      <a href={user.github_url} target="_blank" rel="noreferrer" className="text-xs text-slate-700 dark:text-slate-300 font-bold hover:underline truncate mt-1 block">
                        {user.github_url}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-405 italic mt-1">Not linked</span>
                    )}
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portfolio Website</span>
                    {user?.portfolio_url ? (
                      <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="text-xs text-[#5D3FD3] dark:text-violet-400 font-bold hover:underline truncate mt-1 block">
                        {user.portfolio_url}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-450 italic mt-1">Not linked</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Edit Professional Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Professional Title</label>
                <input
                  type="text"
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Experience Level</label>
                <select
                  value={profileExp}
                  onChange={(e) => setProfileExp(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={profileLinkedin}
                  onChange={(e) => setProfileLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">GitHub Profile URL</label>
                <input
                  type="text"
                  value={profileGithub}
                  onChange={(e) => setProfileGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Portfolio Link URL</label>
                <input
                  type="url"
                  value={profilePortfolioUrl}
                  onChange={(e) => setProfilePortfolioUrl(e.target.value)}
                  placeholder="https://myportfolio.com"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Qualifications & Academic Background</h4>
              <div>
                <textarea
                  value={profileQualifications}
                  onChange={(e) => setProfileQualifications(e.target.value)}
                  placeholder="e.g. B.Sc in Computer Science, Stanford University (2020-2024). Specializations in Software Engineering."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Skills, Interests & Career Direction</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Key Skills (comma separated)</label>
                  <input
                    type="text"
                    value={profileSkills}
                    onChange={(e) => setProfileSkills(e.target.value)}
                    placeholder="TypeScript, React, Node.js, Next.js, PostgreSQL"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Interests</label>
                    <input
                      type="text"
                      value={profileInterests}
                      onChange={(e) => setProfileInterests(e.target.value)}
                      placeholder="e.g. Artificial Intelligence, fintech, biotech"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Career Direction</label>
                    <input
                      type="text"
                      value={profileCareerDirection}
                      onChange={(e) => setProfileCareerDirection(e.target.value)}
                      placeholder="Seeking lead full stack positions, managing agile teams"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Education & Career Preferences</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Institution Studied / Studying</label>
                  <input
                    type="text"
                    value={profileStudyInstitution}
                    onChange={(e) => setProfileStudyInstitution(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Specialisation / Field of Study</label>
                  <input
                    type="text"
                    value={profileStudySpecialisation}
                    onChange={(e) => setProfileStudySpecialisation(e.target.value)}
                    placeholder="e.g. Computer Science, software systems"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">What roles are you seeking?</label>
                <input
                  type="text"
                  value={profileSeekingRoles}
                  onChange={(e) => setProfileSeekingRoles(e.target.value)}
                  placeholder="e.g. Full Stack Developer, Product Engineer"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Verification Documents</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Certificate Upload Field */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Certificates & Degree PDFs</span>
                    {profileCertificatesUrl && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500">Upload degree or academic achievement certificates (PDF only).</p>
                  
                  {profileCertificatesUrl && (
                    <div className="flex items-center gap-2 text-xs">
                      <a href={profileCertificatesUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline truncate max-w-[150px]">
                        View current certificate
                      </a>
                      <button 
                        type="button" 
                        onClick={() => setProfileCertificatesUrl('')} 
                        className="text-rose-500 hover:text-rose-700 font-semibold ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadingCert(true);
                          try {
                            const url = await handleFileUploadToS3(file, 'documents');
                            setProfileCertificatesUrl(url);
                          } catch (err: any) {
                            alert('Failed to upload certificate: ' + err.message);
                          } finally {
                            setUploadingCert(false);
                          }
                        }
                      }}
                      className="hidden" 
                      id="cert-file-input" 
                    />
                    <label 
                      htmlFor="cert-file-input"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer shadow-sm transition"
                    >
                      {uploadingCert ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                          Uploading to S3...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-slate-500" />
                          Choose PDF Certificate
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Police Clearance Upload Field */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Police Clearance Certificate</span>
                    {profilePoliceClearanceUrl && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500">Upload clean police clearance background-check document (PDF only).</p>
                  
                  {profilePoliceClearanceUrl && (
                    <div className="flex items-center gap-2 text-xs">
                      <a href={profilePoliceClearanceUrl} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline truncate max-w-[150px]">
                        View current clearance
                      </a>
                      <button 
                        type="button" 
                        onClick={() => setProfilePoliceClearanceUrl('')} 
                        className="text-rose-500 hover:text-rose-700 font-semibold ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadingClearance(true);
                          try {
                            const url = await handleFileUploadToS3(file, 'documents');
                            setProfilePoliceClearanceUrl(url);
                          } catch (err: any) {
                            alert('Failed to upload police clearance: ' + err.message);
                          } finally {
                            setUploadingClearance(false);
                          }
                        }
                      }}
                      className="hidden" 
                      id="clearance-file-input" 
                    />
                    <label 
                      htmlFor="clearance-file-input"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer shadow-sm transition"
                    >
                      {uploadingClearance ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                          Uploading to S3...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-slate-500" />
                          Choose PDF Clearance
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Work Experience, Internships, Projects & Volunteering</h4>
              <div>
                <textarea
                  value={profileWorkExperience}
                  onChange={(e) => setProfileWorkExperience(e.target.value)}
                  placeholder="Detail your work experience, internships, core projects, or volunteer work..."
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5"
              >
                {isSavingProfile ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* LinkedIn profile sync integration */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#0A66C2] fill-[#0A66C2]" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              LinkedIn Profile Integration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Authenticate and sync your LinkedIn profile details directly to your dynamic LaunchPath profile.</p>
          </div>
          <button
            type="button"
            disabled={syncingLinkedIn}
            onClick={handleLinkedInConnect}
            className="px-4 py-2.5 bg-[#0a66c2] hover:bg-[#004182] disabled:bg-[#0a66c2]/50 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition flex items-center gap-2 border-none"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            {syncingLinkedIn ? 'Connecting...' : 'Sync LinkedIn Data'}
          </button>
        </div>
      </div>

      {/* AI CV / Resume Optimizer & Strength Index Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white font-heading uppercase text-xs tracking-wider">
            <Sparkles className="w-4 h-4 text-[#5D3FD3] dark:text-violet-400"/> AI CV Optimizer & Strength Index
          </h3>
          <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${strength.textColor} bg-slate-100 dark:bg-slate-800`}>
            {strength.label}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Overall CV Strength</span>
              <span className={`font-black text-sm ${strength.color}`}>{strength.score}% Score</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[2px]">
              <div 
                className={`h-full bg-gradient-to-r ${strength.barColor} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-2">
            {[
              { label: 'Contact Info', filled: strength.checks.contact },
              { label: 'Key Skills', filled: strength.checks.skills },
              { label: 'Work History', filled: strength.checks.experience },
              { label: 'Education', filled: strength.checks.education },
              { label: 'Action Metrics', filled: strength.checks.metrics },
            ].map((check, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 text-xs font-semibold p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-800"
              >
                {check.filled ? (
                  <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0 animate-pulse" />
                )}
                <span className={check.filled ? 'text-slate-700 dark:text-slate-300 truncate' : 'text-slate-405 dark:text-slate-500 truncate'}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 bg-violet-50/10 dark:bg-violet-955/5 p-4 sm:p-5 rounded-xl border border-violet-100/30 dark:border-violet-900/10">
            <h4 className="text-xs font-black text-[#5D3FD3] dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>How to Improve Your CV Score</span>
            </h4>
            
            <ul className="space-y-2.5 mt-3">
              {strength.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  <span className="h-5 w-5 bg-violet-100/80 dark:bg-violet-900/30 rounded-full flex items-center justify-center text-[10px] text-[#5D3FD3] dark:text-violet-300 font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Resume viewer and editor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400"/> Current Extracted Resume
          </h3>
          {user?.resume_text && !isEditingResume && (
            <button
              onClick={() => {
                setProfileResumeText(user?.resume_text || '');
                setIsEditingResume(true);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Edit Resume Text
            </button>
          )}
        </div>

        <div className="p-6">
          {isEditingResume ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  You can directly edit the parsed plain-text used by our AI LaunchPath engine to recalculate compatibility scores. Saving updates will refresh relevant matches.
                </p>
                <textarea
                  value={profileResumeText}
                  onChange={(e) => setProfileResumeText(e.target.value)}
                  required
                  rows={12}
                  className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Paste or edit your resume text here..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingResume(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5"
                >
                  {isSavingProfile ? 'Saving...' : 'Save & Re-score'}
                </button>
              </div>
            </form>
          ) : user?.resume_text ? (
            <div className="space-y-4">
              <div className="max-h-72 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300 select-text whitespace-pre-wrap">
                {user.resume_text}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Our system matches you against jobs based on the extracted resume metrics shown above. You can edit this text directly or upload a newer document below.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400">
              <p className="text-sm font-medium mb-1">No resume uploaded or extracted yet.</p>
              <p className="text-xs">Upload a PDF below to populate your parsed profile and enable AI LaunchPath recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Document upload / re-upload area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400"/> {user?.resume_text ? 'Upload Newer Resume Document' : 'Upload Resume Document'}
          </h3>
        </div>
        
        {resumeTask && resumeTask.status !== 'FAILED' ? (
          <div className="p-8 m-6 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Resume Processing Queue</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Your resume is currently being processed by our AI to extract skills and find the best job matches.</p>
            
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 mb-2 overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
              <div className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end px-2" style={{ width: `${resumeTask.progress}%` }}>
                {resumeTask.progress > 10 && <span className="text-[10px] text-white font-bold">{resumeTask.progress}%</span>}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-slate-600 dark:text-slate-400">
              <span>Status: <strong className="text-blue-600 dark:text-blue-400">{resumeTask.status}</strong></span>
              <span>{resumeTask.progress === 100 ? 'Finalizing...' : 'Extracting match metrics...'}</span>
            </div>
          </div>
        ) : (
          <div 
            className="p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 m-6 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative cursor-pointer" 
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="w-12 h-12 text-slate-400 dark:text-slate-505 mb-4" />
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Drag and drop your updated PDF resume here</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Uploading triggers bulk processing of your skill extractions</p>
            <button 
              disabled={uploading}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow disabled:opacity-50 text-sm cursor-pointer border-none"
            >
              {uploading ? 'Initiating Task...' : 'Browse Files'}
            </button>
            <input 
              type="file" 
              accept="application/pdf" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleResumeUpload} 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
