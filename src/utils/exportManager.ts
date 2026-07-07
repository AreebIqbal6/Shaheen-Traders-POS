import { exportReceiptToPDF } from './exportPdf';
import { generateOrderExcel } from './excel';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { desktopDir } from '@tauri-apps/api/path';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

export const saveOrderBackup = async (orderId: string, cart: any[], details: any) => {
  const isTauri = '__TAURI__' in window;

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

    // Use orderId directly — it's already formatted as ORD-XXXXXX or B2B-XXXX
    // Date format: DD-MM-YYYY to match user's expected folder structure
    const dateObj = new Date();
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    const dateStr = `${d}-${m}-${y}`;

    if (isTauri) {
      // NATIVE TAURI DESKTOP MODE (Silent Background Saving)
      let basePath = localStorage.getItem('shaheen_backuppath');
      if (!basePath || basePath.startsWith('Web Folder')) {
        try {
          basePath = await desktopDir();
        } catch {
          basePath = 'D:\\AREEB';
        }
      }
      
      let secondaryPath = localStorage.getItem('shaheen_secondary_backuppath');
      if (secondaryPath && secondaryPath.startsWith('Web Folder')) secondaryPath = '';

      const pathsToSave = [basePath];
      if (secondaryPath && secondaryPath.trim() !== '') {
        pathsToSave.push(secondaryPath.trim());
      }

      for (const currentPath of pathsToSave) {
        try {
          const safeBasePath = currentPath.replace(/\//g, '\\');
          const orderFolderPath = `${safeBasePath}\\SHAHEEN TRADERS BACKUP\\ORDER HISTORY\\${dateStr}\\${orderId}`;

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
          console.log(`Auto-saved all backups to: ${orderFolderPath}`);
        } catch (pathError: any) {
          console.error(`Failed to save backup to path ${currentPath}:`, pathError);
          if (currentPath === secondaryPath) {
            toast.error(`Secondary Backup (USB) failed or drive missing. Primary backup was successful.`);
          } else {
            throw pathError; // If primary fails, bubble up to main catch
          }
        }
      }
    } else {
      // WEB BROWSER MODE FALLBACK (Using Local Vite API)
      const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
             const base64String = (reader.result as string).split(',')[1];
             resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      let basePath = localStorage.getItem('shaheen_backuppath') || 'D:\\AREEB';
      if (basePath.startsWith('Web Folder')) basePath = 'D:\\AREEB';

      let pdfBase64 = null;
      let excelBase64 = null;

      if (pdfResult) {
        pdfBase64 = await blobToBase64(pdfResult.blob);
      }
      if (excelResult.success && excelResult.buffer) {
        const blob = new Blob([excelResult.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        excelBase64 = await blobToBase64(blob);
      }

      try {
        const response = await fetch('/api/save-backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
             basePath,
             dateStr,
             orderId,
             pdfBase64,
             excelBase64,
             sqlContent
          })
        });

        if (!response.ok) {
           throw new Error(`Local API save failed: ${response.statusText}`);
        }
      } catch (apiError) {
        // FALLBACK FOR CLOUD DEPLOYMENTS (Vercel, Netlify, etc.)
        console.warn('Local API failed, falling back to standard browser downloads', apiError);
        
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
    }

    return true;
  } catch (error: any) {
    console.error('Failed to save order backup', error);
    toast.error(`Backup Failed: ${error.message || 'Unknown error'}`);
    return false;
  }
};
