'use client';

import React from 'react';
import { Globe, MapPin, ImageUp, Link2, Save } from 'lucide-react';
import { SectionLoader } from '@/components/PortalLoader';
import { PageHeader, Card, Section, Field, Input, Textarea, Button, Avatar, Badge } from '@/components/portal/ui';

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

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function hrefFor(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
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
  const readLogoFile = (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileLogo(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => readLogoFile(e.target.files?.[0]);
    input.click();
  };

  const isDataLogo = profileLogo.startsWith('data:');

  return (
    <div className="space-y-8">
      <PageHeader title="Company profile" description="This is how your company appears to candidates on your job listings." />

      {profileLoading ? (
        <Card>
          <SectionLoader label="Loading company profile" />
        </Card>
      ) : (
        <>
          {/* Candidate-facing preview */}
          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-3">
              <p className="text-xs font-medium text-slate-500">Candidate view</p>
              <Badge tone="neutral">Preview</Badge>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar name={profileCompanyName || 'Company'} src={profileLogo || undefined} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-brand-navy">{profileCompanyName || 'Your company name'}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    {profileLocation && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {profileLocation}
                      </span>
                    )}
                    {profileWebsite && (
                      <a
                        href={hrefFor(profileWebsite)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-1.5 text-brand-navy hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{displayUrl(profileWebsite)}</span>
                      </a>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {profileDescription || (
                      <span className="text-slate-400">Add a short overview so candidates know what you do and why they should join.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <form onSubmit={handleProfileSubmit}>
              <Section title="Company details" description="Shown on every job you post.">
                <Field label="Company name" htmlFor="cp-company">
                  <Input
                    id="cp-company"
                    type="text"
                    value={profileCompanyName}
                    onChange={(e) => setProfileCompanyName(e.target.value)}
                    placeholder="e.g. Acme Logistics (Pty) Ltd"
                    required
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Website" htmlFor="cp-website" optional>
                    <Input
                      id="cp-website"
                      type="text"
                      icon={Globe}
                      value={profileWebsite}
                      onChange={(e) => setProfileWebsite(e.target.value)}
                      placeholder="www.example.co.za"
                    />
                  </Field>
                  <Field label="Head office" htmlFor="cp-location" optional>
                    <Input
                      id="cp-location"
                      type="text"
                      icon={MapPin}
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      placeholder="e.g. Rosebank, Johannesburg"
                    />
                  </Field>
                </div>
                <Field label="Company overview" htmlFor="cp-description" hint="Two or three sentences on what you do, your culture and your mission.">
                  <Textarea
                    id="cp-description"
                    value={profileDescription}
                    onChange={(e) => setProfileDescription(e.target.value)}
                    rows={5}
                    placeholder="What does your company do, and what is it like to work there?"
                  />
                </Field>
              </Section>

              <Section title="Logo" description="A square image works best. It appears next to your job listings.">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={profileLogo ? 'Replace company logo' : 'Upload company logo'}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    readLogoFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={openFilePicker}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openFilePicker();
                    }
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 sm:flex-row sm:text-left"
                >
                  {profileLogo ? (
                    <>
                      <Avatar name={profileCompanyName || 'Logo'} src={profileLogo} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-brand-navy">Logo added</p>
                        <p className="mt-0.5 text-xs text-slate-500">Click or drop another image to replace it.</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileLogo('');
                        }}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
                        <ImageUp className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-brand-navy">Drop your logo here, or click to upload</p>
                        <p className="mt-0.5 text-xs text-slate-500">PNG, JPG or SVG</p>
                      </div>
                    </>
                  )}
                </div>
                <Field label="Or use an image URL" htmlFor="cp-logo" optional>
                  <Input
                    id="cp-logo"
                    type="text"
                    icon={Link2}
                    value={isDataLogo ? '' : profileLogo}
                    onChange={(e) => setProfileLogo(e.target.value)}
                    placeholder={isDataLogo ? 'Using uploaded image' : 'https://example.co.za/logo.png'}
                  />
                </Field>
              </Section>

              <Section title="Contact person" description="Who candidates and the LaunchPath team should contact. Not shown publicly.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="cp-name">
                    <Input id="cp-name" type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="e.g. Thandi Mokoena" />
                  </Field>
                  <Field label="Job title" htmlFor="cp-title" optional>
                    <Input
                      id="cp-title"
                      type="text"
                      value={profileTitle}
                      onChange={(e) => setProfileTitle(e.target.value)}
                      placeholder="e.g. HR Manager"
                    />
                  </Field>
                  <Field label="Email" htmlFor="cp-email" hint="Contact support to change your sign-in email.">
                    <Input id="cp-email" type="email" value={user?.email || ''} disabled />
                  </Field>
                  <Field label="Phone" htmlFor="cp-phone" optional>
                    <Input
                      id="cp-phone"
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="e.g. +27 11 123 4567"
                    />
                  </Field>
                </div>
              </Section>

              <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                <Button type="submit" variant="primary" icon={Save} loading={profileSaving}>
                  Save profile
                </Button>
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
