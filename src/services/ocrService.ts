import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface OCRResult {
  text: string;
  pages: Array<{ pageNumber: number; text: string }>;
  confidence: number;
  source: 'pdf-text' | 'ocr';
  processingTime: number;
}

export interface OCRError {
  message: string;
  code: 'UNSUPPORTED_TYPE' | 'PDF_ERROR' | 'OCR_ERROR' | 'EMPTY_RESULT' | 'FILE_TOO_LARGE';
}

export class OCRService {
  private static instance: OCRService;

  private constructor() {}

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async processFile(file: File, onProgress?: (progress: number) => void): Promise<OCRResult> {
    try {
      if (file.type === 'application/pdf') {
        return await this.processPDF(file, onProgress);
      } else if (file.type.startsWith('image/')) {
        return await this.processImage(file, onProgress);
      } else {
        throw {
          message: 'Unsupported file type for OCR',
          code: 'UNSUPPORTED_TYPE',
        } as OCRError;
      }
    } catch (error) {
      if (this.isOCRError(error)) {
        throw error;
      }
      throw {
        message: 'OCR processing failed',
        code: 'OCR_ERROR',
      } as OCRError;
    }
  }

  private async processPDF(file: File, onProgress?: (progress: number) => void): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      const pages: Array<{ pageNumber: number; text: string }> = [];
      let hasSelectableText = false;

      for (let i = 1; i <= pdf.numPages; i++) {
        if (onProgress) {
          onProgress((i / pdf.numPages) * 50);
        }

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        if (textContent.items.length > 0) {
          hasSelectableText = true;
          const pageText = textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ')
            .trim();
          fullText += pageText + '\n\n';
          pages.push({ pageNumber: i, text: pageText });
        }
      }

      // Check text quality
      const textQuality = this.assessTextQuality(fullText);
      console.log('[OCRService] Text quality assessment:', textQuality);

      if (hasSelectableText && textQuality.isUsable) {
        const cleanedText = this.cleanText(fullText);
        if (cleanedText.trim().length === 0) {
          throw {
            message: 'No readable text could be extracted from this PDF',
            code: 'EMPTY_RESULT',
          } as OCRError;
        }

        return {
          text: cleanedText,
          pages: pages.map(p => ({ ...p, text: this.cleanText(p.text) })),
          confidence: textQuality.qualityScore,
          source: 'pdf-text',
          processingTime: Date.now() - startTime,
        };
      }

      console.log('[OCRService] Text quality insufficient, falling back to OCR');
      onProgress?.(50);
      return await this.ocrPDF(file, onProgress);
    } catch (error) {
      if (this.isOCRError(error)) {
        throw error;
      }
      throw {
        message: 'Failed to process PDF',
        code: 'PDF_ERROR',
      } as OCRError;
    }
  }

  private async ocrPDF(file: File, onProgress?: (progress: number) => void): Promise<OCRResult> {
    try {
      const ocrResult = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(50 + m.progress * 50);
          }
        },
      });

      const cleanedText = this.cleanText(ocrResult.data.text);
      if (cleanedText.trim().length === 0) {
        throw {
          message: 'OCR could not extract readable text from this document',
          code: 'EMPTY_RESULT',
        } as OCRError;
      }

      // For OCR, we don't have page-level granularity from Tesseract on PDFs
      // So we treat the entire result as a single page
      return {
        text: cleanedText,
        pages: [{ pageNumber: 1, text: cleanedText }],
        confidence: ocrResult.data.confidence,
        source: 'ocr',
        processingTime: 0,
      };
    } catch (error) {
      throw {
        message: 'OCR processing failed for PDF',
        code: 'OCR_ERROR',
      } as OCRError;
    }
  }

  private async processImage(file: File, onProgress?: (progress: number) => void): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(m.progress * 100);
          }
        },
      });

      const cleanedText = this.cleanText(result.data.text);
      if (cleanedText.trim().length === 0) {
        throw {
          message: 'OCR could not extract readable text from this image',
          code: 'EMPTY_RESULT',
        } as OCRError;
      }

      return {
        text: cleanedText,
        pages: [{ pageNumber: 1, text: cleanedText }],
        confidence: result.data.confidence,
        source: 'ocr',
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw {
        message: 'OCR processing failed for image',
        code: 'OCR_ERROR',
      } as OCRError;
    }
  }

  /**
   * Assess the quality of extracted text to determine if it's usable
   */
  private assessTextQuality(text: string): { isUsable: boolean; qualityScore: number; reason: string } {
    const trimmedText = text.trim();
    const characterCount = trimmedText.length;
    
    // Minimum character threshold
    if (characterCount < 100) {
      return { isUsable: false, qualityScore: 0, reason: 'Text too short (< 100 chars)' };
    }

    // Count meaningful words (sequences of letters)
    const words = trimmedText.match(/\b[a-zA-Z]{3,}\b/g) || [];
    const wordCount = words.length;
    
    if (wordCount < 10) {
      return { isUsable: false, qualityScore: 0.3, reason: 'Too few meaningful words (< 10)' };
    }

    // Check for medical document structure indicators
    const hasMedicalStructure = this.hasMedicalStructure(trimmedText);
    
    // Check for common document structure indicators
    const hasGeneralStructure = 
      trimmedText.includes(':') || 
      trimmedText.includes('\n') ||
      /[A-Z][a-z]+:/.test(trimmedText);
    
    // Calculate quality score based on word density and structure
    const wordDensity = wordCount / characterCount;
    let qualityScore = 0.5;
    
    if (wordDensity > 0.3) qualityScore += 0.2;
    if (hasMedicalStructure) qualityScore += 0.3; // Medical structure is more important
    else if (hasGeneralStructure) qualityScore += 0.2;
    if (wordCount > 50) qualityScore += 0.1;
    
    // Check for gibberish (too many special characters relative to letters)
    const letterCount = (trimmedText.match(/[a-zA-Z]/g) || []).length;
    const specialCharCount = (trimmedText.match(/[^a-zA-Z0-9\s]/g) || []).length;
    
    if (specialCharCount > letterCount * 0.5) {
      qualityScore -= 0.3;
    }

    qualityScore = Math.max(0, Math.min(1, qualityScore));
    
    // Higher threshold for medical documents - need good structure
    const isUsable = qualityScore >= 0.6;
    const reason = isUsable ? 'Text quality acceptable for medical extraction' : `Low quality score (${qualityScore.toFixed(2)}) - may need OCR`;
    
    return { isUsable, qualityScore, reason };
  }

  /**
   * Check if text has medical document structure
   */
  private hasMedicalStructure(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Medical section headers
    const medicalSections = [
      'patient', 'chief complaint', 'history', 'medication', 'diagnosis', 
      'assessment', 'plan', 'vitals', 'lab', 'physical exam', 'finding',
      'symptom', 'treatment', 'procedure', 'consultation'
    ];
    
    const hasMedicalSection = medicalSections.some(section => 
      lowerText.includes(section) || new RegExp(section + ':', 'i').test(text)
    );
    
    // Medical data patterns
    const hasMedicalData = 
      /\d{2,3}\/\d{2,3}\s*(mmhg|bpm)/i.test(text) || // BP/HR
      /\d+\.\d+\s*(mg|ml|mcg|g|l)/i.test(text) || // Lab values
      /bmi|bp|hr|temp|temperature/i.test(text); // Vitals
    
    return hasMedicalSection || hasMedicalData;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
  }

  private isOCRError(error: unknown): error is OCRError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'code' in error
    );
  }
}

export const ocrService = OCRService.getInstance();
