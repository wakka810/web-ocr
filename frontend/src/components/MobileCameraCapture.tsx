import React, { useRef } from 'react';

interface MobileCameraCaptureProps {
  onCapture: (file: File) => void;
  isProcessing: boolean;
  supportedFormats: string[];
}

const MobileCameraCapture: React.FC<MobileCameraCaptureProps> = ({
  onCapture,
  isProcessing,
  supportedFormats: _supportedFormats,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      // Reset input to allow capturing the same image again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  // Check if we're on a mobile device or if camera is available
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Also check for touch support as a more reliable indicator
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (!isMobile && !hasTouchSupport) {
    return null;
  }

  return (
    <div className="mt-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        disabled={isProcessing}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className="w-full btn-secondary flex items-center justify-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Take Photo
      </button>
    </div>
  );
};

export default MobileCameraCapture;