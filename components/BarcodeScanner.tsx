import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { X, RefreshCw } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onCancel }) => {
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const startScanner = async () => {
    setError('');
    try {
      const codeReader = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        // decodeFromVideoDevice takes: deviceId, videoElement, callback
        // passing undefined for deviceId auto-selects the best camera (usually environment)
        await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
          if (controls && !controlsRef.current) {
            controlsRef.current = controls;
          }
          
          if (result) {
            if (controlsRef.current) {
              controlsRef.current.stop();
            }
            onScan(result.getText());
          }
        });
      }
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Scan Barcode 🏷️</h2>
        <button onClick={() => {
          if (controlsRef.current) controlsRef.current.stop();
          onCancel();
        }} className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
          <X size={20} strokeWidth={3} />
        </button>
      </div>
      
      {error ? (
        <div className="text-white text-center p-8 bg-slate-800/50 rounded-3xl backdrop-blur-md border border-slate-700 mx-6">
          <p className="mb-5 text-rose-400 font-bold">{error}</p>
          <button 
            onClick={startScanner}
            className="flex items-center gap-2 mx-auto bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-slate-100 transition-colors shadow-lg active:scale-95"
          >
            <RefreshCw size={18} /> Try Again
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-sm">
            <div className="w-full aspect-square rounded-[2rem] overflow-hidden bg-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 relative">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
              />
              {/* Scanning animation line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-70 animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
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
      )}
    </div>
  );
};

export default BarcodeScanner;
