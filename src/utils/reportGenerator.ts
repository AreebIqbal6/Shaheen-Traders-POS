import { supabase } from '../supabaseClient';
import { exportHeadlessReportToPDF } from './exportReportPdf';
import { exportReportToExcel } from './exportReportExcel';
import { type ReportData } from '../components/ReportReceipt';
import { ensureBackupFolder } from './backupValidator';
import toast from 'react-hot-toast';

export async function generateMonthlyReport(year: number, month: number) {
  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  if (!isTauri) return;

  const { BaseDirectory, mkdir, exists, writeFile } = await import('@tauri-apps/plugin-fs');

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[month - 1];
  
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  // Query database for orders in this month
  const { data: orders, error } = await supabase
    .from('orders')
    .select('items, total')
    .eq('status', 'COMPLETED')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) {
    console.error("Error fetching orders for report:", error);
    return;
  }

  const actualOrders = orders || [];
  const aggregatedItems = aggregateItems(actualOrders);
  const totalAmount = actualOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  const reportId = `MONTHLY-${year}-${month.toString().padStart(2, '0')}`;
  
  const reportData: ReportData = {
    id: reportId,
    title: `Monthly Report - ${monthName}`,
    reportPeriod: `${monthName} ${year}`,
    createdAt: new Date().toISOString(),
    items: aggregatedItems,
    total: totalAmount
  };

  // Generate Files
  const baseDir = await ensureBackupFolder();
  const reportDirPath = `${baseDir}\\MONTHLY REPORTS\\${year}\\${monthName}`;
  
  const dirExists = await exists(reportDirPath);
  if (!dirExists) {
    await mkdir(reportDirPath, { recursive: true });
  }

  // 1. PDF
  try {
    const pdfResult = await exportHeadlessReportToPDF(reportData);
    const pdfBuffer = await pdfResult.blob.arrayBuffer();
    await writeFile(`${reportDirPath}\\${reportId}.pdf`, new Uint8Array(pdfBuffer));
  } catch (err) {
    console.error("Failed to save PDF report", err);
  }

  // 2. Excel
  try {
    const excelBlob = await exportReportToExcel(reportData);
    if (excelBlob) {
        const excelBuffer = await excelBlob.arrayBuffer();
        await writeFile(`${reportDirPath}\\${reportId}.xlsx`, new Uint8Array(excelBuffer));
    }
  } catch (err) {
    console.error("Failed to save Excel report", err);
  }

  // 3. SQL
  try {
    let sqlContent = `-- Monthly Report Backup SQL\n-- Generated on ${new Date().toISOString()}\n-- Period: ${monthName} ${year}\n\n`;
    aggregatedItems.forEach(item => {
      sqlContent += `INSERT INTO report_items (report_id, product_id, sku, barcode, name, price, quantity) VALUES ('${reportId}', '${item.id}', '${item.sku || ''}', '${item.barcode || ''}', '${(item.name || '').replace(/'/g, "''")}', ${item.price}, ${item.quantity});\n`;
    });
    
    const textEncoder = new TextEncoder();
    await writeFile(`${reportDirPath}\\${reportId}.sql`, textEncoder.encode(sqlContent));
  } catch (err) {
    console.error("Failed to save SQL report", err);
  }
}

export async function generateBiYearlyReport(year: number, half: 1 | 2) {
  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  if (!isTauri) return;

  const { BaseDirectory, mkdir, exists, writeFile } = await import('@tauri-apps/plugin-fs');

  const periodName = half === 1 ? "JAN-JUNE" : "JULY-DEC";
  
  const startMonth = half === 1 ? 0 : 6;
  const endMonth = half === 1 ? 5 : 11;
  
  const startDate = new Date(year, startMonth, 1).toISOString();
  const endDate = new Date(year, endMonth + 1, 0, 23, 59, 59, 999).toISOString();

  // Query database for orders in this period
  const { data: orders, error } = await supabase
    .from('orders')
    .select('items, total')
    .eq('status', 'COMPLETED')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) {
    console.error("Error fetching orders for bi-yearly report:", error);
    return;
  }

  const actualOrders = orders || [];
  const aggregatedItems = aggregateItems(actualOrders);
  const totalAmount = actualOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  const reportId = `BIYEARLY-${year}-H${half}`;
  
  const reportData: ReportData = {
    id: reportId,
    title: `Bi-Yearly Report - ${periodName}`,
    reportPeriod: `${periodName} ${year}`,
    createdAt: new Date().toISOString(),
    items: aggregatedItems,
    total: totalAmount
  };

  // Generate Files
  const baseDir = await ensureBackupFolder();
  const reportDirPath = `${baseDir}\\BI-YEARLY REPORTS\\${year}`;
  
  const dirExists = await exists(reportDirPath);
  if (!dirExists) {
    await mkdir(reportDirPath, { recursive: true });
  }

  const fileNameBase = `${periodName}`;

  // 1. PDF
  try {
    const pdfResult = await exportHeadlessReportToPDF(reportData);
    const pdfBuffer = await pdfResult.blob.arrayBuffer();
    await writeFile(`${reportDirPath}\\${fileNameBase}.pdf`, new Uint8Array(pdfBuffer));
  } catch (err) {
    console.error("Failed to save PDF bi-yearly report", err);
  }

  // 2. Excel
  try {
    const excelBlob = await exportReportToExcel(reportData);
    if (excelBlob) {
        const excelBuffer = await excelBlob.arrayBuffer();
        await writeFile(`${reportDirPath}\\${fileNameBase}.xlsx`, new Uint8Array(excelBuffer));
    }
  } catch (err) {
    console.error("Failed to save Excel bi-yearly report", err);
  }

  // 3. SQL
  try {
    let sqlContent = `-- Bi-Yearly Report Backup SQL\n-- Generated on ${new Date().toISOString()}\n-- Period: ${periodName} ${year}\n\n`;
    aggregatedItems.forEach(item => {
      sqlContent += `INSERT INTO report_items (report_id, product_id, sku, barcode, name, price, quantity) VALUES ('${reportId}', '${item.id}', '${item.sku || ''}', '${item.barcode || ''}', '${(item.name || '').replace(/'/g, "''")}', ${item.price}, ${item.quantity});\n`;
    });
    
    const textEncoder = new TextEncoder();
    await writeFile(`${reportDirPath}\\${fileNameBase}.sql`, textEncoder.encode(sqlContent));
  } catch (err) {
    console.error("Failed to save SQL bi-yearly report", err);
  }
}

function aggregateItems(orders: any[]) {
  const itemsMap = new Map<string, any>();
  
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const id = item.id || item.barcode || item.name;
        if (!id) return;
        
        const amount = (item.basePrice || item.price) * item.quantity;
        
        if (itemsMap.has(id)) {
          const existing = itemsMap.get(id);
          existing.quantity += item.quantity;
          existing.totalAmount += amount;
        } else {
          itemsMap.set(id, {
            id: item.id || id,
            barcode: item.barcode,
            sku: item.sku,
            name: item.name,
            uom: item.uom,
            quantity: item.quantity,
            totalAmount: amount
          });
        }
      });
    }
  });

  return Array.from(itemsMap.values()).map(item => {
    return {
      ...item,
      // For display, rate = totalAmount / quantity. We also might want to format it cleanly.
      price: item.totalAmount / item.quantity
    };
  }).sort((a, b) => b.quantity - a.quantity);
}

// Function to run on startup to check for missing past reports
export async function autoGenerateMissingReports() {
  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  if (!isTauri) return;

  const { exists } = await import('@tauri-apps/plugin-fs');
  const baseDir = await ensureBackupFolder();
  if (!baseDir) return;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  
  // Find the earliest order date to know how far back to go
  let startYear = currentYear - 1;
  try {
    const { data: oldestOrder } = await supabase
      .from('orders')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
      
    if (oldestOrder && oldestOrder.created_at) {
      startYear = new Date(oldestOrder.created_at).getFullYear();
    }
  } catch (err) {
    console.error("Failed to fetch oldest order year", err);
  }
  
  // We only generate reports for PAST months/periods. We don't generate the current active month.
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  for (let year = startYear; year <= currentYear; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === currentYear && month >= currentMonth) {
        break; // Stop at current or future months
      }
      
      const monthName = monthNames[month - 1];
      const reportId = `MONTHLY-${year}-${month.toString().padStart(2, '0')}`;
      const filePath = `${baseDir}\\MONTHLY REPORTS\\${year}\\${monthName}\\${reportId}.pdf`;
      
      const alreadyGenerated = await exists(filePath);
      if (!alreadyGenerated) {
        console.log(`Generating missing monthly report: ${monthName} ${year}`);
        await generateMonthlyReport(year, month);
      }
    }
    
    // Check Bi-Yearly
    for (let half = 1; half <= 2; half++) {
      // Half 1 is Jan-Jun, ends in June (month 6)
      // Half 2 is Jul-Dec, ends in Dec (month 12)
      if (year === currentYear) {
        if (half === 1 && currentMonth <= 6) break; // First half hasn't ended yet
        if (half === 2) break; // Second half hasn't ended yet
      }
      
      const periodName = half === 1 ? "JAN-JUNE" : "JULY-DEC";
      const filePath = `${baseDir}\\BI-YEARLY REPORTS\\${year}\\${periodName}.pdf`;
      
      const alreadyGenerated = await exists(filePath);
      if (!alreadyGenerated) {
        console.log(`Generating missing bi-yearly report: ${periodName} ${year}`);
        await generateBiYearlyReport(year, half as 1 | 2);
      }
    }
  }
}
