import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Check, Loader2, Barcode, Edit3, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../types';
import { parseReceiptImage, searchBarcode, identifyProductImage } from '../services/geminiService';
import CameraCapture from './CameraCapture';
import BarcodeScanner from './BarcodeScanner';

interface ScanViewProps {
  onItemsExtracted: (items: Partial<InventoryItem>[]) => void;
  onCancel: () => void;
}

const ScanView: React.FC<ScanViewProps> = ({ onItemsExtracted, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [activeScanner, setActiveScanner] = useState<'none' | 'camera' | 'barcode' | 'product'>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (base64Image: string) => {
    setActiveScanner('none');
    setIsProcessing(true);
    setError('');
    try {
      const result = await parseReceiptImage(base64Image);
      onItemsExtracted(result.items);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processProductImage = async (base64Image: string) => {
    setActiveScanner('none');
    setIsProcessing(true);
    setError('');
    try {
      const result = await identifyProductImage(base64Image);
      if (result) {
        onItemsExtracted([result]);
      } else {
        setError("Could not identify the product from the image.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze product image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processBarcode = async (barcode: string) => {
    setActiveScanner('none');
    setIsProcessing(true);
    setError('');
    try {
      const result = await searchBarcode(barcode);
      if (result) {
        onItemsExtracted([result]);
      } else {
        setError("Product not found for this barcode.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to search barcode. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => processImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleManualEntry = () => {
    onItemsExtracted([{
      name: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      category: 'other',
      shelfLifeDays: 7,
      purchaseDate: new Date().toISOString().split('T')[0]
    }]);
  };

  if (activeScanner === 'camera') {
    return <CameraCapture onCapture={processImage} onCancel={() => setActiveScanner('none')} title="Scan Receipt 📸" />;
  }

  if (activeScanner === 'product') {
    return <CameraCapture onCapture={processProductImage} onCancel={() => setActiveScanner('none')} title="Scan Product 🍎" />;
  }

  if (activeScanner === 'barcode') {
    return <BarcodeScanner onScan={processBarcode} onCancel={() => setActiveScanner('none')} />;
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#F0FDF4] to-[#ECFEFF] text-slate-800 p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[60%] bg-[#4ADE80]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-[#38BDF8]/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#4ADE80]/40 animate-[spin_8s_linear_infinite]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#4ADE80]/30 to-[#38BDF8]/30 blur-xl rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
                <Loader2 size={36} className="text-[#4ADE80] animate-spin" strokeWidth={3} />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-black mb-3 tracking-tight text-slate-800">Magic in progress ✨</h2>
          <div className="flex items-center gap-2 text-slate-600 text-sm font-bold bg-white/60 px-5 py-2.5 rounded-2xl backdrop-blur-md shadow-sm border border-white">
            <span>Extracting your groceries...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pb-24 relative">
      <div className="bg-white/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-0 z-10 rounded-b-3xl">
        <h1 className="text-3xl font-extrabold text-[#1E293B] mb-2 tracking-tight">Add Items 🪄</h1>
        <p className="text-slate-500 text-sm font-medium">How would you like to add your groceries?</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error && (
          <div 
            className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-rose-100 flex items-center gap-2 shadow-sm animate-slide-down"
          >
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 max-w-sm mx-auto w-full pb-8">
          <button
            onClick={() => setActiveScanner('camera')}
            className="flex items-center gap-5 bg-white p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 group hover:border-[#4ADE80]/30 hover:shadow-[0_8px_25px_rgba(74,222,128,0.1)] transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] w-full text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#4ADE80]/10 to-[#38BDF8]/10 rounded-2xl flex items-center justify-center group-hover:from-[#4ADE80]/20 group-hover:to-[#38BDF8]/20 transition-colors flex-shrink-0 shadow-inner">
              <Camera size={28} className="text-[#4ADE80]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">Scan Receipt 📸</h3>
              <p className="text-sm text-slate-500 font-medium leading-tight">Take a photo of your bill to auto-extract items</p>
            </div>
          </button>

          <button
            onClick={() => setActiveScanner('product')}
            className="flex items-center gap-5 bg-white p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 group hover:border-rose-400/30 hover:shadow-[0_8px_25px_rgba(244,63,94,0.1)] transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] w-full text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400/10 to-pink-500/10 rounded-2xl flex items-center justify-center group-hover:from-rose-400/20 group-hover:to-pink-500/20 transition-colors flex-shrink-0 shadow-inner">
              <Camera size={28} className="text-rose-500" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">Scan Product 🍎</h3>
              <p className="text-sm text-slate-500 font-medium leading-tight">Take a photo of a product to identify it</p>
            </div>
          </button>

          <button
            onClick={() => setActiveScanner('barcode')}
            className="flex items-center gap-5 bg-white p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 group hover:border-[#38BDF8]/30 hover:shadow-[0_8px_25px_rgba(56,189,248,0.1)] transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] w-full text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#38BDF8]/10 to-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:from-[#38BDF8]/20 group-hover:to-indigo-500/20 transition-colors flex-shrink-0 shadow-inner">
              <Barcode size={28} className="text-[#38BDF8]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">Scan Barcode 🏷️</h3>
              <p className="text-sm text-slate-500 font-medium leading-tight">Quickly scan a single product's barcode</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-5 bg-white p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 group hover:border-purple-400/30 hover:shadow-[0_8px_25px_rgba(168,85,247,0.1)] transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] w-full text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-2xl flex items-center justify-center group-hover:from-purple-400/20 group-hover:to-pink-400/20 transition-colors flex-shrink-0 shadow-inner">
              <Upload size={28} className="text-purple-500" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">Upload Image 🖼️</h3>
              <p className="text-sm text-slate-500 font-medium leading-tight">Select a receipt photo from your gallery</p>
            </div>
          </button>

          <button
            onClick={handleManualEntry}
            className="flex items-center gap-5 bg-white p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 group hover:border-orange-400/30 hover:shadow-[0_8px_25px_rgba(251,146,60,0.1)] transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] w-full text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400/10 to-amber-400/10 rounded-2xl flex items-center justify-center group-hover:from-orange-400/20 group-hover:to-amber-400/20 transition-colors flex-shrink-0 shadow-inner">
              <Edit3 size={28} className="text-orange-500" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">Manual Entry ✍️</h3>
              <p className="text-sm text-slate-500 font-medium leading-tight">Type in your items one by one</p>
            </div>
          </button>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default ScanView;
