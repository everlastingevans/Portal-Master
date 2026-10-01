'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Building,
  Download,
  FileDown,
  RefreshCw,
  DollarSign,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Sparkles,
  SearchX,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SuperadminCandidateInspector from './SuperadminCandidateInspector';
import LaunchPathReportLogo from '@/assets/logo/launch.png';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Identity,
  SearchInput,
  Segmented,
  StatCard,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  chartTheme,
} from '../_components/ui';
import { SectionLoader } from '@/components/PortalLoader';
import { useToast } from '@/components/ToastNotification';

// jsPDF needs image data, not a URL
async function loadImageAsDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

type ReportType = 'candidates' | 'employers' | 'ai-insights';

const AXIS_TICK = { fill: chartTheme.axis, fontSize: 11 };

/* ------------------------------ Chart helpers ----------------------------- */

function ChartEmpty({ message }: { message: string }) {
  return <div className="flex h-full items-center justify-center text-xs text-slate-500">{message}</div>;
}

/** Single-series horizontal bar chart for ranked categories (skills, locations). */
function RankedBarChart({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid horizontal={false} stroke={chartTheme.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={AXIS_TICK} axisLine={false} tickLine={false} width={104} />
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          itemStyle={chartTheme.tooltip.itemStyle}
          cursor={chartTheme.tooltip.cursor}
        />
        <Bar dataKey={dataKey} fill={color} maxBarSize={24} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Single-series column chart for a small set of ordered categories. */
function ColumnChart({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke={chartTheme.grid} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
        <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          itemStyle={chartTheme.tooltip.itemStyle}
          cursor={chartTheme.tooltip.cursor}
        />
        <Bar dataKey={dataKey} fill={color} maxBarSize={24} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* -------------------------------- Component ------------------------------- */

export default function SuperadminReportsView() {
  const toast = useToast();
  const [reportType, setReportType] = useState<ReportType>('candidates');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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

  // PDF Exporter for Candidate profiles with branding and formatted columns
  const downloadCandidatesPDF = async () => {
    if (!data?.candidatesReport?.candidatesList) return;
    const list = data.candidatesReport.candidatesList;

    // Create a landscape, millimeters, a4 size document (297mm x 210mm)
    const doc = new jsPDF('l', 'mm', 'a4');

    // 1. Draw Page 1 Branding and Cover Elements
    // Top bar brand navy accent ribbon
    doc.setFillColor(10, 27, 61);
    doc.rect(0, 0, 297, 4, 'F');

    // Official LaunchPath logo (white mark on navy, 2.5:1)
    const logoDataUrl = await loadImageAsDataUrl(LaunchPathReportLogo.src);
    doc.addImage(logoDataUrl, 'PNG', 15, 8, 40, 16);

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
    doc.setFillColor(10, 27, 61); // brand navy bar
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
        fillColor: [10, 27, 61], // LaunchPath brand navy: #0A1B3D
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
          doc.setFillColor(10, 27, 61);
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

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      await downloadCandidatesPDF();
    } catch (err: any) {
      toast.error(err?.message || 'Could not generate the PDF');
    } finally {
      setGeneratingPdf(false);
    }
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
    return <SectionLoader label="Loading reports" />;
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-xl">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-semibold text-white">Couldn&apos;t load reports</h2>
            <p className="text-xs leading-relaxed text-slate-400">{error}</p>
            <div className="pt-3">
              <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={handleRefresh}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      </Card>
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

  // Format chart data
  const expChartData = Object.entries(data?.candidatesReport?.experienceDistribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  const locationChartData = Object.entries(data?.employersReport?.jobLocationsDistribution || {})
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  const activeApplicants = data?.candidatesReport?.candidatesList?.filter((c: any) => c.appsCount > 0).length || 0;

  const openInspector = (c: any) => {
    setInspectCandidate(c);
    setInspectTab('profile');
  };

  const switchReport = (value: ReportType) => {
    setReportType(value);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="overflow-x-auto">
          <Segmented<ReportType>
            value={reportType}
            onChange={switchReport}
            options={[
              { value: 'candidates', label: 'Candidates' },
              { value: 'employers', label: 'Employers' },
              { value: 'ai-insights', label: 'AI insights' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" icon={RefreshCw} loading={refreshing} onClick={handleRefresh}>
            Refresh
          </Button>
          {reportType === 'candidates' && (
            <>
              <Button variant="secondary" size="sm" icon={Download} onClick={downloadCandidatesCSV}>
                Export CSV
              </Button>
              <Button variant="primary" size="sm" icon={FileDown} loading={generatingPdf} onClick={handleDownloadPdf}>
                Download PDF
              </Button>
            </>
          )}
          {reportType === 'employers' && (
            <Button variant="secondary" size="sm" icon={Download} onClick={downloadEmployersCSV}>
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* 1. CANDIDATES */}
      {reportType === 'candidates' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Candidates"
              value={data?.candidatesReport?.totalCandidates ?? 0}
              hint="Registered profiles"
              icon={Users}
            />
            <StatCard
              label="Average match"
              value={`${data?.candidatesReport?.averageMatchScore ?? 0}%`}
              hint="Across all job matches"
              icon={TrendingUp}
            />
            <StatCard
              label="Active applicants"
              value={activeApplicants}
              hint="With at least one application"
              icon={Briefcase}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Top skills" description="Most common skills in the talent pool" />
              <div className="h-64 w-full">
                {data?.candidatesReport?.topCandidateSkills?.length > 0 ? (
                  <RankedBarChart data={data.candidatesReport.topCandidateSkills} dataKey="count" color={chartTheme.series1} />
                ) : (
                  <ChartEmpty message="No skills recorded yet" />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Experience levels" description="Candidates by experience level" />
              <div className="h-64 w-full">
                {expChartData.length > 0 ? (
                  <ColumnChart data={expChartData} dataKey="value" color={chartTheme.series1} />
                ) : (
                  <ChartEmpty message="No experience data yet" />
                )}
              </div>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Candidate list</h2>
                <p className="mt-1 text-xs text-slate-400">{filteredCandidates.length} shown</p>
              </div>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search name, skill, institution"
                className="w-full sm:w-72"
              />
            </div>

            {filteredCandidates.length > 0 ? (
              <Table>
                <THead>
                  <Th>Candidate</Th>
                  <Th>Education</Th>
                  <Th>Seeking</Th>
                  <Th>Qualifications</Th>
                  <Th>Skills and interests</Th>
                  <Th align="right"><span className="sr-only">Actions</span></Th>
                </THead>
                <TBody>
                  {filteredCandidates.map((c: any) => (
                    <Tr key={c.id} onClick={() => openInspector(c)}>
                      <Td>
                        <Identity name={c.name} sub={c.phone || 'No phone'} />
                      </Td>
                      <Td className="max-w-[14rem]">
                        <p className="truncate text-slate-200">{c.study_institution || 'N/A'}</p>
                        <p className="truncate text-xs text-slate-500">{c.study_specialisation || 'No specialisation'}</p>
                      </Td>
                      <Td className="max-w-[12rem]">
                        <p className="truncate text-slate-300" title={c.seeking_roles}>{c.seeking_roles || 'N/A'}</p>
                      </Td>
                      <Td className="max-w-[12rem]">
                        <p className="truncate text-slate-300" title={c.qualifications}>{c.qualifications || 'N/A'}</p>
                      </Td>
                      <Td className="max-w-[16rem]">
                        <p className="truncate text-slate-300" title={c.skills}>{c.skills || 'N/A'}</p>
                        <p className="truncate text-xs text-slate-500" title={c.interests}>{c.interests || 'No interests listed'}</p>
                      </Td>
                      <Td align="right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInspector(c);
                          }}
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <Card padded={false}>
                <EmptyState
                  icon={SearchX}
                  title="No candidates found"
                  description={searchQuery ? 'Try a different search term.' : undefined}
                />
              </Card>
            )}
          </section>
        </div>
      )}

      {/* 2. EMPLOYERS */}
      {reportType === 'employers' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Employers"
              value={data?.employersReport?.totalEmployers ?? 0}
              hint="Registered accounts"
              icon={Building}
            />
            <StatCard
              label="Job postings"
              value={data?.employersReport?.totalJobs ?? 0}
              hint={`${data?.employersReport?.activeJobs ?? 0} active · ${data?.employersReport?.draftPendingJobs ?? 0} draft`}
              icon={Briefcase}
            />
            <StatCard
              label="Avg. minimum salary"
              value={`R${data?.employersReport?.avgSalaryMin?.toLocaleString() ?? 0}`}
              hint="ZAR, across postings"
              icon={DollarSign}
            />
            <StatCard
              label="Avg. maximum salary"
              value={`R${data?.employersReport?.avgSalaryMax?.toLocaleString() ?? 0}`}
              hint="ZAR, across postings"
              icon={TrendingUp}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Most requested skills" description="Skills employers ask for most" />
              <div className="h-64 w-full">
                {data?.employersReport?.topDemandSkills?.length > 0 ? (
                  <RankedBarChart data={data.employersReport.topDemandSkills} dataKey="count" color={chartTheme.series2} />
                ) : (
                  <ChartEmpty message="No skill requirements yet" />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Job locations" description="Postings by location" />
              <div className="h-64 w-full">
                {locationChartData.length > 0 ? (
                  <RankedBarChart data={locationChartData} dataKey="value" color={chartTheme.series2} />
                ) : (
                  <ChartEmpty message="No locations recorded yet" />
                )}
              </div>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Employer activity</h2>
                <p className="mt-1 text-xs text-slate-400">{filteredEmployers.length} shown</p>
              </div>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search name or email"
                className="w-full sm:w-72"
              />
            </div>

            {filteredEmployers.length > 0 ? (
              <Table>
                <THead>
                  <Th>Employer</Th>
                  <Th align="right">Postings</Th>
                  <Th align="right">Active</Th>
                  <Th align="right">Avg. max salary</Th>
                </THead>
                <TBody>
                  {filteredEmployers.map((e: any) => (
                    <Tr key={e.id}>
                      <Td>
                        <Identity name={e.name} sub={e.email} />
                      </Td>
                      <Td align="right" className="tabular-nums text-slate-300">{e.jobsPostedCount}</Td>
                      <Td align="right">
                        <Badge tone={e.activeJobsCount > 0 ? 'success' : 'neutral'}>
                          <span className="tabular-nums">{e.activeJobsCount} active</span>
                        </Badge>
                      </Td>
                      <Td align="right" className="tabular-nums text-slate-300">
                        {e.avgJobSalaryMax > 0 ? `R${e.avgJobSalaryMax.toLocaleString()}` : 'N/A'}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <Card padded={false}>
                <EmptyState
                  icon={SearchX}
                  title="No employers found"
                  description={searchQuery ? 'Try a different search term.' : undefined}
                />
              </Card>
            )}
          </section>
        </div>
      )}

      {/* 3. AI INSIGHTS */}
      {reportType === 'ai-insights' && (
        <Card className="animate-fade-in">
          <CardHeader
            title="AI insights"
            description="Generated by Gemini from candidate profiles, job postings and hiring activity."
            action={
              <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={handleRefresh}>
                Regenerate
              </Button>
            }
          />

          {data?.aiInsights ? (
            <div
              className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-white prose-h3:text-sm prose-p:text-sm prose-p:leading-relaxed prose-p:text-slate-300 prose-strong:text-white prose-ul:text-sm prose-li:text-slate-300 prose-li:marker:text-slate-500"
              dangerouslySetInnerHTML={{ __html: data.aiInsights }}
            />
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No insights yet"
              description="Select Regenerate to analyse the latest data."
            />
          )}

          <p className="mt-6 border-t border-white/[0.06] pt-4 text-xs text-slate-500">
            Last updated {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
          </p>
        </Card>
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
