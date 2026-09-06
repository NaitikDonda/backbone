import { useState } from 'react';
import { UploadModal } from '../components/UploadModal';
import { useRecordStorage } from '../hooks/useRecordStorage';
import { mockPatient } from '../data/mockData';
import type { MedicalRecord } from '../types';
import { formatDate } from '../utils/dataFormatting';

export function Records() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  
  const { records, addRecord } = useRecordStorage(mockPatient.id);

  const handleUploadComplete = (newRecords: MedicalRecord[]) => {
    newRecords.forEach((record) => {
      addRecord(record);
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ready: 'bg-text-tertiary',
      uploading: 'bg-info',
      processing: 'bg-info',
      ocr_processing: 'bg-info',
      extracting: 'bg-info',
      extracted: 'bg-success',
      extraction_failed: 'bg-error',
      failed: 'bg-error',
    };
    return colors[status] || 'bg-text-tertiary';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ready: 'Ready',
      uploading: 'Uploading',
      processing: 'Processing',
      ocr_processing: 'OCR Processing',
      extracting: 'Extracting',
      extracted: 'Extracted',
      extraction_failed: 'Extraction Failed',
      failed: 'Failed',
    };
    return labels[status] || status;
  };

  const hasRecords = records.length > 0;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-display text-text-primary mb-4">Records</h1>
        <p className="text-h2 text-text-secondary font-light mb-8">
          Source documents and extraction status
        </p>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn btn-primary"
        >
          Upload Document
        </button>
      </div>

      {!hasRecords && (
        <div className="text-center py-24">
          <div className="text-6xl mb-6 text-text-muted">□</div>
          <h2 className="text-h2 text-text-primary mb-4">No Records Yet</h2>
          <p className="text-body-large text-text-secondary mb-8 max-w-xl mx-auto">
            Upload medical documents to begin the health investigation. BACKBONE supports PDF, PNG, and JPG formats.
          </p>
        </div>
      )}

      {hasRecords && (
        <div className="space-y-8">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden"
            >
              <div
                className="p-8 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-h3 text-text-primary">{record.filename}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(record.processingStatus)}`} />
                        <span className="text-body text-text-tertiary">
                          {getStatusLabel(record.processingStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-body text-text-tertiary">
                      <span>{record.documentType}</span>
                      <span>•</span>
                      <span>{(record.fileSize / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{formatDate(record.uploadedAt)}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 text-text-tertiary transition-transform duration-base ml-6 flex-shrink-0 ${
                      selectedRecord?.id === record.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {selectedRecord?.id === record.id && (
                <div className="border-t border-border-light p-8 bg-background">
                  <div className="space-y-8">
                    {/* Extraction status */}
                    <div>
                      <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">Extraction Status</p>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`w-3 h-3 rounded-full ${getStatusColor(record.processingStatus)}`} />
                        <span className="text-body text-text-secondary">
                          {getStatusLabel(record.processingStatus)}
                        </span>
                      </div>
                      {record.processingError && (
                        <p className="text-body text-error">{record.processingError}</p>
                      )}
                    </div>

                    {/* Document details */}
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">Document Type</p>
                        <p className="text-body text-text-secondary">{record.documentType}</p>
                      </div>
                      <div>
                        <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">File Size</p>
                        <p className="text-body text-text-secondary">{(record.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                      {record.recordDate && (
                        <div>
                          <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">Record Date</p>
                          <p className="text-body text-text-secondary">{formatDate(record.recordDate)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">Uploaded</p>
                        <p className="text-body text-text-secondary">{formatDate(record.uploadedAt)}</p>
                      </div>
                    </div>

                    {/* Extracted text preview */}
                    {record.extractedText && (
                      <div>
                        <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">Extracted Text</p>
                        <p className="text-body-large text-text-secondary leading-relaxed">
                          {record.extractedText.substring(0, 500)}
                          {record.extractedText.length > 500 && '...'}
                        </p>
                      </div>
                    )}

                    {/* Structured extraction */}
                    {record.structuredExtraction && (
                      <div>
                        <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">Structured Extraction</p>
                        <div className="grid grid-cols-4 gap-6">
                          <div className="bg-surface rounded-lg border border-border-light p-4">
                            <div className="text-h3 text-text-primary mb-1">
                              {record.structuredExtraction.symptoms?.length || 0}
                            </div>
                            <div className="text-small text-text-tertiary">Symptoms</div>
                          </div>
                          <div className="bg-surface rounded-lg border border-border-light p-4">
                            <div className="text-h3 text-text-primary mb-1">
                              {record.structuredExtraction.diagnoses?.length || 0}
                            </div>
                            <div className="text-small text-text-tertiary">Diagnoses</div>
                          </div>
                          <div className="bg-surface rounded-lg border border-border-light p-4">
                            <div className="text-h3 text-text-primary mb-1">
                              {record.structuredExtraction.labResults?.length || 0}
                            </div>
                            <div className="text-small text-text-tertiary">Laboratory</div>
                          </div>
                          <div className="bg-surface rounded-lg border border-border-light p-4">
                            <div className="text-h3 text-text-primary mb-1">
                              {record.structuredExtraction.medications?.length || 0}
                            </div>
                            <div className="text-small text-text-tertiary">Medications</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        patientId={mockPatient.id}
        onUploadComplete={handleUploadComplete}
        existingFilenames={records.map((r) => r.filename)}
      />
    </div>
  );
}
