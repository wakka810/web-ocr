import React, { useState, useRef, useCallback } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
  supportedFormats: string[];
  maxFileSize: number; // in bytes
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  isProcessing,
  supportedFormats,
  maxFileSize,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type.toLowerCase();
    
    const isValidFormat = supportedFormats.some(format => {
      const formatLower = format.toLowerCase();
      return fileExtension === formatLower || 
             mimeType === `image/${formatLower}` ||
             (formatLower === 'jpg' && (fileExtension === 'jpeg' || mimeType === 'image/jpeg'));
    });

    if (!isValidFormat) {
      return `Invalid file type. Supported formats: ${supportedFormats.join(', ')}`;
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds limit of ${formatBytes(maxFileSize)}`;
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onImageUpload(file);
  }, [onImageUpload, supportedFormats, maxFileSize]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!isProcessing ? handleButtonClick : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={supportedFormats.map(format => `image/${format}`).join(',')}
          onChange={handleChange}
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              {dragActive ? 'Drop image here' : 'Drag and drop an image'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              or <span className="text-primary-600 font-medium">browse</span> to upload
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Supported formats: {supportedFormats.join(', ')}</p>
            <p>Maximum size: {formatBytes(maxFileSize)}</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;