'use client';

import Link from 'next/link';
import Image from "next/image"; 
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import LaunchPathLogo from "../assets/logo/launchpath.png";

import { 
  Sparkles, 
  Briefcase, 
  Settings, 
  LogOut, 
  Search, 
  Bookmark, 
  PlusCircle, 
  ShieldAlert,
  Menu,
  X,
  User,
  ChevronDown,
  Mail,
  Bell
} from 'lucide-react';
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

  const getLinkClasses = (isActive: boolean) => {
    return isActive
      ? 'text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider bg-neutral-900 rounded-lg flex items-center gap-2 transition-all border border-neutral-800'
      : 'text-neutral-400 hover:text-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all hover:bg-neutral-900/50 rounded-lg';
  };

  const getMobileLinkClasses = (isActive: boolean) => {
    return isActive
      ? 'w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-900 text-white font-bold text-left transition-colors border border-neutral-800'
      : 'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-400 hover:bg-neutral-900/50 hover:text-white font-semibold text-left transition-colors';
  };

  const [isOpen, setIsOpen] = useState(false);


  return (
    <header className="relative w-full bg-[#0B0B0C] border-b border-neutral-900 shadow-xl z-50 text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left section: Logo */}
          {/* LOGO: Forced to z-50 so it stays above the open menu screen */}
          <div className="relative z-50">
            <Logo />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex space-x-2 h-full items-center">
            {/* Find Jobs */}
            <button
              onClick={() => handleTabClick('Jobs')}
              className={getLinkClasses(isDashboard ? (activeTab === 'Jobs' || activeTab === 'AllJobs' || activeTab === 'Saved') : false)}
            >
              <Briefcase className="w-4 h-4 text-[#22c55e]" />
              <span>Find Jobs</span>
            </button>

            {/* My Proposals */}
            <button
              onClick={() => handleTabClick('Applications')}
              className={getLinkClasses(isDashboard ? activeTab === 'Applications' : false)}
            >
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>My Proposals</span>
              {applicationsCount > 0 && (
                <span className="bg-[#22c55e] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  {applicationsCount}
                </span>
              )}
            </button>

            {/* Inbox */}
            <button
              onClick={() => handleTabClick('Inbox')}
              className={getLinkClasses(isDashboard ? activeTab === 'Inbox' : false)}
            >
              <Bell className="w-4 h-4 text-emerald-500" />
              <span>Inbox</span>
              {unreadNotificationsCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

          </nav>

          {/* Right section: Profile & Menu Controls */}
          <div className="flex items-center gap-6">
            
            {/* Theme Toggle */}
            {/* <div className="bg-neutral-900 p-1.5 rounded-lg border border-neutral-800">
              <ThemeToggle />
            </div> */}

            {user?.realRole === 'SUPERADMIN' && (
              <div className="hidden xl:flex items-center bg-neutral-950 border border-neutral-900 rounded-full p-1 gap-1">
                <span className="text-[9px] font-extrabold text-[#22c55e] uppercase tracking-wider pl-2.5 pr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Thanos:
                </span>
                <button
                  onClick={() => handleCandidateRoleSwitch('SUPERADMIN')}
                  disabled={switching}
                  className={`flex items-center gap-1 py-1.5 px-3 rounded-full text-[9px] font-bold tracking-wider uppercase transition cursor-pointer ${
                    user.role === 'SUPERADMIN' || (!user.role || user.role === 'ADMIN')
                      ? 'bg-neutral-800 text-white shadow'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => handleCandidateRoleSwitch('CANDIDATE')}
                  disabled={switching}
                  className={`flex items-center gap-1 py-1.5 px-3 rounded-full text-[9px] font-bold tracking-wider uppercase transition cursor-pointer ${
                    user.role === 'CANDIDATE'
                      ? 'bg-neutral-800 text-white shadow'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Candidate
                </button>
                <button
                  onClick={() => handleCandidateRoleSwitch('EMPLOYER')}
                  disabled={switching}
                  className={`flex items-center gap-1 py-1.5 px-3 rounded-full text-[9px] font-bold tracking-wider uppercase transition cursor-pointer ${
                    user.role === 'EMPLOYER'
                      ? 'bg-neutral-800 text-white shadow'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Employer
                </button>
              </div>
            )}
            
            {/* Desktop Settings & Profile actions */}
            <div className="hidden md:flex items-center gap-4 relative">
              {/* User Dropdown Toggle */}
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                  className="flex items-center gap-3 text-neutral-300 hover:text-white transition p-2 rounded-xl bg-neutral-900 border border-neutral-850 hover:border-neutral-800 text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#22c55e]/10 text-[#22c55e] flex items-center justify-center text-sm font-black border border-[#22c55e]/30 shadow-inner">
                    {user?.name?.substring(0, 2).toUpperCase() || 'ME'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-tight leading-none text-white">{user?.name || 'Olivia Timboys'}</span>
                    <span className="text-[10px] text-neutral-400 font-semibold tracking-wide mt-0.5 leading-none">{user?.professional_title || 'Product Designer'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-400 ml-1" />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0B0B0C] border border-neutral-900 rounded-xl shadow-2xl py-2 z-50 text-neutral-300 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-neutral-900">
                      <p className="text-xs font-black truncate text-white uppercase tracking-wider">{user?.name || 'Candidate'}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{user?.professional_title || 'Professional Partner'}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleTabClick('Profile')}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider text-left hover:bg-neutral-900 transition-colors text-neutral-300 font-bold cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#22c55e]" />
                      <span>My Profile</span>
                    </button>

                    <Link 
                      href="/candidate/new" 
                      className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-neutral-900 transition-colors text-neutral-300 font-bold"
                    >
                      <PlusCircle className="w-4 h-4 text-[#22c55e]" />
                      <span>Upload Resume</span>
                    </Link>

                    <Link 
                      href="/candidate/update" 
                      className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-neutral-900 transition-colors text-neutral-300 font-bold"
                    >
                      <Settings className="w-4 h-4 text-neutral-400" />
                      <span>Settings</span>
                    </Link>

                    <Link 
                      href="/candidate/delete" 
                      className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider text-red-400 hover:bg-red-950/20 transition-colors font-bold"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <span>Close Account</span>
                    </Link>

                    <div className="border-t border-neutral-900 my-1.5"></div>

                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider text-left hover:bg-neutral-900 transition-colors text-neutral-500 font-bold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-neutral-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-inner py-4 px-4 space-y-3">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-900">
            <p className="text-sm font-semibold truncate text-slate-950 dark:text-white">{user?.name || 'Talent'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.professional_title || 'Professional Partner'}</p>
          </div>

          {user?.realRole === 'SUPERADMIN' && (
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-2.5 mx-1 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-violet-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse text-violet-400" />
                Thanos Mobile Switcher
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleCandidateRoleSwitch('SUPERADMIN')}
                  disabled={switching}
                  className={`flex-1 flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    user.role === 'SUPERADMIN' || (!user.role || user.role === 'ADMIN')
                      ? 'bg-[#7145FF] text-white shadow-sm shadow-[#7145FF]/20'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 font-medium'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => handleCandidateRoleSwitch('CANDIDATE')}
                  disabled={switching}
                  className={`flex-1 flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    user.role === 'CANDIDATE'
                      ? 'bg-[#7145FF] text-white shadow-sm shadow-[#7145FF]/20'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 font-medium'
                  }`}
                >
                  Candidate
                </button>
                <button
                  onClick={() => handleCandidateRoleSwitch('EMPLOYER')}
                  disabled={switching}
                  className={`flex-1 flex items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    user.role === 'EMPLOYER'
                      ? 'bg-[#7145FF] text-white shadow-sm shadow-[#7145FF]/20'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 font-medium'
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
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>AI Job Feed</span>
          </button>

          <button
            onClick={() => handleTabClick('AllJobs')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'AllJobs' : false)}
          >
            <Search className="w-5 h-5 text-indigo-500" />
            <span>All Active Jobs</span>
          </button>

          <button
            onClick={() => handleTabClick('Saved')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'Saved' : false)}
          >
            <Bookmark className="w-5 h-5 text-amber-500" />
            <span>Saved Jobs</span>
          </button>

          <button
            onClick={() => handleTabClick('Applications')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'Applications' : false)}
          >
            <Briefcase className="w-5 h-5 text-emerald-500" />
            <span className="flex-1 text-left">My Applications</span>
            {applicationsCount > 0 && (
              <span className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                {applicationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('Inbox')}
            className={getMobileLinkClasses(isDashboard ? activeTab === 'Inbox' : false)}
          >
            <Mail className="w-5 h-5 text-purple-500" />
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
            <User className="w-5 h-5 text-blue-500" />
            <span>My Profile</span>
          </button>

          <Link
            href="/candidate/new"
            onClick={() => setMobileMenuOpen(false)}
            className={getMobileLinkClasses(pathname === '/candidate/new')}
          >
            <PlusCircle className="w-5 h-5 text-pink-500" />
            <span>Upload New Resume</span>
          </Link>

          <Link
            href="/candidate/update"
            onClick={() => setMobileMenuOpen(false)}
            className={getMobileLinkClasses(pathname === '/candidate/update')}
          >
            <Settings className="w-5 h-5 text-slate-500" />
            <span>Settings & Preferences</span>
          </Link>

          <Link
            href="/candidate/delete"
            onClick={() => setMobileMenuOpen(false)}
            className={getMobileLinkClasses(pathname === '/candidate/delete')}
          >
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span>Close Account</span>
          </Link>

          <div className="border-t border-slate-100 dark:border-slate-900 my-2"></div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-650 hover:bg-slate-50 dark:hover:bg-slate-900 text-left font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </header>
  );
}
