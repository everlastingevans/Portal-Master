'use client';

import { ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';

export interface SettingsTabProps {
  email: string;
  setEmail: (val: string) => void;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  handleUpdateSettings: (e: React.FormEvent) => Promise<void>;
}

export default function SettingsTab({
  email,
  setEmail,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleUpdateSettings,
}: SettingsTabProps) {
  const { success, warning, info } = useToast();

  const handleExportData = () => {
    success('Your data export request has been submitted. You will receive an email shortly.');
  };

  const handleDeleteAccount = () => {
    const isConfirmed = window.confirm('Are you sure you want to delete your account? This action is permanent and all data will be lost.');
    if (isConfirmed) {
      info('Account deletion requested. Support will contact you to verify.');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <h2 className="text-xl font-bold mb-6">Account Settings</h2>
      <form onSubmit={handleUpdateSettings} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-705 dark:text-slate-300 mb-1">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            className="w-full px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white"
          />
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-705 dark:text-slate-300 mb-1">Current Password</label>
              <input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                className="w-full px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans text-slate-900 dark:text-white" 
                placeholder="Required if changing password"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-705 dark:text-slate-300 mb-1">New Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="w-full px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-705 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="w-full px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="pt-6">
          <button 
            type="submit" 
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold py-3 rounded-lg shadow-md transition text-sm cursor-pointer border-none"
          >
            Save Changes
          </button>
        </div>
      </form>

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-205 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-500" />
          Data Privacy & POPIA
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          In accordance with the Protection of Personal Information Act (POPIA), you have the right to request an export of your personal data or request complete deletion of your account and associated records.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 font-bold text-sm">
          <button 
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer" 
            onClick={handleExportData}
          >
            Request Data Export
          </button>
          <button 
            className="px-4 py-2.5 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition cursor-pointer" 
            onClick={handleDeleteAccount}
          >
            Delete Account & Data
          </button>
        </div>
      </div>
    </div>
  );
}
