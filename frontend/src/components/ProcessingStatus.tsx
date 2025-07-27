import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ProcessingStatusProps {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress?: {
    current: number;
    total: number;
  };
  message?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ 
  status, 
  progress, 
  message 
}) => {
  if (status === 'idle') return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <LoadingSpinner size="sm" />;
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading image...';
      case 'processing':
        return progress
          ? `Processing region ${progress.current} of ${progress.total}...`
          : 'Processing...';
      case 'completed':
        return 'Processing completed!';
      case 'error':
        return message || 'An error occurred';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-50 text-blue-700';
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'error':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className={`rounded-lg p-4 flex items-center space-x-3 ${getStatusColor()}`}>
      {getStatusIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium">{getStatusText()}</p>
        {progress && status === 'processing' && (
          <div className="mt-2">
            <div className="bg-white rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingStatus;