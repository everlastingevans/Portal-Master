'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

interface EditJobModalProps {
  editingJob: any;
  setEditingJob: (job: any) => void;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editCompany: string;
  setEditCompany: (val: string) => void;
  editLocation: string;
  setEditLocation: (val: string) => void;
  editSalaryMin: string;
  setEditSalaryMin: (val: string) => void;
  editSalaryMax: string;
  setEditSalaryMax: (val: string) => void;
  editYearsExperience: string;
  setEditYearsExperience: (val: string) => void;
  editStatus: string;
  setEditStatus: (val: string) => void;
  editMandatorySkills: string;
  setEditMandatorySkills: (val: string) => void;
  editTechStack: string;
  setEditTechStack: (val: string) => void;
  updatingJob: boolean;
  handleUpdateJobSubmit: (e: React.FormEvent) => void;
}

export default function EditJobModal({
  editingJob,
  setEditingJob,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editCompany,
  setEditCompany,
  editLocation,
  setEditLocation,
  editSalaryMin,
  setEditSalaryMin,
  editSalaryMax,
  setEditSalaryMax,
  editYearsExperience,
  setEditYearsExperience,
  editStatus,
  setEditStatus,
  editMandatorySkills,
  setEditMandatorySkills,
  editTechStack,
  setEditTechStack,
  updatingJob,
  handleUpdateJobSubmit,
}: EditJobModalProps) {
  if (!editingJob) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 border border-slate-100 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#5D3FD3]" />
              Edit Job Posting: {editingJob.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Update specifications and requirements for this role.</p>
          </div>
          <button 
            onClick={() => setEditingJob(null)} 
            className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 text-2xl font-bold leading-none cursor-pointer border-none bg-transparent"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleUpdateJobSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Job Title</label>
            <input 
              type="text" 
              value={editTitle} 
              onChange={e => setEditTitle(e.target.value)} 
              className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Job Description (Rich Text Builder)</label>
            <RichTextEditor 
              content={editDescription}
              onChange={setEditDescription}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
              <input 
                type="text" 
                value={editCompany} 
                onChange={e => setEditCompany(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Job Location</label>
              <input 
                type="text" 
                value={editLocation} 
                onChange={e => setEditLocation(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Minimum Salary (R)</label>
              <input 
                type="number" 
                value={editSalaryMin} 
                onChange={e => setEditSalaryMin(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. 450000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Maximum Salary (R)</label>
              <input 
                type="number" 
                value={editSalaryMax} 
                onChange={e => setEditSalaryMax(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. 750000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Years of Experience Required</label>
              <input 
                type="text" 
                value={editYearsExperience} 
                onChange={e => setEditYearsExperience(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. 3-5 years"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Role Status</label>
              <select 
                value={editStatus} 
                onChange={e => setEditStatus(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
              >
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed / Filled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Mandatory Skills (Comma separated)</label>
              <input 
                type="text" 
                value={editMandatorySkills} 
                onChange={e => setEditMandatorySkills(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. React, Node, SQL"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Tech Stack (Comma separated)</label>
              <input 
                type="text" 
                value={editTechStack} 
                onChange={e => setEditTechStack(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. GitHub, GCP, Prisma"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setEditingJob(null)} 
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={updatingJob}
              className="px-6 py-2.5 bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-bold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
            >
              {updatingJob ? 'Saving...' : 'Save Job Posting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
