/**
 * Normalises a South African mobile number to E.164 (+27XXXXXXXXX), or returns null.
 * Accepts the formats candidates actually type: "082 123 4567", "0821234567", "27821234567",
 * "+27 82 123 4567", "+27 (0)82 123 4567". SA mobile numbers start with 6, 7 or 8 after the country code.
 */
export function normalizeSaMobile(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('270')) digits = `27${digits.slice(3)}`; // "+27 (0)82…"
  if (digits.startsWith('0') && digits.length === 10) digits = `27${digits.slice(1)}`;
  return /^27[678]\d{8}$/.test(digits) ? `+${digits}` : null;
}

/** "+27821234567" → "+27 82 123 4567" for display. */
export function formatSaMobile(e164: string): string {
  const d = e164.replace(/\D/g, '');
  return `+27 ${d.slice(2, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

/** wa.me deep link (digits only, no plus) with prefilled text. */
export function waMeLink(e164: string, text: string): string {
  return `https://wa.me/${e164.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
