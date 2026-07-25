'use client';

import Link from 'next/link';
import Image from "next/image"; 
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import LaunchPathLogo from "../assets/logo/launchpath-main.png";

import { Sparkles, Briefcase, Settings, LogOut, Search, Bookmark, PlusCircle, ShieldAlert, Menu, X, User, ChevronDown, Mail, Bell } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useToast } from './ToastNotification';

export interface CandidateNavbarProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
    realRole?: string;
    professional_title?: string;
  };
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  applicationsCount?: number;
  unreadNotificationsCount?: number;
  onLogout: () => void;
  onTabChange?: (tab: string) => void;
}

// Brand tokens for reference (matches landing page header)
// navy: #0A1B3D | lime: #A6F23C | lime hover: #C8FF7A

export const Logo = ({ color = "white" }: { color?: string }) => {
  const isLightText = color === "white";
  return (
    <Link href="/" className="group flex items-center" aria-label="LaunchPath home">
      <div className="relative h-[35px] sm:h-[46px] w-auto transition-all duration-500 group-hover:rotate-[-2deg] group-hover:scale-[1.03]">
        <Image 
          src={LaunchPathLogo} 
          alt="LaunchPath Logo" 
          height={46} 
          priority 
          className={`h-full w-auto object-contain transition-all duration-300 ${
            isLightText ? "" : "brightness-95 contrast-125"
          }`} 
        />
      </div>
    </Link>
  );
};


export default function CandidateNavbar({
  user,
  activeTab,
  setActiveTab,
  applicationsCount = 0,
  unreadNotificationsCount = 0,
  onLogout,
  onTabChange
}: CandidateNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { toast } = useToast();

  const handleCandidateRoleSwitch = async (targetRole: 'SUPERADMIN' | 'CANDIDATE' | 'EMPLOYER') => {
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
        toast(`${result.message || 'Thanos mode updated successfully'} 🛡️`, 'success');
        
        setTimeout(() => {
          if (targetRole === 'CANDIDATE') {
            router.push('/candidate/dashboard');
          } else if (targetRole === 'EMPLOYER') {
            router.push('/employer/dashboard');
          } else {
            router.push('/admin/dashboard');
          }
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
      toast('Error switching role: ' + err.message, 'error');
      setSwitching(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDashboard = pathname?.includes('/candidate/dashboard') || pathname === '/candidate';

  const handleTabClick = (tab: string) => {
    setMobileMenuOpen(false);
    if (isDashboard && setActiveTab) {
      setActiveTab(tab);
      if (onTabChange) {
        onTabChange(tab);
      }
    } else {
      // If we are on another page (e.g. /candidate/new), we redirect to dashboard with query state
      router.push(`/candidate/dashboard?tab=${tab}`);
    }
  };

  // Lock background scroll when mobile drawer is open (matches landing page header behavior)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Desktop pill-nav link classes (mirrors landing page nav pill styling)
  const getLinkClasses = (isActive: boolean) => {
    return `rounded-full px-4 py-2 text-[13px] font-semibold uppercase tracking-wider flex items-center gap-2 transition-all duration-200 ${
      isActive
        ? "bg-[#A6F23C] text-[#0A1B3D] shadow-md"
        : "text-white/80 hover:bg-[#C8FF7A] hover:text-[#0A1B3D]"
    }`;
  };

  const getMobileLinkClasses = (isActive: boolean) => {
    return `w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-medium transition-all duration-200 ${
      isActive
        ? "bg-[#A6F23C] text-[#0A1B3D] font-semibold"
        : "text-white/80 hover:bg-[#C8FF7A] hover:text-[#0A1B3D]"
    }`;
  };

  return (
    <header className="relative w-full bg-[#0A1B3D] z-50 text-white select-none">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-12 md:py-5">

        {/* LOGO */}
        <div className="relative z-50">
          <Logo />
        </div>

        {/* Desktop Navigation — glass pill container, same pattern as landing page */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10">
          <button
            onClick={() => handleTabClick('Jobs')}
            className={getLinkClasses(isDashboard ? (activeTab === 'Jobs' || activeTab === 'AllJobs' || activeTab === 'Saved') : false)}
          >
            <Briefcase className="w-4 h-4" />
            <span>Find Jobs</span>
          </button>

          <button
            onClick={() => handleTabClick('Applications')}
            className={getLinkClasses(isDashboard ? activeTab === 'Applications' : false)}
          >
            <Mail className="w-4 h-4" />
            <span>My Proposals</span>
            {applicationsCount > 0 && (
              <span className="bg-[#0A1B3D] text-[#A6F23C] text-[10px] font-black px-2 py-0.5 rounded-full">
                {applicationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('Inbox')}
            className={getLinkClasses(isDashboard ? activeTab === 'Inbox' : false)}
          >
            <Bell className="w-4 h-4" />
            <span>Inbox</span>
            {unreadNotificationsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right section: Profile & Menu Controls */}
        <div className="flex items-center gap-4 relative z-50">

          {user?.realRole === 'SUPERADMIN' && (
            <div className="hidden xl:flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1 gap-1">
              <span className="text-[9px] font-extrabold text-[#A6F23C] uppercase tracking-wider pl-2.5 pr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Thanos:
              </span>
              <button
                onClick={() => handleCandidateRoleSwitch('SUPERADMIN')}
                disabled={switching}
                className={`py-1.5 px-3 rounded-full text-[9px] font-bold tracking-wider uppercase transition cursor-pointer ${
                  user.role === 'SUPERADMIN' || (!user.role || user.role === 'ADMIN')
                    ? 'bg-[#A6F23C] text-[#0A1B3D]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => handleCandidateRoleSwitch('CANDIDATE')}
                disabled={switching}
                className={`py-1.5 px-3 rounded-full text-[9px] font-bold tracking-wider uppercase transition cursor-pointer ${
                  user.role === 'CANDIDATE'
                    ? 'bg-[#A6F23C] text-[#0A1B3D]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Candidate
              </button>
              <button
                onClick={() => handleCandidateRoleSwitch('EMPLOYER')}
                disabled={switching}
                className={`py-1.5 px-3 rounded-full text-[9px] font-bold tracking-wider uppercase transition cursor-pointer ${
                  user.role === 'EMPLOYER'
                    ? 'bg-[#A6F23C] text-[#0A1B3D]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Employer
              </button>
            </div>
          )}

          {/* Desktop Only: User Dropdown */}
          <div className="hidden md:flex items-center relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
              className="flex items-center gap-3 text-white/80 hover:text-white transition p-1.5 pr-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-[#A6F23C]/10 text-[#A6F23C] flex items-center justify-center text-sm font-black border border-[#A6F23C]/30">
                {user?.name?.substring(0, 2).toUpperCase() || 'ME'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight leading-none text-white">{user?.name || 'Olivia Timboys'}</span>
                <span className="text-[10px] text-white/50 font-semibold tracking-wide mt-0.5 leading-none">{user?.professional_title || 'Product Designer'}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-white/50 ml-1" />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#0A1B3D] border border-white/10 rounded-xl py-2 z-50 text-white/80 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-xs font-black truncate text-white uppercase tracking-wider">{user?.name || 'Candidate'}</p>
                  <p className="text-[10px] text-white/50 truncate">{user?.professional_title || 'Professional Partner'}</p>
                </div>
                
                <button 
                  onClick={() => handleTabClick('Profile')}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider text-left hover:bg-white/5 transition-colors text-white/80 font-bold cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#A6F23C]" />
                  <span>My Profile</span>
                </button>

                <Link 
                  href="/candidate/new" 
                  className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-white/5 transition-colors text-white/80 font-bold"
                >
                  <PlusCircle className="w-4 h-4 text-[#A6F23C]" />
                  <span>Upload Resume</span>
                </Link>

                <Link 
                  href="/candidate/update" 
                  className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-white/5 transition-colors text-white/80 font-bold"
                >
                  <Settings className="w-4 h-4 text-white/50" />
                  <span>Settings</span>
                </Link>

                <Link 
                  href="/candidate/delete" 
                  className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider text-red-400 hover:bg-red-950/20 transition-colors font-bold"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Close Account</span>
                </Link>

                <div className="border-t border-white/10 my-1.5"></div>

                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider text-left hover:bg-white/5 transition-colors text-white/50 font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-white/50" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger / Close Button — same animated icon as landing page */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full lg:hidden border border-white/10 bg-white/5 focus:outline-none" 
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <span className={`h-0.5 w-5 rounded-full transition-all duration-300 bg-white ${
              mobileMenuOpen ? "translate-y-2 rotate-45" : ""
            }`} />
            <span className={`h-0.5 w-5 rounded-full transition-all duration-300 bg-white ${
              mobileMenuOpen ? "opacity-0" : ""
            }`} />
            <span className={`h-0.5 w-5 rounded-full transition-all duration-300 bg-white ${
              mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
            }`} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Overlay — same full-screen navy pattern as landing page */}
      <div className={`fixed inset-0 z-40 bg-[#0A1B3D] transition-all duration-300 lg:hidden flex flex-col justify-center px-6 overflow-y-auto py-24 ${
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}>
        <nav className="flex flex-col gap-2 w-full max-w-md mx-auto">

          {/* User summary card */}
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-[#A6F23C]/10 text-[#A6F23C] flex items-center justify-center text-sm font-black border border-[#A6F23C]/30">
              {user?.name?.substring(0, 2).toUpperCase() || 'ME'}
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-black truncate text-white">{user?.name || 'Talent'}</p>
              <p className="text-xs text-white/50 truncate">{user?.professional_title || 'Professional Partner'}</p>
            </div>
          </div>

          {user?.realRole === 'SUPERADMIN' && (
            <div className="bg-white/5 rounded-xl p-2.5 mb-2 border border-white/10 space-y-1.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#A6F23C] flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Thanos Mobile Switcher
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleCandidateRoleSwitch('SUPERADMIN')}
                  disabled={switching}
                  className={`flex-1 flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    user.role === 'SUPERADMIN' || (!user.role || user.role === 'ADMIN')
                      ? 'bg-[#A6F23C] text-[#0A1B3D]'
                      : 'bg-white/5 text-white/50 font-medium'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => handleCandidateRoleSwitch('CANDIDATE')}
                  disabled={switching}
                  className={`flex-1 flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    user.role === 'CANDIDATE'
                      ? 'bg-[#A6F23C] text-[#0A1B3D]'
                      : 'bg-white/5 text-white/50 font-medium'
                  }`}
                >
                  Candidate
                </button>
                <button
                  onClick={() => handleCandidateRoleSwitch('EMPLOYER')}
                  disabled={switching}
                  className={`flex-1 flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    user.role === 'EMPLOYER'
                      ? 'bg-[#A6F23C] text-[#0A1B3D]'
                      : 'bg-white/5 text-white/50 font-medium'
                  }`}
                >
                  Employer
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => handleTabClick('Jobs')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'Jobs' : false)}
          >
            <Sparkles className="w-5 h-5" />
            <span>AI Job Feed</span>
          </button>

          <button
            onClick={() => handleTabClick('AllJobs')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'AllJobs' : false)}
          >
            <Search className="w-5 h-5" />
            <span>All Active Jobs</span>
          </button>

          <button
            onClick={() => handleTabClick('Saved')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'Saved' : false)}
          >
            <Bookmark className="w-5 h-5" />
            <span>Saved Jobs</span>
          </button>

          <button
            onClick={() => handleTabClick('Applications')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'Applications' : false)}
          >
            <Briefcase className="w-5 h-5" />
            <span className="flex-1 text-left">My Applications</span>
            {applicationsCount > 0 && (
              <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full border border-white/10">
                {applicationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('Inbox')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'Inbox' : false)}
          >
            <Mail className="w-5 h-5" />
            <span className="flex-1 text-left">Inbox</span>
            {unreadNotificationsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('Profile')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'Profile' : false)}
          >
            <User className="w-5 h-5" />
            <span>My Profile</span>
          </button>

          <Link
            href="/candidate/new"
            onClick={() => setMobileMenuOpen(false)}
            className={getMobileLinkClasses(pathname === '/candidate/new')}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Upload New Resume</span>
          </Link>

          <Link
            href="/candidate/update"
            onClick={() => setMobileMenuOpen(false)}
            className={getMobileLinkClasses(pathname === '/candidate/update')}
          >
            <Settings className="w-5 h-5" />
            <span>Settings & Preferences</span>
          </Link>

          <Link
            href="/candidate/delete"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-medium text-red-400 hover:bg-red-950/20 transition-colors"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Close Account</span>
          </Link>

          <div className="border-t border-white/10 my-2"></div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-white/60 hover:bg-white/5 text-left font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
