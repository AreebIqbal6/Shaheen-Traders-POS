import packageJson from '../../package.json';
import { supabase } from '../lib/supabase';

export const CURRENT_APP_VERSION = packageJson.version;

/**
 * Compare two semver-like version strings (e.g., '0.5.85' vs '0.5.86')
 * Returns:
 *  -1 if vA < vB
 *   0 if vA === vB
 *   1 if vA > vB
 */
export function compareVersions(vA: string, vB: string): number {
  if (!vA || !vB) return 0;

  // Clean strings (remove leading 'v' and trim)
  const norm = (s: string) => {
    let clean = s.replace(/^[vV]/, '').trim();
    if (/^\d+\.\d+$/.test(clean) && !clean.startsWith('0.')) {
      clean = '0.' + clean;
    }
    return clean;
  };

  const cleanA = norm(vA);
  const cleanB = norm(vB);

  if (cleanA === cleanB) return 0;

  const partsA = cleanA.split(/[-.+]/).map(p => parseInt(p, 10) || 0);
  const partsB = cleanB.split(/[-.+]/).map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;

    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }

  return 0;
}

/**
 * Checks if the given client version is older than the required minimum version
 */
export function isVersionOutdated(clientVersion = CURRENT_APP_VERSION, minRequiredVersion?: string): boolean {
  if (!minRequiredVersion) return false;
  return compareVersions(clientVersion, minRequiredVersion) < 0;
}

/**
 * Fetches the latest published version and minimum required version
 * from both the public version.json endpoint and the Supabase settings table.
 */
export async function fetchRemoteVersionInfo(): Promise<{
  latestVersion: string;
  minRequiredVersion: string;
  source: 'endpoint' | 'database' | 'fallback';
}> {
  let highestRequiredVersion = CURRENT_APP_VERSION;
  let highestLatestVersion = CURRENT_APP_VERSION;

  // 1. Fetch from deployed static /version.json endpoint (bypasses any browser cache)
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.version) {
        if (compareVersions(data.version, highestLatestVersion) > 0) {
          highestLatestVersion = data.version;
        }
      }
      if (data?.minRequiredVersion) {
        if (compareVersions(data.minRequiredVersion, highestRequiredVersion) > 0) {
          highestRequiredVersion = data.minRequiredVersion;
        }
      }
    }
  } catch (err) {
    console.warn('[VersionEnforcer] Could not reach /version.json endpoint:', err);
  }

  // 2. Query Supabase settings table (for instant cloud version gates)
  try {
    const { data: settingsRows } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['min_required_version', 'app_latest_version']);

    if (settingsRows && settingsRows.length > 0) {
      for (const row of settingsRows) {
        if (row.key === 'min_required_version' && row.value) {
          if (compareVersions(row.value, highestRequiredVersion) > 0) {
            highestRequiredVersion = row.value;
          }
        }
        if (row.key === 'app_latest_version' && row.value) {
          if (compareVersions(row.value, highestLatestVersion) > 0) {
            highestLatestVersion = row.value;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[VersionEnforcer] Could not query Supabase settings version:', err);
  }

  // Cache latest known required version
  try {
    localStorage.setItem('shaheen_min_required_version', highestRequiredVersion);
    localStorage.setItem('shaheen_app_latest_version', highestLatestVersion);
  } catch {}

  return {
    latestVersion: highestLatestVersion,
    minRequiredVersion: highestRequiredVersion,
    source: highestRequiredVersion !== CURRENT_APP_VERSION ? 'endpoint' : 'fallback'
  };
}

/**
 * Broadcasts this running version as the latest required version to the Supabase settings table.
 * Used automatically by the Admin app to elevate minimum version requirements across all clients.
 */
export async function broadcastLatestVersionToCloud(version = CURRENT_APP_VERSION): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    await supabase.from('settings').upsert([
      { key: 'min_required_version', value: version },
      { key: 'app_latest_version', value: version },
      { key: 'version_updated_at', value: timestamp }
    ]);
  } catch (err) {
    console.warn('[VersionEnforcer] Failed to broadcast latest version to cloud:', err);
  }
}
