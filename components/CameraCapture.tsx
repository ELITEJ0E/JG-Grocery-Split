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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
        <h2 className="text-white font-semibold text-lg drop-shadow-md">Scan Receipt</h2>
        <button 
          onClick={() => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            onCancel();
          }}
          className="text-white bg-black/50 p-2 rounded-full backdrop-blur-sm"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4 text-red-400">{error}</p>
            <button 
              onClick={startCamera}
              className="flex items-center gap-2 mx-auto bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <RefreshCw size={16} /> Retry
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
              <div className="w-full max-w-sm aspect-[3/4] border-2 border-white/50 rounded-2xl relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl -ml-1 -mt-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl -mr-1 -mt-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl -ml-1 -mb-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl -mr-1 -mb-1"></div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-32 bg-black flex items-center justify-center pb-safe">
        <button 
          onClick={handleCapture}
          disabled={!!error}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-16 h-16 bg-white rounded-full active:scale-90 transition-transform"></div>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
