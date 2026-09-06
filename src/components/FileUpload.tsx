import { useState, useRef } from 'react';
import type { FileType, ProcessingStatus, DocumentType } from '../types';
import { validateFile, type FileValidationError } from '../utils/fileValidation';

interface PendingFile {
  id: string;
  file: File;
  fileType: FileType;
  status: ProcessingStatus;
  error?: string;
  documentType: DocumentType;
}

interface FileUploadProps {
  onFilesSelected: (files: PendingFile[]) => void;
  existingFilenames: string[];
}

export function FileUpload({ onFilesSelected, existingFilenames }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: PendingFile[] = [];
    const errors: FileValidationError[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file, existingFilenames);
      
      if (validation) {
        errors.push(validation);
      } else {
        validFiles.push({
          id: crypto.randomUUID(),
          file,
          fileType: getFileType(file),
          status: 'ready',
          documentType: 'Unknown',
        });
      }
    });

    if (errors.length > 0) {
      errors.forEach((error) => {
        console.error(error.message);
      });
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const getFileType = (file: File): FileType => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (extension === '.pdf') return 'PDF';
    if (extension === '.png') return 'PNG';
    if (extension === '.jpg' || extension === '.jpeg') return 'JPG';
    return 'PDF';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
          ${isDragging ? 'border-accent bg-background' : 'border-border hover:border-text-tertiary'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <div className="space-y-2">
          <p className="text-text-primary font-medium">Select files</p>
          <p className="text-text-secondary text-sm">
            Add reports, prescriptions, lab results, or other medical documents.
          </p>
          <p className="text-text-tertiary text-xs">
            PDF, PNG, JPG, JPEG · Max 10MB per file
          </p>
        </div>
      </div>
    </div>
  );
}
