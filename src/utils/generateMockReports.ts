import { supabase } from '../supabaseClient';
import { exportHeadlessReportToPDF } from './exportReportPdf';
import { exportReportToExcel } from './exportReportExcel';
import { type ReportData } from '../components/ReportReceipt';
import { ensureBackupFolder } from './backupValidator';
import toast from 'react-hot-toast';

export async function generateMockReports() {
  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  if (!isTauri) {
    toast.error("Mock generation only works in desktop app.");
    return;
  }

  const { mkdir, exists, writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');

  const toastId = toast.loading("Fetching products for mock generation...");

  try {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error || !products || products.length === 0) {
      toast.error("Failed to fetch products for mock", { id: toastId });
      return;
    }

    const baseDir = await ensureBackupFolder();
    if (!baseDir) {
      toast.error("Failed to find backup folder", { id: toastId });
      return;
    }

    const mockDir = `${baseDir}\\MOCK REPORTS`;
    const dirExists = await exists(mockDir);
    if (!dirExists) {
      await mkdir(mockDir, { recursive: true });
    }

    // A report page holds roughly 25 items on first page, and 35 on subsequent.
    // Monthly: 4 pages -> ~ 25 + (35*3) = 130 items.
    // Bi-Yearly: 10 pages -> ~ 25 + (35*9) = 340 items.

    const createMockItems = (count: number) => {
      const items = [];
      for (let i = 0; i < count; i++) {
        const p = products[i % products.length];
        const qty = Math.floor(Math.random() * 50) + 1;
        items.push({
          id: `${p.id}-mock-${i}`,
          barcode: p.barcode,
          sku: p.sku,
          name: `${p.name} - MOCK VARIANT ${i}`,
          uom: p.uom,
          quantity: qty,
          price: p.price || 0,
          totalAmount: qty * (p.price || 0)
        });
      }
      return items;
    };

    const monthlyItems = createMockItems(135); // guarantee at least 4 pages
    const biYearlyItems = createMockItems(350); // guarantee at least 10 pages

    const saveFiles = async (data: ReportData, filenamePrefix: string) => {
      toast.loading(`Generating PDF for ${filenamePrefix}...`, { id: toastId });
      // 1. PDF
      try {
        const pdfResult = await exportHeadlessReportToPDF(data);
        const pdfBuffer = await pdfResult.blob.arrayBuffer();
        await writeFile(`${mockDir}\\${filenamePrefix}.pdf`, new Uint8Array(pdfBuffer));
      } catch (err) {
        console.error("PDF generation error", err);
      }

      toast.loading(`Generating Excel for ${filenamePrefix}...`, { id: toastId });
      // 2. Excel
      try {
        const excelBlob = await exportReportToExcel(data);
        if (excelBlob) {
            const excelBuffer = await excelBlob.arrayBuffer();
            await writeFile(`${mockDir}\\${filenamePrefix}.xlsx`, new Uint8Array(excelBuffer));
        }
      } catch (err) {
        console.error("Excel generation error", err);
      }

      toast.loading(`Generating SQL for ${filenamePrefix}...`, { id: toastId });
      // 3. SQL
      try {
        let sqlContent = `-- Mock Report Backup SQL\n-- Generated on ${new Date().toISOString()}\n\n`;
        data.items.forEach((item) => {
          sqlContent += `INSERT INTO report_items (report_id, product_id, sku, barcode, name, price, quantity) VALUES ('${data.id}', '${item.id}', '${item.sku || ''}', '${item.barcode || ''}', '${(item.name || '').replace(/'/g, "''")}', ${item.price}, ${item.quantity});\n`;
        });
        const textEncoder = new TextEncoder();
        await writeFile(`${mockDir}\\${filenamePrefix}.sql`, textEncoder.encode(sqlContent));
      } catch (err) {
        console.error("SQL generation error", err);
      }
    };

    const monthlyData: ReportData = {
      id: `MOCK-MONTHLY`,
      title: `Monthly Report - Mock`,
      reportPeriod: `MOCK PERIOD 2026`,
      createdAt: new Date().toISOString(),
      items: monthlyItems,
      total: monthlyItems.reduce((sum, i) => sum + i.totalAmount, 0)
    };

    const biYearlyData: ReportData = {
      id: `MOCK-BIYEARLY`,
      title: `Bi-Yearly Report - Mock`,
      reportPeriod: `MOCK HALF 2026`,
      createdAt: new Date().toISOString(),
      items: biYearlyItems,
      total: biYearlyItems.reduce((sum, i) => sum + i.totalAmount, 0)
    };

    await saveFiles(monthlyData, 'Mock_Monthly_Report_4_Pages');
    await saveFiles(biYearlyData, 'Mock_BiYearly_Report_10_Pages');

    toast.success("Mock reports successfully generated in SHAHEEN BACKUP/MOCK REPORTS!", { id: toastId, duration: 5000 });
  } catch (error) {
    console.error(error);
    toast.error("An error occurred during mock generation", { id: toastId });
  }
}
