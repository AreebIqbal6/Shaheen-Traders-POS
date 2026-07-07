import * as XLSX from 'xlsx';
import fs from 'fs';

function generateMock(orderId, numItems) {
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
            id: 'PRD-' + i,
            barcode: 'PRD-2026-' + i,
            name: 'Mock Product ' + i,
            quantity: Math.floor(Math.random() * 10) + 1,
            price: 100,
            uom: 'Pcs'
        });
    }

    details.subTotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    details.tax = details.subTotal * 0.10;
    details.total = details.subTotal + details.tax;

    const headerRow = [
      ['SHAHEEN WHOLESALE'],
      ['Order ID', orderId],
      ['Client Name', details.clientName],
      ['Area', details.area],
      ['Booker', details.bookerName],
      ['Date', new Date().toLocaleDateString()],
      []
    ];

    const tableHeaders = ['S.No', 'Product ID', 'Product Name', 'Quantity', 'Rate', 'Amount'];
    
    const tableData = cart.map((item, index) => [
      index + 1,
      item.barcode || item.id,
      item.name,
      item.quantity + ' ' + (item.uom || 'Pcs'),
      item.price.toFixed(2),
      (item.quantity * item.price).toFixed(2)
    ]);

    const totals = [
      [],
      ['', '', '', '', 'Subtotal', details.subTotal.toFixed(2)],
      ['', '', '', '', 'Tax (10%)', details.tax.toFixed(2)],
      ['', '', '', '', 'GRAND TOTAL', details.total.toFixed(2)]
    ];

    const wsData = [...headerRow, tableHeaders, ...tableData, ...totals];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    
    const wscols = [
      {wch: 6},
      {wch: 15},
      {wch: 30},
      {wch: 12},
      {wch: 12},
      {wch: 15}
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Order');

    XLSX.writeFile(workbook, 'C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\611fb8ae-eb0b-42e8-8ab6-0768780782e2\\' + orderId + '.xlsx');
    console.log('Saved ' + orderId + '.xlsx');
}

generateMock('MOCK-NORMAL-SIZE', 30);
generateMock('MOCK-DOUBLE-SIZE', 60);
