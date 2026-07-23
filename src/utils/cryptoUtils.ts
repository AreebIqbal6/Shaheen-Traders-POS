/**
 * Utility functions for cryptographic operations.
 * Uses the native Web Crypto API for secure hashing.
 */

// Generate a salted SHA-256 hash of a string
export const hashPassword = async (password: string): Promise<string> => {
  // We use a static salt since we are migrating from plain btoa, but ideally each user would have a unique salt.
  // For this application's security posture, a static application-wide salt is significantly stronger than btoa.
  const salt = "shaheen_pos_salt_v1";
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

export const verifyPassword = async (plainPassword: string, hashToCompare: string): Promise<boolean> => {
  // Backwards compatibility for existing users who still have btoa() hashed passwords
  if (btoa(plainPassword) === hashToCompare) return true;
  
  const generatedHash = await hashPassword(plainPassword);
  return generatedHash === hashToCompare;
};
