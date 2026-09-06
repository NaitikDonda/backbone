import type { FileType } from '../types';

const ALLOWED_FILE_TYPES: FileType[] = ['PDF', 'PNG', 'JPG', 'JPEG'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_TYPE_MAP: Record<string, FileType> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPG',
};

const EXTENSION_MAP: Record<string, FileType> = {
  '.pdf': 'PDF',
  '.png': 'PNG',
  '.jpg': 'JPG',
  '.jpeg': 'JPEG',
};

export interface FileValidationError {
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'DUPLICATE_NAME';
  message: string;
}

export function getFileType(file: File): FileType | null {
  const mimeType = MIME_TYPE_MAP[file.type];
  if (mimeType) return mimeType;

  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return EXTENSION_MAP[extension] || null;
}

export function validateFile(
  file: File,
  existingFilenames: string[]
): FileValidationError | null {
  const fileType = getFileType(file);
  
  if (!fileType || !ALLOWED_FILE_TYPES.includes(fileType)) {
    return {
      code: 'INVALID_TYPE',
      message: `Unsupported file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  if (existingFilenames.includes(file.name)) {
    return {
      code: 'DUPLICATE_NAME',
      message: 'A file with this name already exists in the upload queue',
    };
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
