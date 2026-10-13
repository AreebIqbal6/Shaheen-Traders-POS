import { describe, it, expect } from 'vitest';
import { compareVersions, isVersionOutdated, CURRENT_APP_VERSION } from './versionEnforcer';

describe('Version Enforcer System', () => {
  it('correctly compares equal versions', () => {
    expect(compareVersions('0.5.86', '0.5.86')).toBe(0);
    expect(compareVersions('v0.5.86', '0.5.86')).toBe(0);
    expect(compareVersions('0.5.86', 'v0.5.86')).toBe(0);
    expect(compareVersions('  0.5.86  ', '0.5.86')).toBe(0);
  });

  it('correctly identifies older client versions', () => {
    expect(compareVersions('0.5.85', '0.5.86')).toBe(-1);
    expect(compareVersions('0.4.99', '0.5.0')).toBe(-1);
    expect(compareVersions('0.5.0', '1.0.0')).toBe(-1);
    expect(compareVersions('v0.5.80', 'v0.5.86')).toBe(-1);
  });

  it('correctly identifies newer client versions', () => {
    expect(compareVersions('0.5.87', '0.5.86')).toBe(1);
    expect(compareVersions('1.0.0', '0.9.9')).toBe(1);
    expect(compareVersions('0.6.0', '0.5.99')).toBe(1);
  });

  it('evaluates isVersionOutdated accurately', () => {
    expect(isVersionOutdated('0.5.85', '0.5.86')).toBe(true);
    expect(isVersionOutdated('0.5.86', '0.5.86')).toBe(false);
    expect(isVersionOutdated('0.5.87', '0.5.86')).toBe(false);
    // When no minRequiredVersion is provided, never block
    expect(isVersionOutdated('0.5.85', undefined)).toBe(false);
  });

  it('exposes the valid CURRENT_APP_VERSION string', () => {
    expect(CURRENT_APP_VERSION).toBeDefined();
    expect(typeof CURRENT_APP_VERSION).toBe('string');
    expect(CURRENT_APP_VERSION.length).toBeGreaterThan(0);
  });
});
