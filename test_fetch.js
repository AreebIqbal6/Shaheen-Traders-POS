import ExcelJS from 'exceljs';
import fs from 'fs';

async function fetchImageBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('HTTP Error', response.status, url);
        return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (e) {
    console.error("Fetch exception", e.message, url);
    return null;
  }
}
fetchImageBase64('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TEST').then(b => console.log('QR length:', b?.length));
fetchImageBase64('https://bwipjs-api.metafloor.com/?bcid=code128&text=TEST&scale=3&includetext=true').then(b => console.log('Barcode length:', b?.length));
