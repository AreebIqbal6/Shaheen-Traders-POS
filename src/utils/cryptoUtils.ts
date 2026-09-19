/**
 * Utility functions for cryptographic operations.
 * Reverted to base64 encoding per user request to allow admins to view plaintext passwords.
 */

export const hashPassword = async (password: string): Promise<string> => {
  return btoa(password);
};

export const decodePassword = (hash: string | undefined): string => {
  if (!hash) return 'Not Set';
  try {
    // If it's a 64-character hex string (SHA-256 from previous version), we can't decode it.
    if (/^[0-9a-f]{64}$/i.test(hash)) return '(Encrypted - Edit to update)';
    return atob(hash);
  } catch {
    return '(Encrypted - Edit to update)';
  }
};

export const verifyPassword = async (plainPassword: string, hashToCompare: string): Promise<boolean> => {
  // Check if it matches base64
  if (btoa(plainPassword) === hashToCompare) return true;
  
  // Backwards compatibility for the short period where SHA-256 was used
  const salt = "shaheen_pos_salt_v1";
  const encoder = new TextEncoder();
  const data = encoder.encode(plainPassword + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === hashToCompare;
};
