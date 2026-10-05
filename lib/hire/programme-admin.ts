import db from '@/lib/db';
import { isFeatureEnabled } from '@/lib/features';
import { PROGRAMME_STATUSES, PROGRAMME_TIERS_SETTING_KEY, ProgrammeTier, parseProgrammeTerms, parseTiersSetting, validateTiers } from './programmes';
import { EMAIL_RE, ROLE_CATEGORIES } from './vacancy';

type Result = { status: number; body: any };
const ok = (body: any = {}): Result => ({ status: 200, body: { success: true, ...body } });
const fail = (status: number, error: string, errors?: Record<string, string>): Result => ({ status, body: { error, ...(errors ? { errors } : {}) } });
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max) || null;

export async function getProgrammeTiers(client: any = db): Promise<ProgrammeTier[]> {
  try {
    const row = await client.appSetting.findUnique({ where: { key: PROGRAMME_TIERS_SETTING_KEY } });
    return parseTiersSetting(row?.value);
  } catch {
    return parseTiersSetting(null);
  }
}

export async function runProgrammeAction(client: any, action: string, p: Record<string, unknown>, ctx: { actorId: number | null; now?: Date }): Promise<Result> {
  if (!isFeatureEnabled('BULK_PROGRAMMES')) return fail(404, 'Bulk programmes are not enabled (FEATURE_BULK_PROGRAMMES).');
  const now = ctx.now ?? new Date();

  switch (action) {
    case 'SAVE_TIERS': {
      const r = validateTiers(p.tiers);
      if (!r.ok) return fail(400, r.error);
      const value = JSON.stringify(r.tiers);
      await client.appSetting.upsert({
        where: { key: PROGRAMME_TIERS_SETTING_KEY },
        create: { key: PROGRAMME_TIERS_SETTING_KEY, value, updated_by_id: ctx.actorId },
        update: { value, updated_by_id: ctx.actorId },
      });
      return ok({ tiers: r.tiers });
    }
    case 'CREATE_PROGRAMME': {
      const errors: Record<string, string> = {};
      const name = str(p.name, 160);
      const companyName = str(p.company_name, 160);
      const contactName = str(p.contact_name, 120);
      const email = String(p.contact_email ?? '').trim().toLowerCase();
      const target = Number(p.target_hires);
      if (!name) errors.name = 'Name the programme.';
      if (!companyName) errors.company_name = 'Enter the company name.';
      if (!contactName) errors.contact_name = 'Enter the contact name.';
      if (!EMAIL_RE.test(email)) errors.contact_email = 'Enter a valid email.';
      if (!Number.isInteger(target) || target < 1) errors.target_hires = 'Enter the target number of hires.';
      if (Object.keys(errors).length) return fail(400, Object.values(errors)[0], errors);
      const programme = await client.bulkProgramme.create({
        data: {
          source: 'STAFF',
          name,
          company_name: companyName,
          contact_name: contactName,
          contact_email: email,
          contact_phone: str(p.contact_phone, 40),
          requirements: str(p.requirements, 4000) || '',
          target_hires: target,
          role_categories: (Array.isArray(p.role_categories) ? p.role_categories : []).map(String).filter((c) => ROLE_CATEGORIES.some((r) => r.value === c)),
          owner_id: ctx.actorId,
        },
      });
      return ok({ programme });
    }
    case 'UPDATE_PROGRAMME': {
      const prog = await client.bulkProgramme.findUnique({ where: { id: Number(p.programmeId) || -1 } });
      if (!prog) return fail(404, 'Programme not found.');
      const data: Record<string, unknown> = {};
      if (p.status !== undefined) {
        if (!PROGRAMME_STATUSES.some((s) => s.value === p.status)) return fail(400, 'Unknown status.');
        if (['AGREED', 'ACTIVE'].includes(String(p.status))) {
          const terms = await client.programmeTerms.count({ where: { programme_id: prog.id } });
          if (!terms) return fail(400, 'Record the accepted terms before marking the programme agreed or active.');
        }
        data.status = p.status;
      }
      if (p.name !== undefined) data.name = str(p.name, 160) || prog.name;
      if (p.requirements !== undefined) data.requirements = str(p.requirements, 4000) || '';
      if (p.internal_notes !== undefined) data.internal_notes = str(p.internal_notes, 5000);
      if (p.target_hires !== undefined) {
        const t = Number(p.target_hires);
        if (!Number.isInteger(t) || t < 1) return fail(400, 'Enter the target number of hires.');
        data.target_hires = t;
      }
      if (p.owner_id !== undefined) {
        if (p.owner_id === null || p.owner_id === '') data.owner_id = null;
        else {
          const u = await client.user.findFirst({ where: { id: Number(p.owner_id) || -1, role: 'SUPERADMIN' }, select: { id: true } });
          if (!u) return fail(400, 'Owner must be a LaunchPath admin.');
          data.owner_id = u.id;
        }
      }
      if (p.company_id !== undefined) {
        if (p.company_id === null || p.company_id === '') data.company_id = null;
        else {
          const c = await client.company.findUnique({ where: { id: Number(p.company_id) || -1 } });
          if (!c) return fail(404, 'Company not found.');
          data.company_id = c.id;
        }
      }
      await client.bulkProgramme.update({ where: { id: prog.id }, data });
      return ok();
    }
    case 'AGREE_TERMS': {
      const prog = await client.bulkProgramme.findUnique({ where: { id: Number(p.programmeId) || -1 } });
      if (!prog) return fail(404, 'Programme not found.');
      const parsed = parseProgrammeTerms(p, await getProgrammeTiers(client));
      if (!parsed.ok) return fail(400, Object.values(parsed.errors)[0], parsed.errors);
      const { differsFromTier, ...data } = parsed.data;
      // Append-only: earlier terms remain on record and keep pricing the placements made under them
      const terms = await client.programmeTerms.create({ data: { ...data, programme_id: prog.id, agreed_by_id: ctx.actorId } });
      if (['ENQUIRY', 'SCOPING', 'QUOTED'].includes(prog.status)) await client.bulkProgramme.update({ where: { id: prog.id }, data: { status: 'AGREED' } });
      return ok({ terms, differsFromTier, appliesFrom: data.agreed_on <= now ? 'new placements from now' : `new placements from ${data.agreed_on.toISOString().slice(0, 10)}` });
    }
    default:
      return fail(400, 'Unknown action.');
  }
}
