import { jwtSecret } from '@/lib/jwt-secret';

const env = process.env as Record<string, string | undefined>;
const original = { secret: env.JWT_SECRET, nodeEnv: env.NODE_ENV };
afterEach(() => {
  env.JWT_SECRET = original.secret;
  env.NODE_ENV = original.nodeEnv;
});

describe('jwtSecret', () => {
  it('uses JWT_SECRET when set', () => {
    env.JWT_SECRET = 'configured-secret';
    expect(new TextDecoder().decode(jwtSecret())).toBe('configured-secret');
  });

  it('refuses to fall back to a default key in production', () => {
    delete env.JWT_SECRET;
    env.NODE_ENV = 'production';
    expect(() => jwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('allows a dev-only key outside production, never the old public fallback', () => {
    delete env.JWT_SECRET;
    env.NODE_ENV = 'development';
    expect(new TextDecoder().decode(jwtSecret())).not.toBe('fallback-super-secret-key-12345');
  });
});
