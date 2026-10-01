'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, Building, RefreshCw } from 'lucide-react';
import { useToast } from './ToastNotification';

interface ThanosSidebarWidgetProps {
  currentRole: string; // e.g. "SUPERADMIN", "CANDIDATE", "EMPLOYER"
}

export function ThanosSidebarWidget({ currentRole }: ThanosSidebarWidgetProps) {
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRoleSwitch = async (targetRole: 'SUPERADMIN' | 'CANDIDATE' | 'EMPLOYER') => {
    if (switching) return;
    setSwitching(true);
    
    try {
      const res = await fetch('/api/superadmin/thanos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      if (res.ok) {
        const result = await res.json();
        
        toast(result.message || 'Switched view', 'success');
        
        setTimeout(() => {
          if (targetRole === 'CANDIDATE') {
            router.push('/candidate/dashboard');
          } else if (targetRole === 'EMPLOYER') {
            router.push('/employer/dashboard');
          } else {
            router.push('/admin/dashboard');
          }
          // Let router and window reload the page state to get fresh session roles
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }, 800);
      } else {
        const errorData = await res.json();
        toast(errorData.error || 'Failed to trigger Thanos switch.', 'error');
        setSwitching(false);
      }
    } catch (err: any) {
      toast('Error activating Thanos mode: ' + err.message, 'error');
      setSwitching(false);
    }
  };

  const active = String(currentRole || 'SUPERADMIN').toUpperCase();

  const options = [
    { role: 'SUPERADMIN' as const, label: 'Admin', icon: Shield },
    { role: 'CANDIDATE' as const, label: 'Candidate', icon: User },
    { role: 'EMPLOYER' as const, label: 'Employer', icon: Building },
  ];

  return (
    <div className="mx-3 mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between select-none">
        <span className="text-[11px] font-medium text-white/50">View platform as</span>
        {switching && <RefreshCw className="h-3 w-3 animate-spin text-brand-lime" />}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/20 p-1">
        {options.map(({ role, label, icon: Icon }) => {
          const isActive = active === role;
          return (
            <button
              key={role}
              onClick={() => !isActive && handleRoleSwitch(role)}
              disabled={switching}
              aria-pressed={isActive}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors disabled:cursor-wait ${
                isActive ? 'bg-brand-lime text-brand-navy' : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
