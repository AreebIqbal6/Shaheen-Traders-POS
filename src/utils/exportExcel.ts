import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { type ReceiptData } from '../components/Receipt';

export const exportReceiptToExcel = async (data: ReceiptData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Receipt', {
    pageSetup: { paperSize: 9, fitToPage: true, orientation: 'portrait' } 
  });

  // Set column widths
  sheet.columns = [
    { width: 8 },  // A: S.No
    { width: 15 }, // B: SKU
    { width: 15 }, // C: Prod ID
    { width: 35 }, // D: Product Name
    { width: 12 }, // E: Quantity
    { width: 12 }, // F: Rate
    { width: 15 }  // G: Amount
  ];

  // 1. Generate Base64 Images Locally
  const receiptUrl = `${window.location.origin}/receipt/${data.id}`;
  const qrBase64 = await QRCode.toDataURL(receiptUrl, { margin: 1, width: 150 });
  
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, data.id, { format: 'CODE128', displayValue: false, margin: 0, height: 50, width: 2 });
  const barcodeBase64 = canvas.toDataURL('image/png');

  // Embed images into workbook
  const barcodeImageId = workbook.addImage({
    base64: barcodeBase64,
    extension: 'png',
  });
  const qrImageId = workbook.addImage({
    base64: qrBase64,
    extension: 'png',
  });

  // Position images
  sheet.getRow(1).height = 60;
  sheet.mergeCells('A1:C1');
  sheet.mergeCells('F1:G2');
  
  sheet.addImage(barcodeImageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 180, height: 60 }
  });

  sheet.addImage(qrImageId, {
    tl: { col: 5.5, row: 0 },
    ext: { width: 80, height: 80 }
  });

  sheet.getRow(2).height = 20;

  // Order ID Text below barcode
  sheet.mergeCells('A2:C2');
  const barcodeText = sheet.getCell('A2');
  barcodeText.value = data.id;
  barcodeText.font = { size: 9 };
  barcodeText.alignment = { horizontal: 'left', vertical: 'top' };

  // Order ID Text above QR code
  sheet.mergeCells('F3:G3');
  const qrText = sheet.getCell('F3');
  qrText.value = data.id;
  qrText.font = { size: 9, bold: true };
  qrText.alignment = { horizontal: 'right', vertical: 'bottom' };

  // Title
  sheet.mergeCells('A4:G4');
  const titleCell = sheet.getCell('A4');
  titleCell.value = 'SHAHEEN WHOLESALE';
  titleCell.font = { size: 24, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  // Divider
  sheet.mergeCells('A5:G5');
  sheet.getCell('A5').border = { bottom: { style: 'medium' } };

  // Grid
  sheet.getCell('A7').value = 'AREA:'; sheet.getCell('A7').font = { bold: true };
  sheet.getCell('B7').value = data.area || 'N/A';
  sheet.getCell('E7').value = 'DATE OF DELIVERY:'; sheet.getCell('E7').font = { bold: true };
  sheet.getCell('F7').value = new Date(data.createdAt).toLocaleDateString();

  sheet.getCell('A8').value = 'SHOP NAME:'; sheet.getCell('A8').font = { bold: true };
  sheet.getCell('B8').value = data.clientName || 'Walk-in';
  sheet.getCell('E8').value = 'BOOKER NAME:'; sheet.getCell('E8').font = { bold: true };
  sheet.getCell('F8').value = data.bookerName || 'Self';

  sheet.getCell('A9').value = 'CONTACT NUMBER:'; sheet.getCell('A9').font = { bold: true };
  sheet.getCell('B9').value = data.contactNumber || '-';
  sheet.getCell('E9').value = 'ORDER ID:'; sheet.getCell('E9').font = { bold: true };
  sheet.getCell('F9').value = data.id;

  // Divider
  sheet.mergeCells('A10:G10');
  sheet.getCell('A10').border = { bottom: { style: 'medium' } };

  // Headers
  const headerRow = sheet.getRow(12);
  headerRow.values = ['S.No', 'SKU', 'Prod ID', 'Product Name', 'Quantity', 'Rate', 'Amount'];
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center' };
  headerRow.eachCell(cell => {
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    // Not using background color to perfectly match the sleek black/white look of the screenshot
  });

  // Items
  let currentRow = 13;
  data.items.forEach((item, idx) => {
    const row = sheet.getRow(currentRow);
    row.values = [
      idx + 1,
      item.sku || '-',
      item.barcode || item.id,
      item.name,
      `${item.quantity} ${item.uom || 'Pcs'}`,
      item.price.toFixed(2),
      (item.quantity * item.price).toFixed(2)
    ];
    row.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      if (colNumber !== 4) cell.alignment = { horizontal: 'center' };
    });
    currentRow++;
  });

  // Divider
  currentRow += 2;
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  sheet.getCell(`A${currentRow}`).border = { top: { style: 'medium' } };
  
  // Total
  currentRow += 1;
  sheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const totalLabel = sheet.getCell(`A${currentRow}`);
  totalLabel.value = 'GRAND TOTAL:';
  totalLabel.font = { bold: true, size: 14 };
  totalLabel.alignment = { horizontal: 'right' };
  
  const totalValue = sheet.getCell(`F${currentRow}`);
  totalValue.value = `Rs. ${data.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  totalValue.font = { bold: true, size: 14 };
  sheet.mergeCells(`F${currentRow}:G${currentRow}`);
  totalValue.alignment = { horizontal: 'right' };

  // Divider
  currentRow += 1;
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  sheet.getCell(`A${currentRow}`).border = { bottom: { style: 'medium' } };

  // Signature
  currentRow += 4;
  sheet.getCell(`A${currentRow}`).value = 'Authorized Sign';
  sheet.getCell(`A${currentRow}`).font = { bold: true };
  sheet.getCell(`A${currentRow}`).border = { top: { style: 'thin' } };
  sheet.mergeCells(`A${currentRow}:C${currentRow}`);
  sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };

  const footerSign = sheet.getCell(`E${currentRow}`);
  footerSign.value = 'Software by Areeb Iqbal';
  sheet.mergeCells(`E${currentRow}:G${currentRow}`);
  footerSign.alignment = { horizontal: 'right' };

  // Generate and return buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, filename: `Receipt_${data.id}.xlsx` };
};
