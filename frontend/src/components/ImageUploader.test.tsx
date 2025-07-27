import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploader from './ImageUploader';

describe('ImageUploader', () => {
  const mockOnImageUpload = vi.fn();
  const defaultProps = {
    onImageUpload: mockOnImageUpload,
    isProcessing: false,
    supportedFormats: ['PNG', 'JPG', 'JPEG', 'WebP'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload interface', () => {
    render(<ImageUploader {...defaultProps} />);
    
    expect(screen.getByText(/drag and drop an image/i)).toBeDefined();
    expect(screen.getByText(/supported formats:/i)).toBeDefined();
    expect(screen.getByText(/maximum size:/i)).toBeDefined();
  });

  it('handles file selection via input', async () => {
    const user = userEvent.setup();
    render(<ImageUploader {...defaultProps} />);
    
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(input, file);
    
    expect(mockOnImageUpload).toHaveBeenCalledWith(file);
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    render(<ImageUploader {...defaultProps} />);
    
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(input, invalidFile);
    
    expect(mockOnImageUpload).not.toHaveBeenCalled();
    expect(screen.getByText(/invalid file type/i)).toBeDefined();
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    render(<ImageUploader {...defaultProps} />);
    
    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(input, largeFile);
    
    expect(mockOnImageUpload).not.toHaveBeenCalled();
    expect(screen.getByText(/file size exceeds limit/i)).toBeDefined();
  });

  it('handles drag and drop', async () => {
    render(<ImageUploader {...defaultProps} />);
    
    const dropZone = screen.getByText(/drag and drop an image/i).closest('div');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.dragEnter(dropZone!);
    expect(screen.getByText(/drop image here/i)).toBeDefined();
    
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    });
    
    await waitFor(() => {
      expect(mockOnImageUpload).toHaveBeenCalledWith(file);
    });
  });

  it('disables upload when processing', () => {
    render(<ImageUploader {...defaultProps} isProcessing={true} />);
    
    const dropZone = screen.getByText(/drag and drop an image/i).closest('div');
    expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed');
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('accepts JPEG files with jpg extension', async () => {
    const user = userEvent.setup();
    render(<ImageUploader {...defaultProps} />);
    
    const jpegFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(input, jpegFile);
    
    expect(mockOnImageUpload).toHaveBeenCalledWith(jpegFile);
  });
});