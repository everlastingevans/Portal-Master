'use client';

import { track } from '@vercel/analytics';
import { sendGAEvent } from '@next/third-parties/google';

/**
 * Employer-funnel events, sent to both Vercel Analytics and GA4 (already loaded in the root layout).
 * Properties are an explicit allow-list of non-personal values: never pass names, emails, phone
 * numbers, company names or free-text form content.
 */
export type EmployerEvent =
  | 'employer_page_view'
  | 'employer_cta_click'
  | 'vacancy_form_start'
  | 'vacancy_submitted'
  | 'shortlist_viewed'
  | 'interview_requested';

type EventProps = {
  /** Which page the event happened on, e.g. "home", "find_candidates" */
  page?: string;
  /** Where on the page a CTA sits, e.g. "hero", "pricing" */
  location?: string;
  /** Which CTA, e.g. "find_candidates", "how_it_works" */
  cta?: string;
  /** Role category code from the fixed list (SALES, TECHNOLOGY, ...) */
  role_category?: string;
};

const ALLOWED_KEYS: (keyof EventProps)[] = ['page', 'location', 'cta', 'role_category'];

export function trackEmployerEvent(event: EmployerEvent, props: EventProps = {}) {
  const safe: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const value = props[key];
    if (typeof value === 'string' && /^[a-z0-9_]{1,40}$/i.test(value)) safe[key] = value;
  }
  try {
    track(event, safe);
  } catch {
    /* analytics must never break the page */
  }
  try {
    if (typeof window !== 'undefined' && window.dataLayer) sendGAEvent('event', event, safe);
  } catch {
    /* analytics must never break the page */
  }
}
