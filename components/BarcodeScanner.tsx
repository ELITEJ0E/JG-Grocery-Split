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
    <div className="flex flex-col h-full bg-slate-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Scan Barcode 🏷️</h2>
        <button onClick={onCancel} className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
          <X size={20} strokeWidth={3} />
        </button>
      </div>
      
      {error && <div className="bg-rose-500/20 text-rose-200 p-4 rounded-2xl mb-6 text-sm font-bold border border-rose-500/30">{error}</div>}
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-sm">
          <div id="reader" className="w-full rounded-[2rem] overflow-hidden bg-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700"></div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-[#38BDF8]/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#4ADE80]/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>
        <div className="mt-8 bg-slate-800/50 px-6 py-3 rounded-2xl backdrop-blur-md border border-slate-700">
          <p className="text-slate-300 text-sm font-medium text-center">
            Position the barcode inside the frame to scan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
