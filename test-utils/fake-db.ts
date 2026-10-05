/**
 * Minimal in-memory stand-in for the Prisma client, covering only the operations the LaunchPath Hire
 * code uses (where filters incl. relation filters, include/select, orderBy, unique constraints,
 * increments, upsert, updateMany, count, groupBy). For tests only: no real transactions.
 */
type Row = Record<string, any>;
type Rel = { model: string; kind: 'one' | 'many'; fk: string; owner: 'self' | 'other' };

const RELATIONS: Record<string, Record<string, Rel>> = {
  vacancy: {
    lead: { model: 'employerLead', kind: 'one', fk: 'lead_id', owner: 'self' },
    events: { model: 'vacancyStatusEvent', kind: 'many', fk: 'vacancy_id', owner: 'other' },
    shortlists: { model: 'shortlist', kind: 'many', fk: 'vacancy_id', owner: 'other' },
    interview_requests: { model: 'interviewRequest', kind: 'many', fk: 'vacancy_id', owner: 'other' },
    placements: { model: 'placement', kind: 'many', fk: 'vacancy_id', owner: 'other' },
    hire_events: { model: 'hireEvent', kind: 'many', fk: 'vacancy_id', owner: 'other' },
    company: { model: 'company', kind: 'one', fk: 'company_id', owner: 'self' },
    partner_subscription: { model: 'partnerSubscription', kind: 'one', fk: 'partner_subscription_id', owner: 'self' },
    programme: { model: 'bulkProgramme', kind: 'one', fk: 'programme_id', owner: 'self' },
  },
  company: {
    members: { model: 'companyMember', kind: 'many', fk: 'company_id', owner: 'other' },
    vacancies: { model: 'vacancy', kind: 'many', fk: 'company_id', owner: 'other' },
    subscriptions: { model: 'partnerSubscription', kind: 'many', fk: 'company_id', owner: 'other' },
    programmes: { model: 'bulkProgramme', kind: 'many', fk: 'company_id', owner: 'other' },
  },
  companyMember: { company: { model: 'company', kind: 'one', fk: 'company_id', owner: 'self' } },
  partnerSubscription: {
    company: { model: 'company', kind: 'one', fk: 'company_id', owner: 'self' },
    plan_version: { model: 'partnerPlanVersion', kind: 'one', fk: 'plan_version_id', owner: 'self' },
    vacancies: { model: 'vacancy', kind: 'many', fk: 'partner_subscription_id', owner: 'other' },
    billing_events: { model: 'billingEvent', kind: 'many', fk: 'subscription_id', owner: 'other' },
  },
  bulkProgramme: {
    company: { model: 'company', kind: 'one', fk: 'company_id', owner: 'self' },
    vacancies: { model: 'vacancy', kind: 'many', fk: 'programme_id', owner: 'other' },
    terms: { model: 'programmeTerms', kind: 'many', fk: 'programme_id', owner: 'other' },
  },
  shortlist: {
    vacancy: { model: 'vacancy', kind: 'one', fk: 'vacancy_id', owner: 'self' },
    candidates: { model: 'shortlistCandidate', kind: 'many', fk: 'shortlist_id', owner: 'other' },
    links: { model: 'shortlistLink', kind: 'many', fk: 'shortlist_id', owner: 'other' },
  },
  shortlistLink: { shortlist: { model: 'shortlist', kind: 'one', fk: 'shortlist_id', owner: 'self' } },
  shortlistCandidate: {
    shortlist: { model: 'shortlist', kind: 'one', fk: 'shortlist_id', owner: 'self' },
    interview_requests: { model: 'interviewRequest', kind: 'many', fk: 'shortlist_candidate_id', owner: 'other' },
    placement: { model: 'placement', kind: 'one', fk: 'shortlist_candidate_id', owner: 'other' },
    employer_feedback_entries: { model: 'employerFeedback', kind: 'many', fk: 'shortlist_candidate_id', owner: 'other' },
  },
  interviewRequest: {
    vacancy: { model: 'vacancy', kind: 'one', fk: 'vacancy_id', owner: 'self' },
    shortlist_candidate: { model: 'shortlistCandidate', kind: 'one', fk: 'shortlist_candidate_id', owner: 'self' },
  },
  placement: {
    vacancy: { model: 'vacancy', kind: 'one', fk: 'vacancy_id', owner: 'self' },
    shortlist_candidate: { model: 'shortlistCandidate', kind: 'one', fk: 'shortlist_candidate_id', owner: 'self' },
  },
  user: { video_interviews: { model: 'videoInterview', kind: 'many', fk: 'candidate_id', owner: 'other' } },
};

const UNIQUE: Record<string, string[]> = {
  vacancy: ['submission_key'],
  employerLead: ['email'],
  shortlistLink: ['token_hash'],
  placement: ['shortlist_candidate_id'],
  hireEvent: ['dedupe_key'],
  emailLog: ['dedupe_key'],
  user: ['email'],
  partnerSubscription: ['checkout_ref', 'provider_token'],
  billingEvent: ['event_key'],
  bulkProgramme: ['submission_key'],
};

const DEFAULTS: Record<string, () => Row> = {
  vacancy: () => ({ status: 'NEW_VACANCY', status_changed_at: new Date(), key_skills: [], owner_id: null, internal_notes: null, company_id: null, commercial_model: 'STANDARD', partner_subscription_id: null, programme_id: null, salary_benchmark_note: null }),
  company: () => ({}),
  companyMember: () => ({ role: 'MEMBER' }),
  partnerPlanVersion: () => ({ status: 'DRAFT', entitlements: [], effective_to: null }),
  partnerSubscription: () => ({ status: 'PENDING', billing_mode: 'MANUAL', entitlements: [], current_period_end: null, provider_token: null, cancelled_at: null, talent_partner_id: null }),
  billingEvent: () => ({ verified: false, received_at: new Date() }),
  bulkProgramme: () => ({ status: 'ENQUIRY', role_categories: [], company_id: null }),
  programmeTerms: () => ({}),
  employerFeedback: () => ({}),
  shortlist: () => ({ status: 'DRAFT', sent_at: null, title: null }),
  shortlistLink: () => ({ revoked_at: null, view_count: 0, last_viewed_at: null }),
  shortlistCandidate: () => ({ position: 0, key_skills: [], candidate_id: null, offer_status: null, offer_made_at: null, offer_responded_at: null, interview_outcome: null }),
  interviewRequest: () => ({ status: 'NEW', scheduled_for: null }),
  placement: () => ({ fee_basis: 'PERCENT', commercial_model: 'STANDARD', fee_flat: null, invoice_status: 'NOT_INVOICED', invoiced_at: null, paid_at: null, check_30_outcome: null, check_60_outcome: null, check_90_outcome: null }),
  hireEvent: () => ({ occurred_at: new Date() }),
  emailLog: () => ({ status: 'PENDING', attempts: 0, last_error: null, sent_at: null }),
  vacancyStatusEvent: () => ({}),
  employerLead: () => ({}),
  appSetting: () => ({}),
  user: () => ({ role: 'CANDIDATE' }),
  videoInterview: () => ({}),
};

const PK: Record<string, string> = { appSetting: 'key' };

const eq = (a: any, b: any) => (a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b);
const cmp = (a: any, b: any) => (a instanceof Date ? a.getTime() : a) - (b instanceof Date ? b.getTime() : b);

export function createFakeDb() {
  const tables: Record<string, Row[]> = {};
  const seq: Record<string, number> = {};
  const table = (m: string) => (tables[m] ||= []);

  function related(model: string, row: Row, name: string): Row | Row[] | null {
    const rel = RELATIONS[model]?.[name];
    if (!rel) return undefined as any;
    if (rel.owner === 'self') return table(rel.model).find((r) => r.id === row[rel.fk]) ?? null;
    const rows = table(rel.model).filter((r) => r[rel.fk] === row.id);
    return rel.kind === 'many' ? rows : rows[0] ?? null;
  }

  function matchValue(v: any, cond: any): boolean {
    if (cond === null) return v === null || v === undefined;
    if (cond instanceof Date || typeof cond !== 'object' || Array.isArray(cond)) return eq(v ?? null, cond);
    const insensitive = cond.mode === 'insensitive';
    const norm = (x: any) => (insensitive && typeof x === 'string' ? x.toLowerCase() : x);
    for (const [op, arg] of Object.entries(cond)) {
      if (op === 'mode') continue;
      if (op === 'equals' && !eq(norm(v), norm(arg))) return false;
      if (op === 'in' && !(arg as any[]).some((a) => eq(norm(v), norm(a)))) return false;
      if (op === 'notIn' && (arg as any[]).some((a) => eq(norm(v), norm(a)))) return false;
      if (op === 'not') {
        if (arg === null ? v === null || v === undefined : typeof arg === 'object' && !(arg instanceof Date) ? matchValue(v, arg) : eq(v, arg)) return false;
      }
      if (op === 'contains' && !(typeof v === 'string' && norm(v).includes(norm(arg)))) return false;
      if (op === 'gte' && !(v != null && cmp(v, arg) >= 0)) return false;
      if (op === 'gt' && !(v != null && cmp(v, arg) > 0)) return false;
      if (op === 'lte' && !(v != null && cmp(v, arg) <= 0)) return false;
      if (op === 'lt' && !(v != null && cmp(v, arg) < 0)) return false;
    }
    return true;
  }

  function matches(model: string, row: Row, where: Row = {}): boolean {
    for (const [k, cond] of Object.entries(where)) {
      if (k === 'OR') {
        if (!(cond as Row[]).some((w) => matches(model, row, w))) return false;
        continue;
      }
      if (k === 'AND') {
        if (!(cond as Row[]).every((w) => matches(model, row, w))) return false;
        continue;
      }
      const rel = RELATIONS[model]?.[k];
      if (rel) {
        const target = related(model, row, k);
        if (rel.kind === 'many') {
          const list = target as Row[];
          if (cond.some && !list.some((r) => matches(rel.model, r, cond.some))) return false;
        } else if (!target || !matches(rel.model, target as Row, cond)) return false;
        continue;
      }
      if (!matchValue(row[k], cond)) return false;
    }
    return true;
  }

  function sort(rows: Row[], orderBy: any): Row[] {
    if (!orderBy) return rows;
    const keys = (Array.isArray(orderBy) ? orderBy : [orderBy]).map((o) => Object.entries(o)[0] as [string, 'asc' | 'desc']);
    return [...rows].sort((a, b) => {
      for (const [k, dir] of keys) {
        const c = cmp(a[k] ?? 0, b[k] ?? 0);
        if (c !== 0) return dir === 'asc' ? c : -c;
      }
      return 0;
    });
  }

  function shape(model: string, row: Row | null, args: Row = {}): Row | null {
    if (!row) return null;
    const out: Row = args.select ? {} : { ...row };
    const spec = args.select || args.include || {};
    for (const [k, v] of Object.entries(spec)) {
      if (!v) continue;
      const rel = RELATIONS[model]?.[k];
      if (!rel) {
        if (args.select) out[k] = row[k];
        continue;
      }
      const sub = v === true ? {} : (v as Row);
      const target = related(model, row, k);
      if (rel.kind === 'many') {
        let list = (target as Row[]).filter((r) => matches(rel.model, r, sub.where));
        list = sort(list, sub.orderBy);
        if (sub.take) list = list.slice(0, sub.take);
        out[k] = list.map((r) => shape(rel.model, r, sub));
      } else out[k] = shape(rel.model, target as Row | null, sub);
    }
    return out;
  }

  function applyData(row: Row, data: Row) {
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v) && 'increment' in v) row[k] = (row[k] || 0) + v.increment;
      else if (v !== undefined) row[k] = v;
    }
    row.updated_at = new Date(Date.now() + (row.__bump = (row.__bump || 0) + 1));
  }

  function checkUnique(model: string, row: Row) {
    for (const f of UNIQUE[model] || []) {
      if (row[f] === null || row[f] === undefined) continue;
      if (table(model).some((r) => r !== row && eq(r[f], row[f]))) {
        const err: any = new Error(`Unique constraint failed on ${model}.${f}`);
        err.code = 'P2002';
        throw err;
      }
    }
  }

  const findUniqueRow = (model: string, where: Row) => table(model).find((r) => matches(model, r, where)) ?? null;

  function delegate(model: string) {
    return {
      findUnique: async (a: Row) => shape(model, findUniqueRow(model, a.where), a),
      findFirst: async (a: Row = {}) => shape(model, sort(table(model).filter((r) => matches(model, r, a.where)), a.orderBy)[0] ?? null, a),
      findMany: async (a: Row = {}) => {
        let rows = sort(table(model).filter((r) => matches(model, r, a.where)), a.orderBy);
        if (a.take) rows = rows.slice(0, a.take);
        return rows.map((r) => shape(model, r, a));
      },
      count: async (a: Row = {}) => table(model).filter((r) => matches(model, r, a.where)).length,
      create: async (a: Row) => {
        const pk = PK[model] || 'id';
        const now = new Date();
        const row: Row = { ...DEFAULTS[model]?.(), created_at: now, updated_at: now };
        if (pk === 'id') row.id = seq[model] = (seq[model] || 0) + 1;
        Object.assign(row, a.data);
        checkUnique(model, row);
        table(model).push(row);
        return shape(model, row, a);
      },
      update: async (a: Row) => {
        const row = findUniqueRow(model, a.where);
        if (!row) throw Object.assign(new Error(`${model} not found`), { code: 'P2025' });
        applyData(row, a.data);
        checkUnique(model, row);
        return shape(model, row, a);
      },
      updateMany: async (a: Row) => {
        const rows = table(model).filter((r) => matches(model, r, a.where));
        rows.forEach((r) => applyData(r, a.data));
        return { count: rows.length };
      },
      upsert: async (a: Row) => {
        const existing = findUniqueRow(model, a.where);
        if (existing) {
          applyData(existing, a.update);
          return shape(model, existing, a);
        }
        return delegate(model).create({ data: a.create, select: a.select, include: a.include });
      },
      delete: async (a: Row) => {
        const row = findUniqueRow(model, a.where);
        tables[model] = table(model).filter((r) => r !== row);
        return row;
      },
      groupBy: async (a: Row) => {
        const groups = new Map<string, Row>();
        for (const r of table(model)) {
          const key = a.by.map((k: string) => r[k]).join('|');
          const g = groups.get(key) || { ...Object.fromEntries(a.by.map((k: string) => [k, r[k]])), _count: { _all: 0 } };
          g._count._all++;
          groups.set(key, g);
        }
        return Array.from(groups.values());
      },
    };
  }

  const models = Object.keys(DEFAULTS);
  const db: Row = { _tables: tables };
  for (const m of models) db[m] = delegate(m);
  db.$transaction = async (fn: any) => fn(db);
  db.reset = () => {
    for (const k of Object.keys(tables)) delete tables[k];
    for (const k of Object.keys(seq)) delete seq[k];
  };
  return db;
}
