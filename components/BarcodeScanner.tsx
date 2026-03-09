import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onCancel }) => {
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // Ignore continuous scan errors
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="flex flex-col h-full bg-black text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Scan Barcode</h2>
        <button onClick={onCancel} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
          <X size={20} />
        </button>
      </div>
      
      {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-xl mb-4 text-sm">{error}</div>}
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div id="reader" className="w-full max-w-sm rounded-2xl overflow-hidden bg-white/5"></div>
        <p className="mt-6 text-gray-400 text-sm text-center">
          Position the barcode inside the frame to scan.
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
