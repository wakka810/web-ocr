import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RegionSelector from './RegionSelector';
import { Region } from '@/types';

describe('RegionSelector', () => {
  const mockOnRegionsChange = vi.fn();
  const defaultProps = {
    imageUrl: 'test-image.jpg',
    regions: [],
    onRegionsChange: mockOnRegionsChange,
    isProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders region selector interface', () => {
    render(<RegionSelector {...defaultProps} />);
    
    expect(screen.getByText('Select All')).toBeDefined();
    expect(screen.getByText('Clear All')).toBeDefined();
    expect(screen.getByText(/click and drag to select regions/i)).toBeDefined();
  });

  it('displays regions list when regions exist', () => {
    const regions: Region[] = [
      { id: '1', x: 0, y: 0, width: 100, height: 100, color: '#3B82F6' },
      { id: '2', x: 100, y: 100, width: 100, height: 100, color: '#10B981' },
    ];
    
    render(<RegionSelector {...defaultProps} regions={regions} />);
    
    expect(screen.getByText('Selected Regions (2)')).toBeDefined();
    expect(screen.getByText('Region 1')).toBeDefined();
    expect(screen.getByText('Region 2')).toBeDefined();
  });

  it('calls onRegionsChange when Select All is clicked', () => {
    render(<RegionSelector {...defaultProps} />);
    
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);
    
    expect(mockOnRegionsChange).toHaveBeenCalled();
  });

  it('calls onRegionsChange when Clear All is clicked', () => {
    const regions: Region[] = [
      { id: '1', x: 0, y: 0, width: 100, height: 100, color: '#3B82F6' },
    ];
    
    render(<RegionSelector {...defaultProps} regions={regions} />);
    
    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);
    
    expect(mockOnRegionsChange).toHaveBeenCalledWith([]);
  });

  it('disables buttons when processing', () => {
    render(<RegionSelector {...defaultProps} isProcessing={true} />);
    
    expect(screen.getByText('Select All')).toHaveProperty('disabled', true);
    expect(screen.getByText('Clear All')).toHaveProperty('disabled', true);
  });

  it('shows delete button when region is selected', () => {
    const regions: Region[] = [
      { id: '1', x: 0, y: 0, width: 100, height: 100, color: '#3B82F6' },
    ];
    
    render(<RegionSelector {...defaultProps} regions={regions} />);
    
    // Click on a region to select it
    const regionTag = screen.getByText('Region 1');
    fireEvent.click(regionTag);
    
    expect(screen.getByText('Delete Selected')).toBeDefined();
  });

  it('shows instruction to select region when no regions exist', () => {
    render(<RegionSelector {...defaultProps} />);
    
    expect(screen.getByText(/select at least one region to process/i)).toBeDefined();
  });
});