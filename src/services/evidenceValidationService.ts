import type {
  MedicalEvent,
  ClinicalSignal,
  SignalEvidence,
  StructuredOllamaOutput,
  ValidatedStatement,
  ValidationError,
  ValidationStatus,
  ValidationErrorType,
  DataQualityAssessment,
  ConflictDetection,
  DuplicateDetection,
  ValidationLog,
  AIInterpretationConfidence,
  StatementLayer,
  DataConfidence
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validEvidence: SignalEvidence[];
  invalidEvidence: SignalEvidence[];
}

export interface ModelSignalResponse {
  summary: string;
  observations: Array<{
    text: string;
    evidenceIds: string[];
    category: string;
  }>;
  interpretations: Array<{
    text: string;
    evidenceIds: string[];
    confidence: string;
    category: string;
    whatWasDetected?: string;
    whatIsTheIssue?: string;
  }>;
  questionsForReview: string[];
  missingInformation: string[];
}

export class EvidenceValidationService {
  private static instance: EvidenceValidationService;
  private validationLogs: ValidationLog[] = [];

  private constructor() {}

  static getInstance(): EvidenceValidationService {
    if (!EvidenceValidationService.instance) {
      EvidenceValidationService.instance = new EvidenceValidationService();
    }
    return EvidenceValidationService.instance;
  }

  /**
   * Validate model-generated signals against actual events
   */
  validateSignals(
    modelResponse: ModelSignalResponse,
    events: MedicalEvent[],
    patientId: string,
    modelName: string
  ): { validSignals: ClinicalSignal[]; validationResults: ValidationResult[]; summary: string } {
    const validSignals: ClinicalSignal[] = [];
    const validationResults: ValidationResult[] = [];

    // Create a map of events for quick lookup
    const eventMap = new Map<string, MedicalEvent>();
    for (const event of events) {
      eventMap.set(event.id, event);
    }

    // Handle case where AI returns "signals" instead of "interpretations"
    // Convert the response to the expected format
    let interpretations = modelResponse.interpretations || [];
    if (!interpretations && (modelResponse as any).signals) {
      // Convert signals array to interpretations format
      interpretations = (modelResponse as any).signals.map((signal: any) => ({
        text: signal.description || signal.text || '',
        evidenceIds: [],
        confidence: 'moderate' as const,
        category: 'recurring_pattern' as const,
        whatWasDetected: signal.description || signal.text || '',
        whatIsTheIssue: 'Pattern detected in records'
      }));
    }

    // Ensure interpretations is an array
    if (!Array.isArray(interpretations)) {
      interpretations = [];
    }

    // Process interpretations as signals (focus on comprehensive interpretations, not individual observations)
    for (const interpretation of interpretations) {
      const result = this.validateInterpretation(interpretation, eventMap);
      validationResults.push(result);

      // Only include signals with valid evidence
      if (result.isValid && result.validEvidence.length > 0) {
        validSignals.push(this.convertInterpretationToSignal(
          interpretation,
          result.validEvidence,
          patientId,
          modelName
        ));
      }
    }

    return { validSignals, validationResults, summary: modelResponse.summary || '' };
  }

  /**
   * Validate a single observation
   */
  private validateObservation(
    observation: ModelSignalResponse['observations'][0],
    eventMap: Map<string, MedicalEvent>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validEvidence: SignalEvidence[] = [];
    const invalidEvidence: SignalEvidence[] = [];

    // Check required fields
    if (!observation.text || observation.text.trim() === '') {
      errors.push('Observation text is missing');
    }

    if (!observation.category) {
      errors.push('Observation category is missing');
    }

    // Validate evidence IDs
    if (!observation.evidenceIds || observation.evidenceIds.length === 0) {
      errors.push('Observation has no evidence');
    } else {
      for (const evidenceId of observation.evidenceIds) {
        const event = eventMap.get(evidenceId);
        if (event) {
          validEvidence.push({
            eventId: event.id,
            date: event.date || '',
            description: event.title,
            sourceRecordId: event.sourceRecordId,
            sourceDocumentName: event.sourceDocumentName,
          });
        } else {
          invalidEvidence.push({
            eventId: evidenceId,
            date: '',
            description: '',
            sourceRecordId: '',
            sourceDocumentName: 'Unknown',
          });
          errors.push(`Evidence ID ${evidenceId} does not exist in timeline`);
        }
      }
    }

    return {
      isValid: errors.length === 0 && validEvidence.length > 0,
      errors,
      warnings,
      validEvidence,
      invalidEvidence,
    };
  }

  /**
   * Validate a single interpretation
   */
  private validateInterpretation(
    interpretation: ModelSignalResponse['interpretations'][0],
    eventMap: Map<string, MedicalEvent>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validEvidence: SignalEvidence[] = [];
    const invalidEvidence: SignalEvidence[] = [];

    // Check required fields
    if (!interpretation.text || interpretation.text.trim() === '') {
      errors.push('Interpretation text is missing');
    }

    if (!interpretation.confidence) {
      errors.push('Interpretation confidence is missing');
    }

    // STRICT EVIDENCE VALIDATION: Reject interpretations without valid evidence IDs
    if (!interpretation.evidenceIds || interpretation.evidenceIds.length === 0) {
      errors.push('Interpretation has no evidence IDs - REJECTED');
      return {
        isValid: false,
        errors,
        warnings,
        validEvidence,
        invalidEvidence,
      };
    }

    // Validate each evidence ID
    for (const evidenceId of interpretation.evidenceIds) {
      const event = eventMap.get(evidenceId);
      if (event) {
        validEvidence.push({
          eventId: event.id,
          date: event.date || '',
          description: event.title,
          sourceRecordId: event.sourceRecordId,
          sourceDocumentName: event.sourceDocumentName,
        });
      } else {
        invalidEvidence.push({
          eventId: evidenceId,
          date: '',
          description: '',
          sourceRecordId: '',
          sourceDocumentName: 'Unknown',
        });
        errors.push(`Evidence ID ${evidenceId} does not exist in timeline - REJECTED`);
      }
    }

    // If any evidence ID is invalid, reject the entire interpretation
    if (invalidEvidence.length > 0) {
      errors.push(`Interpretation contains ${invalidEvidence.length} invalid evidence IDs - REJECTED`);
      return {
        isValid: false,
        errors,
        warnings,
        validEvidence,
        invalidEvidence,
      };
    }

    return {
      isValid: errors.length === 0 && validEvidence.length > 0,
      errors,
      warnings,
      validEvidence,
      invalidEvidence,
    };
  }

  /**
   * Convert observation to ClinicalSignal
   */
  private convertObservationToSignal(
    observation: ModelSignalResponse['observations'][0],
    validEvidence: SignalEvidence[],
    patientId: string,
    modelName: string
  ): ClinicalSignal {
    // Extract title from text (first sentence or first 50 chars)
    const title = observation.text.split('.')[0].substring(0, 50) + (observation.text.length > 50 ? '...' : '');
    
    return {
      id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      category: observation.category as any,
      title: title,
      summary: observation.text,
      evidence: validEvidence,
      possibleExplanations: [],
      questionsForReview: [],
      strength: 'medium' as const,
      strengthReason: 'Based on documented observations',
      generatedAt: new Date().toISOString(),
      modelName,
      relatedPatternIds: [],
    };
  }

  /**
   * Convert interpretation to ClinicalSignal
   */
  private convertInterpretationToSignal(
    interpretation: ModelSignalResponse['interpretations'][0],
    validEvidence: SignalEvidence[],
    patientId: string,
    modelName: string
  ): ClinicalSignal {
    // Extract title from text (first sentence or first 50 chars)
    const title = interpretation.text.split('.')[0].substring(0, 50) + (interpretation.text.length > 50 ? '...' : '');
    
    return {
      id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      category: interpretation.category as any,
      title: title,
      summary: interpretation.text,
      whatWasDetected: interpretation.whatWasDetected || undefined,
      whatIsTheIssue: interpretation.whatIsTheIssue || undefined,
      evidence: validEvidence,
      possibleExplanations: [],
      questionsForReview: [],
      strength: interpretation.confidence === 'high' ? 'high' : interpretation.confidence === 'low' ? 'low' : 'medium',
      strengthReason: `AI confidence: ${interpretation.confidence}`,
      generatedAt: new Date().toISOString(),
      modelName,
      relatedPatternIds: [],
    };
  }

  /**
   * Check if a signal contains diagnostic language
   */
  containsDiagnosticLanguage(text: string): boolean {
    const diagnosticTerms = [
      'diagnosed with',
      'has ',
      'suffers from',
      'confirmed',
      'definitive',
      'certainly',
      'definitely',
    ];

    const lowerText = text.toLowerCase();
    return diagnosticTerms.some(term => lowerText.includes(term)) &&
           !lowerText.includes('possible') &&
           !lowerText.includes('suspected') &&
           !lowerText.includes('may') &&
           !lowerText.includes('might') &&
           !lowerText.includes('could');
  }

  /**
   * Validate structured Ollama output against JSON schema
   */
  validateStructuredOutput(output: unknown): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!output || typeof output !== 'object') {
      errors.push({
        type: 'invalid_json',
        message: 'Output is not a valid object',
        severity: 'error',
      });
      return { isValid: false, errors };
    }

    const structured = output as StructuredOllamaOutput;

    // Validate required fields
    if (!structured.summary || typeof structured.summary !== 'string') {
      errors.push({
        type: 'missing_required_field',
        field: 'summary',
        message: 'Summary is required and must be a string',
        severity: 'error',
      });
    }

    if (!structured.observations || !Array.isArray(structured.observations)) {
      errors.push({
        type: 'missing_required_field',
        field: 'observations',
        message: 'Observations is required and must be an array',
        severity: 'error',
      });
    }

    if (!structured.interpretations || !Array.isArray(structured.interpretations)) {
      errors.push({
        type: 'missing_required_field',
        field: 'interpretations',
        message: 'Interpretations is required and must be an array',
        severity: 'error',
      });
    }

    // Validate observations
    if (structured.observations) {
      structured.observations.forEach((obs, index) => {
        if (!obs.text || typeof obs.text !== 'string') {
          errors.push({
            type: 'missing_required_field',
            field: `observations[${index}].text`,
            message: 'Observation text is required',
            severity: 'error',
          });
        }
        if (!obs.evidenceIds || !Array.isArray(obs.evidenceIds)) {
          errors.push({
            type: 'missing_required_field',
            field: `observations[${index}].evidenceIds`,
            message: 'Observation evidenceIds is required',
            severity: 'error',
          });
        }
      });
    }

    // Validate interpretations
    if (structured.interpretations) {
      structured.interpretations.forEach((interp, index) => {
        if (!interp.text || typeof interp.text !== 'string') {
          errors.push({
            type: 'missing_required_field',
            field: `interpretations[${index}].text`,
            message: 'Interpretation text is required',
            severity: 'error',
          });
        }
        if (!interp.evidenceIds || !Array.isArray(interp.evidenceIds)) {
          errors.push({
            type: 'missing_required_field',
            field: `interpretations[${index}].evidenceIds`,
            message: 'Interpretation evidenceIds is required',
            severity: 'error',
          });
        }
        if (!interp.confidence || !['high', 'moderate', 'low'].includes(interp.confidence)) {
          errors.push({
            type: 'invalid_enum_value',
            field: `interpretations[${index}].confidence`,
            message: 'Interpretation confidence must be high, moderate, or low',
            severity: 'error',
            actualValue: interp.confidence,
            expectedValue: 'high | moderate | low',
          });
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate evidence IDs against actual events
   */
  validateEvidenceIds(evidenceIds: string[], events: MedicalEvent[]): { isValid: boolean; invalidIds: string[] } {
    const eventIds = new Set(events.map(e => e.id));
    const invalidIds: string[] = [];

    for (const evidenceId of evidenceIds) {
      if (!eventIds.has(evidenceId)) {
        invalidIds.push(evidenceId);
      }
    }

    return { isValid: invalidIds.length === 0, invalidIds };
  }

  /**
   * Validate numerical facts (laboratory values)
   */
  validateNumericalFact(
    statement: string,
    expectedValue: number,
    actualValue: number,
    tolerance: number = 0.01
  ): { isValid: boolean; error?: ValidationError } {
    const diff = Math.abs(expectedValue - actualValue);
    const relativeDiff = diff / Math.max(Math.abs(expectedValue), Math.abs(actualValue));

    if (relativeDiff > tolerance) {
      return {
        isValid: false,
        error: {
          type: 'numerical_mismatch',
          message: `Numerical value mismatch in statement: "${statement}"`,
          severity: 'error',
          actualValue: actualValue,
          expectedValue: expectedValue,
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Validate date claims against actual event dates
   */
  validateDateClaim(
    statement: string,
    claimedStartDate: string,
    claimedEndDate: string,
    actualEvents: MedicalEvent[]
  ): { isValid: boolean; error?: ValidationError } {
    const dates = actualEvents
      .map(e => e.date)
      .filter((d): d is string => d !== null)
      .sort();

    if (dates.length === 0) {
      return {
        isValid: false,
        error: {
          type: 'date_mismatch',
          message: 'No dates found in events to validate claim',
          severity: 'error',
        },
      };
    }

    const actualStartDate = dates[0];
    const actualEndDate = dates[dates.length - 1];

    if (claimedStartDate !== actualStartDate || claimedEndDate !== actualEndDate) {
      return {
        isValid: false,
        error: {
          type: 'date_mismatch',
          message: `Date mismatch in statement: "${statement}"`,
          severity: 'error',
          actualValue: { start: actualStartDate, end: actualEndDate },
          expectedValue: { start: claimedStartDate, end: claimedEndDate },
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Validate medication claims against actual medications
   */
  validateMedicationClaim(
    medicationName: string,
    events: MedicalEvent[]
  ): { isValid: boolean; error?: ValidationError } {
    const medicationEvents = events.filter(e => e.eventType === 'medication');
    const medicationNames = new Set(
      medicationEvents.map(e => e.title.toLowerCase())
    );

    if (!medicationNames.has(medicationName.toLowerCase())) {
      return {
        isValid: false,
        error: {
          type: 'medication_not_found',
          message: `Medication "${medicationName}" not found in patient history`,
          severity: 'error',
          actualValue: Array.from(medicationNames),
          expectedValue: medicationName,
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Validate diagnosis claims with qualifiers
   */
  validateDiagnosisClaim(
    diagnosisName: string,
    claimedStatus: string,
    events: MedicalEvent[]
  ): { isValid: boolean; error?: ValidationError } {
    const diagnosisEvents = events.filter(e => e.eventType === 'diagnosis');
    
    for (const event of diagnosisEvents) {
      if (event.title.toLowerCase() === diagnosisName.toLowerCase()) {
        // Check if qualifiers are preserved
        const actualStatus = (event.status || '').toLowerCase();
        const claimedStatusLower = claimedStatus.toLowerCase();
        
        // If source says "possible", model should not say "confirmed"
        if (actualStatus.includes('possible') || actualStatus.includes('suspected')) {
          if (claimedStatusLower.includes('confirmed') || claimedStatusLower.includes('definitive')) {
            return {
              isValid: false,
              error: {
                type: 'diagnosis_not_found',
                message: `Diagnosis "${diagnosisName}" was documented as "${actualStatus}" but claimed as "${claimedStatus}"`,
                severity: 'error',
                actualValue: actualStatus,
                expectedValue: claimedStatus,
              },
            };
          }
        }
        
        return { isValid: true };
      }
    }

    return {
      isValid: false,
      error: {
        type: 'diagnosis_not_found',
        message: `Diagnosis "${diagnosisName}" not found in patient history`,
        severity: 'error',
      },
    };
  }

  /**
   * Validate negation - ensure negative evidence remains negative
   */
  validateNegation(
    statement: string,
    evidenceIds: string[],
    events: MedicalEvent[]
  ): { isValid: boolean; error?: ValidationError } {
    const negationPatterns = ['denies', 'no', 'negative for', 'without', 'absence of', 'rule out'];
    
    for (const evidenceId of evidenceIds) {
      const event = events.find(e => e.id === evidenceId);
      if (event) {
        const sourceText = (event.sourceText || event.description || '').toLowerCase();
        const isNegated = negationPatterns.some(pattern => sourceText.includes(pattern));
        
        if (isNegated) {
          // Check if statement incorrectly presents as positive
          const statementLower = statement.toLowerCase();
          const positiveIndicators = ['has', 'experienced', 'suffers from', 'diagnosed with'];
          
          if (positiveIndicators.some(indicator => statementLower.includes(indicator))) {
            return {
              isValid: false,
              error: {
                type: 'negation_error',
                message: `Statement presents negated evidence as positive: "${statement}"`,
                severity: 'error',
                evidenceId: evidenceId,
              },
            };
          }
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Validate temporal claims - prevent turning separated events into continuous conditions
   */
  validateTemporalClaim(
    statement: string,
    claimedContinuity: boolean,
    events: MedicalEvent[],
    maxGapDays: number = 180
  ): { isValid: boolean; error?: ValidationError } {
    if (!claimedContinuity) {
      return { isValid: true };
    }

    const sortedEvents = events
      .filter(e => e.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    if (sortedEvents.length === 0) {
      return { isValid: true };
    }

    // Check if events are too old to be considered current
    const now = new Date();
    const latestEvent = sortedEvents[sortedEvents.length - 1];
    const latestDate = new Date(latestEvent.date!);
    const daysSinceLatest = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24);

    // If the latest event is more than 1 year old, it's likely historical
    if (daysSinceLatest > 365) {
      return {
        isValid: false,
        error: {
          type: 'temporal_error',
          message: `Statement claims current condition but latest event is ${Math.round(daysSinceLatest)} days old: "${statement}"`,
          severity: 'error',
          actualValue: `${Math.round(daysSinceLatest)} days ago`,
          expectedValue: 'Recent event (within 1 year)',
        },
      };
    }

    if (sortedEvents.length < 2) {
      return { isValid: true };
    }

    // Check for gaps
    for (let i = 1; i < sortedEvents.length; i++) {
      const prevDate = new Date(sortedEvents[i - 1].date!);
      const currDate = new Date(sortedEvents[i].date!);
      const gapDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (gapDays > maxGapDays) {
        return {
          isValid: false,
          error: {
            type: 'temporal_error',
            message: `Statement claims continuity but events have ${Math.round(gapDays)}-day gap: "${statement}"`,
            severity: 'error',
            actualValue: `${Math.round(gapDays)} days`,
            expectedValue: `≤ ${maxGapDays} days`,
          },
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate causality - prevent correlation from becoming causation
   */
  validateCausality(statement: string): { isValid: boolean; error?: ValidationError } {
    const causalPatterns = [
      'caused',
      'causes',
      'due to',
      'resulted in',
      'led to',
      'because of',
    ];

    const statementLower = statement.toLowerCase();
    const hasCausalLanguage = causalPatterns.some(pattern => statementLower.includes(pattern));

    if (hasCausalLanguage) {
      return {
        isValid: false,
        error: {
          type: 'causality_violation',
          message: `Statement contains causal language without explicit source documentation: "${statement}"`,
          severity: 'error',
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Validate probability claims - prevent unsupported probabilities
   */
  validateProbabilityClaim(statement: string): { isValid: boolean; error?: ValidationError } {
    const probabilityPatterns = [
      /\d+%/,
      /\d+\s*percent/,
      'high probability',
      'low probability',
      'almost certainly',
      'definitely',
      'certainly',
    ];

    const statementLower = statement.toLowerCase();
    const hasProbability = probabilityPatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return statementLower.includes(pattern);
      }
      return pattern.test(statementLower);
    });

    if (hasProbability) {
      return {
        isValid: false,
        error: {
          type: 'unsupported_probability',
          message: `Statement contains unsupported probability claim: "${statement}"`,
          severity: 'error',
        },
      };
    }

    return { isValid: true };
  }

  /**
   * Assess data quality
   */
  assessDataQuality(events: MedicalEvent[], records: number): DataQualityAssessment {
    const missingDates = events.filter(e => {
      if (!e.date) return true;
      // Check if date is valid
      const date = new Date(e.date);
      return isNaN(date.getTime());
    }).length;
    const missingFields = events.filter(e => !e.description || !e.title).length;
    const duplicateRecords = events.filter(e => e.metadata.isDuplicate).length;
    
    // Calculate date range
    const dates = events.map(e => e.date).filter((d): d is string => d !== null);
    let dateRange = { earliest: null as string | null, latest: null as string | null };
    let yearsRepresented = 0;

    if (dates.length > 0) {
      const sortedDates = dates.sort();
      dateRange.earliest = sortedDates[0];
      dateRange.latest = sortedDates[sortedDates.length - 1];
      
      const earliestYear = new Date(dateRange.earliest).getFullYear();
      const latestYear = new Date(dateRange.latest).getFullYear();
      yearsRepresented = latestYear - earliestYear + 1;
    }

    // Simple OCR quality assessment - detect potential OCR issues
    let ocrQuality: DataConfidence = 'high';
    for (const event of events) {
      const text = (event.sourceText || event.description || '').toLowerCase();
      // Check for common OCR error patterns
      if (/\d+[a-z]/i.test(text) || /[a-z]\d+/i.test(text)) {
        // Numbers mixed with letters (e.g., "14S" instead of "145")
        ocrQuality = 'low';
        break;
      }
    }

    const extractionQuality: DataConfidence = missingDates / events.length > 0.2 ? 'moderate' : 'high';

    // Detect conflicts (placeholder)
    const conflictingValues = 0;

    const recordCompleteness = records > 0 ? (records - missingFields) / records : 1;

    return {
      recordCompleteness,
      ocrQuality,
      extractionQuality,
      missingDateCount: missingDates,
      missingFieldCount: missingFields,
      duplicateRecordCount: duplicateRecords,
      conflictingValueCount: conflictingValues,
      totalRecordsProcessed: records,
      yearsRepresented,
      dateRange,
    };
  }

  /**
   * Detect conflicting values
   */
  detectConflicts(events: MedicalEvent[]): ConflictDetection {
    const conflicts: ConflictDetection['conflicts'] = [];

    // Group by event type and title
    const grouped = new Map<string, MedicalEvent[]>();
    for (const event of events) {
      const key = `${event.eventType}-${event.title}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(event);
    }

    // Check for conflicts within groups
    for (const [key, groupEvents] of grouped) {
      if (groupEvents.length > 1) {
        // Check for conflicting values (simplified check)
        const values = groupEvents.map(e => e.description);
        const uniqueValues = new Set(values);
        
        if (uniqueValues.size > 1) {
          conflicts.push({
            field: key,
            eventIds: groupEvents.map(e => e.id),
            values: Array.from(uniqueValues),
            dates: groupEvents.map(e => e.date || 'unknown'),
            sources: groupEvents.map(e => e.sourceDocumentName),
          });
        }
      }
    }

    return { conflicts, totalConflicts: conflicts.length };
  }

  /**
   * Detect duplicate records
   */
  detectDuplicates(events: MedicalEvent[]): DuplicateDetection {
    const duplicateGroups: DuplicateDetection['duplicateGroups'] = [];
    const seen = new Map<string, string[]>();

    for (const event of events) {
      const key = `${event.eventType}-${event.title}-${event.date}`;
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(event.id);
    }

    for (const [_key, eventIds] of seen) {
      if (eventIds.length > 1) {
        duplicateGroups.push({
          groupId: `dup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          eventIds,
          similarity: 1.0,
          reason: 'Exact match on type, title, and date',
        });
      }
    }

    return { duplicateGroups, totalDuplicates: duplicateGroups.length };
  }

  /**
   * Create validation log
   */
  createValidationLog(
    analysisId: string,
    model: string,
    validatedStatements: number,
    rejectedStatements: number,
    validationStatus: ValidationStatus,
    validationErrors: ValidationError[],
    processingTimeMs: number
  ): ValidationLog {
    const log: ValidationLog = {
      analysisId,
      model,
      validatedStatements,
      rejectedStatements,
      validationStatus,
      timestamp: new Date().toISOString(),
      knowledgeVersion: 'development-0.1',
      semanticVersion: 'development-0.1',
      validationErrors,
      processingTimeMs,
    };

    this.validationLogs.push(log);
    return log;
  }

  /**
   * Get validation logs
   */
  getValidationLogs(): ValidationLog[] {
    return [...this.validationLogs];
  }

  /**
   * Clear validation logs
   */
  clearValidationLogs(): void {
    this.validationLogs = [];
  }

  /**
   * Validate and filter statements - partial analysis support
   * Returns only validated statements, rejects invalid ones
   */
  validateAndFilterStatements(
    statements: Array<{ text: string; evidenceIds: string[]; confidence?: string }>,
    events: MedicalEvent[]
  ): { validated: ValidatedStatement[]; rejected: ValidatedStatement[]; validationStatus: ValidationStatus } {
    const validated: ValidatedStatement[] = [];
    const rejected: ValidatedStatement[] = [];

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const errors: ValidationError[] = [];
      let isValid = true;

      // Validate evidence IDs
      const evidenceValidation = this.validateEvidenceIds(stmt.evidenceIds, events);
      if (!evidenceValidation.isValid) {
        isValid = false;
        errors.push({
          type: 'invalid_evidence_id',
          message: `Invalid evidence IDs: ${evidenceValidation.invalidIds.join(', ')}`,
          severity: 'error',
        });
      }

      // Validate negation
      const negationValidation = this.validateNegation(stmt.text, stmt.evidenceIds, events);
      if (!negationValidation.isValid && negationValidation.error) {
        isValid = false;
        errors.push(negationValidation.error);
      }

      // Validate causality
      const causalityValidation = this.validateCausality(stmt.text);
      if (!causalityValidation.isValid && causalityValidation.error) {
        isValid = false;
        errors.push(causalityValidation.error);
      }

      // Validate probability claims
      const probabilityValidation = this.validateProbabilityClaim(stmt.text);
      if (!probabilityValidation.isValid && probabilityValidation.error) {
        isValid = false;
        errors.push(probabilityValidation.error);
      }

      const validatedStatement: ValidatedStatement = {
        id: `stmt-${Date.now()}-${i}`,
        text: stmt.text,
        layer: 'ai_interpretation',
        evidenceIds: stmt.evidenceIds,
        validationStatus: isValid ? 'valid' : 'invalid',
        validationErrors: errors,
        confidence: (stmt.confidence as AIInterpretationConfidence) || 'moderate',
        category: 'interpretation',
      };

      if (isValid) {
        validated.push(validatedStatement);
      } else {
        rejected.push(validatedStatement);
      }
    }

    // Determine overall validation status
    let validationStatus: ValidationStatus = 'valid';
    if (validated.length === 0 && rejected.length > 0) {
      validationStatus = 'invalid';
    } else if (rejected.length > 0) {
      validationStatus = 'partial';
    }

    return { validated, rejected, validationStatus };
  }

  /**
   * Validate complete Ollama output with all checks
   */
  validateCompleteOutput(
    output: unknown,
    events: MedicalEvent[]
  ): { isValid: boolean; validatedStatements: ValidatedStatement[]; rejectedStatements: ValidatedStatement[]; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // Step 1: Validate JSON schema
    const schemaValidation = this.validateStructuredOutput(output);
    if (!schemaValidation.isValid) {
      errors.push(...schemaValidation.errors);
      return {
        isValid: false,
        validatedStatements: [],
        rejectedStatements: [],
        errors,
      };
    }

    const structured = output as StructuredOllamaOutput;

    // Step 2: Validate observations
    const observationsResult = this.validateAndFilterStatements(
      structured.observations.map(obs => ({
        text: obs.text,
        evidenceIds: obs.evidenceIds,
        confidence: 'high',
      })),
      events
    );

    // Step 3: Validate interpretations
    const interpretationsResult = this.validateAndFilterStatements(
      structured.interpretations.map(interp => ({
        text: interp.text,
        evidenceIds: interp.evidenceIds,
        confidence: interp.confidence,
      })),
      events
    );

    const allValidated = [
      ...observationsResult.validated.map(s => ({ ...s, category: 'observation' as const })),
      ...interpretationsResult.validated.map(s => ({ ...s, category: 'interpretation' as const })),
    ];

    const allRejected = [
      ...observationsResult.rejected.map(s => ({ ...s, category: 'observation' as const })),
      ...interpretationsResult.rejected.map(s => ({ ...s, category: 'interpretation' as const })),
    ];

    const isValid = allRejected.length === 0;

    return {
      isValid,
      validatedStatements: allValidated,
      rejectedStatements: allRejected,
      errors: allRejected.flatMap(s => s.validationErrors),
    };
  }
}
