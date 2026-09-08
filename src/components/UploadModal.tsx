import { useState } from 'react';
import type { ProcessingStatus, DocumentType, MedicalRecord } from '../types';
import { FileUpload } from './FileUpload';
import { FilePreview } from './FilePreview';
import { Button } from './Button';
import { Modal } from './Modal';
import { ocrService } from '../services/ocrService';
import { extractionService } from '../services/extractionService';
import type { OCRError } from '../services/ocrService';
import type { ExtractionError } from '../services/extractionService';

interface PendingFile {
  id: string;
  file: File;
  fileType: string;
  status: ProcessingStatus;
  error?: string;
  documentType: DocumentType;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onUploadComplete: (records: MedicalRecord[]) => void;
  existingFilenames: string[];
}

function getErrorMessage(error: unknown): string {
  if (isOCRError(error)) {
    return error.message;
  }
  if (isExtractionError(error)) {
    return error.message;
  }
  return 'Processing failed. Please try again.';
}

function isOCRError(error: unknown): error is OCRError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

function isExtractionError(error: unknown): error is ExtractionError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

export function UploadModal({ isOpen, onClose, patientId, onUploadComplete, existingFilenames }: UploadModalProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = (files: PendingFile[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDocumentTypeChange = (id: string, type: DocumentType) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, documentType: type } : f))
    );
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    const uploadedRecords: MedicalRecord[] = [];

    for (const file of pendingFiles) {
      try {
        console.log('Starting upload for:', file.file.name);
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' } : f))
        );

        const record: MedicalRecord = {
          id: crypto.randomUUID(),
          patientId,
          filename: file.file.name,
          documentType: file.documentType,
          fileType: file.fileType as any,
          fileSize: file.file.size,
          uploadedAt: new Date().toISOString(),
          recordDate: null,
          processingStatus: 'processing',
          source: 'upload',
        };

        uploadedRecords.push(record);
        console.log('Record created:', record.id);

        setPendingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' } : f))
        );

        console.log('Starting OCR for:', file.file.name);
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'ocr_processing' } : f))
        );

        const ocrResult = await ocrService.processFile(file.file);
        console.log('OCR completed, text length:', ocrResult.text.length, 'source:', ocrResult.source);

        record.extractedText = ocrResult.text;
        record.processingStatus = 'extracting';
        record.metadata = {
          ocrConfidence: ocrResult.confidence,
          ocrSource: ocrResult.source,
          processingTime: ocrResult.processingTime,
          pages: ocrResult.pages,
        };

        setPendingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'extracting' } : f))
        );

        console.log('Starting extraction for:', file.file.name);
        try {
          const extraction = await extractionService.extractMedicalInformation(
            ocrResult.text,
            record.id,
            ocrResult.pages
          );
          console.log('Extraction completed successfully');
          console.log('Extraction result:', extraction);

          // Calculate extraction quality metrics
          const totalEntities = extraction.symptoms.length +
                              extraction.diagnoses.length +
                              extraction.labResults.length +
                              extraction.medications.length +
                              extraction.procedures.length +
                              extraction.findings.length +
                              extraction.allergies.length +
                              extraction.referrals.length +
                              extraction.followUps.length +
                              extraction.investigationPlans.length +
                              extraction.outcomes.length +
                              extraction.medicalHistory.length;

          const extractionQuality = {
            totalEntities,
            symptoms: extraction.symptoms.length,
            diagnoses: extraction.diagnoses.length,
            labResults: extraction.labResults.length,
            medications: extraction.medications.length,
            procedures: extraction.procedures.length,
            findings: extraction.findings.length,
            allergies: extraction.allergies.length,
            referrals: extraction.referrals.length,
            followUps: extraction.followUps.length,
            investigationPlans: extraction.investigationPlans.length,
            outcomes: extraction.outcomes.length,
            medicalHistory: extraction.medicalHistory.length,
            hasPatientInfo: !!(extraction.patient.name || extraction.patient.age || extraction.patient.dateOfBirth),
            hasEncounterInfo: !!(extraction.encounter.date || extraction.encounter.type),
          };

          console.log('Extraction quality metrics:', extractionQuality);

          // Determine if extraction is complete enough
          const isComplete = totalEntities > 0 || extractionQuality.hasPatientInfo || extractionQuality.hasEncounterInfo;

          record.structuredExtraction = extraction;
          record.processingStatus = isComplete ? 'extracted' : 'extraction_incomplete';
          record.metadata = {
            ...record.metadata,
            extractionQuality,
            extractedAt: new Date().toISOString(),
          };

          if (!isComplete) {
            console.warn('Extraction incomplete - very few entities extracted');
            record.processingError = `Extraction completed but only ${totalEntities} entities found. Document may have limited medical information or extraction may be incomplete.`;
          }
        } catch (extractionError) {
          console.error('Extraction failed:', extractionError);
          console.error('Extraction error details:', JSON.stringify(extractionError, null, 2));

          // FALLBACK: Save record with OCR text even if extraction fails
          // This allows users to at least view the document
          record.processingStatus = 'extraction_failed';
          record.processingError = 'Structured extraction failed. OCR text is available but medical information could not be extracted. This may be due to an AI model issue or document format.';

          // Create minimal empty extraction to prevent crashes
          record.structuredExtraction = {
            patient: { name: null, age: null, sex: null, dateOfBirth: null, patientId: null },
            encounter: { date: null, type: null, facility: null, department: null, reason: null },
            symptoms: [],
            diagnoses: [],
            labResults: [],
            medications: [],
            procedures: [],
            findings: [],
            allergies: [],
            referrals: [],
            followUps: [],
            investigationPlans: [],
            outcomes: [],
            medicalHistory: [],
            sourceRecordId: record.id,
            extractedAt: new Date().toISOString(),
          };

          console.warn('Saved record with fallback empty extraction due to extraction failure');
        }

        setPendingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'uploaded' } : f))
        );
        console.log('Upload complete for:', file.file.name);
      } catch (error) {
        console.error('Upload failed for:', file.file.name, error);
        const errorMessage = getErrorMessage(error);
        console.error('Error message:', errorMessage);
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'failed', error: errorMessage }
              : f
          )
        );

        // Remove failed record from uploadedRecords so it doesn't get saved
        const failedIndex = uploadedRecords.findIndex(r => r.filename === file.file.name);
        if (failedIndex !== -1) {
          uploadedRecords.splice(failedIndex, 1);
        }
      }
    }

    console.log('All uploads complete, calling onUploadComplete with', uploadedRecords.length, 'records');
    setIsUploading(false);
    onUploadComplete(uploadedRecords);
    setPendingFiles([]);
    onClose();
  };

  const handleClose = () => {
    if (!isUploading) {
      setPendingFiles([]);
      onClose();
    }
  };

  const canUpload = pendingFiles.length > 0 && 
    pendingFiles.every((f) => f.status === 'ready' || f.status === 'failed') &&
    !isUploading;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Records">
      <div className="space-y-6">
        <FileUpload
          onFilesSelected={handleFilesSelected}
          existingFilenames={[...existingFilenames, ...pendingFiles.map((f) => f.file.name)]}
        />

        <FilePreview
          files={pendingFiles}
          onRemove={handleRemoveFile}
          onDocumentTypeChange={handleDocumentTypeChange}
        />

        {pendingFiles.length > 0 && (
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!canUpload}
            >
              {isUploading ? 'Uploading...' : `Upload ${pendingFiles.length} file${pendingFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
