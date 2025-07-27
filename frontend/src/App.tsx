import { useState, useEffect } from 'react'
import ImageUploader from '@/components/ImageUploader'
import MobileCameraCapture from '@/components/MobileCameraCapture'
import RegionSelector from '@/components/RegionSelector'
import OCRResults from '@/components/OCRResults'
import ProcessingStatus from '@/components/ProcessingStatus'
import ResponsiveLayout, { ResponsiveContainer, ResponsiveCard } from '@/components/ResponsiveLayout'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useOCRProcessing } from '@/hooks/useOCRProcessing'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { ImageData, Region } from '@/types'

const SUPPORTED_FORMATS = ['PNG', 'JPG', 'JPEG', 'WebP'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function App() {
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const { uploadImage, isUploading, error: uploadError } = useImageUpload();
  const { 
    processOCR, 
    results, 
    isProcessing, 
    error: ocrError, 
    clearResults 
  } = useOCRProcessing();
  const isMobile = useIsMobile();

  const handleImageUpload = async (file: File) => {
    const imageData = await uploadImage(file);
    if (imageData) {
      setCurrentImage(imageData);
      setRegions([]); // Clear regions when new image is uploaded
      clearResults(); // Clear previous OCR results
    }
  };

  const handleProcessOCR = async () => {
    if (!currentImage || regions.length === 0) return;
    
    await processOCR(currentImage.id, regions);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearResults();
    };
  }, [clearResults]);

  return (
    <ResponsiveLayout>
      <header className="bg-white shadow">
        <ResponsiveContainer className="py-4 sm:py-6">
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Gemini OCR Web Tool
          </h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-600">
            Extract text from images using AI-powered OCR
          </p>
        </ResponsiveContainer>
      </header>
      <main>
        <ResponsiveContainer className="py-4 sm:py-8">
          {!currentImage ? (
            // Upload view
            <div className="max-w-2xl mx-auto">
              <ResponsiveCard>
                <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Upload Image
                </h2>
                
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  isProcessing={isUploading}
                  supportedFormats={SUPPORTED_FORMATS}
                  maxFileSize={MAX_FILE_SIZE}
                />

                <MobileCameraCapture
                  onCapture={handleImageUpload}
                  isProcessing={isUploading}
                  supportedFormats={SUPPORTED_FORMATS}
                />

                {uploadError && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">{uploadError}</p>
                  </div>
                )}
              </ResponsiveCard>
            </div>
          ) : (
            // Region selection and processing view
            <div className="space-y-4 sm:space-y-6">
              <ResponsiveCard>
                <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'} mb-4`}>
                  <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    Select Regions
                  </h2>
                  <button
                    onClick={() => {
                      setCurrentImage(null);
                      setRegions([]);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Upload New Image
                  </button>
                </div>
                
                <RegionSelector
                  imageUrl={currentImage.url}
                  regions={regions}
                  onRegionsChange={setRegions}
                  isProcessing={isProcessing}
                />

                <div className={`mt-4 sm:mt-6 flex ${isMobile ? 'w-full' : 'justify-end'}`}>
                  <button
                    onClick={handleProcessOCR}
                    disabled={regions.length === 0 || isProcessing}
                    className={`btn-primary ${isMobile ? 'w-full' : ''}`}
                  >
                    {isProcessing ? 'Processing...' : 'Extract Text'}
                  </button>
                </div>
              </ResponsiveCard>

              {/* Processing status */}
              {(isProcessing || ocrError) && (
                <ResponsiveCard>
                  <ProcessingStatus
                    status={ocrError ? 'error' : isProcessing ? 'processing' : 'idle'}
                    progress={isProcessing && results.length > 0 ? {
                      current: results.length,
                      total: regions.length
                    } : undefined}
                    message={ocrError || undefined}
                  />
                </ResponsiveCard>
              )}

              {/* Results section */}
              <ResponsiveCard>
                <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Results
                </h2>
                <OCRResults
                  results={results}
                  regions={regions}
                  isProcessing={isProcessing}
                />
              </ResponsiveCard>
            </div>
          )}
        </ResponsiveContainer>
      </main>
    </ResponsiveLayout>
  )
}

export default App