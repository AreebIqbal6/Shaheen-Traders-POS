import ExcelJS from 'exceljs';
import fs from 'fs';

async function fetchImageBase64(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (e) {
    console.error("Failed to fetch image", url);
    return null;
  }
}

async function generateExcelMock(orderId, numItems) {
    const details = {
      clientName: 'Mock Client',
      area: 'Samnabad',
      bookerName: 'Irfan',
      subTotal: 0,
      tax: 0,
      total: 0
    };

    const cart = [];
    for (let i = 1; i <= numItems; i++) {
        cart.push({
            id: `PRD-${i}`,
            barcode: `PRD-2026-${i}`,
            name: `Mock Product ${i}`,
            quantity: Math.floor(Math.random() * 10) + 1,
            price: 100,
            uom: 'Pcs'
        });
    }

    details.subTotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    details.tax = details.subTotal * 0.10;
    details.total = details.subTotal + details.tax;
    const totalWords = "FORTY TWO THOUSAND RUPEES ONLY";

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Order Receipt', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, printArea: 'A1:F100' }
    });

    // Columns matching the grid
    sheet.columns = [
      { key: 'sno', width: 8 },
      { key: 'prodId', width: 20 },
      { key: 'name', width: 40 },
      { key: 'qty', width: 12 },
      { key: 'rate', width: 15 },
      { key: 'amount', width: 18 }
    ];

    // Images
    const barcodeB64 = await fetchImageBase64(`https://bwipjs-api.metafloor.com/?bcid=code128&text=${orderId}&scale=3&includetext=true`);
    const qrB64 = await fetchImageBase64(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://shaheentraders.local/order/${orderId}`);
    
    // Add 4 empty rows for images to fit
    for(let i=0; i<4; i++) sheet.addRow([]);
    
    if (barcodeB64) {
      const imgId1 = workbook.addImage({ base64: barcodeB64, extension: 'png' });
      sheet.addImage(imgId1, { tl: { col: 0, row: 0 }, ext: { width: 180, height: 60 } });
    }
    if (qrB64) {
      const imgId2 = workbook.addImage({ base64: qrB64, extension: 'png' });
      sheet.addImage(imgId2, { tl: { col: 5, row: 0 }, ext: { width: 70, height: 70 } });
    }

    // Row 6: Title
    const titleRow = sheet.addRow(['SHAHEEN WHOLESALE']);
    sheet.mergeCells('A6:F6');
    titleRow.height = 35;
    titleRow.getCell(1).font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FF1E293B' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.addRow([]);

    // Grid details
    const dateStr = new Date().toLocaleDateString();
    
    const d1 = sheet.addRow(['AREA:', details.area, '', 'DATE OF DELIVERY:', dateStr]);
    d1.getCell(1).font = { bold: true };
    d1.getCell(4).font = { bold: true };
    
    const d2 = sheet.addRow(['SHOP NAME:', details.clientName, '', 'BOOKER NAME:', details.bookerName]);
    d2.getCell(1).font = { bold: true };
    d2.getCell(4).font = { bold: true };
    
    const d3 = sheet.addRow(['CONTACT NUMBER:', '-', '', 'ORDER ID:', orderId]);
    d3.getCell(1).font = { bold: true };
    d3.getCell(4).font = { bold: true };

    // Merge some cells for better spacing
    sheet.mergeCells(`B8:C8`); sheet.mergeCells(`E8:F8`);
    sheet.mergeCells(`B9:C9`); sheet.mergeCells(`E9:F9`);
    sheet.mergeCells(`B10:C10`); sheet.mergeCells(`E10:F10`);

    // Borders for grid details section
    const drawGridLines = (rowIdx) => {
        const row = sheet.getRow(rowIdx);
        row.getCell(1).border = { top: {style:'thick'}, bottom: {style:'thick'} };
        row.getCell(2).border = { top: {style:'thick'}, bottom: {style:'thick'} };
        row.getCell(3).border = { top: {style:'thick'}, bottom: {style:'thick'} };
        row.getCell(4).border = { top: {style:'thick'}, bottom: {style:'thick'} };
        row.getCell(5).border = { top: {style:'thick'}, bottom: {style:'thick'} };
        row.getCell(6).border = { top: {style:'thick'}, bottom: {style:'thick'} };
    }
    // We want a thick border ABOVE the grid and BELOW the grid
    const aboveGrid = sheet.getRow(7);
    aboveGrid.eachCell(c => c.border = { bottom: { style: 'medium', color: {argb: 'FF333333'} } });
    
    const belowGrid = sheet.getRow(11);
    belowGrid.eachCell(c => c.border = { top: { style: 'medium', color: {argb: 'FF333333'} } });

    sheet.addRow([]);

    // Table Headers
    const th = sheet.addRow(['[S.No]', '[Prod ID]', '[Product Name]', '[Quantity]', '[Rate]', '[Amount]']);
    th.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FF111827' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      cell.alignment = { horizontal: 'center' };
    });

    let rowNum = 14;
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
    
    // Totals
    const tRow = sheet.addRow(['', '', '', '', 'GRAND TOTAL:', `Rs. ${details.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]);
    tRow.getCell(5).font = { bold: true };
    tRow.getCell(6).font = { bold: true };
    tRow.getCell(6).alignment = { horizontal: 'right' };
    // Top border for grand total
    sheet.getRow(rowNum).eachCell(c => c.border = { bottom: { style: 'medium' } });

    sheet.addRow([]);
    
    // Amount in words
    const wRow = sheet.addRow(['Amount in words:', totalWords]);
    wRow.getCell(1).font = { bold: true };
    sheet.mergeCells(`B${rowNum + 3}:F${rowNum + 3}`);
    sheet.getRow(rowNum+2).eachCell(c => c.border = { bottom: { style: 'medium' } });

    // Signatures
    for(let i=0; i<4; i++) sheet.addRow([]);
    const signRow = sheet.addRow(['Authorized Sign', '', '', '', '', 'Page 1 of 1']);
    signRow.getCell(1).font = { bold: true };
    signRow.getCell(1).border = { top: { style: 'thin' } };
    signRow.getCell(1).alignment = { horizontal: 'center' };
    signRow.getCell(6).alignment = { horizontal: 'right' };

    await workbook.xlsx.writeFile(`C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\scratch\\${orderId}.xlsx`);
    console.log(`Saved ${orderId}.xlsx`);
}

async function run() {
    await generateExcelMock('ORD-MOCK-NORMAL', 25);
    await generateExcelMock('ORD-MOCK-DOUBLE', 50);
}
run();
