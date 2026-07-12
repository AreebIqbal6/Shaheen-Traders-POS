import { exists, mkdir } from '@tauri-apps/plugin-fs';

export const ensureBackupFolder = async (basePath: string, isSecondary: boolean = false) => {
  // 1. If we are on the Web (Vercel/Chrome), we cannot manipulate native file systems silently.
  if (!('__TAURI__' in window)) {
    return true; 
  }

  if (!basePath || basePath.trim() === '') {
    return false;
  }

  try {
    const cleanPath = basePath.trim();
    
    // 2. Check if the parent path exists (e.g., D:\ or E:\Backups)
    const baseExists = await exists(cleanPath);
    if (!baseExists) {
      console.warn(`[Backup Validator] Base path does not exist: ${cleanPath}`);
      return false;
    }

    // 3. Define the mandatory subfolder
    const shaheenPath = `${cleanPath}\\SHAHEEN BACKUP`;
    
    // 4. Check if SHAHEEN BACKUP exists. If not, forcefully create it.
    const shaheenExists = await exists(shaheenPath);
    if (!shaheenExists) {
      console.log(`[Backup Validator] Creating missing directory: ${shaheenPath}`);
      await mkdir(shaheenPath, { recursive: true });
    }

    return true;
  } catch (err) {
    console.error(`[Backup Validator] Critical failure creating folder at ${basePath}:`, err);
    return false;
  }
};
