import type { MedicalRecord } from '../types';
import { Modal } from './Modal';
import { formatFileSize } from '../utils/fileValidation';

interface RecordDetailProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord;
}

export function RecordDetail({ isOpen, onClose, record }: RecordDetailProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={record.filename}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-text-tertiary">Document Type</span>
            <p className="text-text-primary font-medium">{record.documentType}</p>
          </div>
          <div>
            <span className="text-sm text-text-tertiary">File Type</span>
            <p className="text-text-primary font-medium">{record.fileType}</p>
          </div>
          <div>
            <span className="text-sm text-text-tertiary">File Size</span>
            <p className="text-text-primary font-medium">{formatFileSize(record.fileSize)}</p>
          </div>
          <div>
            <span className="text-sm text-text-tertiary">Upload Date</span>
            <p className="text-text-primary font-medium">
              {new Date(record.uploadedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-sm text-text-tertiary">Record Date</span>
            <p className="text-text-primary font-medium">
              {record.recordDate
                ? new Date(record.recordDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Not extracted yet'}
            </p>
          </div>
          <div>
            <span className="text-sm text-text-tertiary">Processing Status</span>
            <p className="text-text-primary font-medium capitalize">{record.processingStatus}</p>
          </div>
        </div>

        {record.description && (
          <div>
            <span className="text-sm text-text-tertiary">Description</span>
            <p className="text-text-primary">{record.description}</p>
          </div>
        )}

        {record.processingError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-sm text-red-800 font-medium">Error</span>
            <p className="text-red-700 text-sm">{record.processingError}</p>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <span className="text-sm text-text-tertiary">Extracted Text</span>
          <div className="mt-2 p-4 bg-background border border-border rounded-lg">
            {record.processingStatus === 'processing' || record.processingStatus === 'extracting' ? (
              <p className="text-text-secondary text-sm">
                {record.processingStatus === 'extracting' ? 'Extracting medical information...' : 'Processing document...'}
              </p>
            ) : record.processingStatus === 'failed' ? (
              <p className="text-red-600 text-sm">Text extraction failed. {record.processingError}</p>
            ) : record.extractedText ? (
              <div className="text-text-primary text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                {record.extractedText}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">No text extracted yet.</p>
            )}
          </div>
          {record.metadata && (
            <div className="mt-2 text-xs text-text-tertiary">
              {record.metadata.ocrSource === 'pdf-text' ? 'Text extracted from PDF' : 'OCR processed'} · 
              Confidence: {Math.round((record.metadata.ocrConfidence as number) * 100)}%
            </div>
          )}
        </div>

        {record.structuredExtraction && (
          <div className="pt-4 border-t border-border">
            <span className="text-sm text-text-tertiary">Extracted Information</span>
            <div className="mt-2 space-y-4">
              {record.structuredExtraction.symptoms.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-text-primary">Symptoms</span>
                  <div className="mt-1 space-y-1">
                    {record.structuredExtraction.symptoms.map((symptom, idx) => (
                      <div key={idx} className="text-sm text-text-secondary">
                        {symptom.name}
                        {symptom.certainty !== 'present' && (
                          <span className="text-text-tertiary ml-2">({symptom.certainty})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {record.structuredExtraction.labResults.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-text-primary">Lab Results</span>
                  <div className="mt-1 space-y-1">
                    {record.structuredExtraction.labResults.map((lab, idx) => (
                      <div key={idx} className="text-sm text-text-secondary">
                        {lab.testName} — {lab.value} {lab.unit}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {record.structuredExtraction.medications.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-text-primary">Medications</span>
                  <div className="mt-1 space-y-1">
                    {record.structuredExtraction.medications.map((med, idx) => (
                      <div key={idx} className="text-sm text-text-secondary">
                        {med.name}
                        {med.dosage && <span> — {med.dosage}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {record.structuredExtraction.diagnoses.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-text-primary">Diagnoses</span>
                  <div className="mt-1 space-y-1">
                    {record.structuredExtraction.diagnoses.map((diag, idx) => (
                      <div key={idx} className="text-sm text-text-secondary">
                        {diag.name}
                        {diag.certainty !== 'confirmed' && (
                          <span className="text-text-tertiary ml-2">({diag.certainty})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {record.structuredExtraction.symptoms.length === 0 &&
               record.structuredExtraction.labResults.length === 0 &&
               record.structuredExtraction.medications.length === 0 &&
               record.structuredExtraction.diagnoses.length === 0 && (
                <p className="text-sm text-text-secondary">No structured information extracted.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
