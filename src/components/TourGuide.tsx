import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface TourGuideProps {
  run: boolean;
  onFinish: () => void;
}

export default function TourGuide({ run, onFinish }: TourGuideProps) {
  const [steps] = useState<Step[]>([
    {
      target: '.tour-sidebar',
      content: 'Navigate between Sales, Inventory, and Analytics.',
      disableBeacon: true,
      title: 'Navigation Menu',
    },
    {
      target: '.tour-product-grid',
      content: 'Tap items here to add them to the current order.',
      title: 'Product Catalog',
    },
    {
      target: '.tour-cart-panel',
      content: 'Review the current order, apply discounts, and manage taxes here.',
      title: 'Active Register',
      placement: 'left',
    },
    {
      target: '.tour-checkout-btn',
      content: 'Process payments and complete the transaction.',
      title: 'Checkout',
      placement: 'top',
    },
  ]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb', // Tailwind blue-600
          zIndex: 10000,
          backgroundColor: '#ffffff',
          textColor: '#0f172a', // Tailwind slate-900
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '8px',
        },
        buttonNext: {
          borderRadius: '6px',
          padding: '8px 16px',
          fontWeight: 600,
        },
        buttonBack: {
          marginRight: '8px',
          color: '#64748b', // slate-500
        },
        buttonSkip: {
          color: '#64748b',
          fontWeight: 500,
        }
      }}
    />
  );
}
