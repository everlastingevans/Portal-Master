'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface SettingsTabProps {
  user: any;
}

export default function SettingsTab({ user }: SettingsTabProps) {
  return (
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
          <button 
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer" 
            onClick={() => alert('Your data export request has been submitted. Prepare for a large zip file.')}
          >
            Request Data Export
          </button>
          <button 
            className="px-4 py-2 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition cursor-pointer" 
            onClick={() => { if(confirm('Are you sure you want to delete your employer account? This action is permanent, all active job posts will be closed, and applicant data will be anonymized.')) alert('Employer account deletion requested. Our team will contact you to finalize.'); }}
          >
            Delete Account & Data
          </button>
        </div>
      </div>
    </div>
  );
}
