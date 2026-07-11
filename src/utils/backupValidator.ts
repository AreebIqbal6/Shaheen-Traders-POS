import { exists, mkdir } from '@tauri-apps/plugin-fs';
import { toast } from 'react-hot-toast';

export const ensureBackupFolder = async (basePath: string, silent = false): Promise<string | null> => {
  if (!basePath || basePath.startsWith('Web Folder:')) return basePath;

  const cleanBasePath = basePath.replace(/\//g, '\\');
  const folderPath = cleanBasePath.endsWith('\\') 
    ? `${cleanBasePath}SHAHEEN TRADERS BACKUP` 
    : `${cleanBasePath}\\SHAHEEN TRADERS BACKUP`;

  try {
    const folderExists = await exists(folderPath);
    if (!folderExists) {
      await mkdir(folderPath, { recursive: true });
      if (!silent) toast.success("Created backup directory: SHAHEEN TRADERS BACKUP");
    }
    return folderPath;
  } catch (err) {
    console.warn(`Drive disconnected or path inaccessible: ${folderPath}`, err);
    if (!silent) toast.error("Backup drive disconnected or inaccessible!");
    return null; // Signals to the export manager that the drive is dead/unplugged
  }
};