import { describe, it, expect } from 'vitest';
import { hashPassword, decodePassword, verifyPassword } from './cryptoUtils';

describe('Crypto & Password Logic', () => {
  it('hashes and decodes passwords correctly', async () => {
    const raw = 'shaheen1234';
    const encoded = await hashPassword(raw);
    expect(encoded).not.toBe(raw);
    expect(decodePassword(encoded)).toBe(raw);
  });

  it('verifies passwords against encoded hash', async () => {
    const raw = 'adminSecretPass';
    const encoded = await hashPassword(raw);
    
    const valid = await verifyPassword('adminSecretPass', encoded);
    expect(valid).toBe(true);

    const invalid = await verifyPassword('wrongPassword', encoded);
    expect(invalid).toBe(false);
  });

  it('safely handles undefined or empty passwords', () => {
    expect(decodePassword(undefined)).toBe('Not Set');
    expect(decodePassword('')).toBe('Not Set');
  });
});
