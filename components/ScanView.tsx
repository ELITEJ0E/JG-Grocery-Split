import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Check, Loader2, Barcode, Edit3 } from 'lucide-react';
import { InventoryItem } from '../types';
import { parseReceiptImage, searchBarcode } from '../services/geminiService';
import { motion } from 'motion/react';
import CameraCapture from './CameraCapture';
import BarcodeScanner from './BarcodeScanner';

interface ScanViewProps {
  onItemsExtracted: (items: Partial<InventoryItem>[]) => void;
  onCancel: () => void;
}

const ScanView: React.FC<ScanViewProps> = ({ onItemsExtracted, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [activeScanner, setActiveScanner] = useState<'none' | 'camera' | 'barcode'>('none');
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
    return <CameraCapture onCapture={processImage} onCancel={() => setActiveScanner('none')} />;
  }

  if (activeScanner === 'barcode') {
    return <BarcodeScanner onScan={processBarcode} onCancel={() => setActiveScanner('none')} />;
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[60%] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-teal-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/30 animate-[spin_8s_linear_infinite]"></div>
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
                <Loader2 size={32} className="text-white animate-spin" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-wide drop-shadow-md">Processing...</h2>
          <div className="flex items-center gap-2 text-emerald-200/90 text-sm font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
            <span>Extracting information</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Groceries</h1>
        <button onClick={onCancel} className="p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 transition-colors">
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center gap-4 max-w-xs mx-auto w-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveScanner('camera')}
          className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:border-emerald-200 transition-colors w-full"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors flex-shrink-0">
            <Camera size={28} className="text-emerald-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Scan Receipt</h3>
            <p className="text-sm text-gray-500">Take a photo of your bill</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveScanner('barcode')}
          className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:border-blue-200 transition-colors w-full"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
            <Barcode size={28} className="text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Scan Barcode</h3>
            <p className="text-sm text-gray-500">Scan a product barcode</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:border-purple-200 transition-colors w-full"
        >
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors flex-shrink-0">
            <Upload size={28} className="text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Upload Receipt</h3>
            <p className="text-sm text-gray-500">Select an image from gallery</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleManualEntry}
          className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:border-orange-200 transition-colors w-full"
        >
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center group-hover:bg-orange-100 transition-colors flex-shrink-0">
            <Edit3 size={28} className="text-orange-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Manual Entry</h3>
            <p className="text-sm text-gray-500">Type in your items manually</p>
          </div>
        </motion.button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ScanView;
