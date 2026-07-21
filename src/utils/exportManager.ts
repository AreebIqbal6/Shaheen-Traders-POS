import { exportReceiptToPDF } from './exportPdf';
import { generateOrderExcel } from './excel';

import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { ensureBackupFolder } from './backupValidator';

export const saveOrderBackup = async (orderId: string, cart: any[], details: any) => {
  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;

  try {
    // 1. Generate PDF
    const pdfResult = await exportReceiptToPDF(orderId, true); 
    
    // 2. Generate Excel
    const excelResult = await generateOrderExcel(orderId, cart, details);
    
    // 3. Generate SQL
    let sqlContent = `-- Order Backup SQL\n-- Generated on ${new Date().toISOString()}\n\n`;
    sqlContent += `INSERT INTO orders (id, client_name, area, contact_number, booker_name, total, date) VALUES ('${orderId}', '${(details.clientName || '').replace(/'/g, "''")}', '${(details.area || '').replace(/'/g, "''")}', '${(details.contactNumber || '').replace(/'/g, "''")}', '${(details.bookerName || '').replace(/'/g, "''")}', ${details.total}, '${new Date().toISOString()}');\n\n`;
    
    cart.forEach(item => {
        sqlContent += `INSERT INTO order_items (order_id, product_id, sku, barcode, name, price, quantity) VALUES ('${orderId}', '${item.id}', '${item.sku || ''}', '${item.barcode || ''}', '${(item.name || '').replace(/'/g, "''")}', ${item.price}, ${item.quantity});\n`;
    });

    const dateObj = new Date();
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    const dateStr = `${d}-${m}-${y}`;

    if (isTauri) {
      const { desktopDir } = await import('@tauri-apps/api/path');
      const { mkdir, writeFile } = await import('@tauri-apps/plugin-fs');
      // NATIVE TAURI DESKTOP MODE
      let basePath = localStorage.getItem('shaheen_backuppath');
      if (!basePath || basePath.startsWith('Web Folder')) {
        try { basePath = await desktopDir(); } catch { basePath = 'D:\\AREEB'; }
      }
      
      let secondaryPath = localStorage.getItem('shaheen_secondary_backuppath');
      if (secondaryPath && secondaryPath.startsWith('Web Folder')) secondaryPath = '';

      // Validate Primary Folder
      const primaryTarget = await ensureBackupFolder(basePath, true); 
      if (!primaryTarget) {
        throw new Error("Primary backup location is inaccessible. Backup aborted.");
      }

      // Convert target to a solid string path
      const baseValidPath = typeof primaryTarget === 'string' ? primaryTarget : `${basePath}\\SHAHEEN BACKUP`;
      const pathsToSave = [baseValidPath];

      // Validate Secondary Folder (Fallback logic)
      if (secondaryPath && secondaryPath.trim() !== '') {
        const secondaryTarget = await ensureBackupFolder(secondaryPath, true);
        if (secondaryTarget) {
          const secondaryValidPath = typeof secondaryTarget === 'string' ? secondaryTarget : `${secondaryPath}\\SHAHEEN BACKUP`;
          pathsToSave.push(secondaryValidPath);
        } else {
          console.warn("Secondary backup drive (USB) missing. Skipping secondary backup silently.");
        }
      }

      for (const validBase of pathsToSave) {
        console.log("Saving to Base Path:", validBase); 
        
        try {
          // Construct explicit order hierarchy cleanly on top of valid target base
          const orderFolderPath = `${validBase}\\ORDERS\\${dateStr}\\${orderId}`;
          console.log("Creating Folder Structure:", orderFolderPath); 
          
          await mkdir(orderFolderPath, { recursive: true });

          if (pdfResult) {
            const pdfBuffer = await pdfResult.blob.arrayBuffer();
            await writeFile(`${orderFolderPath}\\${orderId}.pdf`, new Uint8Array(pdfBuffer));
          }

          if (excelResult.success && excelResult.buffer) {
            await writeFile(`${orderFolderPath}\\${orderId}.xlsx`, excelResult.buffer);
          }

          const textEncoder = new TextEncoder();
          await writeFile(`${orderFolderPath}\\${orderId}.sql`, textEncoder.encode(sqlContent));
          console.log(`Auto-saved backup strictly to: ${orderFolderPath}`);
        } catch (pathError: any) {
          console.error(`Failed to save backup to path ${validBase}:`, pathError);
          if (validBase === pathsToSave[0]) {
            throw pathError; 
          }
        }
      }
    } else {
      
      if (pdfResult) {
        saveAs(pdfResult.blob, `${orderId}.pdf`);
      }
      if (excelResult.success && excelResult.buffer) {
        const blob = new Blob([excelResult.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${orderId}.xlsx`);
      }
      const sqlBlob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
      saveAs(sqlBlob, `${orderId}.sql`);
      
      toast.success('Downloaded files via browser (Cloud Fallback)');
      return true;
    }

    return true;
  } catch (error: any) {
    console.error('Failed to save order backup', error);
    toast.error(`Backup Failed: ${error.message || 'Unknown error'}`);
    return false;
  }
};
