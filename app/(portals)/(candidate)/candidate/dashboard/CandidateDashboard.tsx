'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, FileText, Upload, Briefcase, Eye, BadgeCheck, ShieldAlert, ArrowLeft, User, Bookmark, BookmarkCheck, Moon, Sun, CheckCircle2, XCircle, Clock, PlusCircle, Video, Mail, Heart, MapPin, ChevronDown, SlidersHorizontal, X, ExternalLink, Calendar, DollarSign, Award, ThumbsUp, Building, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import sanitizeHtml from 'sanitize-html';
import { useTheme } from 'next-themes';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import CandidateNavbar from '@/components/CandidateNavbar';
import PracticeHeatmap from '@/components/PracticeHeatmap';
import LaunchpathMuxPlayer from '@/app/components/LaunchpathMuxPlayer';

const LAUNCHPATH_POSTER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNDUwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ2xvdyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxZTFiNGIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI0MCUiIHN0b3AtY29sb3I9IiMwZjE3MmEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDIwNjE3Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJicmFuZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNzE0NUZGIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzhiNWNmNiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9InVybCgjZ2xvdykiLz4KICAKICA8IS0tIFN1YnRsZSBmdXR1cmlzdGljIGxpbmVzIC0tPgogIDxnIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSI+CiAgICA8bGluZSB4MT0iMTAwIiB5MT0iMCIgeDI9IjEwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjIwMCIgeTE9IjAiIHgyPSIyMDAiIHkyPSI0NTAiLz4KICAgIDxsaW5lIHgxPSIzMDAiIHkxPSIwIiB4Mj0iMzAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iNDAwIiB5MT0iMCIgeDI9IjQwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjUwMCIgeTE9IjAiIHgyPSI1MDAiIHkyPSI0NTAiLz4KICAgIDxsaW5lIHgxPSI2MDAiIHkxPSIwIiB4Mj0iNjAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iNzAwIiB5MT0iMCIgeDI9IjcwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjAiIHkxPSIxMDAiIHgyPSI4MDAiIHkyPSIxMDAiLz4KICAgIDxsaW5lIHgxPSIwIiB5MT0iMjAwIiB4Mj0iODAwIiB5Mj0iMjAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iMzAwIiB4Mj0iODAwIiB5Mj0iMzAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iNDAwIiB4Mj0iODAwIiB5Mj0iNDAwIi8+CiAgPC9nPgogIDxjaXJjbGUgY3g9IjQwMCIgY3k9IjIyNSIgcj0iMTQwIiBmaWxsPSIjNzE0NUZGIiBmaWxsLW9wYWNpdHk9IjAuMTUiIGZpbHRlcj0iYmx1cig2MHB4KSIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiMzYjgyZjYiIGZpbGwtb3BhY2l0eT0iMC4xIiBmaWx0ZXI9ImJsdXIoNDBweCkiLz4KICA8cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSI3MDAiIGhlaWdodD0iMzUwIiByeD0iMjAiIGZpbGw9IiMwZjE3MmEiIGZpbGwtb3BhY2l0eT0iMC41IiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Utb3BhY2l0eT0iMC40Ii8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTkwIiByPSI0NSIgZmlsbD0iIzcxNDVGRiIgZmlsbC1vcGFjaXR5PSIwLjIiIHN0cm9rZT0iIzcxNDVGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTkwIiByPSIzNSIgZmlsbD0idXJsKCNicmFuZCkiLz4KICA8cG9seWdvbiBwb2ludHM9IjM5MiwxNzcgNDE1LDE5MCAzOTIsMjAzIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHJlY3QgeD0iMzEwIiB5PSIyNzAiIHdpZHRoPSIxODAiIGhlaWdodD0iMjQiIHJ4PSIxMiIgZmlsbD0iIzcxNDVGRiIgZmlsbC1vcGFjaXR5PSIwLjE1IiBzdHJva2U9IiM3MTQ1RkYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMyIvPgogIDx0ZXh0IHg9IjQwMCIgeT0iMjg1IiBmaWxsPSIjYTc4YmZhIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Db2wsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9IjkwMCIgbGV0dGVyLXNwYWNpbmc9IjEuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgdGV4dC10cmFuc2Zvcm09InVwcGVyY2FzZSI+TEFVTkNIUEFUSCBWRVJJRklFRDwvdGV4dD4KICA8dGV4dCB4PSI0MDAiIHk9IjMyNSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtQ29sLCAnU2Vnb2UgVUknLCBSb2JvdG8sIE91dGZpdCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9IjgwMCIgbGV0dGVyLXNwYWNpbmc9Ii0wLjUiIHRleHQtYW5jaG9yPSJuYXR1cmFsIj5BSSBSRUFESU5FU1MgVklERU8gSU5URVJWSUVXPC90ZXh0PgogIDx0ZXh0IHg9IjQwMCIgeT0iMzQ3IiBmaWxsPSIjOTRhM2I4IiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Db2wsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9IjUwMCIgdHJhY2tpbmc9IjAuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VjdXJlIFdlYlJUQyBUaW1lZCBFeGVjdXRpdmUgUHJlc2VudGF0aW9uPC90ZXh0PgogIDx0ZXh0IHg9IjgwIiB5PSI5MCIgZmlsbD0iIzY0NzQ4YiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMSIgZm9udC13ZWlnaHQ9IjcwMCI+RkVFRF9TVFJFQU06IEFDVElWRTwvdGV4dD4KICA8Y2lyY2xlIGN4PSIyMTUiIGN5PSI4NiIgcj0iNCIgZmlsbD0iIzEwYjk4MSIvPgogIDx0ZXh0IHg9IjcyMCIgeT0iOTAiIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTEiIHRleHQtYW5jaG9yPSJlbmQiPjQvNCBNT0RVTEVTIENPTVBMRVRFRDwvdGV4dD4KPC9zdmc+";

function CircularProgress({ score }: { score: number }) {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];
  const COLORS = [score >= 80 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626', 'transparent'];

  return (
    <div className="w-12 h-12 relative flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full">
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={18}
              outerRadius={24}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-800 dark:text-slate-200">
        {score}%
      </div>
    </div>
  );
}

const getResumeStrength = (text: string | null | undefined) => {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      label: 'No CV Uploaded',
      color: 'text-neutral-400 dark:text-neutral-500',
      textColor: 'text-neutral-500',
      barColor: 'bg-neutral-200 dark:bg-neutral-850',
      tips: [
        'Upload your PDF resume below to trigger AI analysis and get job matches.',
        'Ensure your document is in standard single-column PDF format for best parse rates.'
      ],
      checks: {
        contact: false,
        skills: false,
        experience: false,
        education: false,
        metrics: false,
      }
    };
  }

  const lowercase = text.toLowerCase();
  const checks = {
    contact: /email|@|\+?\d[\d\s-]{7,}/i.test(lowercase) || lowercase.includes('phone') || lowercase.includes('contact'),
    skills: /skills|technologies|proficiencies|languages/i.test(lowercase) && lowercase.split(/skills|technologies/i)[1]?.length > 15,
    experience: /experience|work history|employment|career|history/i.test(lowercase),
    education: /education|degree|university|college|school|academic/i.test(lowercase),
    metrics: /%|\d+\s*%/i.test(lowercase) || /achieved|managed|led|increased|saved|reduced|budget/i.test(lowercase),
  };

  let score = 25; // Base score for having text
  if (checks.contact) score += 15;
  if (checks.skills) score += 15;
  if (checks.experience) score += 15;
  if (checks.education) score += 15;
  if (checks.metrics) score += 15;

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 300) score += 5;
  
  if (score > 100) score = 100;

  let label = 'Needs Improvement';
  let color = 'text-rose-500 dark:text-rose-400';
  let textColor = 'text-rose-700 dark:text-rose-300';
  let barColor = 'from-rose-500 to-rose-400';
  
  if (score >= 80) {
    label = 'Excellent / Industry Standard';
    color = 'text-[#22c55e] dark:text-[#22c55e]';
    textColor = 'text-emerald-700 dark:text-emerald-300';
    barColor = 'from-emerald-500 to-teal-400';
  } else if (score >= 60) {
    label = 'Good Strength';
    color = 'text-[#5D3FD3] dark:text-violet-400';
    textColor = 'text-indigo-700 dark:text-indigo-300';
    barColor = 'from-indigo-500 to-violet-500';
  } else if (score >= 40) {
    label = 'Average';
    color = 'text-amber-500 dark:text-amber-400';
    textColor = 'text-amber-700 dark:text-amber-300';
    barColor = 'from-amber-500 to-orange-400';
  }

  const tips: string[] = [];
  if (!checks.contact) {
    tips.push('Include professional contact information (such as an email, phone number, and LinkedIn URL) in the top section.');
  }
  if (!checks.skills) {
    tips.push('Add a dedicated "Skills" or "Technologies" section cleanly list out your toolstack to pass automated keyword screens.');
  }
  if (!checks.experience) {
    tips.push('Flesh out your professional timeline, mentioning detailed technical roles, major projects, and precise durations.');
  }
  if (!checks.education) {
    tips.push('Ensure your formal degrees, diplomas, or vocational certifications are structured cleanly under "Education".');
  }
  if (!checks.metrics) {
    tips.push('Quantify your contributions! Use dynamic action verbs and numeric metrics (e.g., "Led team of 4", "Boosted speeds by 25%").');
  }
  if (wordCount < 150) {
    tips.push('Your CV content is very short. Expand on your projects, certifications, or specific tech tools to demonstrate full depth.');
  }

  if (tips.length === 0) {
    tips.push('Excellent CV format! Your resume contains all standard structures needed for candidate match calculations.');
    tips.push('You can tailor specific keywords to match the "Missing Skills" listed on jobs to push match percentages even higher.');
  }

  return {
    score,
    label,
    color,
    textColor,
    barColor,
    tips,
    checks
  };
};

function CompanyLogo({ companyName, logo }: { companyName: string; logo?: string | null }) {
  if (logo) {
    return (
      <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white flex items-center justify-center flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={`${companyName} Logo`} className="w-full h-full object-cover" />
      </div>
    );
  }
  const name = companyName || 'Unknown';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 5;
  
  const gradients = [
    'from-emerald-400 to-teal-600',
    'from-orange-400 to-red-500',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-slate-800 to-slate-950',
  ];
  
  const patterns = [
    <svg key="1" className="w-5 h-5 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>,
    <svg key="2" className="w-5 h-5 text-white opacity-90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="10" cy="12" r="5" />
      <circle cx="14" cy="12" r="5" />
    </svg>,
    <svg key="3" className="w-5 h-5 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 22h20L12 2zm0 4l6.5 13H5.5L12 6z" />
    </svg>,
    <svg key="4" className="w-5 h-5 text-white opacity-90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>,
    <span key="5" className="text-white text-xs font-black tracking-tighter uppercase">{name.substring(0, 2)}</span>
  ];

  return (
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[index]} flex items-center justify-center shadow-inner overflow-hidden select-none flex-shrink-0`}>
      {patterns[index]}
    </div>
  );
}

function CategoryBreakdownChart({ questions }: { questions: any[] }) {
  const hasScores = Array.isArray(questions) && questions.some((q) => (q.questionScore || q.score || 0) > 0);
  if (!hasScores) {
    return (
      <div className="w-full h-[140px] mt-1.5 flex items-center justify-center text-center">
        <p className="text-xs text-slate-400 dark:text-slate-505 italic">
          Awaiting manual grading by Super Admin to plot metrics.
        </p>
      </div>
    );
  }

  const data = questions.map((q) => {
    let shortName = q.title || '';
    if (q.title && q.title.includes('&')) {
      shortName = q.title.split('&')[0].trim();
    }
    return {
      category: shortName,
      score: q.questionScore || 0,
    };
  });

  return (
    <div className="w-full h-[140px] mt-1.5 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 10, left: -24, bottom: 2 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            dataKey="category"
            type="category"
            axisLine={false}
            tickLine={false}
            width={120}
            tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
          />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '11.5px',
              color: '#fff',
            }}
            cursor={{ fill: 'rgba(113, 69, 255, 0.05)' }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={11}>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill="#5D3FD3" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReadinessGauge({ score, status }: { score: number | null | undefined; status?: string }) {
  const isPending = status === 'PENDING_REVIEW';
  const hasScore = !isPending && typeof score === 'number' && score >= 0;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (hasScore) {
      const timer = setTimeout(() => {
        setAnimatedScore(score);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [score, hasScore]);

  const displayScore = hasScore ? animatedScore : 0;
  
  // LaunchPath theme: Premium violet #5D3FD3.
  const strokeColor = hasScore 
    ? (score >= 80 ? '#5D3FD3' : score >= 50 ? '#a78bfa' : '#ef4444')
    : '#cbd5e1';

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - displayScore / 100);

  return (
    <div className="ready-score-gauge w-12 h-12 relative flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm">
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90 p-1">
          <circle 
            cx="24" 
            cy="24" 
            r={radius} 
            stroke="currentColor" 
            className="text-slate-200 dark:text-slate-700" 
            strokeWidth="3.2" 
            fill="transparent" 
          />
          {hasScore ? (
            <circle 
              cx="24" 
              cy="24" 
              r={radius} 
              stroke={strokeColor} 
              strokeWidth="3.2" 
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ transitionProperty: 'stroke-dashoffset' }}
            />
          ) : isPending ? (
            <circle 
              cx="24" 
              cy="24" 
              r={radius} 
              stroke="#f59e0b" 
              strokeWidth="3.2" 
              strokeDasharray="4,2" 
              fill="transparent" 
              className="animate-spin text-amber-500"
              style={{ transformOrigin: 'center', animationDuration: '6s' }}
            />
          ) : (
            <circle 
              cx="24" 
              cy="24" 
              r={radius} 
              stroke="#cbd5e1" 
              strokeWidth="1.5" 
              strokeDasharray="3,3" 
              fill="transparent" 
              className="text-slate-350 dark:text-slate-600"
            />
          )}
        </svg>
      </div>
      <div className="absolute inset-y-0 inset-x-0 flex items-center justify-center">
        {isPending ? (
          <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
        ) : (
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-none">
            {hasScore ? `${Math.round(displayScore)}%` : '—'}
          </span>
        )}
      </div>
    </div>
  );
}

const getProfileCompletion = (u: any) => {
  const items = [
    { label: 'Full Name', filled: !!u?.name, weight: 10 },
    { label: 'Professional Title', filled: !!u?.professional_title, weight: 10 },
    { label: 'Contact Phone', filled: !!u?.phone, weight: 10 },
    { label: 'Qualifications & Academics', filled: !!u?.qualifications, weight: 15 },
    { label: 'Skills & Interests', filled: !!u?.skills, weight: 15 },
    { label: 'Work & Volunteer Experience', filled: !!u?.work_experience, weight: 15 },
    { label: 'CV / Resume Uploaded', filled: !!u?.resume_text, weight: 15 },
    { label: 'LinkedIn & Portfolio Link', filled: !!u?.linkedin_url || !!u?.github_url || !!u?.portfolio_url, weight: 10 }
  ];

  const totalScore = items.reduce((sum, item) => sum + (item.filled ? item.weight : 0), 0);
  return {
    score: totalScore,
    items
  };
};

export default function CandidateDashboard({ data, user, onRefresh, onLogout }: { data: any, user: any, onRefresh: () => void, onLogout: () => void }) {
  const { matches = [], savedJobs: initialSaved = [], applications = [], allJobs = [], readinessInterview = null } = data || {};
  const [activeTab, setActiveTab ] = useState('Jobs');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>(['Product Designer', 'Artist', 'Game Designer', 'Designer']);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([]);
  const [selectedSeniorityLevels, setSelectedSeniorityLevels] = useState<string[]>([]);
  const [salaryMinRange, setSalaryMinRange] = useState<number>(10000);
  const [salaryMaxRange, setSalaryMaxRange] = useState<number>(500000);
  const [selectedCountry, setSelectedCountry] = useState<string>('All Countries');
  const [selectedJobTypeDropdown, setSelectedJobTypeDropdown] = useState<string>('Job Type');
  const [selectedSalaryDropdown, setSelectedSalaryDropdown] = useState<string>('Salary Range');
  const [employmentCollapse, setEmploymentCollapse] = useState(false);
  const [seniorityCollapse, setSeniorityCollapse] = useState(false);
  const [salaryCollapse, setSalaryCollapse] = useState(false);
  const [savedJobsMap, setSavedJobsMap] = useState<Record<number, boolean>>(() => {
    const acc: Record<number, boolean> = {};
    initialSaved.forEach((id: number) => { acc[id] = true; });
    return acc;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);

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

  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch('/api/candidate/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/candidate/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam && ['Jobs', 'AllJobs', 'Saved', 'Applications', 'Profile', 'Inbox'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.pushState(null, '', url.pathname + url.search);
    }
  }, [activeTab, mounted]);

  // LinkedIn OAuth event listener & popup initiator
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        alert('LinkedIn Profile Synced Successfully! Syncing matching pipeline...');
        onRefresh();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRefresh]);

  const [syncingLinkedIn, setSyncingLinkedIn] = useState(false);

  const handleLinkedInConnect = async () => {
    try {
      setSyncingLinkedIn(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`/api/auth/linkedin/url?origin=${encodeURIComponent(origin)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch auth url');
      }
      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        'linkedin_oauth_popup',
        'width=600,height=700'
      );
      if (!authWindow) {
        alert('Please allow popups for this site to connect your LinkedIn account.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error fetching LinkedIn Auth URL: ' + err.message);
    } finally {
      setSyncingLinkedIn(false);
    }
  };

  // Profile Settings State
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resumeTask, setResumeTask] = useState<any>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<number, boolean>>({});
  const [hasInitializedTask, setHasInitializedTask] = useState(false);

  // Profile editable details state
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);

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
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchTaskStatus = async () => {
      try {
        const res = await fetch('/api/candidate/resume-status');
        if (res.ok) {
          const { task } = await res.json();
          if (task) {
            const isFinished = task.status === 'COMPLETED' || task.status === 'FAILED';

            // If checking on mount and the task is already finished, ignore it
            if (!hasInitializedTask && isFinished) {
              setCompletedTaskIds(prev => ({ ...prev, [task.id]: true }));
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
              setCompletedTaskIds(prev => ({ ...prev, [task.id]: true }));
              setTimeout(() => {
                setResumeTask(null);
                onRefresh(); // refresh dashboard data to get new matches
              }, 3000);
            } else if (task.status === 'FAILED') {
              setResumeTask(task);
              setCompletedTaskIds(prev => ({ ...prev, [task.id]: true }));
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
  }, [resumeTask, completedTaskIds, hasInitializedTask, onRefresh]);

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
      } else {
        const errorData = await res.json();
        alert('Error uploading resume: ' + errorData.error);
      }
    } catch (err: any) {
      alert('Error uploading resume: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async (jobId: number) => {
    try {
      const res = await fetch('/api/candidate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        alert('Application submitted successfully!');
        onRefresh();
      } else {
        alert('Failed to apply. You may have already applied.');
      }
    } catch (err) {
      alert('Error submitting application.');
    }
  };

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
        setSavedJobsMap(prev => ({ ...prev, [jobId]: d.saved }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    
    try {
      const res = await fetch('/api/candidate/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword })
      });
      if (res.ok) {
         alert('Account settings updated successfully. If email or password was changed, please log in again.');
         window.location.reload();
      } else {
         const d = await res.json();
         alert('Failed to update: ' + d.error);
      }
    } catch (e) {
      alert('Error updating settings.');
    }
  };

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
        }),
      });

      if (res.ok) {
        const result = await res.json();
        alert('Profile saved successfully!');
        setIsEditingProfile(false);
        setIsEditingResume(false);
        if (result.taskId) {
          setResumeTask({ status: 'PROCESSING', progress: 0, id: result.taskId });
        }
        onRefresh();
      } else {
        const err = await res.json();
        alert('Failed to save profile: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error updating profile details.');
    } finally {
      setIsSavingProfile(false);
    }
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
              className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-neutral-900/5 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
              onClick={() => setSelectedJob(match)}
            >
              <div>
                {/* Top card header */}
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
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' 
                        : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:bg-neutral-850 dark:text-neutral-500 dark:border-neutral-800 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 dark:hover:border-emerald-900/50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Job Details */}
                <div className="mt-2">
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white leading-snug tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 h-12">
                    {match.title}
                  </h3>
                  
                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-350 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {expLevel}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {formatSalary(match.salary_min, match.salary_max)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 line-clamp-5 leading-relaxed min-h-[5.5rem] overflow-hidden">
                    {previewText}
                  </p>
                </div>
              </div>

              {/* Match Score Progress Bar */}
              {match.match_score > 0 ? (() => {
                const score = match.match_score;
                let barColorClass = "from-rose-500 to-rose-400";
                let textColorClass = "text-rose-600 dark:text-rose-400";
                let bgBadgeClass = "bg-rose-50 dark:bg-rose-950/20";
                let labelText = "Low Match";

                if (score >= 80) {
                  barColorClass = "from-emerald-500 to-teal-500";
                  textColorClass = "text-emerald-600 dark:text-[#22c55e]";
                  bgBadgeClass = "bg-emerald-50 dark:bg-emerald-950/20";
                  labelText = "Excellent Match";
                } else if (score >= 60) {
                  barColorClass = "from-indigo-500 to-violet-500";
                  textColorClass = "text-[#5D3FD3] dark:text-violet-400";
                  bgBadgeClass = "bg-violet-50 dark:bg-violet-950/20";
                  labelText = "Strong Match";
                } else if (score >= 40) {
                  barColorClass = "from-amber-500 to-orange-500";
                  textColorClass = "text-amber-600 dark:text-amber-400";
                  bgBadgeClass = "bg-amber-50 dark:bg-amber-950/20";
                  labelText = "Fair Match";
                }

                return (
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/40">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#5D3FD3] dark:text-violet-400 animate-pulse" />
                        <span>{labelText}</span>
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${textColorClass} ${bgBadgeClass}`}>
                        {score}% Match
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className={`h-full bg-gradient-to-r ${barColorClass} rounded-full transition-all duration-700 ease-out`} 
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })() : (
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/40 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">No Match Score</span>
                  <span className="text-[9px] font-bold text-[#5D3FD3] bg-violet-50 dark:bg-violet-950/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    Upload CV
                  </span>
                </div>
              )}

              {/* Bottom stats footer */}
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end items-center">
                <span className="text-[11px] font-extrabold text-emerald-500 uppercase tracking-wider group-hover:underline flex items-center gap-1">
                  <span>View Details</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
        {(!jobList || jobList.length === 0) && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-2xl shadow-inner">
            <SlidersHorizontal className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">No Jobs Found</h4>
            <p className="text-xs text-neutral-500 mt-1">Try clearing your search query or choosing another country.</p>
          </div>
        )}
      </div>
    );
  };

  const handleUpdateInterview = async (interviewId: number, status: string) => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert('Interview status updated successfully.');
        onRefresh();
      } else {
        alert('Failed to update interview.');
      }
    } catch (e) {
      alert('Error updating interview.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />;
      case 'Interviewing': return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-500" />;
      case 'Hired': return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-600 dark:text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

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

    // 3. Country Filter
    if (selectedCountry !== 'All Countries') {
      const query = selectedCountry.toLowerCase().trim();
      if (!m.location?.toLowerCase().includes(query)) {
        return false;
      }
    }

    // 4. Type of Employment filter
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

    // 5. Seniority level filter
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

    // 6. Salary Range filter
    const minSalary = m.salary_min || 0;
    const maxSalary = m.salary_max || 1000000;
    if (minSalary > salaryMaxRange || maxSalary < salaryMinRange) {
      return false;
    }

    return true;
  });

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
        <div className="flex-1 overflow-y-auto p-8">
        {/* TAB 1: JOB BROWSER & SAVED JOBS */}
        {(activeTab === 'Jobs' || activeTab === 'Saved' || activeTab === 'AllJobs') && (
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
                  Find Your Dream Job<span className="text-emerald-500 font-sans mx-1">!</span>
                </h1>
                <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mt-1">
                  Discover opportunities tailored for you, matched instantly by AI.
                </p>
              </div>

              {/* Nested Sub-navigation Tabs */}
              <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setActiveTab('Jobs')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'Jobs'
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <span>Best Matches</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'Jobs' ? 'bg-emerald-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600'}`}>
                    {matches.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('AllJobs')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'AllJobs'
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <span>All Vacancies</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'AllJobs' ? 'bg-emerald-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600'}`}>
                    {allJobs.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('Saved')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'Saved'
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <span>Bookmarks</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'Saved' ? 'bg-emerald-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600'}`}>
                    {Object.keys(savedJobsMap).filter(k => savedJobsMap[Number(k)]).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Search Bar Block */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="relative flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100 text-sm placeholder-neutral-400"
                  />
                </div>
                
                <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 hidden md:block"></div>
                
                {/* Country dropdown */}
                <div className="relative w-full md:w-56">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs text-neutral-600 dark:text-neutral-400 font-bold cursor-pointer appearance-none"
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
                  className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  Search
                </button>
              </div>

              {/* Popular Searches */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Popular Searches:</span>
                {searchTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className={`px-3 py-1.5 border rounded-lg transition-all font-bold text-[11px] cursor-pointer ${
                      searchQuery === tag
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600 dark:bg-neutral-850 dark:hover:bg-neutral-800 dark:border-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Main content grid: Centered and full-width (No filter sidebar) */}
            <div className="space-y-6">
              
              {/* Feed Header */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white uppercase">
                    {activeTab === 'Saved' ? 'Saved Bookmarks' : activeTab === 'AllJobs' ? 'All active vacancies' : 'AI matched feed'}
                  </h3>
                  <p className="text-xs text-neutral-400 font-bold mt-0.5">Showing {displayedJobs.length} opportunities</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider hidden sm:inline">Sort by:</span>
                  <select className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-black text-neutral-700 dark:text-neutral-300 rounded-xl py-2 px-3 focus:outline-none cursor-pointer uppercase tracking-wide">
                    <option>Newest Post</option>
                    <option>Match Score</option>
                    <option>Highest Salary</option>
                  </select>
                </div>
              </div>

              {/* Resume Warning if needed */}
              {activeTab === 'Jobs' && matches.length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 p-5 rounded-2xl text-amber-900 dark:text-amber-305 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm mb-6 transition-colors">
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider">No Resume Uploaded Yet</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                      Upload your resume in Profile settings to calculate AI match confidence scores and unlock detailed advice. Showing all active posts in the meantime.
                    </p>
                  </div>
                  <button onClick={() => setActiveTab('Profile')} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap shadow transition-all self-start sm:self-center cursor-pointer">
                    Upload Now
                  </button>
                </div>
              )}

              {/* Main Render List */}
              {renderJobs(displayedJobs)}

            </div>
          </div>
        )}

        {/* TAB APPLICATIONS */}
        {activeTab === 'Applications' && (
           <div className="max-w-6xl mx-auto space-y-6">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold dark:text-white">My Applications</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 pb-1">Track the status of your submitted applications.</p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {applications.length > 0 ? applications.map((app: any) => (
                    <div key={app.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col gap-4">
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                         <div>
                           <h3 className="font-bold text-lg text-slate-950 dark:text-white leading-normal">{app.job.title}</h3>
                           <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">{app.job.company} • {app.job.location}</p>
                           <p className="text-xs text-slate-550 mt-2 font-medium">Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                         </div>
                         <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg shadow-sm mt-3 sm:mt-0">
                           {getStatusIcon(app.status)}
                           <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{app.status}</span>
                         </div>
                       </div>
                       
                       {app.interviews && app.interviews.length > 0 && (
                         <div className="mt-2 pl-4 border-l-2 border-blue-200 dark:border-blue-900">
                           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interviews</h4>
                           {app.interviews.map((iv: any) => (
                             <div key={iv.id} className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-3">
                               <div>
                                 <p className="font-bold text-slate-800 dark:text-slate-200">{new Date(iv.proposed_time).toLocaleString()}</p>
                                 <p className="text-slate-600 text-xs mt-1">Status: <strong className={iv.status === 'Confirmed' ? 'text-green-600' : 'text-amber-600'}>{iv.status}</strong></p>
                                 {iv.notes && <p className="text-slate-600 dark:text-slate-400 text-xs italic mt-1 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">{iv.notes}</p>}
                               </div>
                               {iv.status === 'Proposed' && (
                                 <div className="flex gap-2">
                                   <button onClick={() => handleUpdateInterview(iv.id, 'Confirmed')} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold cursor-pointer">Confirm</button>
                                   <button onClick={() => handleUpdateInterview(iv.id, 'Rescheduled')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold cursor-pointer">Request Reschedule</button>
                                   <button onClick={() => handleUpdateInterview(iv.id, 'Cancelled')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer">Decline</button>
                                 </div>
                               )}
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  )) : (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium pb-12">
                      You haven&apos;t submitted any job applications yet.
                    </div>
                  )}
                </div>
             </div>
           </div>
        )}

        {/* JOB DETAIL PANEL (Upwork-style slide-over panel) */}
        <AnimatePresence>
          {selectedJob && (
            <>
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedJob(null)}
                className="fixed inset-0 bg-neutral-950/50 dark:bg-neutral-950/70 backdrop-blur-xs z-50 transition-opacity"
              />

              {/* Slide-over Drawer Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col h-screen overflow-hidden border-l border-neutral-200 dark:border-neutral-800 transition-colors"
              >
                {/* Drawer Sticky Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between gap-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedJob(null)} 
                      className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Close Panel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest hidden sm:inline-block">Job Details</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Bookmark Toggle */}
                    {(() => {
                      const isSaved = !!savedJobsMap[selectedJob.job_id];
                      return (
                        <button 
                          onClick={(e) => handleSaveJob(e, selectedJob.job_id)} 
                          className={`p-2.5 rounded-xl border transition-all ${
                            isSaved 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' 
                              : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:text-[#5D3FD3] hover:bg-violet-50 hover:border-violet-200 dark:bg-neutral-850 dark:text-neutral-500 dark:border-neutral-800 dark:hover:bg-violet-950/20 dark:hover:text-[#5D3FD3]/80 dark:hover:border-[#5D3FD3]/40'
                          }`}
                          title={isSaved ? 'Remove from Saved' : 'Save Job Opportunity'}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      );
                    })()}

                    {/* Apply Button */}
                    {(() => {
                      const hasApplied = (applications || []).some((app: any) => app.job?.id === selectedJob.job_id);
                      if (hasApplied) {
                        return (
                          <button 
                            disabled
                            className="bg-neutral-100 dark:bg-neutral-800 text-neutral-450 dark:text-neutral-400 px-5 py-2.5 rounded-xl font-bold border border-neutral-250 dark:border-neutral-700 text-sm flex items-center gap-1.5 cursor-not-allowed"
                          >
                            <span>Applied</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </button>
                        );
                      }
                      return (
                        <button 
                          onClick={() => handleApply(selectedJob.job_id)} 
                          style={{ backgroundColor: '#5D3FD3' }}
                          className="hover:opacity-90 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-[#5D3FD3]/10 text-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Apply Now</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Job Header Info Block */}
                  <div className="px-6 py-8 md:px-8 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/10">
                    <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                      <div className="flex gap-4 items-start">
                        <CompanyLogo companyName={selectedJob.company} logo={selectedJob.tenantLogo} />
                        <div>
                          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 dark:text-white leading-tight uppercase font-sans tracking-tight">
                            {selectedJob.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            <span className="text-[#5D3FD3] dark:text-[#7d62ef] font-bold hover:underline cursor-pointer">{selectedJob.company}</span>
                            <span className="text-neutral-300 dark:text-neutral-700">•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-neutral-400" />
                              {selectedJob.location || 'Remote'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Experience & Salary badges */}
                      <div className="flex flex-wrap gap-2 sm:self-start">
                        <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider">
                          {selectedJob.years_experience !== undefined ? (selectedJob.years_experience <= 2 ? 'Entry Level' : selectedJob.years_experience <= 5 ? 'Mid Level' : 'Senior Level') : 'Full Time'}
                        </span>
                        <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl text-xs font-bold uppercase tracking-wider">
                          {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Split Layout Section */}
                  <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Details Panel (Job description & Skills) */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Job Description */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                          Job Description
                        </h3>
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm space-y-4"
                          dangerouslySetInnerHTML={{ 
                            __html: sanitizeHtml(selectedJob.job_description || '<p>Description text unavailable.</p>') 
                          }} 
                        />
                      </div>

                      {/* AI Fit Analysis Block */}
                      <div className="space-y-5 bg-violet-50/20 dark:bg-violet-950/5 border border-violet-100/40 dark:border-violet-900/10 p-6 rounded-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-100/30 dark:border-violet-900/10 pb-4">
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#5D3FD3]" />
                            <span>AI Match Analytics</span>
                          </h3>
                          {selectedJob.match_score > 0 ? (
                            <span 
                              style={{ color: '#5D3FD3', backgroundColor: 'rgba(93, 63, 211, 0.1)' }}
                              className="px-3 py-1 rounded-xl text-xs font-black self-start sm:self-center"
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
                              <span className="text-[#5D3FD3] dark:text-violet-400 font-extrabold">{selectedJob.match_score}% Match</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-850 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-[#5D3FD3] rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${selectedJob.match_score}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Matched / Missing skills row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Matched Skills */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-2 uppercase tracking-wider">
                              <BadgeCheck className="w-4 h-4 text-emerald-500" />
                              <span>Matched Skills ({selectedJob.matched_skills?.length || 0})</span>
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedJob.matched_skills?.map((skill: string, i: number) => (
                                <span 
                                  key={i} 
                                  className="text-xs bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-bold"
                                >
                                  {skill}
                                </span>
                              ))}
                              {(!selectedJob.matched_skills || selectedJob.matched_skills.length === 0) && (
                                <p className="text-xs text-neutral-400 italic">None matched yet.</p>
                              )}
                            </div>
                          </div>

                          {/* Missing Requirements */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-2 uppercase tracking-wider">
                              <ShieldAlert className="w-4 h-4 text-rose-500" />
                              <span>Missing Skills ({selectedJob.missing_skills?.length || 0})</span>
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedJob.missing_skills?.map((skill: string, i: number) => (
                                <span 
                                  key={i} 
                                  className="text-xs bg-rose-50/80 dark:bg-rose-955/30 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-lg font-bold"
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

                        {/* Recruiter AI Fit Advice */}
                        {selectedJob.fit_summary && (
                          <div className="border-t border-violet-100/30 dark:border-violet-900/10 pt-4 mt-2">
                            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2">
                              Recruiter Advice Summary
                            </h4>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed italic bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-xs border-l-4 border-[#5D3FD3]">
                              &ldquo;{selectedJob.fit_summary}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side Sidebar Details */}
                    <div className="lg:col-span-1 space-y-6 lg:border-l lg:border-neutral-200 dark:lg:border-neutral-800 lg:pl-8">
                      <div>
                        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest pb-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-4">
                          Job Overview
                        </h4>

                        <div className="space-y-4">
                          {/* Salary Item */}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-violet-50 dark:bg-violet-950/40 rounded-lg text-[#5D3FD3]">
                              <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Salary Range</p>
                              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                                {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                              </p>
                            </div>
                          </div>

                          {/* Experience Item */}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-violet-50 dark:bg-violet-950/40 rounded-lg text-[#5D3FD3]">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Experience Level</p>
                              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                                {selectedJob.years_experience !== undefined ? `${selectedJob.years_experience} Years Required` : 'Not Specified'}
                              </p>
                            </div>
                          </div>

                          {/* Location Item */}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-violet-50 dark:bg-violet-950/40 rounded-lg text-[#5D3FD3]">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Location</p>
                              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                                {selectedJob.location || 'Remote'}
                              </p>
                            </div>
                          </div>

                          {/* Company info */}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-violet-50 dark:bg-violet-950/40 rounded-lg text-[#5D3FD3]">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Company Profile</p>
                              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                                {selectedJob.company}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Tips / Info card */}
                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800 space-y-2.5">
                        <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <ThumbsUp className="w-4 h-4 text-[#5D3FD3]" />
                          <span>Candidate Tip</span>
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
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

        {/* TAB 2: PROFILE */}
        {activeTab === 'Profile' && (
          <div className="max-w-3xl mx-auto space-y-6">

            {/* PROFILE COMPLETION DASHBOARD CARD */}
            {(() => {
              const completion = getProfileCompletion(user);
              return (
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
                        <span className={item.filled ? 'text-slate-800 dark:text-slate-200 truncate' : 'text-slate-400 dark:text-slate-500 line-through decoration-slate-250 dark:decoration-slate-800/50 truncate'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            
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
                        setIsEditingProfile(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      Edit Details
                    </button>
                  </div>

                  {/* Additional profile details segments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Qualifications */}
                    <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/60">
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

                    {/* Skills & Interests */}
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

                      {user?.career_direction && (
                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-900">
                          <h5 className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                            Career Direction
                          </h5>
                          <p className="text-xs text-slate-705 dark:text-slate-300 font-medium">
                            {user.career_direction}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Work Experience */}
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

                    {/* LinkedIn & Portfolio Links */}
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
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Qualifications & Academic Background</h4>
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
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Skills, Interests & Career Direction</h4>
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

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Work Experience, Internships, Projects & Volunteering</h4>
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
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">Authenticate and sync your LinkedIn profile details directly to your dynamic LaunchPath profile.</p>
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
             {(() => {
               const strength = getResumeStrength(user?.resume_text);
               return (
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
                     {/* Strength meter progress bar */}
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

                     {/* Breakdown of Checks */}
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
                           className="flex items-center gap-2 text-xs font-semibold p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800"
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

                     {/* Tips and improvements list */}
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
               );
             })()}

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
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
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
                  <h4 className="font-bold text-slate-805 dark:text-slate-200 mb-2">Resume Processing Queue</h4>
                  <p className="text-sm text-slate-650 dark:text-slate-350 mb-6 leading-relaxed">Your resume is currently being processed by our AI to extract skills and find the best job matches.</p>
                  
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 mb-2 overflow-hidden border border-slate-305 dark:border-slate-700 shadow-inner overflow-hidden">
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
                <div className="p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 m-6 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Drag and drop your updated PDF resume here</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Uploading triggers bulk processing of your skill extractions</p>
                  <button 
                    disabled={uploading}
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow disabled:opacity-50 text-sm cursor-pointer"
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
        )}

        {/* TAB: INBOX / NOTIFICATIONS */}
        {activeTab === 'Inbox' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight dark:text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-500" />
                    <span>In-App Mailbox</span>
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Your direct notifications, acknowledgments, and messages from LaunchPath.
                  </p>
                </div>
                {notifications.some(n => !n.is_read) && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-[#5D3FD3] dark:text-violet-400 hover:underline bg-[#5D3FD3]/5 hover:bg-[#5D3FD3]/10 dark:bg-violet-955/20 dark:hover:bg-violet-955/40 px-3.5 py-2 rounded-lg border border-[#5D3FD3]/10 cursor-pointer self-start sm:self-center transition-all"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-850">
                    <Mail className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-220">Your inbox is clear</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    When you apply for a job or get invited to interview, your platform notifications will show up here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`py-4 first:pt-0 last:pb-0 flex gap-4 transition-all duration-200 cursor-pointer ${
                        !n.is_read 
                          ? 'bg-indigo-50/20 dark:bg-indigo-950/10 px-3 rounded-lg border-l-4 border-[#5D3FD3] ml-[-4px]' 
                          : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {n.type === 'APPLICATION' ? (
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-bold">
                            📝
                          </div>
                        ) : n.type === 'INTERVIEW' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold">
                            📅
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#5D3FD3]/10 text-[#5D3FD3] flex items-center justify-center text-sm font-bold">
                            🔔
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            {n.title}
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 inline-block" />
                            )}
                          </h4>
                          <span className="text-[10.5px] text-slate-450 dark:text-slate-500 whitespace-nowrap font-mono">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                          {n.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'Settings' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
             <h2 className="text-xl font-bold mb-6">Account Settings</h2>
             <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-705 dark:text-slate-300 mb-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"/>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-705 dark:text-slate-300 mb-1">Current Password</label>
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans" placeholder="Required if changing password"/>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-705 dark:text-slate-300 mb-1">New Password</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans"/>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-705 dark:text-slate-300 mb-1">Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans"/>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold py-3 rounded-lg shadow-md transition text-sm cursor-pointer border-none">
                    Save Changes
                  </button>
                </div>
             </form>

             <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-205 mb-4 flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-blue-500" />
                 Data Privacy & POPIA
               </h3>
               <p className="text-sm text-slate-650 dark:text-slate-400 mb-6 leading-relaxed">
                 In accordance with the Protection of Personal Information Act (POPIA), you have the right to request an export of your personal data or request complete deletion of your account and associated records.
               </p>
               <div className="flex flex-col sm:flex-row gap-4 font-bold text-sm">
                 <button className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer" onClick={() => alert('Your data export request has been submitted. You will receive an email shortly.')}>
                   Request Data Export
                 </button>
                 <button className="px-4 py-2.5 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-650 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition cursor-pointer" onClick={() => { if(confirm('Are you sure you want to delete your account? This action is permanent and all data will be lost.')) alert('Account deletion requested. Support will contact you to verify.'); }}>
                   Delete Account & Data
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
