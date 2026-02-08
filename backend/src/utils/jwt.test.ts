import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt';

jest.mock('../config/environment', () => ({
  config: {
    jwtSecret: 'test-secret-access',
    jwtRefreshSecret: 'test-secret-refresh',
    jwtExpiration: '1h',
    jwtRefreshExpiration: '7d',
  },
}));

describe('generateAccessToken / verifyAccessToken', () => {
  it('generates a token that can be verified', () => {
    const token = generateAccessToken(1, 'USER');
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe(1);
    expect(payload.role).toBe('USER');
  });

  it('throws on invalid token', () => {
    expect(() => verifyAccessToken('bad.token.here')).toThrow();
  });
});

describe('generateRefreshToken / verifyRefreshToken', () => {
  it('generates a refresh token that can be verified', () => {
    const token = generateRefreshToken(42);
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe(42);
  });

  it('throws on tampered token', () => {
    expect(() => verifyRefreshToken('tampered')).toThrow();
  });
});
