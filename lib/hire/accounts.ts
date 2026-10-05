/**
 * Staff administration of companies, memberships and Hiring Partner plans/subscriptions.
 * Company access is granted explicitly per user; nothing is inferred from email addresses or domains.
 */
import { randomBytes } from 'crypto';
import { isFeatureEnabled } from '@/lib/features';
import { buildSubscriptionCheckout } from '@/lib/billing/payfast-sandbox';
import { HireTerms } from './terms';
import { INDICATIVE_PLAN, parseFeeRule, parsePlanInput, snapshotFeeBounds } from './partner';

type Result = { status: number; body: any };
const ok = (body: any = {}): Result => ({ status: 200, body: { success: true, ...body } });
const fail = (status: number, error: string, errors?: Record<string, string>): Result => ({ status, body: { error, ...(errors ? { errors } : {}) } });
const id = (v: unknown) => Number(v) || -1;
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max) || null;

const PARTNER_ACTIONS = new Set([
  'CREATE_PLAN',
  'CREATE_PLAN_FROM_INDICATIVE',
  'UPDATE_PLAN',
  'ACTIVATE_PLAN',
  'RETIRE_PLAN',
  'CREATE_SUBSCRIPTION',
  'SET_SUBSCRIPTION_FEE_RULE',
  'SET_TALENT_PARTNER',
  'MANUAL_ACTIVATE',
  'RECORD_MANUAL_PAYMENT',
  'MARK_PAST_DUE',
  'CANCEL_SUBSCRIPTION',
  'CREATE_SANDBOX_CHECKOUT',
]);

export async function runAccountAction(
  db: any,
  action: string,
  p: Record<string, unknown>,
  ctx: { actorId: number | null; terms: HireTerms; now?: Date; appUrl?: string },
): Promise<Result> {
  const now = ctx.now ?? new Date();
  if (PARTNER_ACTIONS.has(action) && !isFeatureEnabled('HIRING_PARTNER')) return fail(404, 'Hiring Partner is not enabled (FEATURE_HIRING_PARTNER).');

  switch (action) {
    /* ------------------------------- Companies ------------------------------- */
    case 'CREATE_COMPANY': {
      const name = str(p.name, 160);
      if (!name || name.length < 2) return fail(400, 'Enter the company name.');
      const company = await db.company.create({ data: { name, notes: str(p.notes, 2000), created_by_id: ctx.actorId } });
      return ok({ company });
    }
    case 'UPDATE_COMPANY': {
      const c = await db.company.findUnique({ where: { id: id(p.companyId) } });
      if (!c) return fail(404, 'Company not found.');
      const name = str(p.name, 160);
      if (!name || name.length < 2) return fail(400, 'Enter the company name.');
      await db.company.update({ where: { id: c.id }, data: { name, notes: str(p.notes, 2000) } });
      return ok();
    }
    case 'ADD_MEMBER': {
      const c = await db.company.findUnique({ where: { id: id(p.companyId) } });
      if (!c) return fail(404, 'Company not found.');
      // Staff pick a specific employer account; access is never granted from an email or domain match
      const user = await db.user.findFirst({ where: { id: id(p.userId), role: { in: ['CLIENT', 'EMPLOYER'] } }, select: { id: true } });
      if (!user) return fail(400, 'Only employer accounts can be added to a company.');
      const role = p.role === 'OWNER' ? 'OWNER' : 'MEMBER';
      const existing = await db.companyMember.findFirst({ where: { company_id: c.id, user_id: user.id } });
      if (existing) return fail(400, 'That user is already a member.');
      await db.companyMember.create({ data: { company_id: c.id, user_id: user.id, role, granted_by_id: ctx.actorId } });
      return ok();
    }
    case 'REMOVE_MEMBER': {
      const m = await db.companyMember.findFirst({ where: { id: id(p.memberId), company_id: id(p.companyId) } });
      if (!m) return fail(404, 'Member not found.');
      await db.companyMember.delete({ where: { id: m.id } });
      return ok();
    }

    /* --------------------------------- Plans --------------------------------- */
    case 'CREATE_PLAN_FROM_INDICATIVE':
    case 'CREATE_PLAN': {
      const raw = action === 'CREATE_PLAN_FROM_INDICATIVE' ? { ...INDICATIVE_PLAN, effective_from: now.toISOString().slice(0, 10), ...p } : p;
      const parsed = parsePlanInput(raw);
      if (!parsed.ok) return fail(400, Object.values(parsed.errors)[0], parsed.errors);
      const plan = await db.partnerPlanVersion.create({ data: { ...parsed.data, status: 'DRAFT', created_by_id: ctx.actorId } });
      return ok({ plan });
    }
    case 'UPDATE_PLAN': {
      const plan = await db.partnerPlanVersion.findUnique({ where: { id: id(p.planId) } });
      if (!plan) return fail(404, 'Plan version not found.');
      // Activated versions are immutable so existing agreements and history stay accurate
      if (plan.status !== 'DRAFT') return fail(400, 'Only draft plan versions can be edited. Create a new version instead.');
      const parsed = parsePlanInput({ ...plan, ...p, effective_from: p.effective_from ?? plan.effective_from.toISOString().slice(0, 10) });
      if (!parsed.ok) return fail(400, Object.values(parsed.errors)[0], parsed.errors);
      await db.partnerPlanVersion.update({ where: { id: plan.id }, data: parsed.data });
      return ok();
    }
    case 'ACTIVATE_PLAN':
    case 'RETIRE_PLAN': {
      const plan = await db.partnerPlanVersion.findUnique({ where: { id: id(p.planId) } });
      if (!plan) return fail(404, 'Plan version not found.');
      const next = action === 'ACTIVATE_PLAN' ? 'ACTIVE' : 'RETIRED';
      if (action === 'ACTIVATE_PLAN' && plan.status !== 'DRAFT') return fail(400, 'Only draft versions can be activated.');
      if (action === 'RETIRE_PLAN' && plan.status !== 'ACTIVE') return fail(400, 'Only active versions can be retired.');
      await db.partnerPlanVersion.update({ where: { id: plan.id }, data: { status: next, ...(next === 'RETIRED' && !plan.effective_to ? { effective_to: now } : {}) } });
      return ok();
    }

    /* ----------------------------- Subscriptions ----------------------------- */
    case 'CREATE_SUBSCRIPTION': {
      const company = await db.company.findUnique({ where: { id: id(p.companyId) } });
      if (!company) return fail(404, 'Company not found.');
      const plan = await db.partnerPlanVersion.findUnique({ where: { id: id(p.planVersionId) } });
      if (!plan || plan.status !== 'ACTIVE') return fail(400, 'Choose an active plan version.');
      const mode = p.billing_mode === 'PAYFAST_SANDBOX' ? 'PAYFAST_SANDBOX' : 'MANUAL';
      if (mode === 'PAYFAST_SANDBOX' && !isFeatureEnabled('PARTNER_BILLING_SANDBOX')) return fail(400, 'PayFast sandbox billing is not enabled.');
      const open = await db.partnerSubscription.findFirst({ where: { company_id: company.id, status: { in: ['PENDING', 'ACTIVE', 'PAST_DUE'] } } });
      if (open) return fail(400, 'This company already has an open subscription.');

      // Negotiated terms for this customer (optional), otherwise the plan version's terms
      const merged = { ...plan, ...(p.overrides && typeof p.overrides === 'object' ? (p.overrides as Record<string, unknown>) : {}) };
      const parsed = parsePlanInput({ ...merged, name: plan.name, effective_from: plan.effective_from.toISOString().slice(0, 10), effective_to: null, entitlements: merged.entitlements ?? plan.entitlements });
      if (!parsed.ok) return fail(400, Object.values(parsed.errors)[0], parsed.errors);
      const t = parsed.data;
      const startsOn = typeof p.starts_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.starts_on) ? new Date(`${p.starts_on}T00:00:00Z`) : now;
      let talentPartner: number | null = null;
      if (p.talent_partner_id) {
        const u = await db.user.findFirst({ where: { id: id(p.talent_partner_id), role: 'SUPERADMIN' }, select: { id: true } });
        if (!u) return fail(400, 'The talent partner must be a LaunchPath admin.');
        talentPartner = u.id;
      }
      const sub = await db.partnerSubscription.create({
        data: {
          company_id: company.id,
          plan_version_id: plan.id,
          billing_mode: mode,
          checkout_ref: `HP_${randomBytes(9).toString('hex')}`,
          monthly_price: t.monthly_price,
          vat_treatment: t.vat_treatment,
          vacancy_limit: t.vacancy_limit,
          success_fee_bps: t.success_fee_bps,
          fee_rule: t.fee_rule,
          ...snapshotFeeBounds(t.fee_rule, { fee_min: t.fee_min, fee_max: t.fee_max }, ctx.terms),
          guarantee_days: t.guarantee_days,
          entitlements: t.entitlements,
          terms_note: str(p.terms_note, 2000),
          talent_partner_id: talentPartner,
          starts_on: startsOn,
          created_by_id: ctx.actorId,
        },
      });
      return ok({ subscription: sub });
    }
    case 'SET_SUBSCRIPTION_FEE_RULE': {
      const sub = await db.partnerSubscription.findUnique({ where: { id: id(p.subscriptionId) } });
      if (!sub) return fail(404, 'Subscription not found.');
      // Once agreed, the fee rule is part of the customer's terms and can't be silently changed
      if (sub.fee_rule !== 'UNDECIDED') return fail(400, 'The fee rule for this agreement is already recorded. A changed agreement needs a new subscription.');
      const parsed = parseFeeRule(p);
      if (Object.keys(parsed.errors).length) return fail(400, Object.values(parsed.errors)[0], parsed.errors);
      if (parsed.data.fee_rule === 'UNDECIDED') return fail(400, 'Choose the agreed rule.');
      await db.partnerSubscription.update({
        where: { id: sub.id },
        data: {
          fee_rule: parsed.data.fee_rule,
          ...snapshotFeeBounds(parsed.data.fee_rule, parsed.data, ctx.terms),
          terms_note: [sub.terms_note, str(p.note, 500)].filter(Boolean).join('\n') || null,
        },
      });
      return ok();
    }
    case 'SET_TALENT_PARTNER': {
      const sub = await db.partnerSubscription.findUnique({ where: { id: id(p.subscriptionId) } });
      if (!sub) return fail(404, 'Subscription not found.');
      let talentPartner: number | null = null;
      if (p.talent_partner_id) {
        const u = await db.user.findFirst({ where: { id: id(p.talent_partner_id), role: 'SUPERADMIN' }, select: { id: true } });
        if (!u) return fail(400, 'The talent partner must be a LaunchPath admin.');
        talentPartner = u.id;
      }
      await db.partnerSubscription.update({ where: { id: sub.id }, data: { talent_partner_id: talentPartner } });
      return ok();
    }
    case 'MANUAL_ACTIVATE': {
      const sub = await db.partnerSubscription.findUnique({ where: { id: id(p.subscriptionId) } });
      if (!sub) return fail(404, 'Subscription not found.');
      if (sub.billing_mode !== 'MANUAL') return fail(400, 'Sandbox subscriptions are activated by PayFast notifications.');
      if (!['PENDING', 'PAST_DUE'].includes(sub.status)) return fail(400, `A ${sub.status.toLowerCase()} subscription can’t be activated.`);
      await db.partnerSubscription.update({ where: { id: sub.id }, data: { status: 'ACTIVE' } });
      return ok();
    }
    case 'RECORD_MANUAL_PAYMENT': {
      const sub = await db.partnerSubscription.findUnique({ where: { id: id(p.subscriptionId) } });
      if (!sub) return fail(404, 'Subscription not found.');
      if (sub.billing_mode !== 'MANUAL') return fail(400, 'Payments for sandbox subscriptions come from PayFast.');
      const amountRand = Number(String(p.amount ?? '').replace(/[\sR,]/gi, ''));
      if (!Number.isFinite(amountRand) || amountRand <= 0) return fail(400, 'Enter the amount received.');
      const periodEnd = typeof p.period_end === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.period_end) ? new Date(`${p.period_end}T00:00:00Z`) : null;
      if (!periodEnd) return fail(400, 'Enter the date this payment covers until.');
      const reference = str(p.reference, 80);
      if (reference && (await db.billingEvent.findUnique({ where: { event_key: `manual:${sub.id}:${reference}` } }))) {
        return fail(400, 'A payment with that reference is already recorded.');
      }
      await db.$transaction(async (tx: any) => {
        await tx.billingEvent.create({
          data: {
            provider: 'MANUAL',
            event_key: `manual:${sub.id}:${reference || randomBytes(6).toString('hex')}`,
            subscription_id: sub.id,
            payment_status: 'COMPLETE',
            amount_cents: Math.round(amountRand * 100),
            provider_payment_id: reference,
            verified: true,
            outcome: 'APPLIED',
            detail: 'Payment recorded manually by staff.',
            recorded_by_id: ctx.actorId,
          },
        });
        await tx.partnerSubscription.update({ where: { id: sub.id }, data: { current_period_end: periodEnd, ...(sub.status === 'CANCELLED' ? {} : { status: 'ACTIVE' }) } });
      });
      return ok();
    }
    case 'MARK_PAST_DUE': {
      const sub = await db.partnerSubscription.findUnique({ where: { id: id(p.subscriptionId) } });
      if (!sub || sub.status !== 'ACTIVE') return fail(400, 'Only an active subscription can be marked past due.');
      await db.partnerSubscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE' } });
      return ok();
    }
    case 'CANCEL_SUBSCRIPTION': {
      const sub = await db.partnerSubscription.findUnique({ where: { id: id(p.subscriptionId) } });
      if (!sub) return fail(404, 'Subscription not found.');
      if (sub.status === 'CANCELLED') return ok();
      // Vacancies stay linked; their treatment after cancellation is a pending commercial decision
      await db.partnerSubscription.update({ where: { id: sub.id }, data: { status: 'CANCELLED', cancelled_at: now, ends_on: now } });
      return ok({ note: 'Cancelled in LaunchPath. For sandbox subscriptions, also cancel in the PayFast sandbox dashboard.' });
    }
    case 'CREATE_SANDBOX_CHECKOUT': {
      const sub = await db.partnerSubscription.findUnique({ where: { id: id(p.subscriptionId) }, include: { company: true } });
      if (!sub) return fail(404, 'Subscription not found.');
      if (sub.billing_mode !== 'PAYFAST_SANDBOX') return fail(400, 'This subscription uses manual billing.');
      if (sub.status !== 'PENDING') return fail(400, 'Checkout is only needed for a pending subscription.');
      try {
        const checkout = buildSubscriptionCheckout({
          checkoutRef: sub.checkout_ref,
          monthlyPrice: sub.monthly_price,
          itemName: `LaunchPath Hiring Partner (SANDBOX) - ${sub.company.name}`,
          email: str(p.email, 200),
          billingDate: now,
          appUrl: ctx.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        });
        return ok({ checkout, sandbox: true });
      } catch (e: any) {
        return fail(400, e.message);
      }
    }
    default:
      return fail(400, 'Unknown action.');
  }
}
