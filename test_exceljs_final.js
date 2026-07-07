import fs from 'fs';
import https from 'https';
import ExcelJS from 'exceljs';
import ntw from 'number-to-words';

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data).toString('base64')));
    }).on('error', reject);
  });
}

async function createOrder(orderId, itemsCount) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Order Receipt', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, printArea: 'A1:F100' }
    });

    sheet.columns = [
      { key: 'sno', width: 8 },
      { key: 'prodId', width: 20 },
      { key: 'name', width: 40 },
      { key: 'qty', width: 15 },
      { key: 'rate', width: 15 },
      { key: 'amount', width: 18 }
    ];

    console.log("Fetching images for", orderId);
    let barcodeB64 = null, qrB64 = null;
    try {
      barcodeB64 = await fetchImage('https://bwipjs-api.metafloor.com/?bcid=code128&text=' + orderId + '&scale=3&includetext=true');
      qrB64 = await fetchImage('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://shaheentraders.local/order/' + orderId);
    } catch(e) {}

    for(let i=0; i<4; i++) sheet.addRow([]);
    
    if (barcodeB64) {
      const imgId1 = workbook.addImage({ base64: barcodeB64, extension: 'png' });
      sheet.addImage(imgId1, { tl: { col: 0, row: 0 }, ext: { width: 180, height: 60 } });
    }
    if (qrB64) {
      const imgId2 = workbook.addImage({ base64: qrB64, extension: 'png' });
      sheet.addImage(imgId2, { tl: { col: 5, row: 0 }, ext: { width: 70, height: 70 } });
    }

    const titleRow = sheet.addRow(['SHAHEEN WHOLESALE']);
    sheet.mergeCells('A5:F5');
    titleRow.height = 35;
    titleRow.getCell(1).font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FF1E293B' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.addRow([]);

    const d1 = sheet.addRow(['AREA:', 'Samnabad', '', 'DATE OF DELIVERY:', '6/25/2026']);
    d1.getCell(1).font = { bold: true };
    d1.getCell(4).font = { bold: true };
    
    const d2 = sheet.addRow(['SHOP NAME:', 'Mock Client', '', 'BOOKER NAME:', 'Irfan']);
    d2.getCell(1).font = { bold: true };
    d2.getCell(4).font = { bold: true };
    
    const d3 = sheet.addRow(['CONTACT NUMBER:', '0300000000', '', 'ORDER ID:', orderId]);
    d3.getCell(1).font = { bold: true };
    d3.getCell(4).font = { bold: true };

    sheet.mergeCells('B7:C7'); sheet.mergeCells('E7:F7');
    sheet.mergeCells('B8:C8'); sheet.mergeCells('E8:F8');
    sheet.mergeCells('B9:C9'); sheet.mergeCells('E9:F9');

    const aboveGrid = sheet.getRow(6);
    aboveGrid.eachCell({ includeEmpty: true }, c => c.border = { bottom: { style: 'medium', color: {argb: 'FF333333'} } });
    
    const belowGrid = sheet.getRow(10);
    belowGrid.eachCell({ includeEmpty: true }, c => c.border = { top: { style: 'medium', color: {argb: 'FF333333'} } });

    sheet.addRow([]);

    const th = sheet.addRow(['[S.No]', '[Prod ID]', '[Product Name]', '[Quantity]', '[Rate]', '[Amount]']);
    th.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FF111827' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      cell.alignment = { horizontal: 'center' };
    });

    let rowNum = 13;
    let total = 0;
    for (let i = 1; i <= itemsCount; i++) {
        total += 500;
        const row = sheet.addRow([
            i,
            'PRD-2026-' + i,
            'Mock Product ' + i,
            '5 Pcs',
            '100.00',
            '500.00'
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
    }

    sheet.addRow([]);
    rowNum++;
    
    const tRow = sheet.addRow(['', '', '', '', 'GRAND TOTAL:', 'Rs. ' + total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})]);
    tRow.getCell(5).font = { bold: true };
    tRow.getCell(6).font = { bold: true };
    tRow.getCell(6).alignment = { horizontal: 'right' };
    
    sheet.getRow(rowNum - 1).eachCell({ includeEmpty: true }, c => c.border = { bottom: { style: 'medium' } });

    sheet.addRow([]);
    rowNum++;
    
    const totalWords = ntw.toWords(total).toUpperCase() + ' RUPEES ONLY';
    const wRow = sheet.addRow(['Amount in words:', totalWords]);
    wRow.getCell(1).font = { bold: true };
    sheet.mergeCells('B' + rowNum + ':F' + rowNum);
    
    sheet.getRow(rowNum + 1).eachCell({ includeEmpty: true }, c => c.border = { top: { style: 'medium' } });

    for(let i=0; i<4; i++) sheet.addRow([]);
    rowNum += 5;
    
    const signRow = sheet.addRow(['Authorized Sign', '', '', '', '', 'Page 1 of 1']);
    signRow.getCell(1).font = { bold: true };
    signRow.getCell(1).border = { top: { style: 'thin' } };
    signRow.getCell(1).alignment = { horizontal: 'center' };
    signRow.getCell(6).alignment = { horizontal: 'right' };

    await workbook.xlsx.writeFile(orderId + '.xlsx');
    console.log("Saved " + orderId + ".xlsx");
}

async function main() {
    await createOrder('ORD-MOCK-NORMAL', 25);
    await createOrder('ORD-MOCK-DOUBLE', 50);
}
main();
