import React, { useState } from 'react';
import { OCRResult, Region } from '@/types';
import LoadingSpinner from './LoadingSpinner';

interface OCRResultsProps {
  results: OCRResult[];
  regions: Region[];
  isProcessing: boolean;
  onCopyText?: (text: string) => void;
}

const OCRResults: React.FC<OCRResultsProps> = ({
  results,
  regions,
  isProcessing,
  onCopyText,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, regionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(regionId);
      if (onCopyText) {
        onCopyText(text);
      }
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleCopyAll = async () => {
    const allText = results
      .filter(result => result.text && !result.error)
      .map(result => result.text)
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(allText);
      setCopiedId('all');
      if (onCopyText) {
        onCopyText(allText);
      }
      
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy all text:', error);
    }
  };

  const getRegionLabel = (regionId: string, index: number) => {
    const region = regions.find(r => r.id === regionId);
    return region?.label || `Region ${index + 1}`;
  };

  const getRegionColor = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    return region?.color || '#3B82F6';
  };

  if (isProcessing && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Processing regions...</p>
      </div>
    );
  }

  if (!isProcessing && results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results yet. Select regions and click "Extract Text" to begin.</p>
      </div>
    );
  }

  const successfulResults = results.filter(r => !r.error);
  const failedResults = results.filter(r => r.error);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {isProcessing ? (
            <span>Processing {results.length} of {regions.length} regions...</span>
          ) : (
            <span>
              Processed {results.length} regions 
              ({successfulResults.length} successful, {failedResults.length} failed)
            </span>
          )}
        </div>
        
        {successfulResults.length > 1 && (
          <button
            onClick={handleCopyAll}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {copiedId === 'all' ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy All
              </>
            )}
          </button>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={result.regionId}
            className={`border rounded-lg overflow-hidden ${
              result.error ? 'border-red-200' : 'border-gray-200'
            }`}
          >
            {/* Header */}
            <div
              className="px-4 py-2 flex justify-between items-center"
              style={{ backgroundColor: `${getRegionColor(result.regionId)}20` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getRegionColor(result.regionId) }}
                />
                <span className="font-medium text-sm">
                  {getRegionLabel(result.regionId, index)}
                </span>
                {result.processingTime && (
                  <span className="text-xs text-gray-500">
                    ({(result.processingTime / 1000).toFixed(1)}s)
                  </span>
                )}
              </div>
              
              {result.text && !result.error && (
                <button
                  onClick={() => handleCopy(result.text, result.regionId)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  {copiedId === result.regionId ? (
                    <>
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Content */}
            <div className="px-4 py-3">
              {result.error ? (
                <div className="text-sm text-red-600">
                  <p className="font-medium">Error: {result.error.message}</p>
                  {result.error.retryable && (
                    <p className="text-xs mt-1">This error may be temporary. Please try again.</p>
                  )}
                </div>
              ) : result.text ? (
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                  {result.text}
                </pre>
              ) : (
                <p className="text-sm text-gray-500 italic">No text detected</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator for remaining regions */}
      {isProcessing && results.length < regions.length && (
        <div className="flex items-center justify-center py-4 text-sm text-gray-600">
          <LoadingSpinner size="sm" className="mr-2" />
          Processing remaining regions...
        </div>
      )}
    </div>
  );
};

export default OCRResults;