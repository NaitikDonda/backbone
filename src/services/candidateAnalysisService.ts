import type { MedicalEvent, Pattern, CandidateReview, AnalysisAudit } from '../types';
import { OllamaService } from './ollamaService';
import { CandidateMatchingService, type CandidateMatchResult } from './candidateMatchingService';
import { CANDIDATE_SYSTEM_PROMPT, CANDIDATE_USER_PROMPT_TEMPLATE } from './candidateSystemPrompt';
import { CandidateKnowledgeBase } from '../data/candidateKnowledgeBase';
import { AnalysisAuditService } from './analysisAuditService';

export interface CandidateAnalysisResult {
  candidateReviews: CandidateReview[];
  success: boolean;
  error?: string;
  modelName: string;
  knowledgeVersion: string;
  generatedAt: string;
  auditId?: string;
  analysisVersion: number;
}

export interface ModelCandidateResponse {
  candidateReviews: Array<{
    candidateId: string;
    candidateName: string;
    matchLevel: 'strong' | 'moderate' | 'weak';
    summary: string;
    supportingEvidence: Array<{
      eventId: string;
      date: string;
      description: string;
    }>;
    contradictingEvidence: Array<{
      eventId: string;
      date: string;
      description: string;
    }>;
    missingInformation: string[];
    longitudinalReasoning: string;
    reviewQuestions: string[];
  }>;
}

export class CandidateAnalysisService {
  private static instance: CandidateAnalysisService;
  private ollamaService: OllamaService;
  private matchingService: CandidateMatchingService;
  private knowledgeBase: CandidateKnowledgeBase;
  private auditService: AnalysisAuditService;
  
  // Simple in-memory cache
  private cache: Map<string, { result: CandidateAnalysisResult; timestamp: number }>;
  private readonly CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  
  // Analysis version counter
  private analysisVersion: number = 1;

  private constructor() {
    this.ollamaService = OllamaService.getInstance();
    this.matchingService = CandidateMatchingService.getInstance();
    this.knowledgeBase = CandidateKnowledgeBase.getInstance();
    this.auditService = AnalysisAuditService.getInstance();
    this.cache = new Map();
  }

  static getInstance(): CandidateAnalysisService {
    if (!CandidateAnalysisService.instance) {
      CandidateAnalysisService.instance = new CandidateAnalysisService();
    }
    return CandidateAnalysisService.instance;
  }

  /**
   * Analyze patient records for candidate conditions
   */
  async analyzeCandidates(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    forceRefresh: boolean = false
  ): Promise<CandidateAnalysisResult> {
    // Check cache
    const cacheKey = this.getCacheKey(patientId, events);
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
        return cached.result;
      }
    }

    // Check if Ollama is available
    const isAvailable = await this.ollamaService.isAvailable();
    if (!isAvailable) {
      // Return deterministic matches without Ollama explanation
      return this.getDeterministicMatchesOnly(patientId, events, patterns);
    }

    try {
      // Get deterministic candidate matches
      const matchResults = this.matchingService.matchAllCandidates(events, patterns);

      if (matchResults.length === 0) {
        return {
          candidateReviews: [],
          success: true,
          modelName: this.ollamaService.getModel(),
          knowledgeVersion: this.knowledgeBase.getVersion(),
          generatedAt: new Date().toISOString(),
          analysisVersion: this.analysisVersion,
        };
      }

      // Build context for Ollama
      const context = this.buildCandidateContext(matchResults);
      const userPrompt = CANDIDATE_USER_PROMPT_TEMPLATE(context);

      // Send to Ollama
      const modelResponse = await this.ollamaService.generateJson<ModelCandidateResponse>(
        userPrompt,
        CANDIDATE_SYSTEM_PROMPT
      );

      // Validate and convert to CandidateReview
      const candidateReviews = this.convertToCandidateReviews(
        modelResponse,
        matchResults,
        patientId,
        this.ollamaService.getModel(),
        this.knowledgeBase.getVersion()
      );

      const result: CandidateAnalysisResult = {
        candidateReviews,
        success: true,
        modelName: this.ollamaService.getModel(),
        knowledgeVersion: this.knowledgeBase.getVersion(),
        generatedAt: new Date().toISOString(),
        analysisVersion: this.analysisVersion,
      };

      // Record audit
      const auditId = this.auditService.generateAuditId();
      const audit: AnalysisAudit = {
        id: auditId,
        patientId,
        analysisType: 'candidate_review',
        analysisId: auditId,
        timestamp: result.generatedAt,
        modelName: result.modelName,
        knowledgeVersion: result.knowledgeVersion,
        eventIds: events.map(e => e.id),
        patternIds: patterns.map(p => p.id),
        candidateIds: candidateReviews.map(r => r.id),
        sourceRecordIds: [...new Set(events.map(e => e.sourceRecordId))],
      };
      this.auditService.recordAudit(audit);
      result.auditId = auditId;

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    } catch (error) {
      // Fallback to deterministic matches only
      return this.getDeterministicMatchesOnly(patientId, events, patterns);
    }
  }

  /**
   * Get deterministic matches without Ollama explanation
   */
  private getDeterministicMatchesOnly(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[]
  ): CandidateAnalysisResult {
    const matchResults = this.matchingService.matchAllCandidates(events, patterns);

    const candidateReviews: CandidateReview[] = matchResults.map(match => ({
      id: `candidate-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      candidateId: match.candidateId,
      candidateName: match.candidateName,
      matchLevel: match.matchLevel,
      evidenceMatchScore: match.evidenceMatchScore,
      summary: `Deterministic pattern match found. ${match.supportingEvidence.length} supporting evidence items identified.`,
      supportingEvidence: match.supportingEvidence,
      contradictingEvidence: match.contradictingEvidence,
      missingInformation: match.missingInformation,
      longitudinalReasoning: match.temporalReasoning,
      reviewQuestions: [
        'Was this pattern previously evaluated?',
        'Was the finding persistent on subsequent testing?',
      ],
      generatedAt: new Date().toISOString(),
      modelName: 'deterministic-only',
      knowledgeVersion: this.knowledgeBase.getVersion(),
      status: 'pending',
    }));

    return {
      candidateReviews,
      success: true,
      modelName: 'deterministic-only',
      knowledgeVersion: this.knowledgeBase.getVersion(),
      generatedAt: new Date().toISOString(),
      analysisVersion: this.analysisVersion,
    };
  }

  /**
   * Build context for Ollama candidate analysis
   */
  private buildCandidateContext(matchResults: CandidateMatchResult[]): string {
    let context = '';

    context += `CANDIDATE MATCH RESULTS\n\n`;

    for (const match of matchResults) {
      context += `Candidate: ${match.candidateName}\n`;
      context += `Match Level: ${match.matchLevel}\n`;
      context += `Evidence Match Score: ${match.evidenceMatchScore.toFixed(2)}\n`;
      context += `Temporal Reasoning: ${match.temporalReasoning}\n\n`;
      
      context += `Supporting Evidence (${match.supportingEvidence.length}):\n`;
      for (const evidence of match.supportingEvidence) {
        context += `  - ${evidence.date || 'Undated'} | ${evidence.matchType} | ${evidence.description}\n`;
        context += `    Event ID: ${evidence.eventId}\n`;
        context += `    Source: ${evidence.sourceDocumentName}\n`;
      }
      context += '\n';

      if (match.contradictingEvidence.length > 0) {
        context += `Contradicting Evidence (${match.contradictingEvidence.length}):\n`;
        for (const evidence of match.contradictingEvidence) {
          context += `  - ${evidence.date || 'Undated'} | ${evidence.description}\n`;
        }
        context += '\n';
      }

      if (match.missingInformation.length > 0) {
        context += `Missing Information:\n`;
        for (const missing of match.missingInformation) {
          context += `  - ${missing}\n`;
        }
        context += '\n';
      }

      context += '---\n\n';
    }

    return context;
  }

  /**
   * Convert model response to CandidateReview with validation
   */
  private convertToCandidateReviews(
    modelResponse: ModelCandidateResponse,
    matchResults: CandidateMatchResult[],
    patientId: string,
    modelName: string,
    knowledgeVersion: string
  ): CandidateReview[] {
    const reviews: CandidateReview[] = [];

    // Create a map of match results by candidate ID
    const matchMap = new Map<string, CandidateMatchResult>();
    for (const match of matchResults) {
      matchMap.set(match.candidateId, match);
    }

    for (const modelReview of modelResponse.candidateReviews) {
      const matchResult = matchMap.get(modelReview.candidateId);
      if (!matchResult) continue;

      // Validate evidence references
      const validSupporting = this.validateEvidenceReferences(
        modelReview.supportingEvidence,
        matchResult.supportingEvidence
      );
      const validContradicting = this.validateEvidenceReferences(
        modelReview.contradictingEvidence,
        matchResult.contradictingEvidence
      );

      reviews.push({
        id: `candidate-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        candidateId: modelReview.candidateId,
        candidateName: modelReview.candidateName,
        matchLevel: modelReview.matchLevel,
        evidenceMatchScore: matchResult.evidenceMatchScore,
        summary: modelReview.summary,
        supportingEvidence: validSupporting,
        contradictingEvidence: validContradicting,
        missingInformation: modelReview.missingInformation,
        longitudinalReasoning: modelReview.longitudinalReasoning,
        reviewQuestions: modelReview.reviewQuestions,
        generatedAt: new Date().toISOString(),
        modelName,
        knowledgeVersion,
        status: 'pending',
      });
    }

    return reviews;
  }

  /**
   * Validate evidence references against match results
   */
  private validateEvidenceReferences(
    modelEvidence: Array<{ eventId: string; date: string; description: string }>,
    matchEvidence: Array<{ eventId: string; date: string | null; description: string; sourceRecordId: string; sourceDocumentName: string; matchType: 'symptom' | 'lab' | 'pattern' | 'other' }>
  ): Array<{ eventId: string; date: string | null; description: string; sourceRecordId: string; sourceDocumentName: string; matchType: 'symptom' | 'lab' | 'pattern' | 'other' }> {
    const validEvidence: Array<{ eventId: string; date: string | null; description: string; sourceRecordId: string; sourceDocumentName: string; matchType: 'symptom' | 'lab' | 'pattern' | 'other' }> = [];
    const matchEvidenceMap = new Map<string, typeof matchEvidence[0]>();
    
    for (const evidence of matchEvidence) {
      matchEvidenceMap.set(evidence.eventId, evidence);
    }

    for (const evidence of modelEvidence) {
      const match = matchEvidenceMap.get(evidence.eventId);
      if (match) {
        validEvidence.push(match);
      }
    }

    return validEvidence;
  }

  /**
   * Check if candidate analysis is available
   */
  async isAnalysisAvailable(): Promise<{ available: boolean; reason?: string }> {
    const isAvailable = await this.ollamaService.isAvailable();
    if (!isAvailable) {
      return {
        available: false,
        reason: 'Ollama is not running. Deterministic matching will be used without AI explanation.',
      };
    }

    return { available: true };
  }

  /**
   * Clear cache for a patient
   */
  clearCache(patientId: string): void {
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
    return `candidate:${patientId}:${fingerprint}`;
  }

  /**
   * Update candidate review status
   */
  updateReviewStatus(
    reviewId: string,
    status: 'pending' | 'reviewing' | 'reviewed' | 'dismissed',
    dismissalReason?: string
  ): void {
    // Update in-memory cache
    for (const cached of this.cache.values()) {
      const review = cached.result.candidateReviews.find(r => r.id === reviewId);
      if (review) {
        review.status = status;
        if (dismissalReason) {
          review.dismissalReason = dismissalReason;
        }
      }
    }
  }

  /**
   * Get candidate review by ID
   */
  getReviewById(reviewId: string): CandidateReview | undefined {
    for (const cached of this.cache.values()) {
      const review = cached.result.candidateReviews.find(r => r.id === reviewId);
      if (review) {
        return review;
      }
    }
    return undefined;
  }

  /**
   * Regenerate analysis with force refresh
   */
  async regenerateAnalysis(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[]
  ): Promise<CandidateAnalysisResult> {
    // Increment analysis version
    this.analysisVersion++;
    
    // Clear cache for this patient
    this.clearCache(patientId);
    
    // Run fresh analysis
    return this.analyzeCandidates(patientId, events, patterns, true);
  }

  /**
   * Get current analysis version
   */
  getCurrentAnalysisVersion(): number {
    return this.analysisVersion;
  }
}
