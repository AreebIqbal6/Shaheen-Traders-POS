import { writeTextFile, mkdir, exists } from "@tauri-apps/plugin-fs";

export async function saveSilentBackup(orderData: any) {
  // Use the key exactly as it appears in SettingsView
  const primaryPath = localStorage.getItem('shaheen_backuppath');
  if (!primaryPath) return;

  // Format: dd-mm-yyyy
  const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const orderId = orderData.receiptNumber || 'unknown';
  
  // Construct path: Path/Shaheen Traders Backup/dd-mm-yyyy/Order_ID/
  const targetDir = `${primaryPath}/Shaheen Traders Backup/${dateStr}/${orderId}`;

  try {
    // Tauri's fs plugin handles directory creation recursively
    if (!(await exists(targetDir))) {
     await mkdir(backupPath, { recursive: true });
    }
    
    // Save order as JSON
    await writeTextFile(`${targetDir}/order_data.json`, JSON.stringify(orderData, null, 2));
    console.log("Silent backup successful:", targetDir);
  } catch (err) {
    console.error("Silent backup failed:", err);
  }
}