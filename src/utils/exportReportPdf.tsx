import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import React from 'react';
import ReportReceipt, { type ReportData } from '../components/ReportReceipt';

export const exportHeadlessReportToPDF = async (receiptData: ReportData): Promise<{blob: Blob, filename: string}> => {
  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    // Hide it extremely far offscreen
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    // Match the receipt wrapper width for high quality rendering
    container.style.width = '800px'; 
    container.id = 'headless-receipt-container';
    document.body.appendChild(container);

    const root = createRoot(container);
    
    // Wrap in a div with the same class logic
    root.render(
      <div id="receipt-print-area">
        <ReportReceipt data={receiptData} isPrintable={true} />
      </div>
    );

    // Wait for render and images/barcodes to fully load
    setTimeout(async () => {
      try {
        const pages = container.querySelectorAll('.receipt-page');
        if (pages.length === 0) {
          throw new Error("No receipt pages rendered");
        }

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < pages.length; i++) {
          const pageEl = pages[i] as HTMLElement;
          
          const imgData = await toPng(pageEl, {
            cacheBust: true,
            pixelRatio: 2, // High quality, but not insanely slow
            backgroundColor: '#ffffff',
            width: pageEl.offsetWidth,
            height: pageEl.offsetHeight,
            style: {
              transform: 'none',
              transformOrigin: 'top left',
              margin: '0',
              position: 'relative',
            }
          });
          
          if (i > 0) {
            pdf.addPage();
          }
          
          const imgProps = pdf.getImageProperties(imgData);
          const calculatedHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, calculatedHeight);
        }

        root.unmount();
        document.body.removeChild(container);
        
        resolve({ blob: pdf.output('blob'), filename: `${receiptData.id}.pdf` });
      } catch (error) {
        console.error('Headless PDF generation failed:', error);
        root.unmount();
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
        reject(error);
      }
    }, 1500); // 1.5s buffer to absolutely ensure all barcodes/qr codes and layout shifts are completed
  });
};
