import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Cross-tab broadcast channel for instant 0ms inter-tab security synchronization
const AUTH_CHANNEL_NAME = 'shaheen_auth_security_channel';

interface SecurityMessage {
  type: 'REVOKE_ADMIN' | 'REVOKE_BOOKER' | 'REVOKE_ALL';
  bookerId?: string;
  reason: string;
  timestamp: number;
}

let authChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel not supported in older web views
}

/**
 * Purge all admin session data and local credentials
 */
export const purgeAdminSession = async (reason = 'Admin session has expired or credentials were changed.') => {
  try {
    await supabase.auth.signOut();
  } catch {}

  localStorage.removeItem('shaheen_admin_auth');
  localStorage.removeItem('shaheen_admin_login_time');
  localStorage.removeItem('admin_offline_hash');

  // Broadcast inter-tab
  if (authChannel) {
    try {
      authChannel.postMessage({
        type: 'REVOKE_ADMIN',
        reason,
        timestamp: Date.now()
      } as SecurityMessage);
    } catch {}
  }

  // Dispatch custom event for immediate UI unmount
  window.dispatchEvent(new CustomEvent('shaheen_admin_logged_out', { detail: { reason } }));
  window.dispatchEvent(new Event('force_remount'));
};

/**
 * Purge booker session data and invalidate cached credentials
 */
export const purgeBookerSession = (reason = 'Your session has expired due to credential changes.', targetBookerId?: string) => {
  const activeBookerStr = localStorage.getItem('shaheen_active_booker');
  let currentBookerId: string | undefined;

  if (activeBookerStr) {
    try {
      const b = JSON.parse(activeBookerStr);
      currentBookerId = b.id || b.booker_number;
    } catch {}
  }

  // If a specific booker was targeted, only purge if this session matches
  if (targetBookerId && currentBookerId && targetBookerId !== currentBookerId) {
    return;
  }

  localStorage.removeItem('shaheen_active_booker');
  localStorage.removeItem('shaheen_bookerName');
  localStorage.removeItem('shaheen_booker_login_time');

  // Purge from cached profiles
  try {
    const profiles = JSON.parse(localStorage.getItem('booker_profiles') || '[]');
    const filtered = profiles.filter((b: any) => targetBookerId ? (b.id !== targetBookerId && b.booker_number !== targetBookerId) : false);
    localStorage.setItem('booker_profiles', JSON.stringify(filtered));

    const cachedBookers = JSON.parse(localStorage.getItem('shaheen_bookers') || '[]');
    const updatedBookers = cachedBookers.filter((b: any) => targetBookerId ? (b.id !== targetBookerId && b.booker_number !== targetBookerId) : false);
    localStorage.setItem('shaheen_bookers', JSON.stringify(updatedBookers));
  } catch {}

  // Broadcast inter-tab
  if (authChannel) {
    try {
      authChannel.postMessage({
        type: 'REVOKE_BOOKER',
        bookerId: targetBookerId,
        reason,
        timestamp: Date.now()
      } as SecurityMessage);
    } catch {}
  }

  // Dispatch custom event for immediate UI unmount
  window.dispatchEvent(new CustomEvent('shaheen_booker_logged_out', { detail: { reason, targetBookerId } }));
  window.dispatchEvent(new Event('force_remount'));
};

/**
 * Broadcasts global credential revocation to Supabase settings table.
 * All online instances (Admin + Bookers) listening to postgres_changes will instantly terminate sessions.
 */
export const broadcastCloudRevocation = async (type: 'ADMIN' | 'BOOKER' | 'ALL', details?: { bookerId?: string; username?: string }) => {
  const timestamp = new Date().toISOString();

  try {
    if (type === 'ADMIN' || type === 'ALL') {
      await supabase.from('settings').upsert({
        key: 'admin_credentials_updated_at',
        value: timestamp
      });
    }

    if (type === 'BOOKER' || type === 'ALL') {
      await supabase.from('settings').upsert({
        key: 'booker_credentials_revoked_at',
        value: JSON.stringify({
          bookerId: details?.bookerId || 'ALL',
          username: details?.username,
          timestamp
        })
      });
    }

    if (type === 'ALL') {
      await supabase.from('settings').upsert({
        key: 'system_auth_revoked_at',
        value: timestamp
      });
    }
  } catch (err) {
    console.warn('Failed to broadcast cloud revocation:', err);
  }

  // Also broadcast locally across open tabs
  if (authChannel) {
    try {
      authChannel.postMessage({
        type: type === 'ADMIN' ? 'REVOKE_ADMIN' : (type === 'BOOKER' ? 'REVOKE_BOOKER' : 'REVOKE_ALL'),
        bookerId: details?.bookerId,
        reason: 'Credentials updated. Logged out everywhere immediately.',
        timestamp: Date.now()
      } as SecurityMessage);
    } catch {}
  }
};

/**
 * Subscribes to cross-tab broadcast messages and window storage events
 */
export const setupCrossTabSecurityListener = (
  onAdminRevoke: (reason: string) => void,
  onBookerRevoke: (reason: string, bookerId?: string) => void
) => {
  // 1. BroadcastChannel listener
  const handleBroadcast = (event: MessageEvent<SecurityMessage>) => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'REVOKE_ADMIN' || data.type === 'REVOKE_ALL') {
      onAdminRevoke(data.reason);
    }
    if (data.type === 'REVOKE_BOOKER' || data.type === 'REVOKE_ALL') {
      onBookerRevoke(data.reason, data.bookerId);
    }
  };

  if (authChannel) {
    authChannel.addEventListener('message', handleBroadcast);
  }

  // 2. Storage event listener (fires when another tab modifies localStorage)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'shaheen_admin_auth' && (!e.newValue || e.newValue === 'false')) {
      onAdminRevoke('Admin session terminated from another tab.');
    }
    if (e.key === 'shaheen_active_booker' && !e.newValue) {
      onBookerRevoke('Booker session terminated from another tab.');
    }
  };
  window.addEventListener('storage', handleStorage);

  // Return unsubscribe cleanup
  return () => {
    if (authChannel) {
      authChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
};
