import { computeHireMetrics, MetricsInput, workingDaysBetween } from '@/lib/hire/metrics';

const NOW = new Date('2026-10-05T12:00:00Z'); // Monday
const d = (s: string) => new Date(`${s}T09:00:00Z`);
const empty = (): MetricsInput => ({ vacancies: [], shortlists: [], interviewRequests: [], entries: [], placements: [] });
const placement = (vacancy_id: number, start: string, patch: Partial<MetricsInput['placements'][number]> = {}) => ({
  vacancy_id,
  start_date: d(start),
  placement_fee: 13_500,
  check_30_outcome: null,
  check_60_outcome: null,
  check_90_outcome: null,
  ...patch,
});

describe('workingDaysBetween', () => {
  it('counts weekdays only', () => {
    expect(workingDaysBetween(d('2026-10-02'), d('2026-10-05'))).toBe(1); // Fri -> Mon
    expect(workingDaysBetween(d('2026-09-28'), d('2026-10-05'))).toBe(5); // Mon -> Mon
    expect(workingDaysBetween(d('2026-10-05'), d('2026-10-05'))).toBe(0);
  });
});

describe('computeHireMetrics', () => {
  it('returns explicit empty states (null, not zero) with no data', () => {
    const m = computeHireMetrics(empty(), { now: NOW, windowDays: 90 });
    expect(m.liveVacancies.value).toBe(0);
    for (const r of [m.shortlistToInterview, m.interviewToOffer, m.vacancyToHire, m.offerAcceptance, m.retention60, m.retention90, m.repeatEmployers]) {
      expect(r.value).toBeNull();
      expect(r.denominator).toBe(0);
      expect(r.definition.length).toBeGreaterThan(40);
    }
    expect(m.timeToShortlist.medianWorkingDays).toBeNull();
    expect(m.averagePlacementFee.value).toBeNull();
  });

  it('calculates the funnel with documented denominators', () => {
    const input: MetricsInput = {
      vacancies: [
        { id: 1, created_at: d('2026-09-01'), status: 'HIRED', lead_id: 1 },
        { id: 2, created_at: d('2026-09-07'), status: 'INTERVIEWING', lead_id: 2 },
        { id: 3, created_at: d('2026-09-14'), status: 'SOURCING', lead_id: 1 },
        { id: 4, created_at: d('2026-09-21'), status: 'CLOSED_NO_HIRE', lead_id: 3 },
        { id: 5, created_at: d('2026-01-05'), status: 'CLOSED_EMPLOYER', lead_id: 4 }, // outside a 90-day window
      ],
      shortlists: [
        { vacancy_id: 1, sent_at: d('2026-09-04') }, // 3 working days
        { vacancy_id: 1, sent_at: d('2026-09-20') }, // later shortlist ignored for timing
        { vacancy_id: 2, sent_at: d('2026-09-16') }, // 7 working days
        { vacancy_id: 4, sent_at: null }, // draft only
      ],
      interviewRequests: [
        { vacancy_id: 1, created_at: d('2026-09-08') },
        { vacancy_id: 1, created_at: d('2026-09-09') },
        { vacancy_id: 2, created_at: d('2026-09-18') },
      ],
      entries: [
        { vacancy_id: 1, offer_status: 'ACCEPTED', offer_made_at: d('2026-09-15'), offer_responded_at: d('2026-09-16') },
        { vacancy_id: 2, offer_status: 'OFFERED', offer_made_at: d('2026-09-25'), offer_responded_at: null },
        { vacancy_id: 2, offer_status: 'DECLINED', offer_made_at: d('2026-09-22'), offer_responded_at: d('2026-09-23') },
      ],
      placements: [placement(1, '2026-09-21', { placement_fee: 12_000 })],
    };
    const m = computeHireMetrics(input, { now: NOW, windowDays: 90 });

    expect(m.vacanciesInWindow).toBe(4);
    expect(m.liveVacancies.value).toBe(2); // INTERVIEWING + SOURCING; HIRED and closed excluded
    expect(m.timeToShortlist).toMatchObject({ medianWorkingDays: 5, averageWorkingDays: 5, count: 2 });
    expect(m.timeToShortlist.withinFiveWorkingDays).toMatchObject({ numerator: 1, denominator: 2 });
    expect(m.shortlistToInterview).toMatchObject({ numerator: 2, denominator: 2, value: 1 });
    expect(m.interviewToOffer).toMatchObject({ numerator: 2, denominator: 2 });
    expect(m.vacancyToHire).toMatchObject({ numerator: 1, denominator: 4, value: 0.25, stillOpen: 2 });
    expect(m.offerAcceptance).toMatchObject({ numerator: 1, denominator: 2, value: 0.5, awaitingResponse: 1 });
    expect(m.averagePlacementFee).toMatchObject({ value: 12_000, count: 1, total: 12_000 });
    expect(m.repeatEmployers).toMatchObject({ numerator: 1, denominator: 3 }); // lead 1 submitted twice
  });

  it('assesses retention only for placements old enough, separating unknown from departed', () => {
    const input: MetricsInput = {
      ...empty(),
      placements: [
        placement(1, '2026-06-01', { check_30_outcome: 'RETAINED', check_60_outcome: 'RETAINED', check_90_outcome: 'RETAINED' }),
        placement(2, '2026-06-02', { check_30_outcome: 'LEFT_VOLUNTARY' }), // departure carries forward
        placement(3, '2026-06-03', { check_60_outcome: 'UNREACHABLE' }), // could not confirm: unknown
        placement(4, '2026-07-01'), // eligible at 60 days, never checked
        placement(5, '2026-09-01', { check_30_outcome: 'RETAINED' }), // not yet 60 days in
      ],
    };
    const m = computeHireMetrics(input, { now: NOW, windowDays: 365 });
    expect(m.retention60).toMatchObject({ eligible: 4, retained: 1, departed: 1, unknownOrNotChecked: 2, notYetDue: 1, value: 0.5 });
    // 90 days: placements 1-3 eligible (started by 7 July); placement 4 started 1 July, 96 days ago, also eligible
    expect(m.retention90).toMatchObject({ eligible: 4, retained: 1, departed: 1, unknownOrNotChecked: 2, notYetDue: 1 });
  });

  it('reports no retention rate when nothing is confirmed, rather than 0% or 100%', () => {
    const m = computeHireMetrics({ ...empty(), placements: [placement(1, '2026-05-01')] }, { now: NOW, windowDays: null });
    expect(m.retention60).toMatchObject({ value: null, eligible: 1, unknownOrNotChecked: 1 });
  });

  it('applies the window to submissions, offers and placements', () => {
    const input: MetricsInput = {
      ...empty(),
      vacancies: [{ id: 1, created_at: d('2025-01-01'), status: 'CHECK_90', lead_id: 1 }],
      entries: [{ vacancy_id: 1, offer_status: 'ACCEPTED', offer_made_at: d('2025-01-20'), offer_responded_at: d('2025-01-21') }],
      placements: [placement(1, '2025-02-01')],
    };
    const recent = computeHireMetrics(input, { now: NOW, windowDays: 30 });
    expect([recent.vacanciesInWindow, recent.offerAcceptance.denominator, recent.averagePlacementFee.count]).toEqual([0, 0, 0]);
    const all = computeHireMetrics(input, { now: NOW, windowDays: null });
    expect([all.vacanciesInWindow, all.offerAcceptance.denominator, all.averagePlacementFee.count]).toEqual([1, 1, 1]);
  });
});
