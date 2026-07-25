'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MapPin, SlidersHorizontal, Search, ChevronDown, X, 
  ArrowUpRight, CheckCircle2, Sparkles, BadgeCheck, ShieldAlert, 
  DollarSign, Award, Building, ThumbsUp 
} from 'lucide-react';
import { CompanyLogo } from './DashboardHelpers';

export interface JobFeedTabProps {
  user: any;
  allJobs: any[];
  matches: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedJob: any;
  setSelectedJob: (job: any) => void;
  savedJobsMap: Record<number, boolean>;
  handleSaveJob: (e: React.MouseEvent, jobId: number) => void;
  handleApply: (jobId: number) => void;
  applications: any[];
}

export default function JobFeedTab({
  user,
  allJobs = [],
  matches = [],
  activeTab,
  setActiveTab,
  selectedJob,
  setSelectedJob,
  savedJobsMap,
  handleSaveJob,
  handleApply,
  applications = []
}: JobFeedTabProps) {
  // Encapsulated search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>(['Product Designer', 'Artist', 'Game Designer', 'Designer']);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([]);
  const [selectedSeniorityLevels, setSelectedSeniorityLevels] = useState<string[]>([]);
  const [salaryMinRange, setSalaryMinRange] = useState<number>(5000);
  const [salaryMaxRange, setSalaryMaxRange] = useState<number>(500000);
  const [selectedCountry, setSelectedCountry] = useState<string>('All Countries');

  const sanitizeHtml = (html: string) => {
    // Simple basic sanitizer to replace potential script tags or direct threats
    if (!html) return '';
    return html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return 'Salary not specified';
    if (!min) return `Up to R${max.toLocaleString()}`;
    if (!max) return `From R${min.toLocaleString()}`;
    return `R${min.toLocaleString()} - R${max.toLocaleString()}`;
  };

  // Filter computation
  const baseJobs = activeTab === 'Saved' 
    ? matches.filter((m: any) => savedJobsMap[m.job_id]) 
    : (activeTab === 'AllJobs' || (activeTab === 'Jobs' && matches.length === 0) ? allJobs : matches);

  const displayedJobs = baseJobs.filter((m: any) => {
    // 1. Keyword Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const titleMatch = m.title?.toLowerCase().includes(query);
      const companyMatch = m.company?.toLowerCase().includes(query);
      const locationMatch = m.location?.toLowerCase().includes(query);
      const descMatch = (m.description || m.job_description || '')?.toLowerCase().includes(query);
      if (!titleMatch && !companyMatch && !locationMatch && !descMatch) {
        return false;
      }
    }

    // 2. Country Filter
    if (selectedCountry !== 'All Countries') {
      const query = selectedCountry.toLowerCase().trim();
      if (!m.location?.toLowerCase().includes(query)) {
        return false;
      }
    }

    // 3. Type of Employment filter
    if (selectedEmploymentTypes.length > 0) {
      let matchesType = false;
      const text = `${m.title} ${m.description} ${m.job_description}`.toLowerCase();
      
      if (selectedEmploymentTypes.includes('Full Time Jobs') && (text.includes('full-time') || text.includes('full time') || text.includes('fulltime'))) {
        matchesType = true;
      }
      if (selectedEmploymentTypes.includes('Part Time Jobs') && (text.includes('part-time') || text.includes('part time') || text.includes('parttime'))) {
        matchesType = true;
      }
      if (selectedEmploymentTypes.includes('Remote Jobs') && (text.includes('remote') || m.location?.toLowerCase().includes('remote'))) {
        matchesType = true;
      }
      if (selectedEmploymentTypes.includes('Training Jobs') && (text.includes('training') || text.includes('intern') || text.includes('apprentice'))) {
        matchesType = true;
      }
      
      if (!matchesType) return false;
    }

    // 4. Seniority level filter
    if (selectedSeniorityLevels.length > 0) {
      let matchesSeniority = false;
      const exp = m.years_experience || 0;
      
      if (selectedSeniorityLevels.includes('Student Level') && exp <= 1) {
        matchesSeniority = true;
      }
      if (selectedSeniorityLevels.includes('Entry Level') && exp <= 2) {
        matchesSeniority = true;
      }
      if (selectedSeniorityLevels.includes('Mid Level') && exp >= 2 && exp <= 4) {
        matchesSeniority = true;
      }
      if (selectedSeniorityLevels.includes('Senior Level') && exp >= 4 && exp <= 7) {
        matchesSeniority = true;
      }
      if (selectedSeniorityLevels.includes('Directors') && exp >= 7 && exp <= 10) {
        matchesSeniority = true;
      }
      if (selectedSeniorityLevels.includes('VP or Above') && exp >= 10) {
        matchesSeniority = true;
      }
      
      if (!matchesSeniority) return false;
    }

    // 5. Salary Range filter
    const minSalary = m.salary_min || 0;
    const maxSalary = m.salary_max || 1000000;
    if (minSalary > salaryMaxRange || maxSalary < salaryMinRange) {
      return false;
    }

    return true;
  });

  const renderJobs = (jobList: any[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobList?.map((match: any) => {
          const isSaved = !!savedJobsMap[match.job_id];
          const expLevel = match.years_experience !== undefined ? (match.years_experience <= 2 ? 'Entry Level' : match.years_experience <= 5 ? 'Mid Level' : 'Senior Level') : 'Full Time';
          const rawDesc = match.description || match.job_description || match.fit_summary || 'No description available.';
          const cleanDesc = stripHtml(rawDesc);
          const previewText = cleanDesc.length > 250 ? cleanDesc.substring(0, 250) + '...' : cleanDesc;
          
          return (
            <div 
              key={match.id || match.job_id} 
              className="group bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-neutral-900/5 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
              onClick={() => setSelectedJob(match)}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo companyName={match.company} logo={match.tenantLogo} />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 group-hover:text-neutral-500 transition-colors">{match.company}</h4>
                      <p className="text-[11px] text-neutral-400 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span>{match.location || 'Remote'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleSaveJob(e, match.job_id)} 
                    className={`p-2 rounded-xl transition-all border ${
                      isSaved 
                        ? 'bg-[#A6F23C]/15 text-[#0A1B3D] border-[#A6F23C]/40' 
                        : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:text-[#0A1B3D] hover:bg-[#A6F23C]/15 hover:border-[#A6F23C]/40'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="mt-2">
                  <h3 className="font-bold text-base text-neutral-900 leading-snug tracking-tight group-hover:text-[#0A1B3D] transition-colors line-clamp-2 h-12">
                    {match.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {expLevel}
                    </span>
                    <span className="px-2.5 py-1 bg-[#A6F23C]/15 text-[#0A1B3D] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {formatSalary(match.salary_min, match.salary_max)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-neutral-500 mt-4 line-clamp-5 leading-relaxed min-h-[5.5rem] overflow-hidden">
                    {previewText}
                  </p>
                </div>
              </div>

              {match.match_score > 0 ? (() => {
                const score = match.match_score;
                let barColorClass = "from-rose-500 to-rose-400";
                let textColorClass = "text-rose-600";
                let bgBadgeClass = "bg-rose-50";
                let labelText = "Low Match";

                if (score >= 80) {
                  barColorClass = "from-emerald-500 to-teal-500";
                  textColorClass = "text-emerald-600";
                  bgBadgeClass = "bg-emerald-50";
                  labelText = "Excellent Match";
                } else if (score >= 60) {
                  barColorClass = "from-sky-500 to-blue-500";
                  textColorClass = "text-blue-600";
                  bgBadgeClass = "bg-blue-50";
                  labelText = "Strong Match";
                } else if (score >= 40) {
                  barColorClass = "from-amber-500 to-orange-500";
                  textColorClass = "text-amber-600";
                  bgBadgeClass = "bg-amber-50";
                  labelText = "Fair Match";
                }

                return (
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#0A1B3D] animate-pulse" />
                        <span>{labelText}</span>
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${textColorClass} ${bgBadgeClass}`}>
                        {score}% Match
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className={`h-full bg-gradient-to-r ${barColorClass} rounded-full transition-all duration-700 ease-out`} 
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })() : (
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">No Match Score</span>
                  <span className="text-[9px] font-bold text-[#0A1B3D] bg-[#A6F23C]/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    Upload CV
                  </span>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end items-center">
                <span className="text-[11px] font-extrabold text-[#0A1B3D] uppercase tracking-wider group-hover:underline flex items-center gap-1">
                  <span>View Details</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
        {(!jobList || jobList.length === 0) && (
          <div className="col-span-full text-center py-16 bg-white border border-neutral-200 rounded-2xl shadow-inner">
            <SlidersHorizontal className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h4 className="font-bold text-neutral-800 text-sm">No Jobs Found</h4>
            <p className="text-xs text-neutral-500 mt-1">Try clearing your search query or choosing another country.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0A1B3D] uppercase">
            Find Your Dream Job<span className="text-[#0A1B3D]/60 font-sans mx-1">!</span>
          </h1>
          <p className="text-sm font-semibold text-neutral-500 mt-1">
            Discover opportunities tailored for you, matched instantly by AI.
          </p>
        </div>

        <div className="flex gap-1 bg-white p-1.5 rounded-full border border-neutral-200">
          <button
            onClick={() => setActiveTab('Jobs')}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'Jobs'
                ? 'bg-[#A6F23C] text-[#0A1B3D] shadow-sm'
                : 'text-neutral-500 hover:text-[#0A1B3D]'
            }`}
          >
            <span>Best Matches</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'Jobs' ? 'bg-[#0A1B3D] text-white' : 'bg-neutral-200 text-neutral-600'}`}>
              {matches.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('AllJobs')}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'AllJobs'
                ? 'bg-[#A6F23C] text-[#0A1B3D] shadow-sm'
                : 'text-neutral-500 hover:text-[#0A1B3D]'
            }`}
          >
            <span>All Vacancies</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'AllJobs' ? 'bg-[#0A1B3D] text-white' : 'bg-neutral-200 text-neutral-600'}`}>
              {allJobs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('Saved')}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'Saved'
                ? 'bg-[#A6F23C] text-[#0A1B3D] shadow-sm'
                : 'text-neutral-500 hover:text-[#0A1B3D]'
            }`}
          >
            <span>Bookmarks</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'Saved' ? 'bg-[#0A1B3D] text-white' : 'bg-neutral-200 text-neutral-600'}`}>
              {Object.keys(savedJobsMap).filter(k => savedJobsMap[Number(k)]).length}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="relative flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Job title, keywords, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#A6F23C] text-neutral-900 text-sm placeholder-neutral-400"
            />
          </div>
          
          <div className="h-6 w-px bg-neutral-200 hidden md:block"></div>
          
          <div className="relative w-full md:w-56">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full pl-9 pr-8 py-3 bg-neutral-50 border border-neutral-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#A6F23C] text-xs text-neutral-600 font-bold cursor-pointer appearance-none"
            >
              <option value="All Countries">All Countries</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Germany">Germany</option>
              <option value="Canada">Canada</option>
              <option value="Remote">Remote Only</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          <button 
            onClick={() => setSearchQuery(searchQuery)}
            className="w-full md:w-auto px-6 py-3 bg-[#A6F23C] hover:bg-[#C8FF7A] active:scale-95 text-[#0A1B3D] font-black text-xs uppercase tracking-wider rounded-full transition shadow-lg shadow-[#A6F23C]/20 cursor-pointer"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
          <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Popular Searches:</span>
          {searchTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className={`px-3 py-1.5 border rounded-full transition-all font-bold text-[11px] cursor-pointer ${
                searchQuery === tag
                  ? 'bg-[#A6F23C] text-[#0A1B3D] border-[#A6F23C]'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-lg font-black tracking-tight text-[#0A1B3D] uppercase">
              {activeTab === 'Saved' ? 'Saved Bookmarks' : activeTab === 'AllJobs' ? 'All active vacancies' : 'AI matched feed'}
            </h3>
            <p className="text-xs text-neutral-400 font-bold mt-0.5">Showing {displayedJobs.length} opportunities</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider hidden sm:inline">Sort by:</span>
            <select className="bg-white border border-neutral-200 text-xs font-black text-neutral-700 rounded-full py-2 px-3 focus:outline-none cursor-pointer uppercase tracking-wide">
              <option>Newest Post</option>
              <option>Match Score</option>
              <option>Highest Salary</option>
            </select>
          </div>
        </div>

        {activeTab === 'Jobs' && matches.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm mb-6 transition-colors">
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider">No Resume Uploaded Yet</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Upload your resume in Profile settings to calculate AI match confidence scores and unlock detailed advice. Showing all active posts in the meantime.
              </p>
            </div>
            <button onClick={() => setActiveTab('Profile')} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap shadow transition-all self-start sm:self-center cursor-pointer">
              Upload Now
            </button>
          </div>
        )}

        {renderJobs(displayedJobs)}
      </div>

      {/* Selected Job Slide-over Detail overlay */}
      <AnimatePresence>
        {selectedJob && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="fixed inset-0 bg-[#0A1B3D]/50 backdrop-blur-xs z-50 transition-opacity"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-white shadow-2xl flex flex-col h-screen overflow-hidden border-l border-neutral-200 transition-colors"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedJob(null)} 
                    className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Close Panel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-black text-neutral-400 uppercase tracking-widest hidden sm:inline-block">Job Details</span>
                </div>

                <div className="flex items-center gap-2.5">
                  {(() => {
                    const isSaved = !!savedJobsMap[selectedJob.job_id];
                    return (
                      <button 
                        onClick={(e) => handleSaveJob(e, selectedJob.job_id)} 
                        className={`p-2.5 rounded-xl border transition-all ${
                          isSaved 
                            ? 'bg-[#A6F23C]/15 text-[#0A1B3D] border-[#A6F23C]/40' 
                            : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:text-[#0A1B3D] hover:bg-[#A6F23C]/15 hover:border-[#A6F23C]/40'
                        }`}
                        title={isSaved ? 'Remove from Saved' : 'Save Job Opportunity'}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    );
                  })()}

                  {(() => {
                    const hasApplied = (applications || []).some((app: any) => app.job?.id === selectedJob.job_id);
                    if (hasApplied) {
                      return (
                        <button 
                          disabled
                          className="bg-neutral-100 text-neutral-400 px-5 py-2.5 rounded-xl font-bold border border-neutral-200 text-sm flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <span>Applied</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </button>
                      );
                    }
                    return (
                      <button 
                        onClick={() => handleApply(selectedJob.job_id)} 
                        className="bg-[#A6F23C] hover:bg-[#C8FF7A] active:scale-95 text-[#0A1B3D] px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-[#A6F23C]/20 text-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Apply Now</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    );
                  })()}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-8 md:px-8 border-b border-neutral-200 bg-neutral-50/50">
                  <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                    <div className="flex gap-4 items-start">
                      <CompanyLogo companyName={selectedJob.company} logo={selectedJob.tenantLogo} />
                      <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0A1B3D] leading-tight uppercase font-sans tracking-tight">
                          {selectedJob.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-sm font-medium text-neutral-500">
                          <span className="text-[#0A1B3D] font-bold hover:underline cursor-pointer">{selectedJob.company}</span>
                          <span className="text-neutral-300">•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-neutral-400" />
                            {selectedJob.location || 'Remote'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:self-start">
                      <span className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider">
                        {selectedJob.years_experience !== undefined ? (selectedJob.years_experience <= 2 ? 'Entry Level' : selectedJob.years_experience <= 5 ? 'Mid Level' : 'Senior Level') : 'Full Time'}
                      </span>
                      <span className="px-3 py-1.5 bg-[#A6F23C]/15 text-[#0A1B3D] border border-[#A6F23C]/30 rounded-xl text-xs font-bold uppercase tracking-wider">
                        {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest pb-1.5 border-b border-neutral-100">
                        Job Description
                      </h3>
                      <div 
                        className="prose prose-sm max-w-none text-neutral-700 leading-relaxed text-sm space-y-4"
                        dangerouslySetInnerHTML={{ 
                          __html: sanitizeHtml(selectedJob.job_description || '<p>Description text unavailable.</p>') 
                        }} 
                      />
                    </div>

                    <div className="space-y-5 bg-[#A6F23C]/5 border border-[#A6F23C]/20 p-6 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#A6F23C]/20 pb-4">
                        <h3 className="text-sm font-bold text-[#0A1B3D] flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#0A1B3D]" />
                          <span>AI Match Analytics</span>
                        </h3>
                        {selectedJob.match_score > 0 ? (
                          <span 
                            className="px-3 py-1 rounded-xl text-xs font-black self-start sm:self-center bg-[#A6F23C]/20 text-[#0A1B3D]"
                          >
                            {selectedJob.match_score}% Confidence Match
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 font-medium self-start sm:self-center">
                            Upload resume to view fit score
                          </span>
                        )}
                      </div>

                      {selectedJob.match_score > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                            <span>Resume Match Bar</span>
                            <span className="text-[#0A1B3D] font-extrabold">{selectedJob.match_score}% Match</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#A6F23C] to-[#7dbf1f] rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${selectedJob.match_score}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-neutral-500 flex items-center gap-2 uppercase tracking-wider">
                            <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            <span>Matched Skills ({selectedJob.matched_skills?.length || 0})</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJob.matched_skills?.map((skill: string, i: number) => (
                              <span 
                                key={i} 
                                className="text-xs bg-emerald-50/80 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg font-bold"
                              >
                                {skill}
                              </span>
                            ))}
                            {(!selectedJob.matched_skills || selectedJob.matched_skills.length === 0) && (
                              <p className="text-xs text-neutral-400 italic">None matched yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-neutral-500 flex items-center gap-2 uppercase tracking-wider">
                            <ShieldAlert className="w-4 h-4 text-rose-500" />
                            <span>Missing Skills ({selectedJob.missing_skills?.length || 0})</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJob.missing_skills?.map((skill: string, i: number) => (
                              <span 
                                key={i} 
                                className="text-xs bg-rose-50/80 border border-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-bold"
                              >
                                {skill}
                              </span>
                            ))}
                            {(!selectedJob.missing_skills || selectedJob.missing_skills.length === 0) && (
                              <p className="text-xs text-neutral-400 italic">None identified.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedJob.fit_summary && (
                        <div className="border-t border-[#A6F23C]/20 pt-4 mt-2">
                          <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2">
                            Recruiter Advice Summary
                          </h4>
                          <p className="text-xs text-neutral-700 leading-relaxed italic bg-white p-4 rounded-xl border border-neutral-100 shadow-xs border-l-4 border-[#A6F23C]">
                            &ldquo;{selectedJob.fit_summary}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-6 lg:border-l lg:border-neutral-200 lg:pl-8">
                    <div>
                      <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pb-1.5 border-b border-neutral-100 mb-4">
                        Job Overview
                      </h4>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#A6F23C]/15 rounded-lg text-[#0A1B3D]">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Salary Range</p>
                            <p className="text-sm font-bold text-neutral-800 mt-0.5">
                              {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#A6F23C]/15 rounded-lg text-[#0A1B3D]">
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Experience Level</p>
                            <p className="text-sm font-bold text-neutral-800 mt-0.5">
                              {selectedJob.years_experience !== undefined ? `${selectedJob.years_experience} Years Required` : 'Not Specified'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#A6F23C]/15 rounded-lg text-[#0A1B3D]">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Location</p>
                            <p className="text-sm font-bold text-neutral-800 mt-0.5">
                              {selectedJob.location || 'Remote'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#A6F23C]/15 rounded-lg text-[#0A1B3D]">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Company Profile</p>
                            <p className="text-sm font-bold text-neutral-800 mt-0.5">
                              {selectedJob.company}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-2.5">
                      <h4 className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-[#0A1B3D]" />
                        <span>Candidate Tip</span>
                      </h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Tailor your profile description and highlight matching skills on your resume to increase your AI Fit Score.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
