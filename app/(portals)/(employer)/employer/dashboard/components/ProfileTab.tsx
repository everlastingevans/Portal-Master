'use client';

import React from 'react';
import { Building } from 'lucide-react';

interface ProfileTabProps {
  user: any;
  profileLoading: boolean;
  profileName: string;
  setProfileName: (val: string) => void;
  profileTitle: string;
  setProfileTitle: (val: string) => void;
  profilePhone: string;
  setProfilePhone: (val: string) => void;
  profileCompanyName: string;
  setProfileCompanyName: (val: string) => void;
  profileWebsite: string;
  setProfileWebsite: (val: string) => void;
  profileDescription: string;
  setProfileDescription: (val: string) => void;
  profileLocation: string;
  setProfileLocation: (val: string) => void;
  profileLogo: string;
  setProfileLogo: (val: string) => void;
  profileSaving: boolean;
  handleProfileSubmit: (e: React.FormEvent) => void;
}

export default function ProfileTab({
  user,
  profileLoading,
  profileName,
  setProfileName,
  profileTitle,
  setProfileTitle,
  profilePhone,
  setProfilePhone,
  profileCompanyName,
  setProfileCompanyName,
  profileWebsite,
  setProfileWebsite,
  profileDescription,
  setProfileDescription,
  profileLocation,
  setProfileLocation,
  profileLogo,
  setProfileLogo,
  profileSaving,
  handleProfileSubmit,
}: ProfileTabProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-12">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
        <div className="p-2.5 bg-[#5D3FD3]/10 text-[#5D3FD3] rounded-xl">
          <Building className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Company Profile</h2>
          <p className="text-xs text-slate-500">Update your company details, website, overview, and branding logo.</p>
        </div>
      </div>

      {profileLoading ? (
        <div className="py-12 text-center text-slate-500">Loading company profile details...</div>
      ) : (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          
          <h3 className="text-sm font-bold text-[#5D3FD3] uppercase tracking-wider">Contact Person Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
              <input 
                type="text" 
                value={profileName} 
                onChange={e => setProfileName(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Job Title</label>
              <input 
                type="text" 
                value={profileTitle} 
                onChange={e => setProfileTitle(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. Talent Acquisition Lead"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email Address (Read-only)</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled 
                className="w-full text-sm p-2.5 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 text-slate-400 rounded-xl cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Contact Phone</label>
              <input 
                type="text" 
                value={profilePhone} 
                onChange={e => setProfilePhone(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. +27 11 123 4567"
              />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />
          <h3 className="text-sm font-bold text-[#5D3FD3] uppercase tracking-wider">Company Brand & Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
              <input 
                type="text" 
                value={profileCompanyName} 
                onChange={e => setProfileCompanyName(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. LaunchPath Inc."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Company Website</label>
              <input 
                type="text" 
                value={profileWebsite} 
                onChange={e => setProfileWebsite(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. https://launchpath.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Location / Headquarters</label>
              <input 
                type="text" 
                value={profileLocation} 
                onChange={e => setProfileLocation(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. Rosebank, Johannesburg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Logo URL (Optional)</label>
              <input 
                type="text" 
                value={profileLogo} 
                onChange={e => setProfileLogo(e.target.value)} 
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl"
                placeholder="e.g. https://domain.com/logo.png"
              />
            </div>
          </div>

          {/* DRAG AND DROP FILE UPLOADER FOR LOGO */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Upload Company Logo</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      setProfileLogo(event.target.result as string);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#5D3FD3] dark:hover:border-[#5D3FD3] rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-950/20 transition-all flex flex-col items-center justify-center gap-3"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setProfileLogo(event.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
            >
              {profileLogo ? (
                <div className="flex items-center gap-4 text-left justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profileLogo} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 bg-white" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Logo Selected & Loaded</p>
                    <p className="text-[10px] text-slate-400 mt-1">Click or drag another image to replace.</p>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setProfileLogo(''); }} 
                      className="text-red-500 hover:text-red-600 text-xs font-bold mt-2"
                    >
                      Remove Logo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-450 text-xl font-bold">
                    📁
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop your company logo here</p>
                    <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, or SVG up to 2MB (converts to Base64 data)</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Company Description</label>
            <textarea 
              value={profileDescription} 
              onChange={e => setProfileDescription(e.target.value)} 
              rows={4}
              className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl font-sans"
              placeholder="Provide a brief description of what your company does, its culture, and mission..."
            />
          </div>

          <button 
            type="submit" 
            disabled={profileSaving}
            className="w-full bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-bold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {profileSaving ? 'Saving Changes...' : 'Save Company Profile'}
          </button>
        </form>
      )}
    </div>
  );
}
