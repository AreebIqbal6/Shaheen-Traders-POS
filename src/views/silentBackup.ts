// src/utils/silentBackup.ts
import { writeTextFile, createDir, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

export async function saveSilentBackup(orderData: any) {
  const primaryPath = localStorage.getItem('shaheen_backup_path'); // Ensure this matches your SettingsView key
  if (!primaryPath) return;

  const dateStr = new Date().toISOString().split('T')[0]; // dd-mm-yyyy format logic can be adjusted
  const orderId = orderData.receiptNumber || 'unknown';
  
  // Construct path: Path/Shaheen Traders Backup/dd-mm-yyyy/Order_ID/
  const targetDir = `${primaryPath}/Shaheen Traders Backup/${dateStr}/${orderId}`;

  try {
    if (!(await exists(targetDir))) {
      await createDir(targetDir, { recursive: true });
    }
    
    // Save as JSON (you can add PDF/Excel blobs here later)
    await writeTextFile(`${targetDir}/order_data.json`, JSON.stringify(orderData, null, 2));
    console.log("Silent backup completed successfully.");
  } catch (err) {
    console.error("Silent backup failed, skipping:", err);
  }
}