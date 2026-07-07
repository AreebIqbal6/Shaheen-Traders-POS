import React from 'react';
import CodeScanner from './CodeScanner';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

/**
 * CameraScanner — thin wrapper around CodeScanner that preserves the
 * existing onScan(barcode: string) API used throughout the app.
 */
const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onClose }) => {
  return (
    <CodeScanner
      onDetected={({ value }) => onScan(value)}
      onClose={onClose}
    />
  );
};

export default CameraScanner;
