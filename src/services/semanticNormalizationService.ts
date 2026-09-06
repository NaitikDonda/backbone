/**
 * Semantic Normalization Service for Phase 12
 * 
 * This service provides semantic linking between medical events using a layered approach:
 * - Layer 1: Deterministic normalization (simple string transformations)
 * - Layer 2: Synonym mapping (development vocabulary)
 * - Layer 3: Semantic similarity (optional, using embeddings/Ollama)
 * 
 * The service preserves original events and creates relationships rather than merging.
 */

import type {
  MedicalEvent,
  SemanticRelationship,
  SemanticAnalysis,
  Episode,
  SemanticThresholds,
  TemporalQualifier,
  ConceptType,
} from '../types';
import {
  getCanonicalConcept,
  normalizeTerm,
  containsNegation,
  extractTemporalQualifier,
  indicatesResolution,
  DEVELOPMENT_VOCABULARY,
} from '../config/semanticVocabulary';
import { OllamaService } from './ollamaService';

export class SemanticNormalizationService {
  private static instance: SemanticNormalizationService;
  private ollamaService: OllamaService;
  private analysisVersion: string;
  private thresholds: SemanticThresholds;
  private rejectedRelationships: Set<string>; // Cache of rejected relationships

  private constructor() {
    this.ollamaService = OllamaService.getInstance();
    this.analysisVersion = 'development-0.1';
    this.thresholds = {
      highSimilarity: 0.85,
      mediumSimilarity: 0.70,
      lowSimilarity: 0.50,
      maxEpisodeGapDays: 180,
    };
    this.rejectedRelationships = new Set();
  }

  static getInstance(): SemanticNormalizationService {
    if (!SemanticNormalizationService.instance) {
      SemanticNormalizationService.instance = new SemanticNormalizationService();
    }
    return SemanticNormalizationService.instance;
  }

  /**
   * Analyze semantic relationships between medical events
   */
  async analyzeSemanticRelationships(
    patientId: string,
    events: MedicalEvent[]
  ): Promise<SemanticAnalysis> {
    const canonicalConcepts = DEVELOPMENT_VOCABULARY;
    const semanticRelationships: SemanticRelationship[] = [];
    const episodes: Episode[] = [];

    // Group events by concept type for processing
    const eventsByType = this.groupEventsByType(events);

    // Process each concept type
    for (const [conceptType, typeEvents] of eventsByType.entries()) {
      // Find semantic relationships within this type
      const typeRelationships = await this.findRelationshipsForType(
        patientId,
        typeEvents,
        conceptType
      );
      semanticRelationships.push(...typeRelationships);

      // Group related events into episodes
      const typeEpisodes = this.groupEpisodes(
        patientId,
        typeEvents,
        typeRelationships,
        conceptType
      );
      episodes.push(...typeEpisodes);
    }

    return {
      id: `semantic-analysis-${patientId}-${Date.now()}`,
      patientId,
      canonicalConcepts,
      semanticRelationships,
      episodes,
      analysisVersion: this.analysisVersion,
      generatedAt: new Date().toISOString(),
      eventIds: events.map(e => e.id),
      sourceRecordIds: Array.from(new Set(events.map(e => e.sourceRecordId))),
    };
  }

  /**
   * Find semantic relationships for events of a specific type
   */
  private async findRelationshipsForType(
    patientId: string,
    events: MedicalEvent[],
    conceptType: ConceptType
  ): Promise<SemanticRelationship[]> {
    const relationships: SemanticRelationship[] = [];

    // Compare each event with every other event of the same type
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        // Skip if either event is negated
        if (this.isEventNegated(event1) || this.isEventNegated(event2)) {
          continue;
        }

        // Check if these events are semantically related
        const relationship = await this.createRelationship(
          patientId,
          event1,
          event2,
          conceptType
        );

        if (relationship) {
          // Skip if this relationship was previously rejected
          const relationshipKey = this.getRelationshipKey(event1.id, event2.id);
          if (this.rejectedRelationships.has(relationshipKey)) {
            continue;
          }
          relationships.push(relationship);
        }
      }
    }

    return relationships;
  }

  /**
   * Create a semantic relationship between two events
   */
  private async createRelationship(
    patientId: string,
    event1: MedicalEvent,
    event2: MedicalEvent,
    conceptType: ConceptType
  ): Promise<SemanticRelationship | null> {
    // Layer 1: Deterministic normalization
    const normalized1 = normalizeTerm(event1.title);
    const normalized2 = normalizeTerm(event2.title);

    // If they normalize to the same term, they're definitely related
    if (normalized1 === normalized2) {
      return this.buildRelationship(
        patientId,
        event1,
        event2,
        normalized1,
        'deterministic_dictionary',
        'high',
        1.0,
        conceptType
      );
    }

    // Layer 2: Synonym mapping
    const concept1 = getCanonicalConcept(event1.title, conceptType);
    const concept2 = getCanonicalConcept(event2.title, conceptType);

    if (concept1 && concept2 && concept1.id === concept2.id) {
      return this.buildRelationship(
        patientId,
        event1,
        event2,
        concept1.canonicalName,
        'synonym_mapping',
        'high',
        0.95,
        conceptType
      );
    }

    // Layer 3: Semantic similarity (optional, if Ollama is available)
    const ollamaAvailable = await this.ollamaService.isAvailable();
    if (ollamaAvailable) {
      try {
        const similarity = await this.calculateSemanticSimilarity(
          event1.title,
          event2.title
        );

        if (similarity >= this.thresholds.highSimilarity) {
          return this.buildRelationship(
            patientId,
            event1,
            event2,
            event1.title, // Use source title as canonical when high similarity
            'embedding_similarity',
            'high',
            similarity,
            conceptType
          );
        } else if (similarity >= this.thresholds.mediumSimilarity) {
          return this.buildRelationship(
            patientId,
            event1,
            event2,
            event1.title,
            'embedding_similarity',
            'medium',
            similarity,
            conceptType
          );
        }
      } catch (error) {
        // If embedding calculation fails, fall back gracefully
        console.warn('Semantic similarity calculation failed:', error);
      }
    }

    // No relationship found
    return null;
  }

  /**
   * Build a semantic relationship object
   */
  private buildRelationship(
    patientId: string,
    event1: MedicalEvent,
    event2: MedicalEvent,
    canonicalName: string,
    method: 'deterministic_dictionary' | 'normalization' | 'synonym_mapping' | 'embedding_similarity' | 'ollama_review',
    strength: 'high' | 'medium' | 'low',
    similarityScore: number,
    conceptType: ConceptType
  ): SemanticRelationship {
    const temporalQualifier1 = this.extractTemporalQualifier(event1);
    const temporalQualifier2 = this.extractTemporalQualifier(event2);

    return {
      id: `semantic-rel-${event1.id}-${event2.id}`,
      patientId,
      sourceEventId: event1.id,
      targetEventId: event2.id,
      canonicalConceptId: `concept-${canonicalName.toLowerCase().replace(/\s+/g, '-')}`,
      canonicalConceptName: canonicalName,
      relationshipStrength: strength,
      matchingMethod: method,
      similarityScore,
      originalTextSource: event1.title,
      originalTextTarget: event2.title,
      sourceDocumentName: event1.sourceDocumentName,
      targetDocumentName: event2.sourceDocumentName,
      sourceDate: event1.date,
      targetDate: event2.date,
      temporalQualifier: temporalQualifier1 || temporalQualifier2 || 'unknown',
      isNegated: this.isEventNegated(event1) || this.isEventNegated(event2),
      isHistorical: this.isEventHistorical(event1) || this.isEventHistorical(event2),
      isResolved: this.isEventResolved(event1) || this.isEventResolved(event2),
      status: 'pending',
      analysisVersion: this.analysisVersion,
      generatedAt: new Date().toISOString(),
      metadata: {
        conceptType,
      },
    };
  }

  /**
   * Group related events into episodes
   */
  private groupEpisodes(
    patientId: string,
    events: MedicalEvent[],
    relationships: SemanticRelationship[],
    conceptType: ConceptType
  ): Episode[] {
    const episodes: Episode[] = [];

    // Group events by canonical concept
    const eventsByConcept = new Map<string, MedicalEvent[]>();

    for (const relationship of relationships) {
      if (!eventsByConcept.has(relationship.canonicalConceptId)) {
        eventsByConcept.set(relationship.canonicalConceptId, []);
      }
      eventsByConcept.get(relationship.canonicalConceptId)!.push(
        events.find(e => e.id === relationship.sourceEventId)!
      );
      eventsByConcept.get(relationship.canonicalConceptId)!.push(
        events.find(e => e.id === relationship.targetEventId)!
      );
    }

    // Create episodes for each concept group
    for (const [conceptId, conceptEvents] of eventsByConcept.entries()) {
      // Sort events by date
      const sortedEvents = conceptEvents
        .filter(e => e.date !== null)
        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

      if (sortedEvents.length === 0) continue;

      // Detect episode boundaries
      const episodeGroups = this.detectEpisodeBoundaries(sortedEvents);

      for (const group of episodeGroups) {
        const firstEvent = group[0];
        const lastEvent = group[group.length - 1];

        const episode: Episode = {
          id: `episode-${conceptId}-${firstEvent.date}`,
          patientId,
          canonicalConceptId: conceptId,
          canonicalConceptName: relationships.find(r => r.canonicalConceptId === conceptId)?.canonicalConceptName || '',
          conceptType,
          startDate: firstEvent.date,
          endDate: lastEvent.date,
          eventIds: group.map(e => e.id),
          sourceRecordIds: Array.from(new Set(group.map(e => e.sourceRecordId))),
          temporalQualifier: this.extractTemporalQualifier(firstEvent) || 'unknown',
          episodeType: group.length > 1 ? 'continuous' : 'single',
          generatedAt: new Date().toISOString(),
        };

        episodes.push(episode);
      }
    }

    return episodes;
  }

  /**
   * Detect episode boundaries based on temporal gaps and resolution
   */
  private detectEpisodeBoundaries(events: MedicalEvent[]): MedicalEvent[][] {
    if (events.length === 0) return [];

    const episodes: MedicalEvent[][] = [];
    let currentEpisode: MedicalEvent[] = [events[0]];

    for (let i = 1; i < events.length; i++) {
      const previousEvent = events[i - 1];
      const currentEvent = events[i];

      // Check if there's a significant gap
      if (previousEvent.date && currentEvent.date) {
        const gapDays = this.calculateDayGap(previousEvent.date, currentEvent.date);

        // Break episode if gap exceeds threshold
        if (gapDays > this.thresholds.maxEpisodeGapDays) {
          episodes.push(currentEpisode);
          currentEpisode = [currentEvent];
          continue;
        }

        // Break episode if previous event indicates resolution
        if (this.isEventResolved(previousEvent)) {
          episodes.push(currentEpisode);
          currentEpisode = [currentEvent];
          continue;
        }
      }

      currentEpisode.push(currentEvent);
    }

    if (currentEpisode.length > 0) {
      episodes.push(currentEpisode);
    }

    return episodes;
  }

  /**
   * Calculate day gap between two dates
   */
  private calculateDayGap(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if an event is negated
   */
  private isEventNegated(event: MedicalEvent): boolean {
    const text = event.sourceText || event.title || event.description || '';
    return containsNegation(text);
  }

  /**
   * Check if an event is historical
   */
  private isEventHistorical(event: MedicalEvent): boolean {
    const text = event.sourceText || event.title || event.description || '';
    const qualifier = extractTemporalQualifier(text);
    return qualifier === 'historical' || qualifier === 'previous' || qualifier === 'past';
  }

  /**
   * Check if an event indicates resolution
   */
  private isEventResolved(event: MedicalEvent): boolean {
    const text = event.sourceText || event.title || event.description || '';
    return indicatesResolution(text);
  }

  /**
   * Extract temporal qualifier from an event
   */
  private extractTemporalQualifier(event: MedicalEvent): TemporalQualifier {
    const text = event.sourceText || event.title || event.description || '';
    const qualifier = extractTemporalQualifier(text);
    return (qualifier as TemporalQualifier) || 'unknown';
  }

  /**
   * Group events by concept type
   */
  private groupEventsByType(events: MedicalEvent[]): Map<ConceptType, MedicalEvent[]> {
    const groups = new Map<ConceptType, MedicalEvent[]>();

    for (const event of events) {
      const conceptType = this.mapEventTypeToConceptType(event.eventType);
      if (!groups.has(conceptType)) {
        groups.set(conceptType, []);
      }
      groups.get(conceptType)!.push(event);
    }

    return groups;
  }

  /**
   * Map MedicalEventType to ConceptType
   */
  private mapEventTypeToConceptType(eventType: string): ConceptType {
    const mapping: Record<string, ConceptType> = {
      'symptom': 'symptom',
      'diagnosis': 'diagnosis',
      'laboratory': 'laboratory',
      'medication': 'medication',
      'procedure': 'procedure',
      'finding': 'finding',
    };
    return mapping[eventType] || 'symptom';
  }

  /**
   * Calculate semantic similarity using Ollama (Layer 3)
   * This is optional and falls back gracefully if unavailable
   */
  private async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const prompt = `Rate the semantic similarity between these two medical terms on a scale of 0.0 to 1.0.
Return ONLY the number, no explanation.

Term 1: "${text1}"
Term 2: "${text2}"

Similarity score:`;

      const response = await this.ollamaService.generate(prompt);
      const score = parseFloat(response.trim());
      
      if (isNaN(score) || score < 0 || score > 1) {
        return 0;
      }

      return score;
    } catch (error) {
      console.warn('Failed to calculate semantic similarity:', error);
      return 0;
    }
  }

  /**
   * Get a unique key for a relationship pair
   */
  private getRelationshipKey(eventId1: string, eventId2: string): string {
    return [eventId1, eventId2].sort().join('-');
  }

  /**
   * Reviewer action: confirm or reject a relationship
   */
  reviewRelationship(
    relationshipId: string,
    action: 'confirm' | 'reject',
    _reason: string
  ): void {
    const relationshipKey = relationshipId.replace('semantic-rel-', '').replace(/-/g, '-');
    
    if (action === 'reject') {
      this.rejectedRelationships.add(relationshipKey);
    } else {
      this.rejectedRelationships.delete(relationshipKey);
    }
  }

  /**
   * Get current analysis version
   */
  getAnalysisVersion(): string {
    return this.analysisVersion;
  }

  /**
   * Set analysis version (for testing)
   */
  setAnalysisVersion(version: string): void {
    this.analysisVersion = version;
  }

  /**
   * Get current thresholds
   */
  getThresholds(): SemanticThresholds {
    return { ...this.thresholds };
  }

  /**
   * Set thresholds (for configuration)
   */
  setThresholds(thresholds: Partial<SemanticThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Clear rejected relationships cache
   */
  clearRejectedRelationships(): void {
    this.rejectedRelationships.clear();
  }
}

export const semanticNormalizationService = SemanticNormalizationService.getInstance();
