'use client';

import { Clock, Briefcase, CheckCircle2, XCircle } from 'lucide-react';

export interface ApplicationsTabProps {
  applications: any[];
  handleUpdateInterview: (interviewId: number, status: string) => Promise<void>;
}

export default function ApplicationsTab({
  applications = [],
  handleUpdateInterview,
}: ApplicationsTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />;
      case 'Interviewing': return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-500" />;
      case 'Hired': return <CheckCircle2 className="w-4 h-4 text-[#22c55e] dark:text-[#22c55e]" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-600 dark:text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
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
                  <p className="text-xs text-slate-500 mt-2 font-medium">Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
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
                          <button onClick={() => handleUpdateInterview(iv.id, 'Confirmed')} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold cursor-pointer transition-colors">Confirm</button>
                          <button onClick={() => handleUpdateInterview(iv.id, 'Rescheduled')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold cursor-pointer transition-colors">Request Reschedule</button>
                          <button onClick={() => handleUpdateInterview(iv.id, 'Cancelled')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer transition-colors">Decline</button>
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
  );
}
