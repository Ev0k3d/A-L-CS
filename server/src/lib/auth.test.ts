import { describe, expect, it } from 'vitest';
import { generateRefreshToken, getRefreshTokenExpiresAt, hashRefreshToken, signAccessToken, verifyToken } from './auth.js';

describe('auth helpers', () => {
  it('signs and verifies access tokens', () => {
    const token = signAccessToken({ userId: 'user-1', email: 'player@example.com' });
    const payload = verifyToken(token);
    expect(payload.userId).toBe('user-1');
    expect(payload.email).toBe('player@example.com');
  });

  it('hashes refresh tokens deterministically', () => {
    const raw = generateRefreshToken();
    expect(hashRefreshToken(raw)).toBe(hashRefreshToken(raw));
    expect(hashRefreshToken(raw)).not.toBe(hashRefreshToken(`${raw}-other`));
  });

  it('sets refresh token expiry in the future', () => {
    expect(getRefreshTokenExpiresAt().getTime()).toBeGreaterThan(Date.now());
  });
});
