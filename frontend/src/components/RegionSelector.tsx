import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Region } from '@/types';

interface RegionSelectorProps {
  imageUrl: string;
  regions: Region[];
  onRegionsChange: (regions: Region[]) => void;
  isProcessing: boolean;
}

interface Point {
  x: number;
  y: number;
}

const REGION_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

const RegionSelector: React.FC<RegionSelectorProps> = ({
  imageUrl,
  regions,
  onRegionsChange,
  isProcessing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentRect, setCurrentRect] = useState<Region | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale] = useState(1);

  // Generate unique ID for regions
  const generateRegionId = () => `region_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get color for region based on index
  const getRegionColor = (index: number) => REGION_COLORS[index % REGION_COLORS.length];

  // Update canvas size when image loads or window resizes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (imageRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const naturalWidth = imageRef.current.naturalWidth;
        const naturalHeight = imageRef.current.naturalHeight;
        
        // Ensure we have valid dimensions
        if (naturalWidth === 0 || naturalHeight === 0) {
          return;
        }
        
        const imageAspectRatio = naturalWidth / naturalHeight;
        
        const canvasWidth = containerWidth;
        const canvasHeight = canvasWidth / imageAspectRatio;
        
        // Ensure canvas dimensions are valid numbers
        if (isNaN(canvasWidth) || isNaN(canvasHeight) || canvasWidth <= 0 || canvasHeight <= 0) {
          return;
        }
        
        const scale = canvasWidth / naturalWidth;
        
        setCanvasSize({ width: canvasWidth, height: canvasHeight });
        setImageScale(scale);
      }
    };

    const img = new Image();
    img.onload = updateCanvasSize;
    img.src = imageUrl;

    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [imageUrl]);

  // Draw regions on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing regions
    regions.forEach((region, index) => {
      const color = region.color || getRegionColor(index);
      const isSelected = region.id === selectedRegionId;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(isSelected ? [5, 5] : []);
      
      const scaledX = region.x * imageScale;
      const scaledY = region.y * imageScale;
      const scaledWidth = region.width * imageScale;
      const scaledHeight = region.height * imageScale;
      
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      
      // Draw region label
      ctx.fillStyle = color;
      ctx.fillRect(scaledX, scaledY - 20, 60, 20);
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Region ${index + 1}`, scaledX + 5, scaledY - 5);
      
      ctx.setLineDash([]);
    });

    // Draw current drawing rectangle
    if (currentRect && isDrawing) {
      ctx.strokeStyle = getRegionColor(regions.length);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      const scaledX = currentRect.x * imageScale;
      const scaledY = currentRect.y * imageScale;
      const scaledWidth = currentRect.width * imageScale;
      const scaledHeight = currentRect.height * imageScale;
      
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      ctx.setLineDash([]);
    }
  }, [regions, currentRect, isDrawing, selectedRegionId, imageScale]);

  // Get coordinates relative to canvas
  const getRelativeCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / imageScale,
      y: (clientY - rect.top) / imageScale,
    };
  }, [imageScale]);

  // Check if a point is inside a region
  const isPointInRegion = (point: Point, region: Region): boolean => {
    return point.x >= region.x &&
           point.x <= region.x + region.width &&
           point.y >= region.y &&
           point.y <= region.y + region.height;
  };

  // Handle mouse/touch down
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isProcessing) return;

    const point = getRelativeCoordinates(e);
    
    // Check if clicking on existing region
    const clickedRegion = regions.find(region => isPointInRegion(point, region));
    
    if (clickedRegion) {
      setSelectedRegionId(clickedRegion.id);
    } else {
      setSelectedRegionId(null);
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentRect({
        id: generateRegionId(),
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        color: getRegionColor(regions.length),
      });
    }
  }, [isProcessing, getRelativeCoordinates, regions]);

  // Handle mouse/touch move
  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPoint) return;

    const currentPoint = getRelativeCoordinates(e);
    
    const newRect: Region = {
      id: currentRect?.id || generateRegionId(),
      x: Math.min(startPoint.x, currentPoint.x),
      y: Math.min(startPoint.y, currentPoint.y),
      width: Math.abs(currentPoint.x - startPoint.x),
      height: Math.abs(currentPoint.y - startPoint.y),
      color: currentRect?.color || getRegionColor(regions.length),
    };

    setCurrentRect(newRect);
  }, [isDrawing, startPoint, currentRect, getRelativeCoordinates, regions.length]);

  // Handle mouse/touch up
  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentRect) return;

    // Only add region if it has meaningful size (at least 10x10 pixels)
    if (currentRect.width > 10 && currentRect.height > 10) {
      onRegionsChange([...regions, currentRect]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  }, [isDrawing, currentRect, regions, onRegionsChange]);

  // Handle region deletion
  const handleDeleteRegion = useCallback((regionId: string) => {
    onRegionsChange(regions.filter(r => r.id !== regionId));
    setSelectedRegionId(null);
  }, [regions, onRegionsChange]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (imageRef.current) {
      const fullImageRegion: Region = {
        id: generateRegionId(),
        x: 0,
        y: 0,
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
        color: getRegionColor(0),
        label: 'Full Image',
      };
      onRegionsChange([fullImageRegion]);
    }
  }, [onRegionsChange]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onRegionsChange([]);
    setSelectedRegionId(null);
  }, [onRegionsChange]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSelectAll}
          disabled={isProcessing}
          className="btn-secondary text-sm"
        >
          Select All
        </button>
        <button
          onClick={handleClearAll}
          disabled={isProcessing || regions.length === 0}
          className="btn-secondary text-sm"
        >
          Clear All
        </button>
        {selectedRegionId && (
          <button
            onClick={() => handleDeleteRegion(selectedRegionId)}
            disabled={isProcessing}
            className="btn-secondary text-sm text-red-600 hover:text-red-700"
          >
            Delete Selected
          </button>
        )}
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="relative bg-gray-100 rounded-lg overflow-hidden">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Source"
          className="w-full h-auto"
          style={{ display: 'block' }}
        />
        <canvas
          ref={canvasRef}
          width={canvasSize.width || 0}
          height={canvasSize.height || 0}
          className="absolute top-0 left-0 cursor-crosshair"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{ 
            cursor: isProcessing ? 'not-allowed' : 'crosshair',
            display: canvasSize.width > 0 && canvasSize.height > 0 ? 'block' : 'none',
          }}
        />
      </div>

      {/* Region list */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Selected Regions ({regions.length})</h3>
          <div className="flex flex-wrap gap-2">
            {regions.map((region, index) => (
              <div
                key={region.id}
                className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-opacity ${
                  selectedRegionId === region.id ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: region.color || getRegionColor(index),
                  color: 'white',
                }}
                onClick={() => setSelectedRegionId(region.id)}
              >
                Region {index + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-sm text-gray-600">
        Click and drag to select regions for text extraction. 
        {regions.length === 0 && ' Select at least one region to process.'}
      </p>
    </div>
  );
};

export default RegionSelector;