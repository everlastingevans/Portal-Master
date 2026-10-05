'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, Plus, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ToastNotification';
import { Modal, useConfirm } from '../_components/overlay';
import { Badge, Button, Card, EmptyState, Field, IconButton, Input, PageHeader, PageSkeleton, SearchInput, Select, Textarea } from '../_components/ui';
import { ENTITLEMENTS, FEE_RULES, VAT_TREATMENTS, countsTowardLimit } from '@/lib/hire/partner';
import { formatRand, formatRate } from '@/lib/hire/terms';
import { fmtDate } from '../vacancies/_shared';

const label = (list: readonly { value: string; label: string }[], v: string) => list.find((o) => o.value === v)?.label ?? v;
const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { ACTIVE: 'success', PENDING: 'warning', PAST_DUE: 'danger', CANCELLED: 'neutral', DRAFT: 'warning', RETIRED: 'neutral' };

export default function PartnerAdminPage() {
  const { error: toastError, success } = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState<any>(null);
  const [newCompany, setNewCompany] = useState('');
  const [addingMember, setAddingMember] = useState<any>(null);
  const [subForm, setSubForm] = useState<any>(null);
  const [feeRule, setFeeRule] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [checkout, setCheckout] = useState<any>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/superadmin/partner', { cache: 'no-store' });
    const j = await r.json();
    if (!r.ok) toastError(j.error || 'Could not load');
    else setData(j);
  }, [toastError]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string, payload: Record<string, unknown> = {}) => {
    const r = await fetch('/api/superadmin/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      toastError(j.error || 'Something went wrong');
      return null;
    }
    await load();
    return j;
  };

  if (!data) return <PageSkeleton />;
  const partnerOn = data.features.find((f: any) => f.key === 'HIRING_PARTNER')?.enabled;
  const sandboxOn = data.features.find((f: any) => f.key === 'PARTNER_BILLING_SANDBOX')?.enabled;
  const userName = (id: number) => {
    const u = data.memberUsers.find((x: any) => x.id === id);
    return u ? `${u.name || u.email} (${u.email})` : `User #${id}`;
  };
  const adminName = (id?: number | null) => data.admins.find((a: any) => a.id === id)?.name || data.admins.find((a: any) => a.id === id)?.email || '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies & Hiring Partner"
        description="Verified customer companies and who can access them. Access is granted per user by staff; it is never inferred from an email address or domain."
      />

      {/* Companies */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-sm font-semibold text-white">Companies</h2>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act('CREATE_COMPANY', { name: newCompany })) {
                setNewCompany('');
                success('Company created');
              }
            }}
          >
            <Input aria-label="New company name" placeholder="Company name" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
            <Button type="submit" icon={Plus} variant="primary">
              Add
            </Button>
          </form>
        </div>
        {data.companies.length === 0 ? (
          <EmptyState icon={Building2} title="No companies yet" description="Create a company, add its employer users, then link vacancies to it from the vacancy page." />
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {data.companies.map((c: any) => (
              <li key={c.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">
                    {c.name} <span className="text-xs font-normal text-slate-500">#{c.id} · {c._count.vacancies} vacancies · {c._count.programmes} programmes</span>
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" icon={UserPlus} onClick={() => setAddingMember(c)}>
                      Add user
                    </Button>
                    {partnerOn && (
                      <Button size="sm" onClick={() => setSubForm({ companyId: c.id, companyName: c.name, planVersionId: data.currentPlanId ?? '', billing_mode: 'MANUAL', starts_on: new Date().toISOString().slice(0, 10), talent_partner_id: '', terms_note: '' })}>
                        New subscription
                      </Button>
                    )}
                  </div>
                </div>
                {c.members.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No users have access.</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {c.members.map((m: any) => (
                      <li key={m.id} className="flex items-center justify-between gap-2 text-slate-300">
                        <span>
                          {userName(m.user_id)} <Badge>{m.role.toLowerCase()}</Badge>
                        </span>
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label="Remove access"
                          onClick={async () => {
                            if (await confirm({ title: 'Remove this user’s access?', confirmLabel: 'Remove', tone: 'danger' })) act('REMOVE_MEMBER', { companyId: c.id, memberId: m.id });
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!partnerOn ? (
        <Card>
          <p className="text-sm text-slate-300">Hiring Partner is switched off (FEATURE_HIRING_PARTNER). Plans and subscriptions appear here when it is enabled. See Commercial setup for the open decisions.</p>
        </Card>
      ) : (
        <>
          {/* Plans */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Plan versions</h2>
                <p className="text-xs text-slate-500">Activated versions can’t be edited. Subscriptions keep the terms copied from the version they started on.</p>
              </div>
              <Button size="sm" icon={Plus} onClick={() => act('CREATE_PLAN_FROM_INDICATIVE').then((r) => r && success('Draft created from the indicative offer'))}>
                Draft from indicative offer
              </Button>
            </div>
            <ul className="mt-4 space-y-3">
              {data.plans.map((p: any) => (
                <li key={p.id} className="rounded-xl border border-white/[0.06] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">
                      {p.name} {p.id === data.currentPlanId && <Badge tone="brand">current</Badge>}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[p.status]}>{p.status.toLowerCase()}</Badge>
                      {p.status === 'DRAFT' && (
                        <Button size="sm" variant="primary" onClick={() => act('ACTIVATE_PLAN', { planId: p.id })}>
                          Activate
                        </Button>
                      )}
                      {p.status === 'ACTIVE' && (
                        <Button size="sm" onClick={() => act('RETIRE_PLAN', { planId: p.id })}>
                          Retire
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatRand(p.monthly_price)}/month ({label(VAT_TREATMENTS, p.vat_treatment)}) · up to {p.vacancy_limit} active vacancies · success fee {formatRate(p.success_fee_bps)} ·{' '}
                    {label(FEE_RULES, p.fee_rule)} · {p.guarantee_days}-day guarantee · effective {fmtDate(p.effective_from)}
                    {p.effective_to ? ` to ${fmtDate(p.effective_to)}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{p.entitlements.map((e: string) => label(ENTITLEMENTS, e)).join(' · ') || 'No entitlements'}</p>
                </li>
              ))}
              {data.plans.length === 0 && <p className="text-sm text-slate-500">No plan versions yet.</p>}
            </ul>
          </Card>

          {/* Subscriptions */}
          <Card>
            <h2 className="text-sm font-semibold text-white">Subscriptions</h2>
            {data.subscriptions.length === 0 && <p className="mt-3 text-sm text-slate-500">No subscriptions yet.</p>}
            <ul className="mt-4 space-y-4">
              {data.subscriptions.map((s: any) => (
                <li key={s.id} className="rounded-xl border border-white/[0.06] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">
                      {s.company.name} <span className="text-xs font-normal text-slate-500">#{s.id}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge tone={s.billing_mode === 'MANUAL' ? 'neutral' : 'info'}>{s.billing_mode === 'MANUAL' ? 'Manual billing' : 'PayFast SANDBOX'}</Badge>
                      <Badge tone={STATUS_TONE[s.status]} dot>
                        {s.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Agreed: {formatRand(s.monthly_price)}/month ({label(VAT_TREATMENTS, s.vat_treatment)}) · {s.vacancies.filter((v: any) => countsTowardLimit(v.status)).length} of {s.vacancy_limit} active
                    vacancies · success fee {formatRate(s.success_fee_bps)} · {label(FEE_RULES, s.fee_rule)}
                    {s.fee_min !== null ? ` (min ${formatRand(s.fee_min)}, max ${formatRand(s.fee_max)})` : ''} · {s.guarantee_days}-day guarantee
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Talent partner: {adminName(s.talent_partner_id)} · starts {fmtDate(s.starts_on)}
                    {s.current_period_end ? ` · paid to ${fmtDate(s.current_period_end)}` : ''}
                    {s.cancelled_at ? ` · cancelled ${fmtDate(s.cancelled_at)}` : ''}
                  </p>
                  {s.fee_rule === 'UNDECIDED' && <p className="mt-2 text-xs text-amber-300">Partner placement fees are refused until the agreed fee rule is recorded.</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.fee_rule === 'UNDECIDED' && (
                      <Button size="sm" onClick={() => setFeeRule({ subscriptionId: s.id, fee_rule: 'STANDARD_MIN_MAX', fee_min: '', fee_max: '', note: '' })}>
                        Record agreed fee rule
                      </Button>
                    )}
                    {s.billing_mode === 'MANUAL' && ['PENDING', 'PAST_DUE'].includes(s.status) && (
                      <Button size="sm" variant="primary" onClick={() => act('MANUAL_ACTIVATE', { subscriptionId: s.id })}>
                        Mark active
                      </Button>
                    )}
                    {s.billing_mode === 'MANUAL' && s.status !== 'CANCELLED' && (
                      <Button size="sm" onClick={() => setPayment({ subscriptionId: s.id, amount: String(s.monthly_price), period_end: '', reference: '' })}>
                        Record payment
                      </Button>
                    )}
                    {s.billing_mode === 'PAYFAST_SANDBOX' && s.status === 'PENDING' && sandboxOn && (
                      <Button size="sm" variant="primary" onClick={() => act('CREATE_SANDBOX_CHECKOUT', { subscriptionId: s.id }).then((r) => r && setCheckout(r.checkout))}>
                        Open sandbox checkout
                      </Button>
                    )}
                    {s.status === 'ACTIVE' && (
                      <Button size="sm" onClick={() => act('MARK_PAST_DUE', { subscriptionId: s.id })}>
                        Mark past due
                      </Button>
                    )}
                    {s.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (await confirm({ title: 'Cancel this subscription?', description: 'Its vacancies stay linked, but partner placement fees will be refused (cancellation terms are undecided).', confirmLabel: 'Cancel subscription', tone: 'danger' })) {
                            act('CANCEL_SUBSCRIPTION', { subscriptionId: s.id });
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                  {s.billing_events.length > 0 && (
                    <details className="mt-3 text-xs text-slate-400">
                      <summary className="cursor-pointer text-slate-300">Billing events ({s.billing_events.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {s.billing_events.map((e: any) => (
                          <li key={e.id}>
                            {fmtDate(e.received_at)} · {e.provider === 'MANUAL' ? 'manual' : 'sandbox'} · {e.payment_status || '—'} · {e.amount_cents !== null ? formatRand(Math.round(e.amount_cents / 100)) : ''} ·{' '}
                            <span className={e.outcome === 'REJECTED' ? 'text-rose-300' : ''}>{e.outcome.toLowerCase()}</span> {e.detail ? `· ${e.detail}` : ''}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {addingMember && <AddMemberModal company={addingMember} onClose={() => setAddingMember(null)} onAdd={(userId, role) => act('ADD_MEMBER', { companyId: addingMember.id, userId, role }).then((r) => r && setAddingMember(null))} />}

      {subForm && (
        <Modal
          open
          onClose={() => setSubForm(null)}
          title={`New Hiring Partner subscription: ${subForm.companyName}`}
          description="Terms are copied from the chosen plan version and kept with this customer. Starts as pending."
          footer={
            <>
              <Button variant="ghost" onClick={() => setSubForm(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => act('CREATE_SUBSCRIPTION', subForm).then((r) => r && setSubForm(null))}>
                Create
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Plan version" htmlFor="s-plan">
              <Select id="s-plan" value={subForm.planVersionId} onChange={(e) => setSubForm({ ...subForm, planVersionId: e.target.value })}>
                <option value="">Choose an active version</option>
                {data.plans
                  .filter((p: any) => p.status === 'ACTIVE')
                  .map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (from {fmtDate(p.effective_from)})
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Billing" htmlFor="s-mode">
              <Select id="s-mode" value={subForm.billing_mode} onChange={(e) => setSubForm({ ...subForm, billing_mode: e.target.value })}>
                <option value="MANUAL">Manual (invoice / EFT recorded by staff)</option>
                {sandboxOn && <option value="PAYFAST_SANDBOX">PayFast SANDBOX (test only, no real money)</option>}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts on" htmlFor="s-start">
                <Input id="s-start" type="date" value={subForm.starts_on} onChange={(e) => setSubForm({ ...subForm, starts_on: e.target.value })} />
              </Field>
              <Field label="Dedicated talent partner" htmlFor="s-tp">
                <Select id="s-tp" value={subForm.talent_partner_id} onChange={(e) => setSubForm({ ...subForm, talent_partner_id: e.target.value })}>
                  <option value="">Not assigned</option>
                  {data.admins.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.email}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Agreement note" htmlFor="s-note" hint="Anything agreed specifically with this customer.">
              <Textarea id="s-note" rows={3} value={subForm.terms_note} onChange={(e) => setSubForm({ ...subForm, terms_note: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}

      {feeRule && (
        <Modal
          open
          onClose={() => setFeeRule(null)}
          title="Record the agreed success-fee rule"
          description="Once recorded this becomes part of the customer’s terms and can’t be changed on this subscription."
          footer={
            <>
              <Button variant="ghost" onClick={() => setFeeRule(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => act('SET_SUBSCRIPTION_FEE_RULE', feeRule).then((r) => r && setFeeRule(null))}>
                Record rule
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Select aria-label="Fee rule" value={feeRule.fee_rule} onChange={(e) => setFeeRule({ ...feeRule, fee_rule: e.target.value })}>
              {FEE_RULES.filter((r) => r.value !== 'UNDECIDED').map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            {feeRule.fee_rule === 'STANDARD_MIN_MAX' && <p className="text-xs text-slate-400">Today’s standard minimum and maximum ({formatRand(data.terms.feeMin)} / {formatRand(data.terms.feeMax)}) will be copied into this agreement.</p>}
            {feeRule.fee_rule === 'CUSTOM' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Minimum (R)" htmlFor="f-min">
                  <Input id="f-min" inputMode="numeric" value={feeRule.fee_min} onChange={(e) => setFeeRule({ ...feeRule, fee_min: e.target.value })} />
                </Field>
                <Field label="Maximum (R)" htmlFor="f-max">
                  <Input id="f-max" inputMode="numeric" value={feeRule.fee_max} onChange={(e) => setFeeRule({ ...feeRule, fee_max: e.target.value })} />
                </Field>
              </div>
            )}
            <Field label="Where was this agreed?" htmlFor="f-note">
              <Input id="f-note" value={feeRule.note} onChange={(e) => setFeeRule({ ...feeRule, note: e.target.value })} placeholder="e.g. Signed agreement 12 Nov 2026" />
            </Field>
          </div>
        </Modal>
      )}

      {payment && (
        <Modal
          open
          onClose={() => setPayment(null)}
          title="Record a payment received"
          footer={
            <>
              <Button variant="ghost" onClick={() => setPayment(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => act('RECORD_MANUAL_PAYMENT', payment).then((r) => r && setPayment(null))}>
                Record
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Amount (R)" htmlFor="p-amt">
              <Input id="p-amt" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
            </Field>
            <Field label="Covers until" htmlFor="p-end">
              <Input id="p-end" type="date" value={payment.period_end} onChange={(e) => setPayment({ ...payment, period_end: e.target.value })} />
            </Field>
            <Field label="Reference" htmlFor="p-ref">
              <Input id="p-ref" value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} placeholder="EFT / invoice no." />
            </Field>
          </div>
        </Modal>
      )}

      {checkout && <SandboxCheckout checkout={checkout} onClose={() => setCheckout(null)} />}
    </div>
  );
}

function AddMemberModal({ company, onClose, onAdd }: { company: any; onClose: () => void; onAdd: (userId: number, role: string) => void }) {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState('MEMBER');
  useEffect(() => {
    if (q.trim().length < 2) return setUsers([]);
    const t = setTimeout(() => {
      fetch(`/api/superadmin/users/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then((j) => setUsers(j.users || []));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Modal open onClose={onClose} title={`Give a user access to ${company.name}`} description="Only add people you have confirmed work for this company. Matching email domains do not grant access.">
      <div className="space-y-4">
        <SearchInput value={q} onChange={setQ} placeholder="Employer account name or email" />
        <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="MEMBER">Member</option>
          <option value="OWNER">Owner</option>
        </Select>
        <ul className="divide-y divide-white/[0.06]">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-slate-200">
                {u.name || '—'} <span className="text-slate-500">{u.email}</span>
              </span>
              <Button size="sm" onClick={() => onAdd(u.id, role)}>
                Grant access
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

/** Posts the signed sandbox form to PayFast in a new tab. Test only: sandbox.payfast.co.za. */
function SandboxCheckout({ checkout, onClose }: { checkout: any; onClose: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <Modal
      open
      onClose={onClose}
      title="PayFast SANDBOX checkout"
      description="Opens PayFast’s sandbox. No real money moves. Use the sandbox buyer account to complete a test payment."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => form.current?.submit()}>
            Open sandbox
          </Button>
        </>
      }
    >
      <p className="text-xs text-slate-400">
        Target: <span className="font-mono">{checkout.action}</span>
      </p>
      <p className="mt-2 text-xs text-slate-500">PayFast must be able to reach the notify URL. On localhost, use a tunnel and set NEXT_PUBLIC_APP_URL to it.</p>
      <form ref={form} method="POST" action={checkout.action} target="_blank" className="hidden">
        {checkout.fields.map(([k, v]: [string, string]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      </form>
    </Modal>
  );
}
