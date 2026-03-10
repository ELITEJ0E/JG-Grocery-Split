import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      <div className="flex justify-between items-center p-6 bg-gradient-to-b from-slate-900/90 to-transparent absolute top-0 w-full z-10">
        <h2 className="text-white font-extrabold text-xl drop-shadow-md tracking-tight">Scan Receipt 📸</h2>
        <button 
          onClick={() => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            onCancel();
          }}
          className="text-white bg-white/20 p-2.5 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors"
        >
          <X size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-8 bg-slate-800/50 rounded-3xl backdrop-blur-md border border-slate-700 mx-6">
            <p className="mb-5 text-rose-400 font-bold">{error}</p>
            <button 
              onClick={startCamera}
              className="flex items-center gap-2 mx-auto bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-slate-100 transition-colors shadow-lg active:scale-95"
            >
              <RefreshCw size={18} /> Try Again
            </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-full max-w-sm aspect-[3/4] border-2 border-white/30 rounded-[2rem] relative shadow-[inset_0_0_50px_rgba(0,0,0,0.3)]">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#4ADE80] rounded-tl-[2rem] -ml-1 -mt-1"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#4ADE80] rounded-tr-[2rem] -mr-1 -mt-1"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#4ADE80] rounded-bl-[2rem] -ml-1 -mb-1"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#4ADE80] rounded-br-[2rem] -mr-1 -mb-1"></div>
                
                {/* Scanning animation line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4ADE80] to-transparent opacity-70 animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-40 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent flex items-center justify-center pb-safe absolute bottom-0 w-full">
        <button 
          onClick={handleCapture}
          disabled={!!error}
          className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-white transition-colors group"
        >
          <div className="w-16 h-16 bg-white rounded-full group-hover:scale-95 group-active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
