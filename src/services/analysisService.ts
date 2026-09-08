import type { MedicalEvent, Pattern, ClinicalSignal } from '../types';
import { OllamaService } from './ollamaService';
import { ContextBuilderService } from './contextBuilderService';
import { EvidenceValidationService, type ModelSignalResponse } from './evidenceValidationService';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from './systemPrompt';

export interface AnalysisResult {
  signals: ClinicalSignal[];
  summary: string;
  success: boolean;
  error?: string;
  modelName: string;
  generatedAt: string;
  validationErrors?: string[];
}

export class AnalysisService {
  private static instance: AnalysisService;
  private ollamaService: OllamaService;
  private contextBuilder: ContextBuilderService;
  private evidenceValidator: EvidenceValidationService;
  
  // Simple in-memory cache
  private cache: Map<string, { result: AnalysisResult; timestamp: number }>;
  private readonly CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.ollamaService = OllamaService.getInstance();
    this.contextBuilder = ContextBuilderService.getInstance();
    this.evidenceValidator = EvidenceValidationService.getInstance();
    this.cache = new Map();
  }

  static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  /**
   * Analyze patient records and generate clinical signals
   */
  async analyzePatient(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    journeySummary: string,
    forceRefresh: boolean = false
  ): Promise<AnalysisResult> {
    console.log('[AnalysisService] Starting analysis for patient:', patientId);
    console.log('[AnalysisService] Events count:', events.length);
    console.log('[AnalysisService] Patterns count:', patterns.length);
    
    // Debug logging for dataset fingerprint
    const sourceDocuments = [...new Set(events.map(e => e.sourceDocumentName))].sort();
    const cacheKey = this.getCacheKey(patientId, events);
    console.log('[AnalysisService] Analysis dataset:');
    console.log('[AnalysisService]   events:', events.length);
    console.log('[AnalysisService]   sourceDocuments:', sourceDocuments.join(', '));
    console.log('[AnalysisService]   cacheKey:', cacheKey);
    
    // Check cache
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
        console.log('[AnalysisService] Returning cached result');
        return cached.result;
      }
    }

    // Check if Ollama is available
    console.log('[AnalysisService] Checking Ollama availability...');
    const isAvailable = await this.ollamaService.isAvailable();
    console.log('[AnalysisService] Ollama available:', isAvailable);
    if (!isAvailable) {
      console.error('[AnalysisService] Ollama not available');
      return {
        signals: [],
        summary: '',
        success: false,
        error: 'Ollama is not available. Please ensure Ollama is running locally.',
        modelName: this.ollamaService.getModel(),
        generatedAt: new Date().toISOString(),
      };
    }

    // Check if model is available
    console.log('[AnalysisService] Checking model availability...');
    const isModelAvailable = await this.ollamaService.isModelAvailable();
    console.log('[AnalysisService] Model available:', isModelAvailable);
    if (!isModelAvailable) {
      console.error('[AnalysisService] Model not available');
      return {
        signals: [],
        summary: '',
        success: false,
        error: `Model "${this.ollamaService.getModel()}" is not available in Ollama.`,
        modelName: this.ollamaService.getModel(),
        generatedAt: new Date().toISOString(),
      };
    }

    try {
      console.log('[AnalysisService] Building analysis context...');
      // Build context
      const context = this.contextBuilder.buildAnalysisContext(
        patientId,
        events,
        patterns,
        journeySummary
      );
      console.log('[AnalysisService] Context built, timeline events:', context.timelineEvents.length);

      // Convert context to prompt
      console.log('[AnalysisService] Converting context to prompt...');
      const contextPrompt = this.contextBuilder.contextToPrompt(context);
      console.log('[AnalysisService] Context prompt content:');
      console.log(contextPrompt);
      const userPrompt = USER_PROMPT_TEMPLATE(contextPrompt);
      console.log('[AnalysisService] Prompt length:', userPrompt.length);

      // Send to Ollama
      console.log('[AnalysisService] Sending to Ollama...');
      const modelResponse = await this.ollamaService.generateJson<ModelSignalResponse>(
        userPrompt,
        SYSTEM_PROMPT
      );
      console.log('[AnalysisService] Ollama response received:', modelResponse);
      console.log('[AnalysisService] Observations in response:', modelResponse.observations?.length || 0);
      console.log('[AnalysisService] Interpretations in response:', modelResponse.interpretations?.length || 0);

      // Validate evidence
      console.log('[AnalysisService] Validating evidence...');
      const { validSignals, validationResults, summary } = this.evidenceValidator.validateSignals(
        modelResponse,
        events,
        patientId,
        this.ollamaService.getModel()
      );
      console.log('[AnalysisService] Valid signals:', validSignals.length);
      console.log('[AnalysisService] Validation results:', validationResults);
      console.log('[AnalysisService] Summary:', summary);

      // Collect validation errors
      const allErrors = validationResults.flatMap(r => r.errors);
      console.log('[AnalysisService] Validation errors:', allErrors);

      const result: AnalysisResult = {
        signals: validSignals,
        summary: summary,
        success: true,
        modelName: this.ollamaService.getModel(),
        generatedAt: new Date().toISOString(),
        validationErrors: allErrors.length > 0 ? allErrors : undefined,
      };

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      console.log('[AnalysisService] Analysis complete, returning result');

      return result;
    } catch (error) {
      console.error('[AnalysisService] Analysis failed with error:', error);
      return {
        signals: [],
        summary: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during analysis',
        modelName: this.ollamaService.getModel(),
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if analysis is available
   */
  async isAnalysisAvailable(): Promise<{ available: boolean; reason?: string }> {
    const isAvailable = await this.ollamaService.isAvailable();
    if (!isAvailable) {
      return {
        available: false,
        reason: 'Ollama is not running. Please start Ollama locally.',
      };
    }

    const isModelAvailable = await this.ollamaService.isModelAvailable();
    if (!isModelAvailable) {
      return {
        available: false,
        reason: `Model "${this.ollamaService.getModel()}" is not available in Ollama.`,
      };
    }

    return { available: true };
  }

  /**
   * Clear cache for a patient
   */
  clearCache(patientId: string): void {
    // Clear all cache entries for this patient
    for (const [key] of this.cache) {
      if (key.startsWith(patientId)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key based on dataset fingerprint
   */
  private getCacheKey(patientId: string, events: MedicalEvent[]): string {
    // Create a fingerprint based on:
    // - Patient ID
    // - Unique source document names (sorted)
    // - Event count
    // - Event IDs (sorted)
    const sourceDocuments = [...new Set(events.map(e => e.sourceDocumentName))].sort().join(',');
    const eventIds = events.map(e => e.id).sort().join(',');
    const fingerprint = `${sourceDocuments}|${events.length}|${eventIds}`;
    return `${patientId}:${fingerprint}`;
  }

  /**
   * Get configured model name
   */
  getModelName(): string {
    return this.ollamaService.getModel();
  }
}
