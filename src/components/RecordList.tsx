import type { MedicalRecord } from '../types';

interface RecordListProps {
  records: MedicalRecord[];
  onRecordClick?: (record: MedicalRecord) => void;
}

export function RecordList({ records, onRecordClick }: RecordListProps) {
  const getStatusColor = (status: MedicalRecord['processingStatus']) => {
    switch (status) {
      case 'uploaded':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record.id}
          onClick={() => onRecordClick?.(record)}
          className={`bg-surface border border-border rounded-lg p-5 transition-colors duration-200 ${
            onRecordClick ? 'hover:border-text-tertiary cursor-pointer' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium text-text-primary">{record.filename}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(record.processingStatus)}`}>
                  {record.processingStatus}
                </span>
              </div>
              <div className="text-sm text-text-secondary mb-2">
                {record.documentType !== 'Unknown' && (
                  <span className="mr-3">{record.documentType}</span>
                )}
                <span className="text-text-tertiary">{record.fileType} · {formatFileSize(record.fileSize)}</span>
              </div>
              <p className="text-text-tertiary text-sm">
                Uploaded {new Date(record.uploadedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
