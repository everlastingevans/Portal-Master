'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Search, 
  DollarSign, 
  MapPin, 
  Briefcase,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SuperadminCandidateInspector from './SuperadminCandidateInspector';

export default function SuperadminReportsView() {
  const [reportType, setReportType] = useState<'candidates' | 'employers' | 'ai-insights'>('candidates');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [inspectCandidate, setInspectCandidate] = useState<any>(null);
  const [inspectTab, setInspectTab] = useState<string>('profile');

  const fetchReports = async () => {
    try {
      setError(null);
      const res = await fetch('/api/superadmin/reports/insights');
      if (!res.ok) {
        throw new Error('Failed to retrieve system analytical records');
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || 'Server returned an invalid reports payload');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during reports synchronization.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // CSV Exporter for Candidate profiles
  const downloadCandidatesCSV = () => {
    if (!data?.candidatesReport?.candidatesList) return;
    const list = data.candidatesReport.candidatesList;
    
    // Headers
    const headers = [
      'Full Name',
      'Study Institute',
      'Study Specialisation',
      'Seeking Roles',
      'Phone Number',
      'Qualifications',
      'Skills',
      'Interests'
    ];
    
    const rows = list.map((c: any) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.study_institution || '').replace(/"/g, '""')}"`,
      `"${(c.study_specialisation || '').replace(/"/g, '""')}"`,
      `"${(c.seeking_roles || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.qualifications || '').replace(/"/g, '""')}"`,
      `"${(c.skills || '').replace(/"/g, '""')}"`,
      `"${(c.interests || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LaunchPath_Candidate_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF Exporter for Candidate profiles with premium branding and formatted columns
  const downloadCandidatesPDF = () => {
    if (!data?.candidatesReport?.candidatesList) return;
    const list = data.candidatesReport.candidatesList;

    // Create a landscape, millimeters, a4 size document (297mm x 210mm)
    const doc = new jsPDF('l', 'mm', 'a4');

    // 1. Draw Page 1 Branding and Cover Elements
    // Top bar deep purple accent ribbon
    doc.setFillColor(113, 69, 255);
    doc.rect(0, 0, 297, 4, 'F');

    // LaunchPath Logo & Header text
    // Custom geometric brand emblem (a neat purple rocket-trail icon block)
    doc.setFillColor(113, 69, 255);
    doc.rect(15, 12, 4, 10, 'F');
    doc.setFillColor(16, 185, 129); // Green accent block
    doc.rect(21, 15, 4, 7, 'F');

    // Text logo
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('LAUNCHPATH', 28, 17);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('EXECUTIVE TALENT NETWORK', 28, 22);

    // Metadata Right Block
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('REPORT ID: LP-INS-2026', 215, 15);
    doc.text(`GENERATED ON: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 215, 19);
    doc.text('STATUS: ACTIVE CANDIDATE REGISTRY', 215, 23);

    // Horizontal thin divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 26, 282, 26);

    // Main Report Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('CANDIDATE REGISTRY & TALENT POOL PROFILE SUMMARY', 15, 33);

    // KPI Summary Widgets
    // Total registered candidates in pool
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(15, 37, 80, 13, 1.5, 1.5, 'F');
    doc.setFillColor(113, 69, 255); // purple bar
    doc.rect(15, 37, 2, 13, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL TALENT POOL', 20, 41);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.candidatesReport.totalCandidates || 0} Candidates`, 20, 47);

    // Average matching score
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(105, 37, 80, 13, 1.5, 1.5, 'F');
    doc.setFillColor(16, 185, 129); // emerald bar
    doc.rect(105, 37, 2, 13, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('AVERAGE MATCH FIT', 110, 41);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.candidatesReport.averageMatchScore || 0}% AI Confidence`, 110, 47);

    // Active pipeline applicants
    const activePipelinersCount = list.filter((c: any) => c.appsCount > 0).length;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(195, 37, 87, 13, 1.5, 1.5, 'F');
    doc.setFillColor(59, 130, 246); // blue bar
    doc.rect(195, 37, 2, 13, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('ACTIVE APPLICANTS', 200, 41);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${activePipelinersCount} Active Pipeliners`, 200, 47);

    // 2. Format Table Columns
    // Column Headers matching the user's specific items:
    // "full name, study institute, study_specialisation, seeking_roles, Phone number, Qualifications, skills and interests"
    const tableHeaders = [
      'Full Name',
      'Study Institute',
      'Specialisation',
      'Seeking Roles',
      'Phone Number',
      'Qualifications',
      'Core Skills',
      'Interests'
    ];

    // Data Rows
    const tableRows = list.map((c: any) => [
      c.name || 'N/A',
      c.study_institution || 'N/A',
      c.study_specialisation || 'N/A',
      c.seeking_roles || 'N/A',
      c.phone || 'N/A',
      c.qualifications || 'N/A',
      c.skills || 'N/A',
      c.interests || 'N/A'
    ]);

    // 3. Render Table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableRows,
      startY: 55, // Leaves space for the Cover elements on page 1
      margin: { left: 15, right: 15, bottom: 20 },
      theme: 'striped',
      headStyles: {
        fillColor: [113, 69, 255], // LaunchPath brand purple: #7145FF
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
        valign: 'middle',
        cellPadding: 2.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Clean slate row shading
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 28 }, // Full Name
        1: { cellWidth: 36 }, // Study Institute
        2: { cellWidth: 34 }, // Study Specialisation
        3: { cellWidth: 34 }, // Seeking Roles
        4: { cellWidth: 25 }, // Phone Number
        5: { cellWidth: 36 }, // Qualifications
        6: { cellWidth: 38 }, // Core Skills
        7: { cellWidth: 36 }  // Interests
      },
      didDrawPage: (pageData) => {
        // Draw Footer on every page
        const pageCount = doc.getNumberOfPages();
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400

        // Footer divider line
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.line(15, 195, 282, 195);

        // Footer Metadata Text
        doc.text('LAUNCHPATH PLACEMENT NETWORK • CONFIDENTIAL CANDIDATE REGISTRY REPORT', 15, 201);
        doc.text(`Page ${pageCount}`, 282, 201, { align: 'right' });

        // On subsequent pages, draw a minimalist top bar header so the layout remains professional
        if (pageData.pageNumber > 1) {
          // Top bar accent line
          doc.setFillColor(113, 69, 255);
          doc.rect(0, 0, 297, 3, 'F');

          // Header Text
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text('LAUNCHPATH TALENT NETWORK', 15, 10);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text('• CANDIDATE REGISTRY EXPORT REPORT', 68, 10);

          // Header divider
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.line(15, 12, 282, 12);
        }
      }
    });

    // Save PDF Document
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`LaunchPath_Candidate_Insights_Report_${dateStr}.pdf`);
  };

  // CSV Exporter for Employer activity records
  const downloadEmployersCSV = () => {
    if (!data?.employersReport?.employersList) return;
    const list = data.employersReport.employersList;
    
    // Headers
    const headers = ['ID', 'Employer Name', 'Email', 'Total Jobs Posted', 'Active Jobs Count', 'Average Job Salary Cap (ZAR)'];
    const rows = list.map((e: any) => [
      e.id,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      e.email,
      e.jobsPostedCount,
      e.activeJobsCount,
      e.avgJobSalaryMax
    ]);

    const csvContent = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LaunchPath_Employer_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-slate-400">Compiling corporate analytics and market benchmarks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/15 p-6 rounded-2xl max-w-2xl mx-auto space-y-3">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <h4 className="font-bold text-sm">Failed to retrieve analytical reporting records</h4>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Fetching Reports
        </button>
      </div>
    );
  }

  // Filter lists based on Search Query
  const filteredCandidates = (data?.candidatesReport?.candidatesList || []).filter((c: any) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.study_institution || '').toLowerCase().includes(q) ||
      (c.study_specialisation || '').toLowerCase().includes(q) ||
      (c.seeking_roles || '').toLowerCase().includes(q) ||
      (c.qualifications || '').toLowerCase().includes(q) ||
      (c.skills || '').toLowerCase().includes(q) ||
      (c.interests || '').toLowerCase().includes(q)
    );
  });

  const filteredEmployers = (data?.employersReport?.employersList || []).filter((e: any) => {
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
  });

  // Recharts custom colors
  const COLORS = ['#7145FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

  // Format Recharts data
  const expChartData = Object.entries(data?.candidatesReport?.experienceDistribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white font-sans">Corporate & Market Analytical Reports</h3>
          <p className="text-xs text-slate-400">
            Monitor ecosystem growth, skills demand matching, and export transactional logs securely.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-[#7145FF]/30 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-violet-400' : ''}`} />
            <span>Sync Data</span>
          </button>
          
          {reportType === 'candidates' && (
            <>
              <button
                onClick={downloadCandidatesCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={downloadCandidatesPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#7145FF] hover:bg-[#5b32e6] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-[#7145FF]/10"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>Download Branded PDF</span>
              </button>
            </>
          )}

          {reportType === 'employers' && (
            <button
              onClick={downloadEmployersCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7145FF] hover:bg-[#5b32e6] text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-[#7145FF]/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Employers CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Report Toggles */}
      <div className="flex border-b border-slate-800 gap-6 select-none">
        <button
          onClick={() => { setReportType('candidates'); setSearchQuery(''); }}
          className={`pb-4 text-xs uppercase tracking-widest font-bold transition relative cursor-pointer ${
            reportType === 'candidates' ? 'text-[#7145FF]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Candidate Pool Reports
          </span>
          {reportType === 'candidates' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7145FF]" />
          )}
        </button>

        <button
          onClick={() => { setReportType('employers'); setSearchQuery(''); }}
          className={`pb-4 text-xs uppercase tracking-widest font-bold transition relative cursor-pointer ${
            reportType === 'employers' ? 'text-[#7145FF]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Building className="w-4 h-4" /> Employer Activity Reports
          </span>
          {reportType === 'employers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7145FF]" />
          )}
        </button>

        <button
          onClick={() => { setReportType('ai-insights'); setSearchQuery(''); }}
          className={`pb-4 text-xs uppercase tracking-widest font-bold transition relative cursor-pointer ${
            reportType === 'ai-insights' ? 'text-[#7145FF]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" /> Gemini AI Strategic Insights
          </span>
          {reportType === 'ai-insights' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7145FF]" />
          )}
        </button>
      </div>

      {/* 1. CANDIDATES REPORT VIEW */}
      {reportType === 'candidates' && (
        <div className="space-y-8 animate-fade-in">
          {/* Candidate KPI Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Candidate Registry</p>
                <p className="text-3xl font-black text-white font-mono">{data?.candidatesReport?.totalCandidates}</p>
                <p className="text-[10px] text-slate-500">Registered candidate profiles in pool</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-violet-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Average Match Fit</p>
                <p className="text-3xl font-black text-white font-mono">{data?.candidatesReport?.averageMatchScore}%</p>
                <p className="text-[10px] text-slate-500">Aggregate AI resume matching confidence</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Active Pipeliners</p>
                <p className="text-3xl font-black text-white font-mono">
                  {data?.candidatesReport?.candidatesList?.filter((c: any) => c.appsCount > 0).length || 0}
                </p>
                <p className="text-[10px] text-slate-500">Candidates with at least 1 active application</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-blue-400">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Candidate Skills Chart */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Top Talent Pool Skills</h4>
              <div className="h-64 w-full">
                {data?.candidatesReport?.topCandidateSkills?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.candidatesReport.topCandidateSkills} layout="vertical">
                      <XAxis type="number" stroke="#64748B" fontSize={10} fontStyle="mono" />
                      <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} fontStyle="mono" width={90} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '12px', fontSize: '11px' }}
                        itemStyle={{ color: '#F1F5F9' }}
                      />
                      <Bar dataKey="count" fill="#7145FF" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs font-mono text-slate-500">No candidate skills mapped yet</div>
                )}
              </div>
            </div>

            {/* Experience Level Distribution */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Experience Level Distribution</h4>
              <div className="h-64 w-full flex items-center justify-center">
                {expChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${typeof percent === 'number' ? (percent * 100).toFixed(0) : '0'}%)`}
                      >
                        {expChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '12px', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs font-mono text-slate-500">No experience level data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Candidates Detailed List */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Candidate Registry Export View</h4>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, title, skill..."
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-[#7145FF] text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Study Details</th>
                    <th className="py-3 px-4">Seeking Roles</th>
                    <th className="py-3 px-4">Qualifications</th>
                    <th className="py-3 px-4">Skills & Interests</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/55 text-xs text-slate-300">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((c: any) => (
                      <tr 
                        key={c.id} 
                        className="hover:bg-slate-900/40 transition cursor-pointer group"
                        onClick={() => {
                          setInspectCandidate(c);
                          setInspectTab('profile');
                        }}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white group-hover:text-[#a385ff] transition-colors">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.phone || 'No phone number'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{c.study_institution || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{c.study_specialisation || 'No specialisation'}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate" title={c.seeking_roles}>
                          <span className="text-[#a385ff] font-bold text-[11px]">{c.seeking_roles || 'N/A'}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate" title={c.qualifications}>
                          <span className="text-slate-300 font-medium">{c.qualifications || 'N/A'}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="text-[11px] text-slate-300 truncate" title={c.skills}><strong className="text-slate-400 font-mono text-[10px] uppercase">Skills:</strong> {c.skills || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={c.interests}><strong className="text-slate-500 font-mono text-[9px] uppercase">Interests:</strong> {c.interests || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setInspectCandidate(c);
                              setInspectTab('profile');
                            }}
                            className="px-2.5 py-1 bg-violet-600/20 text-violet-400 hover:bg-[#7145FF] hover:text-white border border-[#7145FF]/30 rounded-lg text-[10px] font-bold uppercase font-sans cursor-pointer group-hover:scale-105 transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <Sparkles className="w-3 h-3 text-violet-400 group-hover:text-white" />
                            Pull Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs font-mono text-slate-500">
                        No candidates matching the search parameters were found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. EMPLOYERS REPORT VIEW */}
      {reportType === 'employers' && (
        <div className="space-y-8 animate-fade-in">
          {/* Employer KPI Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Employers</p>
                <p className="text-3xl font-black text-white font-mono">{data?.employersReport?.totalEmployers}</p>
                <p className="text-[10px] text-slate-500">Corporate tenants & indices</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-violet-400">
                <Building className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Open Postings</p>
                <p className="text-3xl font-black text-white font-mono">{data?.employersReport?.totalJobs}</p>
                <p className="text-[10px] text-slate-500">{data?.employersReport?.activeJobs} active / {data?.employersReport?.draftPendingJobs} draft</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[#7145FF]">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Avg Min Salary (ZAR)</p>
                <p className="text-2xl font-black text-white font-mono">R{data?.employersReport?.avgSalaryMin?.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">Starting benchmark package</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Avg Max Salary (ZAR)</p>
                <p className="text-2xl font-black text-white font-mono">R{data?.employersReport?.avgSalaryMax?.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">Ceiling benchmark package</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Employer Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Requested Tech Stack Chart */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Most Demanded Market Skills</h4>
              <div className="h-64 w-full">
                {data?.employersReport?.topDemandSkills?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.employersReport.topDemandSkills} layout="vertical">
                      <XAxis type="number" stroke="#64748B" fontSize={10} fontStyle="mono" />
                      <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} fontStyle="mono" width={90} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '12px', fontSize: '11px' }}
                        itemStyle={{ color: '#F1F5F9' }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs font-mono text-slate-500">No hiring requirements parsed yet</div>
                )}
              </div>
            </div>

            {/* Geographical Distribution */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Geographical Job Locations</h4>
              <div className="h-64 w-full flex items-center justify-center">
                {Object.keys(data?.employersReport?.jobLocationsDistribution || {}).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(data.employersReport.jobLocationsDistribution).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${typeof percent === 'number' ? (percent * 100).toFixed(0) : '0'}%)`}
                      >
                        {Object.keys(data.employersReport.jobLocationsDistribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#090D16', borderColor: '#1E293B', borderRadius: '12px', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs font-mono text-slate-500">No geographic indicators recorded</div>
                )}
              </div>
            </div>
          </div>

          {/* Employers Detailed Activity List */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Employer Index Activity Logs</h4>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by employer name, email..."
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-[#7145FF] text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Employer</th>
                    <th className="py-3 px-4 text-center">Total Postings</th>
                    <th className="py-3 px-4 text-center">Active Jobs</th>
                    <th className="py-3 px-4 text-right">Average Salary Cap (ZAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/55 text-xs text-slate-300">
                  {filteredEmployers.length > 0 ? (
                    filteredEmployers.map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            {e.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono pl-5">{e.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-400">{e.jobsPostedCount}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                            e.activeJobsCount > 0 ? 'bg-[#7145FF]/10 text-[#7145FF] border border-[#7145FF]/20' : 'bg-slate-800/40 text-slate-500'
                          }`}>
                            {e.activeJobsCount} Active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-300">
                          {e.avgJobSalaryMax > 0 ? `R${e.avgJobSalaryMax.toLocaleString()}` : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs font-mono text-slate-500">
                        No employers matching the query found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. GEMINI AI STRATEGIC INSIGHTS VIEW */}
      {reportType === 'ai-insights' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#7145FF]/5 rounded-full filter blur-3xl -z-10" />
            
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-mono font-bold rounded-md uppercase border border-yellow-500/20">
                  <Sparkles className="w-3 h-3 animate-pulse" /> Gemini Pro Powered
                </span>
                <h4 className="text-lg font-bold text-white font-sans">Strategic Talent Intelligence & Market Insights</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Dynamic, real-time tactical executive insights formulated by analyzing active candidate profiles, parsed resumes, job definitions, and hiring activities.
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-yellow-500/35 text-yellow-500 hover:text-yellow-400 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Re-Analyze</span>
              </button>
            </div>

            {/* Generated HTML content container */}
            <div className="border border-slate-800/80 bg-slate-900/40 p-6 rounded-xl text-sm leading-relaxed text-slate-300 space-y-6">
              {data?.aiInsights ? (
                <div 
                  className="prose prose-invert prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-h3:text-sm prose-h3:font-mono prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-[#7145FF] prose-p:text-slate-300 prose-p:text-xs prose-p:leading-relaxed prose-ul:text-xs prose-ul:space-y-2 prose-li:text-slate-300 max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.aiInsights }}
                />
              ) : (
                <div className="text-center py-12 text-xs font-mono text-slate-500">
                  No insights generated. Try clicking the &quot;Re-Analyze&quot; button to launch Gemini analysis.
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7145FF]" />
              <span>Data accurate as of system sync timestamp: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {inspectCandidate && (
        <SuperadminCandidateInspector 
          inspectCandidate={inspectCandidate}
          setInspectCandidate={setInspectCandidate}
          inspectTab={inspectTab}
          setInspectTab={setInspectTab}
          interviews={[]}
        />
      )}

    </div>
  );
}
