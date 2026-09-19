import toast from 'react-hot-toast';

export async function saveBlobAsFile(blob: Blob, defaultFilename: string) {
  try {
    if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeBinaryFile } = await import('@tauri-apps/plugin-fs');
      
      const ext = defaultFilename.split('.').pop() || '*';
      const filePath = await save({
        defaultPath: defaultFilename,
        filters: [{ name: 'File', extensions: [ext] }]
      });
      
      if (filePath) {
        const arrayBuffer = await blob.arrayBuffer();
        await writeBinaryFile(filePath, new Uint8Array(arrayBuffer));
        toast.success('Saved successfully');
        return true;
      }
      return false; // User cancelled
    }
    
    // For Web, try File System Access API first
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const ext = defaultFilename.split('.').pop() || '*';
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{ description: 'File', accept: { [`*/*`]: [`.${ext}`] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success('Saved successfully');
        return true;
      } catch (err: any) {
        // Fallback to file-saver if user didn't just cancel
        if (err.name === 'AbortError') return false;
      }
    }
    
    // Fallback: file-saver (uses browser's download dialog)
    const fileSaver = await import('file-saver');
    if (fileSaver && fileSaver.saveAs) {
      fileSaver.saveAs(blob, defaultFilename);
    } else if (fileSaver && fileSaver.default && fileSaver.default.saveAs) {
      fileSaver.default.saveAs(blob, defaultFilename);
    }
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    // Last resort fallback
    const fileSaver = await import('file-saver');
    if (fileSaver && fileSaver.saveAs) {
      fileSaver.saveAs(blob, defaultFilename);
    }
    return false;
  }
}
