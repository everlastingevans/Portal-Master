'use client';

import { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const LAUNCHPATH_POSTER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNDUwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ2xvdyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxZTFiNGIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI0MCUiIHN0b3AtY29sb3I9IiMwZjE3MmEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDIwNjE3Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJicmFuZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNzE0NUZGIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzhiNWNmNiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9InVybCgjZ2xvdykiLz4KICAKICA8IS0tIFN1YnRsZSBmdXR1cmlzdGljIGxpbmVzIC0tPgogIDxnIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSI+CiAgICA8bGluZSB4MT0iMTAwIiB5MT0iMCIgeDI9IjEwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjIwMCIgeTE9IjAiIHgyPSIyMDAiIHkyPSI0NTAiLz4KICAgIDxsaW5lIHgxPSIzMDAiIHkxPSIwIiB4Mj0iMzAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iNDAwIiB5MT0iMCIgeDI9IjQwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjUwMCIgeTE9IjAiIHgyPSI1MDAiIHkyPSI0NTAiLz4KICAgIDxsaW5lIHgxPSI2MDAiIHkxPSIwIiB4Mj0iNjAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iNzAwIiB5MT0iMCIgeDI9IjcwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjAiIHkxPSIxMDAiIHgyPSI4MDAiIHkyPSIxMDAiLz4KICAgIDxsaW5lIHgxPSIwIiB5MT0iMjAwIiB4Mj0iODAwIiB5Mj0iMjAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iMzAwIiB4Mj0iODAwIiB5Mj0iMzAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iNDAwIiB4Mj0iODAwIiB5Mj0iNDAwIi8+CiAgPC9nPgogIDxjaXJjbGUgY3g9IjQwMCIgY3k9IjIyNSIgcj0iMTQwIiBmaWxsPSIjNzE0NUZGIiBmaWxsLW9wYWNpdHk9IjAuMTUiIGZpbHRlcj0iYmx1cig2MHB4KSIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiMzYjgyZjYiIGZpbGwtb3BhY2l0eT0iMC4xIiBmaWx0ZXI9ImJsdXIoNDBweCkiLz4KICA8cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSI3MDAiIGhlaWdodD0iMzUwIiByeD0iMjAiIGZpbGw9IiMwZjE3MmEiIGZpbGwtb3BhY2l0eT0iMC41IiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Utb3BhY2l0eT0iMC40Ii8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTkwIiByPSI0NSIgZmlsbD0iIzcxNDVGRiIgZmlsbC1vcGFjaXR5PSIwLjIiIHN0cm9rZT0iIzcxNDVGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTkwIiByPSIzNSIgZmlsbD0idXJsKCNicmFuZCkiLz4KICA8cG9seWdvbiBwb2ludHM9IjM5MiwxNzcgNDE1LDE5MCAzOTIsMjAzIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHJlY3QgeD0iMzEwIiB5PSIyNzAiIHdpZHRoPSIxODAiIGhlaWdodD0iMjQgIHJ4PSIxMiIgZmlsbD0iIzcxNDVGRiIgZmlsbC1vcGFjaXR5PSIwLjE1IiBzdHJva2U9IiM3MTQ1RkYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMyIvPgogIDx0ZXh0IHg9IjQwMCIgeT0iMjg1IiBmaWxsPSIjYTc4YmZhIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Db2wsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9IjkwMCIgbGV0dGVyLXNwYWNpbmc9IjEuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgdGV4dC10cmFuc2Zvcm09InVwcGVyY2FzZSI+TEFVTkNIUEFUSCBWRVJJRklFRDwvdGV4dD4KICA8dGV4dCB4PSI0MDAiIHk9IjMyNSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtQ29sLCAnU2Vnb2UgVUknLCBSb2JvdG8sIE91dGZpdCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9IjgwMCIgbGV0dGVyLXNwYWNpbmc9Ii0wLjUiIHRleHQtYW5jaG9yPSJuYXR1cmFsIj5BSSBSRUFESU5FU1MgVklERU8gSU5URVJWSUVXPC90ZXh0PgogIDx0ZXh0IHg9IjQwMCIgeT0iMzQ3IiBmaWxsPSIjOTRhM2I4IiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Db2wsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9IjUwMCIgdHJhY2tpbmc9IjAuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VjdXJlIFdlYlJUQyBUaW1lZCBFeGVjdXRpdmUgUHJlc2VudGF0aW9uPC90ZXh0PgogIDx0ZXh0IHg9IjgwIiB5PSI5MCIgZmlsbD0iIzY0NzQ4YiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMSIgZm9udC13ZWlnaHQ9IjcwMCI+RkVFRF9TVFJFQU06IEFDVElWRTwvdGV4dD4KICA8Y2lyY2xlIGN4PSIyMTUiIGN5PSI4NiIgcj0iNCIgZmlsbD0iIzEwYjk4MSIvPgogIDx0ZXh0IHg9IjcyMCIgeT0iOTAiIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTEiIHRleHQtYW5jaG9yPSJlbmQiPjQvNCBNT0RVTEVTIENPTVBMRVRFRDwvdGV4dD4KPC9zdmc+";

export function CircularProgress({ score }: { score: number }) {
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

export const getResumeStrength = (text: string | null | undefined) => {
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

export function CompanyLogo({ companyName, logo }: { companyName: string; logo?: string | null }) {
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

export function CategoryBreakdownChart({ questions }: { questions: any[] }) {
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

export function ReadinessGauge({ score, status }: { score: number | null | undefined; status?: string }) {
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

export const getProfileCompletion = (u: any) => {
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
