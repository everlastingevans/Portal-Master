import { hashPassword, verifyPassword, signToken, verifyToken } from '@/lib/auth';

describe('Auth Utilities', () => {
  describe('Password Hashing', () => {
    it('should generate a valid hash containing salt', () => {
      const password = 'mySecurePassword';
      const hash = hashPassword(password);
      expect(hash).toContain('.');
      
      const parts = hash.split('.');
      expect(parts.length).toBe(2);
      expect(parts[0]).toBeDefined(); // Hash
      expect(parts[1]).toBeDefined(); // Salt
    });

    it('should successfully verify the correct password', async () => {
      const password = 'mySecurePassword';
      const hash = hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'mySecurePassword';
      const wrongPassword = 'wrongPassword';
      const hash = hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Utilities', () => {
    it('should sign and verify a token successfully', async () => {
      const payload = { userId: 1, role: 'CANDIDATE' };
      const token = await signToken(payload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const decoded = await verifyToken(token) as any;
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(1);
      expect(decoded.role).toBe('CANDIDATE');
    });

    it('should fail verification for an invalid token', async () => {
      const decoded = await verifyToken('invalid.token.string');
      expect(decoded).toBeNull();
    });
  });
});

describe('withoutSecrets', () => {
  it('drops the password hash and reset token, keeps everything else', () => {
    const { withoutSecrets } = require('@/lib/auth');
    const out = withoutSecrets({ id: 1, email: 'a@b.co.za', password: 'hash.salt', reset_token: 'abc', reset_token_expiry: new Date(), name: 'A' });
    expect(out).toEqual({ id: 1, email: 'a@b.co.za', name: 'A' });
  });
});
