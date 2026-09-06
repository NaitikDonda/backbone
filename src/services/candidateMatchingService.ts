import type { MedicalEvent, Pattern, CandidateCondition, CandidateEvidence, MatchLevel } from '../types';
import { CandidateKnowledgeBase } from '../data/candidateKnowledgeBase';

export interface CandidateMatchResult {
  candidateId: string;
  candidateName: string;
  matchLevel: MatchLevel;
  evidenceMatchScore: number;
  supportingEvidence: CandidateEvidence[];
  contradictingEvidence: CandidateEvidence[];
  missingInformation: string[];
  temporalReasoning: string;
}

export class CandidateMatchingService {
  private static instance: CandidateMatchingService;
  private knowledgeBase: CandidateKnowledgeBase;

  // Thresholds for match levels
  private readonly STRONG_MATCH_THRESHOLD = 0.7;
  private readonly MODERATE_MATCH_THRESHOLD = 0.4;
  private readonly WEAK_MATCH_THRESHOLD = 0.2;

  private constructor() {
    this.knowledgeBase = CandidateKnowledgeBase.getInstance();
  }

  static getInstance(): CandidateMatchingService {
    if (!CandidateMatchingService.instance) {
      CandidateMatchingService.instance = new CandidateMatchingService();
    }
    return CandidateMatchingService.instance;
  }

  /**
   * Match patient events against all candidate conditions
   */
  matchAllCandidates(
    events: MedicalEvent[],
    patterns: Pattern[]
  ): CandidateMatchResult[] {
    const candidates = this.knowledgeBase.getAllConditions();
    const results: CandidateMatchResult[] = [];

    for (const candidate of candidates) {
      const result = this.matchCandidate(candidate, events, patterns);
      if (result.matchLevel !== 'insufficient') {
        results.push(result);
      }
    }

    // Sort by evidence match score (highest first)
    return results.sort((a, b) => b.evidenceMatchScore - a.evidenceMatchScore);
  }

  /**
   * Match patient events against a single candidate condition
   */
  private matchCandidate(
    candidate: CandidateCondition,
    events: MedicalEvent[],
    patterns: Pattern[]
  ): CandidateMatchResult {
    const supportingEvidence: CandidateEvidence[] = [];
    const contradictingEvidence: CandidateEvidence[] = [];
    const missingInformation: string[] = [];

    // Match symptoms
    const symptomEvents = events.filter(e => e.eventType === 'symptom');
    for (const symptom of candidate.associatedSymptoms) {
      const matches = this.matchSymptom(symptom, symptomEvents);
      supportingEvidence.push(...matches);
    }

    // Match lab tests
    const labEvents = events.filter(e => e.eventType === 'laboratory');
    for (const lab of candidate.associatedLabs) {
      const matches = this.matchLabTest(lab, labEvents);
      supportingEvidence.push(...matches);
    }

    // Match patterns
    for (const pattern of candidate.associatedPatterns) {
      const matches = this.matchPattern(pattern, patterns);
      supportingEvidence.push(...matches);
    }

    // Check for contradicting evidence
    for (const feature of candidate.contradictingFeatures) {
      const contradictions = this.findContradictingEvidence(feature, events);
      contradictingEvidence.push(...contradictions);
    }

    // Identify missing required evidence
    for (const required of candidate.requiredEvidence) {
      if (!this.hasRequiredEvidence(required, events, patterns)) {
        missingInformation.push(required);
      }
    }

    // Calculate evidence match score
    const score = this.calculateMatchScore(
      candidate,
      supportingEvidence,
      contradictingEvidence,
      missingInformation
    );

    // Determine match level
    const matchLevel = this.determineMatchLevel(score, supportingEvidence.length);

    // Generate temporal reasoning
    const temporalReasoning = this.generateTemporalReasoning(supportingEvidence);

    return {
      candidateId: candidate.id,
      candidateName: candidate.name,
      matchLevel,
      evidenceMatchScore: score,
      supportingEvidence,
      contradictingEvidence,
      missingInformation,
      temporalReasoning,
    };
  }

  /**
   * Match a symptom against patient events
   */
  private matchSymptom(symptom: string, events: MedicalEvent[]): CandidateEvidence[] {
    const evidence: CandidateEvidence[] = [];
    const normalizedSymptom = symptom.toLowerCase().trim();

    for (const event of events) {
      const normalizedTitle = event.title.toLowerCase();
      const normalizedDescription = event.description?.toLowerCase() || '';

      // Check for exact match or partial match
      if (normalizedTitle.includes(normalizedSymptom) ||
          normalizedDescription.includes(normalizedSymptom)) {
        evidence.push({
          eventId: event.id,
          date: event.date,
          description: event.description || event.title,
          sourceRecordId: event.sourceRecordId,
          sourceDocumentName: event.sourceDocumentName,
          matchType: 'symptom',
        });
      }
    }

    // Deduplicate by event ID (same event shouldn't count multiple times)
    return this.deduplicateEvidence(evidence);
  }

  /**
   * Match a lab test against patient events
   */
  private matchLabTest(
    lab: { testName: string; expectedPattern: 'low' | 'high' | 'abnormal' | 'normal' },
    events: MedicalEvent[]
  ): CandidateEvidence[] {
    const evidence: CandidateEvidence[] = [];
    const normalizedTestName = lab.testName.toLowerCase().trim();

    for (const event of events) {
      const normalizedTitle = event.title.toLowerCase();
      const normalizedDescription = event.description?.toLowerCase() || '';

      // Check if this is the right test
      if (normalizedTitle.includes(normalizedTestName) ||
          normalizedDescription.includes(normalizedTestName)) {
        
        // Check if the pattern matches
        const patternMatches = this.checkLabPattern(lab.expectedPattern, event);
        
        if (patternMatches) {
          evidence.push({
            eventId: event.id,
            date: event.date,
            description: event.description || event.title,
            sourceRecordId: event.sourceRecordId,
            sourceDocumentName: event.sourceDocumentName,
            matchType: 'lab',
          });
        }
      }
    }

    return this.deduplicateEvidence(evidence);
  }

  /**
   * Check if lab result pattern matches expected pattern
   */
  private checkLabPattern(
    expected: 'low' | 'high' | 'abnormal' | 'normal',
    event: MedicalEvent
  ): boolean {
    const normalizedDescription = event.description?.toLowerCase() || '';
    const normalizedTitle = event.title.toLowerCase();

    switch (expected) {
      case 'low':
        return normalizedDescription.includes('low') ||
               normalizedTitle.includes('low') ||
               event.status === 'abnormal';
      case 'high':
        return normalizedDescription.includes('high') ||
               normalizedTitle.includes('high') ||
               event.status === 'abnormal';
      case 'abnormal':
        return event.status === 'abnormal' ||
               normalizedDescription.includes('abnormal') ||
               normalizedTitle.includes('abnormal');
      case 'normal':
        return event.status === 'normal' ||
               normalizedDescription.includes('normal') ||
               normalizedTitle.includes('normal');
      default:
        return false;
    }
  }

  /**
   * Match a pattern against detected patterns
   */
  private matchPattern(pattern: string, patterns: Pattern[]): CandidateEvidence[] {
    const evidence: CandidateEvidence[] = [];
    const normalizedPattern = pattern.toLowerCase().trim();

    for (const detectedPattern of patterns) {
      const normalizedTitle = detectedPattern.title.toLowerCase();
      const normalizedDescription = detectedPattern.description.toLowerCase();

      if (normalizedTitle.includes(normalizedPattern) ||
          normalizedDescription.includes(normalizedPattern)) {
        // Add evidence from all events in this pattern
        for (const patternEvidence of detectedPattern.evidence) {
          evidence.push({
            eventId: patternEvidence.eventId,
            date: patternEvidence.date,
            description: patternEvidence.description,
            sourceRecordId: patternEvidence.sourceRecordId,
            sourceDocumentName: patternEvidence.sourceDocumentName,
            matchType: 'pattern',
          });
        }
      }
    }

    return this.deduplicateEvidence(evidence);
  }

  /**
   * Find contradicting evidence for a feature
   */
  private findContradictingEvidence(feature: string, events: MedicalEvent[]): CandidateEvidence[] {
    const evidence: CandidateEvidence[] = [];
    const normalizedFeature = feature.toLowerCase().trim();

    for (const event of events) {
      const normalizedTitle = event.title.toLowerCase();
      const normalizedDescription = event.description?.toLowerCase() || '';

      if (normalizedTitle.includes(normalizedFeature) ||
          normalizedDescription.includes(normalizedFeature)) {
        evidence.push({
          eventId: event.id,
          date: event.date,
          description: event.description || event.title,
          sourceRecordId: event.sourceRecordId,
          sourceDocumentName: event.sourceDocumentName,
          matchType: 'other',
        });
      }
    }

    return this.deduplicateEvidence(evidence);
  }

  /**
   * Check if required evidence is present
   */
  private hasRequiredEvidence(required: string, events: MedicalEvent[], patterns: Pattern[]): boolean {
    const normalizedRequired = required.toLowerCase().trim();

    // Check events
    for (const event of events) {
      const normalizedTitle = event.title.toLowerCase();
      const normalizedDescription = event.description?.toLowerCase() || '';

      if (normalizedTitle.includes(normalizedRequired) ||
          normalizedDescription.includes(normalizedRequired)) {
        return true;
      }
    }

    // Check patterns
    for (const pattern of patterns) {
      const normalizedTitle = pattern.title.toLowerCase();
      const normalizedDescription = pattern.description.toLowerCase();

      if (normalizedTitle.includes(normalizedRequired) ||
          normalizedDescription.includes(normalizedRequired)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate evidence match score
   */
  private calculateMatchScore(
    candidate: CandidateCondition,
    supportingEvidence: CandidateEvidence[],
    contradictingEvidence: CandidateEvidence[],
    missingInformation: string[]
  ): number {
    let score = 0;

    // Count unique supporting evidence by type
    const uniqueSymptoms = new Set(
      supportingEvidence.filter(e => e.matchType === 'symptom').map(e => e.eventId)
    ).size;
    const uniqueLabs = new Set(
      supportingEvidence.filter(e => e.matchType === 'lab').map(e => e.eventId)
    ).size;
    const uniquePatterns = new Set(
      supportingEvidence.filter(e => e.matchType === 'pattern').map(e => e.eventId)
    ).size;

    // Base score from supporting evidence
    const symptomScore = Math.min(uniqueSymptoms / candidate.associatedSymptoms.length, 1);
    const labScore = candidate.associatedLabs.length > 0 
      ? Math.min(uniqueLabs / candidate.associatedLabs.length, 1)
      : 0;
    const patternScore = candidate.associatedPatterns.length > 0
      ? Math.min(uniquePatterns / candidate.associatedPatterns.length, 1)
      : 0;

    score = (symptomScore * 0.4) + (labScore * 0.3) + (patternScore * 0.3);

    // Penalize for contradicting evidence
    const contradictionPenalty = Math.min(contradictingEvidence.length * 0.1, 0.5);
    score -= contradictionPenalty;

    // Penalize for missing required evidence
    const missingPenalty = Math.min(
      (missingInformation.length / candidate.requiredEvidence.length) * 0.3,
      0.5
    );
    score -= missingPenalty;

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine match level based on score and evidence count
   */
  private determineMatchLevel(score: number, evidenceCount: number): MatchLevel {
    if (score >= this.STRONG_MATCH_THRESHOLD && evidenceCount >= 3) {
      return 'strong';
    } else if (score >= this.MODERATE_MATCH_THRESHOLD && evidenceCount >= 2) {
      return 'moderate';
    } else if (score >= this.WEAK_MATCH_THRESHOLD && evidenceCount >= 1) {
      return 'weak';
    } else {
      return 'insufficient';
    }
  }

  /**
   * Generate temporal reasoning
   */
  private generateTemporalReasoning(evidence: CandidateEvidence[]): string {
    if (evidence.length === 0) {
      return 'No temporal evidence available.';
    }

    const datedEvidence = evidence.filter(e => e.date !== null);
    if (datedEvidence.length === 0) {
      return 'Evidence found but dates are not available.';
    }

    const dates = datedEvidence.map(e => new Date(e.date!)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    const yearDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearDiff < 0.1) {
      return 'Evidence appears within a short time frame (days to weeks).';
    } else if (yearDiff < 1) {
      return 'Evidence spans several months.';
    } else if (yearDiff < 2) {
      return 'Evidence spans over a year.';
    } else {
      return `Evidence spans ${Math.round(yearDiff)}+ years, indicating a longitudinal pattern.`;
    }
  }

  /**
   * Deduplicate evidence by event ID
   */
  private deduplicateEvidence(evidence: CandidateEvidence[]): CandidateEvidence[] {
    const seen = new Set<string>();
    return evidence.filter(e => {
      if (seen.has(e.eventId)) {
        return false;
      }
      seen.add(e.eventId);
      return true;
    });
  }
}
