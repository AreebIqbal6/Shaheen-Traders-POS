import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export const exportReceiptToPDF = async (orderId: string, silent: boolean = false) => {
  const container = document.getElementById('receipt-print-area');
  if (!container) {
    if (!silent) toast.error('Receipt container not found');
    return;
  }

  const pages = container.querySelectorAll('.receipt-page');
  if (pages.length === 0) {
    if (!silent) toast.error('No receipt pages found');
    return;
  }

  let toastId;
  if (!silent) toastId = toast.loading('Generating PDF...');

  try {
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
        pixelRatio: 4,
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
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    const filename = `${orderId}.pdf`;
    const blob = pdf.output('blob');
    if (!silent) toast.success('PDF generated successfully!', { id: toastId });
    return { blob, filename };
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!silent) toast.error('PDF generation failed on this device.', { id: toastId, duration: 4000 });
    throw error;
  }
};
