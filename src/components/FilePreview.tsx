import type { ProcessingStatus, DocumentType } from '../types';
import { formatFileSize } from '../utils/fileValidation';

interface PendingFile {
  id: string;
  file: File;
  fileType: string;
  status: ProcessingStatus;
  error?: string;
  documentType: DocumentType;
}

interface FilePreviewProps {
  files: PendingFile[];
  onRemove: (id: string) => void;
  onDocumentTypeChange: (id: string, type: DocumentType) => void;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'Lab Report',
  'Prescription',
  'Diagnosis',
  'Discharge Summary',
  'Consultation Note',
  'Imaging Report',
  'Hospital Visit',
  'Other',
  'Unknown',
];

export function FilePreview({ files, onRemove, onDocumentTypeChange }: FilePreviewProps) {
  const getStatusText = (status: ProcessingStatus): string => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'uploading': return 'Uploading...';
      case 'uploaded': return 'Uploaded';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
    }
  };

  const getStatusColor = (status: ProcessingStatus): string => {
    switch (status) {
      case 'ready': return 'text-text-tertiary';
      case 'uploading': return 'text-blue-600';
      case 'uploaded': return 'text-green-600';
      case 'processing': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm text-text-tertiary">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-surface border border-border rounded-lg p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-text-primary truncate">{file.file.name}</p>
                <span className={`text-sm ${getStatusColor(file.status)}`}>
                  {getStatusText(file.status)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <span>{file.fileType}</span>
                <span>·</span>
                <span>{formatFileSize(file.file.size)}</span>
              </div>
              {file.error && (
                <p className="text-sm text-red-600 mt-1">{file.error}</p>
              )}
              <div className="mt-2">
                <select
                  value={file.documentType}
                  onChange={(e) => onDocumentTypeChange(file.id, e.target.value as DocumentType)}
                  className="text-sm border border-border rounded px-2 py-1 bg-background text-text-primary"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === 'Unknown' ? 'Select document type...' : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => onRemove(file.id)}
              className="text-text-tertiary hover:text-text-primary transition-colors p-1"
              disabled={file.status === 'uploading'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
