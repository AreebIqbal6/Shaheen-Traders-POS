import { get, set } from 'idb-keyval';
import toast from 'react-hot-toast';

export const requestBackupDirectory = async (type: 'primary' | 'secondary' = 'primary'): Promise<string | null> => {
  try {
    if (!('showDirectoryPicker' in window)) {
      toast.error('Your browser does not support local folder selection. Please use Chrome or Edge.');
      return null;
    }

    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    
    // Store the handle in IndexedDB
    const storageKey = type === 'primary' ? 'shaheen_primary_dir_handle' : 'shaheen_secondary_dir_handle';
    await set(storageKey, dirHandle);
    
    return dirHandle.name;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Error selecting directory:', error);
      toast.error('Failed to select directory.');
    }
    return null;
  }
};

export const getBackupDirectoryHandle = async (type: 'primary' | 'secondary' = 'primary'): Promise<any | null> => {
  try {
    const storageKey = type === 'primary' ? 'shaheen_primary_dir_handle' : 'shaheen_secondary_dir_handle';
    const handle = await get(storageKey);
    
    if (handle) {
      // Verify we still have permission, if not request it
      // @ts-ignore
      const options = { mode: 'readwrite' };
      // @ts-ignore
      if (await handle.queryPermission(options) === 'granted') {
        return handle;
      }
      
      // @ts-ignore
      if (await handle.requestPermission(options) === 'granted') {
        return handle;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting directory handle:', error);
    return null;
  }
};
