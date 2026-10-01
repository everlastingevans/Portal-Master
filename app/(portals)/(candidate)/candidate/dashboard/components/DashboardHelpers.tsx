'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { chartTheme, cx } from '@/components/portal/ui';

/* -------------------------------------------------------------------------- */
/*  Shared helpers for the candidate dashboard (also used by ProfileTab).     */
/* -------------------------------------------------------------------------- */

const POSTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="#A6F23C" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#A6F23C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="#0A1B3D"/>
  <rect width="800" height="450" fill="url(#g)"/>
  <circle cx="400" cy="190" r="46" fill="#A6F23C"/>
  <polygon points="390,170 420,190 390,210" fill="#0A1B3D"/>
  <text x="400" y="290" fill="#ffffff" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" text-anchor="middle">Readiness interview</text>
  <text x="400" y="320" fill="#94A3B8" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="14" text-anchor="middle">LaunchPath</text>
</svg>`;

/** Video poster for readiness interview recordings (navy + lime brand). */
export const LAUNCHPATH_POSTER_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(POSTER_SVG)}`;

function ringColour(score: number) {
  if (score >= 80) return chartTheme.series1;
  if (score >= 50) return '#D97706';
  return '#E11D48';
}

/** Small circular score ring. */
export function CircularProgress({ score }: { score: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(score || 0)));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative flex h-12 w-12 items-center justify-center" role="img" aria-label={`${safe}%`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#EEF1F5" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={ringColour(safe)}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safe / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-semibold tabular-nums text-brand-navy">{safe}%</span>
    </div>
  );
}

export const getResumeStrength = (text: string | null | undefined) => {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      label: 'No CV yet',
      color: 'text-slate-500',
      textColor: 'text-slate-600',
      barColor: 'from-slate-200 to-slate-200',
      tips: [
        'Upload your CV as a PDF so we can match you with the right roles.',
        'A simple, single-column layout works best and is easiest for us to read.',
      ],
      checks: {
        contact: false,
        skills: false,
        experience: false,
        education: false,
        metrics: false,
      },
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

  let label = 'Needs work';
  let color = 'text-rose-600';
  let textColor = 'text-rose-700';
  let barColor = 'from-rose-500 to-rose-400';

  if (score >= 80) {
    label = 'Excellent';
    color = 'text-emerald-600';
    textColor = 'text-emerald-700';
    barColor = 'from-emerald-500 to-emerald-400';
  } else if (score >= 60) {
    label = 'Good';
    color = 'text-sky-600';
    textColor = 'text-sky-700';
    barColor = 'from-sky-500 to-sky-400';
  } else if (score >= 40) {
    label = 'Fair';
    color = 'text-amber-600';
    textColor = 'text-amber-700';
    barColor = 'from-amber-500 to-amber-400';
  }

  const tips: string[] = [];
  if (!checks.contact) {
    tips.push('Add your email address, phone number and LinkedIn profile at the top of your CV.');
  }
  if (!checks.skills) {
    tips.push('Add a "Skills" section that lists the tools and technologies you know. Employers search for these.');
  }
  if (!checks.experience) {
    tips.push('List your work experience, including part-time jobs, internships and projects, with dates.');
  }
  if (!checks.education) {
    tips.push('Add an "Education" section with your qualifications, institution and year completed.');
  }
  if (!checks.metrics) {
    tips.push('Show your impact with numbers, for example "Led a team of 4" or "Cut processing time by 25%".');
  }
  if (wordCount < 150) {
    tips.push('Your CV is quite short. Add more detail about your projects, certificates and the tools you used.');
  }

  if (tips.length === 0) {
    tips.push('Your CV covers everything employers look for. Nice work.');
    tips.push('To raise your match scores, add any missing skills listed on jobs you are interested in (if you have them).');
  }

  return {
    score,
    label,
    color,
    textColor,
    barColor,
    tips,
    checks,
  };
};

const LOGO_TONES = [
  'bg-brand-navy text-brand-lime',
  'bg-slate-100 text-brand-navy ring-1 ring-inset ring-slate-200',
  'bg-brand-lime/30 text-brand-navy ring-1 ring-inset ring-brand-lime/60',
  'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15',
  'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
];

const LOGO_SIZES = {
  sm: 'h-8 w-8 rounded-lg text-[11px]',
  md: 'h-11 w-11 rounded-xl text-xs',
  lg: 'h-14 w-14 rounded-2xl text-base',
};

/** Company logo, or a tidy initials tile when no logo has been uploaded. */
export function CompanyLogo({
  companyName,
  logo,
  size = 'md',
}: {
  companyName: string;
  logo?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims = LOGO_SIZES[size];
  if (logo) {
    return (
      <div className={cx('flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-slate-200', dims)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={`${companyName || 'Company'} logo`} className="h-full w-full object-cover" />
      </div>
    );
  }
  const name = (companyName || 'Company').trim();
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const tone = LOGO_TONES[Math.abs(hash) % LOGO_TONES.length];
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div aria-hidden="true" className={cx('flex shrink-0 select-none items-center justify-center font-semibold', dims, tone)}>
      {initials || '?'}
    </div>
  );
}

export function CategoryBreakdownChart({ questions }: { questions: any[] }) {
  const hasScores = Array.isArray(questions) && questions.some((q) => (q.questionScore || q.score || 0) > 0);
  if (!hasScores) {
    return (
      <div className="mt-1.5 flex h-[140px] w-full items-center justify-center px-4 text-center">
        <p className="text-xs text-slate-500">Your scores will appear here once your interview has been reviewed.</p>
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
    <div className="mt-1.5 flex h-[140px] w-full items-center">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 10, left: -24, bottom: 2 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            dataKey="category"
            type="category"
            axisLine={false}
            tickLine={false}
            width={120}
            tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            itemStyle={chartTheme.tooltip.itemStyle}
            cursor={chartTheme.tooltip.cursor}
            formatter={(value: any) => [`${value}%`, 'Score']}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={10}>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={chartTheme.series1} />
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
  const strokeColor = hasScore ? (score >= 80 ? chartTheme.series1 : score >= 50 ? chartTheme.series2 : '#E11D48') : '#CBD5E1';

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - displayScore / 100);
  const label = isPending ? 'Awaiting review' : hasScore ? `Readiness score ${Math.round(score)}%` : 'No score yet';

  return (
    <div className="ready-score-gauge relative flex h-12 w-12 items-center justify-center rounded-full bg-white" role="img" aria-label={label}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} stroke="#EEF1F5" strokeWidth="3.5" fill="transparent" />
        {hasScore ? (
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke={strokeColor}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        ) : isPending ? (
          <circle cx="24" cy="24" r={radius} stroke="#F59E0B" strokeWidth="3.5" strokeDasharray="4 3" fill="transparent" />
        ) : (
          <circle cx="24" cy="24" r={radius} stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" fill="transparent" />
        )}
      </svg>
      {isPending ? (
        <Clock className="relative h-4 w-4 text-amber-600" aria-hidden="true" />
      ) : (
        <span className="relative text-[11px] font-semibold leading-none tabular-nums text-brand-navy">
          {hasScore ? `${Math.round(displayScore)}%` : '–'}
        </span>
      )}
    </div>
  );
}

export const getProfileCompletion = (u: any) => {
  const items = [
    { label: 'Full name', filled: !!u?.name, weight: 10 },
    { label: 'Professional title', filled: !!u?.professional_title, weight: 10 },
    { label: 'Phone number', filled: !!u?.phone, weight: 10 },
    { label: 'Qualifications', filled: !!u?.qualifications, weight: 15 },
    { label: 'Skills and interests', filled: !!u?.skills, weight: 15 },
    { label: 'Work or volunteer experience', filled: !!u?.work_experience, weight: 15 },
    { label: 'CV uploaded', filled: !!u?.resume_text, weight: 15 },
    { label: 'LinkedIn or portfolio link', filled: !!u?.linkedin_url || !!u?.github_url || !!u?.portfolio_url, weight: 10 },
  ];

  const totalScore = items.reduce((sum, item) => sum + (item.filled ? item.weight : 0), 0);
  return {
    score: totalScore,
    items,
  };
};
