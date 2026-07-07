import ExcelJS from 'exceljs';
import ntw from 'number-to-words';

async function fetchImageBase64(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    // Convert arrayBuffer to Base64 in Browser
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch (e) {
    console.error("Failed to fetch image", url);
    return null;
  }
}

export const generateOrderExcel = async (orderId: string, cart: any[], details: any) => {
  try {
    const isTauri = '__TAURI__' in window;
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Order Receipt', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, printArea: 'A1:F100' }
    });

    // Columns matching the grid
    sheet.columns = [
      { key: 'sno', width: 8 },
      { key: 'prodId', width: 20 },
      { key: 'name', width: 40 },
      { key: 'qty', width: 15 },
      { key: 'rate', width: 15 },
      { key: 'amount', width: 18 }
    ];

    // Try fetching images over network
    const barcodeB64 = await fetchImageBase64(`https://bwipjs-api.metafloor.com/?bcid=code128&text=${orderId}&scale=3&includetext=true`);
    const qrB64 = await fetchImageBase64(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://shaheentraders.local/order/${orderId}`);
    const logoB64 = await fetchImageBase64(`${window.location.origin}/logo_transparent.png`);
    
    // Rows 1-4 for images
    for(let i=0; i<4; i++) sheet.addRow([]);
    
    if (barcodeB64) {
      const imgId1 = workbook.addImage({ base64: barcodeB64, extension: 'png' });
      sheet.addImage(imgId1, { tl: { col: 0, row: 0 }, ext: { width: 180, height: 60 } });
    }
    if (logoB64) {
      const imgId3 = workbook.addImage({ base64: logoB64, extension: 'png' });
      sheet.addImage(imgId3, { tl: { col: 2.5, row: 0 }, ext: { width: 160, height: 70 } });
    }
    if (qrB64) {
      const imgId2 = workbook.addImage({ base64: qrB64, extension: 'png' });
      // Placed roughly near the end of column 5
      sheet.addImage(imgId2, { tl: { col: 5, row: 0 }, ext: { width: 70, height: 70 } });
    }

    // Row 5: Title
    const titleRow = sheet.addRow(['SHAHEEN WHOLESALE']);
    sheet.mergeCells('A5:F5');
    titleRow.height = 35;
    titleRow.getCell(1).font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FF1E293B' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.addRow([]); // Row 6 Empty

    // Grid details
    const dateStr = new Date().toLocaleDateString();
    
    // Row 7
    const d1 = sheet.addRow(['SHOP NAME:', details.clientName || 'Walk-in', '', 'DATE OF DELIVERY:', dateStr]);
    d1.getCell(1).font = { bold: true };
    d1.getCell(4).font = { bold: true };
    
    // Row 8
    const d2 = sheet.addRow(['AREA:', details.area || '-', '', 'BOOKER NAME:', details.bookerName || '-']);
    d2.getCell(1).font = { bold: true };
    d2.getCell(4).font = { bold: true };
    
    // Row 9
    const d3 = sheet.addRow(['CONTACT NUMBER:', details.contactNumber || '-', '', 'ORDER ID:', orderId]);
    d3.getCell(1).font = { bold: true };
    d3.getCell(4).font = { bold: true };

    // Merge some cells for better spacing
    sheet.mergeCells('B7:C7'); sheet.mergeCells('E7:F7');
    sheet.mergeCells('B8:C8'); sheet.mergeCells('E8:F8');
    sheet.mergeCells('B9:C9'); sheet.mergeCells('E9:F9');

    // Borders for grid details section
    const aboveGrid = sheet.getRow(6);
    aboveGrid.eachCell({ includeEmpty: true }, c => c.border = { bottom: { style: 'medium', color: {argb: 'FF333333'} } });
    
    const belowGrid = sheet.getRow(10);
    belowGrid.eachCell({ includeEmpty: true }, c => c.border = { top: { style: 'medium', color: {argb: 'FF333333'} } });

    sheet.addRow([]); // Row 11 Empty

    // Table Headers (Row 12)
    const th = sheet.addRow(['[S.No]', '[Prod ID]', '[Product Name]', '[Quantity]', '[Rate]', '[Amount]']);
    th.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FF111827' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      cell.alignment = { horizontal: 'center' };
    });

    let rowNum = 13;
    cart.forEach((item, idx) => {
        const row = sheet.addRow([
            idx + 1,
            item.barcode || item.id,
            item.name,
            `${item.quantity} ${item.uom || 'Pcs'}`,
            item.price.toFixed(2),
            (item.quantity * item.price).toFixed(2)
        ]);
        row.eachCell(cell => {
            cell.border = { top: {style:'thin', color:{argb:'FFE5E7EB'}}, bottom: {style:'thin', color:{argb:'FFE5E7EB'}} };
            cell.alignment = { vertical: 'middle' };
        });
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(5).alignment = { horizontal: 'right' };
        row.getCell(6).alignment = { horizontal: 'right' };
        rowNum++;
    });

    sheet.addRow([]);
    rowNum++;
    
    // Totals
    const tRow = sheet.addRow(['', '', '', '', 'GRAND TOTAL:', `Rs. ${details.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    tRow.getCell(5).font = { bold: true };
    tRow.getCell(6).font = { bold: true };
    tRow.getCell(6).alignment = { horizontal: 'right' };
    
    // Top border for grand total
    sheet.getRow(rowNum - 1).eachCell({ includeEmpty: true }, c => c.border = { bottom: { style: 'medium' } });

    sheet.addRow([]);
    rowNum++;
    
    // Amount in words
    const totalWords = ntw.toWords(details.total).toUpperCase() + ' RUPEES ONLY';
    const wRow = sheet.addRow(['Amount in words:', totalWords]);
    wRow.getCell(1).font = { bold: true };
    sheet.mergeCells(`B${rowNum}:F${rowNum}`);
    
    sheet.getRow(rowNum + 1).eachCell({ includeEmpty: true }, c => c.border = { top: { style: 'medium' } });

    // Signatures
    for(let i=0; i<4; i++) sheet.addRow([]);
    rowNum += 5;
    
    const signRow = sheet.addRow(['Authorized Sign', '', '', '', '', 'Page 1 of 1']);
    signRow.getCell(1).font = { bold: true };
    signRow.getCell(1).border = { top: { style: 'thin' } };
    signRow.getCell(1).alignment = { horizontal: 'center' };
    signRow.getCell(6).alignment = { horizontal: 'right' };

    // Generate buffer from exceljs
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const uint8Array = new Uint8Array(excelBuffer);
    
    // We just return the Excel Uint8Array now, the exportManager handles saving
    return { success: true, buffer: uint8Array };
  } catch (error) {
    console.error('Failed to generate Excel:', error);
    return { success: false, error };
  }
};
