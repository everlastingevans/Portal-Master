import path from 'path';
import { safeUploadName } from '@/lib/uploads';

describe('safeUploadName', () => {
  it.each(['../../../next.config.mjs', '..\\..\\app\\page.tsx', '/etc/passwd', '....//x'])('cannot escape the upload folder: %s', (name) => {
    const dir = path.join('/srv', 'public', 'uploads');
    const out = safeUploadName(7, name);
    expect(out).not.toMatch(/[\\/]/);
    expect(path.dirname(path.join(dir, out))).toBe(dir);
  });

  it('keeps a readable base name and adds a random suffix', () => {
    const a = safeUploadName(7, 'my answer (1).webm');
    const b = safeUploadName(7, 'my answer (1).webm');
    expect(a).toMatch(/^7-\d+-[0-9a-f]{16}-my_answer__1_\.webm$/);
    expect(a).not.toBe(b);
  });

  it('falls back when no usable name is given', () => {
    expect(safeUploadName(7, undefined)).toMatch(/-recording\.webm$/);
    expect(safeUploadName(7, '...')).toMatch(/-recording\.webm$/);
  });
});
