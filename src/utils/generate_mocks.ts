import { generateOrderExcel } from './excel';

async function generateMocks() {
    console.log("Generating Mocks...");
    
    // Normal Size
    const details1 = {
      clientName: 'Mock Normal Client',
      area: 'Samnabad',
      bookerName: 'Irfan',
      subTotal: 0,
      tax: 0,
      total: 0
    };
    const cart1 = [];
    for (let i = 1; i <= 25; i++) {
        cart1.push({ id: 'PRD-' + i, barcode: 'PRD-2026-' + i, name: 'Mock Product ' + i, quantity: 5, price: 100, uom: 'Pcs' });
    }
    details1.subTotal = cart1.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    details1.tax = details1.subTotal * 0.10;
    details1.total = details1.subTotal + details1.tax;
    
    // Web environment mock for Tauri check
    (globalThis as any).window = {} as any; 
    
    await generateOrderExcel('ORD-MOCK-NORMAL', cart1, details1);
    console.log("Generated Normal Size Mock");
    
    // Double Size
    const details2 = {
      clientName: 'Mock Double Client',
      area: 'Samnabad',
      bookerName: 'Irfan',
      subTotal: 0,
      tax: 0,
      total: 0
    };
    const cart2 = [];
    for (let i = 1; i <= 50; i++) {
        cart2.push({ id: 'PRD-' + i, barcode: 'PRD-2026-' + i, name: 'Mock Product ' + i, quantity: 5, price: 100, uom: 'Pcs' });
    }
    details2.subTotal = cart2.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    details2.tax = details2.subTotal * 0.10;
    details2.total = details2.subTotal + details2.tax;
    
    await generateOrderExcel('ORD-MOCK-DOUBLE', cart2, details2);
    console.log("Generated Double Size Mock");
}

generateMocks();
