export interface Patient {
  id: string;
  name: string;
  age: number;
  yearsOfHistory: number;
}

export type DocumentType = 
  | 'Lab Report'
  | 'Prescription'
  | 'Diagnosis'
  | 'Discharge Summary'
  | 'Consultation Note'
  | 'Imaging Report'
  | 'Hospital Visit'
  | 'Other'
  | 'Unknown';

export type ProcessingStatus = 'ready' | 'uploading' | 'uploaded' | 'processing' | 'ocr_processing' | 'extracting' | 'extracted' | 'extraction_incomplete' | 'extraction_failed' | 'failed';

export type FileType = 'PDF' | 'PNG' | 'JPG' | 'JPEG';

export interface MedicalRecord {
  id: string;
  patientId: string;
  filename: string;
  documentType: DocumentType;
  fileType: FileType;
  fileSize: number;
  uploadedAt: string;
  recordDate: string | null;
  processingStatus: ProcessingStatus;
  processingError?: string;
  source: 'upload' | 'import';
  extractedText?: string;
  structuredExtraction?: StructuredExtraction;
  metadata?: Record<string, unknown>;
  description?: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  type: 'consultation' | 'symptom' | 'lab' | 'diagnosis' | 'follow-up' | 'prescription' | 'hospital' | 'other';
}

// Unified Medical Event Model for Phase 5
export type MedicalEventType = 
  | 'symptom'
  | 'diagnosis'
  | 'laboratory'
  | 'medication'
  | 'procedure'
  | 'hospital_visit'
  | 'consultation'
  | 'finding'
  | 'other';

export interface MedicalEvent {
  id: string;
  patientId: string;
  eventType: MedicalEventType;
  title: string;
  description: string | null;
  date: string | null;
  endDate: string | null;
  status: string | null;
  severity: string | null;
  sourceRecordId: string;
  sourceDocumentName: string;
  sourceText: string | null;
  metadata: {
    encounterId?: string;
    relatedEventIds?: string[];
    isDuplicate?: boolean;
    duplicateOf?: string;
    pageNumber?: number;
  };
}

// Pattern Detection Model for Phase 6
export type PatternType = 
  | 'recurring_symptom'
  | 'persistent_finding'
  | 'repeated_lab_abnormality'
  | 'symptom_co_occurrence'
  | 'cross_domain_pattern'
  | 'multi_year_recurrence'
  | 'potential_unresolved_issue'
  | 'repeated_visits';

export interface PatternEvidence {
  eventId: string;
  date: string | null;
  description: string;
  sourceRecordId: string;
  sourceDocumentName: string;
}

export interface Pattern {
  id: string;
  patientId: string;
  patternType: PatternType;
  title: string;
  description: string;
  firstObserved: string | null;
  lastObserved: string | null;
  occurrenceCount: number;
  eventIds: string[];
  sourceRecordIds: string[];
  evidence: PatternEvidence[];
  confidence: null; // Explicitly null - no AI confidence scores
  severity: null; // Explicitly null - no automatic severity
  metadata: {
    timeSpanYears: number | null;
    uniqueEncounters: number;
    relatedPatterns?: string[];
  };
}

// Clinical Signal Model for Phase 7 - Ollama-generated insights
export type SignalCategory = 
  | 'recurring_pattern'
  | 'cross_domain_relationship'
  | 'persistent_finding'
  | 'potential_unresolved'
  | 'unusual_combination'
  | 'temporal_trend'
  | 'gap_in_care'
  | 'other';

export interface SignalEvidence {
  eventId: string;
  date: string | null;
  description: string;
  sourceRecordId: string;
  sourceDocumentName: string;
}

export interface ClinicalSignal {
  id: string;
  patientId: string;
  category: SignalCategory;
  title: string;
  summary: string;
  whatWasDetected?: string;
  whatIsTheIssue?: string;
  evidence: SignalEvidence[];
  possibleExplanations: string[];
  questionsForReview: string[];
  strength: 'low' | 'medium' | 'high';
  strengthReason: string;
  generatedAt: string;
  modelName: string;
  relatedPatternIds: string[];
}

// Candidate Condition Model for Phase 8
export interface CandidateCondition {
  id: string;
  name: string;
  category: string;
  description: string;
  associatedSymptoms: string[];
  associatedLabs: Array<{
    testName: string;
    expectedPattern: 'low' | 'high' | 'abnormal' | 'normal';
  }>;
  associatedPatterns: string[];
  requiredEvidence: string[];
  contradictingFeatures: string[];
  source?: string;
  version: string;
}

// Candidate Review Model for Phase 8
export type MatchLevel = 'strong' | 'moderate' | 'weak' | 'insufficient';

export interface CandidateEvidence {
  eventId: string;
  date: string | null;
  description: string;
  sourceRecordId: string;
  sourceDocumentName: string;
  matchType: 'symptom' | 'lab' | 'pattern' | 'other';
}

export interface CandidateReview {
  id: string;
  patientId: string;
  candidateId: string;
  candidateName: string;
  matchLevel: MatchLevel;
  evidenceMatchScore: number; // Internal score, not a probability
  summary: string;
  supportingEvidence: CandidateEvidence[];
  contradictingEvidence: CandidateEvidence[];
  missingInformation: string[];
  longitudinalReasoning: string;
  reviewQuestions: string[];
  generatedAt: string;
  modelName: string;
  knowledgeVersion: string;
  status: 'pending' | 'reviewing' | 'reviewed' | 'dismissed';
  dismissalReason?: string;
}

// Evidence Graph Model for Phase 9
export type EvidenceNodeType = 'patient' | 'event' | 'pattern' | 'candidate' | 'source_record' | 'missing_evidence' | 'care_gap' | 'semantic_concept';

export type EvidenceRelationshipType = 
  | 'derived_from'      // Pattern → Event
  | 'supported_by'       // Candidate → Pattern
  | 'observed_in'       // Event → Source Record
  | 'associated_with'    // Event → Event (when documented together)
  | 'contradicts'       // Candidate → Evidence
  | 'missing_evidence_for' // Candidate → Missing evidence
  | 'indicates'         // Care Gap → Event/Pattern
  | 'semantically_related'; // Semantic Concept → Event

export type EvidenceStrength = 'strong' | 'moderate' | 'weak' | 'insufficient';

export interface EvidenceNode {
  id: string;
  type: EvidenceNodeType;
  patientId: string;
  title: string;
  description?: string;
  date?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EvidenceRelationship {
  id: string;
  patientId: string;
  sourceType: EvidenceNodeType;
  sourceId: string;
  targetType: EvidenceNodeType;
  targetId: string;
  relationshipType: EvidenceRelationshipType;
  strength?: EvidenceStrength;
  reason?: string;
  sourceCount?: number;
  temporalDistance?: string; // e.g., "3 years", "2 months"
  metadata?: Record<string, unknown>;
}

export interface EvidenceGraph {
  patientId: string;
  nodes: EvidenceNode[];
  relationships: EvidenceRelationship[];
  analysisId?: string;
  generatedAt: string;
}

export interface FocusedGraphQuery {
  patientId: string;
  focusType: 'candidate' | 'pattern' | 'event' | 'time_range';
  focusId?: string;
  startDate?: string;
  endDate?: string;
  maxDepth?: number;
}

export interface AnalysisAudit {
  id: string;
  patientId: string;
  analysisType: 'clinical_signal' | 'candidate_review' | 'care_gap';
  analysisId: string;
  timestamp: string;
  modelName: string;
  knowledgeVersion?: string;
  eventIds: string[];
  patternIds: string[];
  candidateIds?: string[];
  sourceRecordIds: string[];
}

// Care Gap Model for Phase 10
export type CareGapType = 
  | 'recurring_issue'
  | 'persistent_abnormal_finding'
  | 'potential_follow_up_gap'
  | 'repeated_visits_same_issue'
  | 'treatment_followed_by_continued_issue'
  | 'investigation_without_clear_outcome'
  | 'diagnosis_without_supporting_detail'
  | 'fragmented_care'
  | 'unresolved_status';

export type CareGapStatus = 'potential' | 'documented' | 'reviewed' | 'dismissed';

export type CareGapConfidence = 'clearly_documented' | 'potential' | 'insufficient_information';

export interface CareGapEvidence {
  eventId: string;
  date: string | null;
  description: string;
  sourceRecordId: string;
  sourceDocumentName: string;
  eventType: MedicalEventType;
}

export interface CareGap {
  id: string;
  patientId: string;
  gapType: CareGapType;
  title: string;
  description: string;
  status: CareGapStatus;
  confidence: CareGapConfidence;
  firstObserved: string | null;
  lastObserved: string | null;
  occurrenceCount: number;
  eventIds: string[];
  sourceRecordIds: string[];
  evidence: CareGapEvidence[];
  missingInformation: string[];
  reviewQuestions: string[];
  analysisId: string;
  generatedAt: string;
  dismissalReason?: string;
  dismissedAt?: string;
  metadata: {
    timeSpanYears: number | null;
    uniqueEncounters: number;
    temporalWindow?: string;
    isExplicitFollowUp?: boolean;
    relatedPatternIds?: string[];
  };
}

export interface Symptom {
  id: string;
  name: string;
  firstObserved: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  date: string;
  isAbnormal: boolean;
}

export interface Diagnosis {
  id: string;
  name: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'chronic';
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  startDate: string;
  endDate?: string;
}

export interface Signal {
  id: string;
  type: 'SIGNAL DETECTED' | 'PERSISTENT FINDING' | 'PATTERN';
  title: string;
  description: string;
  observedYears: number[];
  severity: 'low' | 'medium' | 'high';
}

// Structured Medical Extraction Types
export interface ExtractedPatientInfo {
  name: string | null;
  dateOfBirth: string | null;
  age: number | null;
  sex: string | null;
  patientId: string | null;
}

export interface ExtractedEncounter {
  date: string | null;
  type: string | null;
  facility: string | null;
  department: string | null;
  reason: string | null;
}

export interface ExtractedSymptom {
  name: string;
  date: string | null;
  duration: string | null;
  severity: string | null;
  certainty: 'present' | 'absent' | 'possible' | 'suspected' | 'denied';
  status: string | null;
  datePrecision?: 'exact' | 'approximate' | 'year_only' | 'unknown';
  sourceText: string;
}

export interface ExtractedDiagnosis {
  name: string;
  date: string | null;
  status: 'active' | 'historical' | 'resolved' | 'suspected' | 'possible' | 'ruled_out' | 'ongoing' | 'chronic';
  certainty: 'confirmed' | 'suspected' | 'possible' | 'ruled_out';
  datePrecision?: 'exact' | 'approximate' | 'year_only' | 'unknown';
  sourceText: string;
}

export interface ExtractedLabResult {
  testName: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean | null;
  date: string | null;
  datePrecision?: 'exact' | 'approximate' | 'year_only' | 'unknown';
  sourceText: string;
  validated?: boolean; // Flag to indicate if test/value/unit match was validated
}

export interface ExtractedMedication {
  name: string;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  startDate: string | null;
  endDate: string | null;
  duration: string | null;
  status?: 'active' | 'discontinued' | 'completed' | 'ongoing';
  sourceText: string;
}

export interface ExtractedProcedure {
  name: string;
  date: string | null;
  result: string | null;
  finding: string | null;
  status?: 'completed' | 'planned' | 'ongoing' | 'resolved';
  datePrecision?: 'exact' | 'approximate' | 'year_only' | 'unknown';
  sourceText: string;
}

export interface ExtractedAllergy {
  name: string;
  severity: string | null;
  reaction: string | null;
  status: 'active' | 'resolved' | 'historical';
  sourceText: string;
}

export interface ExtractedReferral {
  specialty: string;
  reason: string | null;
  date: string | null;
  status: 'pending' | 'completed' | 'unknown';
  sourceText: string;
}

export interface ExtractedFollowUp {
  type: string;
  reason: string | null;
  date: string | null;
  status: 'pending' | 'completed' | 'unknown';
  sourceText: string;
}

export interface ExtractedInvestigationPlan {
  testName: string;
  reason: string | null;
  plannedDate: string | null;
  status: 'planned' | 'completed' | 'unknown';
  sourceText: string;
}

export interface ExtractedOutcome {
  description: string;
  category: 'procedure_outcome' | 'treatment_response' | 'resolution_status' | 'other';
  date: string | null;
  sourceText: string;
}

export interface ExtractedMedicalHistory {
  condition: string;
  type: 'condition' | 'surgery' | 'hospitalization' | 'other';
  date: string | null;
  status: string | null;
  sourceText: string;
}

export interface StructuredExtraction {
  patient: ExtractedPatientInfo;
  encounter: ExtractedEncounter;
  symptoms: ExtractedSymptom[];
  diagnoses: ExtractedDiagnosis[];
  labResults: ExtractedLabResult[];
  medications: ExtractedMedication[];
  procedures: ExtractedProcedure[];
  findings: string[];
  allergies: ExtractedAllergy[];
  referrals: ExtractedReferral[];
  followUps: ExtractedFollowUp[];
  investigationPlans: ExtractedInvestigationPlan[];
  outcomes: ExtractedOutcome[];
  medicalHistory: ExtractedMedicalHistory[];
  sourceRecordId: string;
  extractedAt: string;
}

// Semantic Medical Event Linking Model for Phase 12

export type SemanticRelationshipStrength = 'high' | 'medium' | 'low';

export type SemanticMatchingMethod = 
  | 'deterministic_dictionary'
  | 'normalization'
  | 'synonym_mapping'
  | 'embedding_similarity'
  | 'ollama_review';

export type TemporalQualifier = 
  | 'current'
  | 'historical'
  | 'resolved'
  | 'recurrent'
  | 'intermittent'
  | 'chronic'
  | 'acute'
  | 'previous'
  | 'unknown';

export type ConceptType = 
  | 'symptom'
  | 'diagnosis'
  | 'laboratory'
  | 'medication'
  | 'procedure'
  | 'finding';

export interface CanonicalConcept {
  id: string;
  canonicalName: string;
  conceptType: ConceptType;
  synonyms: string[];
  variants: string[];
  version: string;
}

export interface SemanticRelationship {
  id: string;
  patientId: string;
  sourceEventId: string;
  targetEventId: string;
  canonicalConceptId: string;
  canonicalConceptName: string;
  relationshipStrength: SemanticRelationshipStrength;
  matchingMethod: SemanticMatchingMethod;
  similarityScore?: number; // 0-1 for embedding-based matches
  originalTextSource: string;
  originalTextTarget: string;
  sourceDocumentName: string;
  targetDocumentName: string;
  sourceDate: string | null;
  targetDate: string | null;
  temporalQualifier: TemporalQualifier;
  isNegated: boolean;
  isHistorical: boolean;
  isResolved: boolean;
  status: 'pending' | 'confirmed' | 'rejected';
  reviewerAction?: 'confirm' | 'reject';
  reviewerReason?: string;
  reviewedAt?: string;
  analysisVersion: string;
  generatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Episode {
  id: string;
  patientId: string;
  canonicalConceptId: string;
  canonicalConceptName: string;
  conceptType: ConceptType;
  startDate: string | null;
  endDate: string | null;
  eventIds: string[];
  sourceRecordIds: string[];
  temporalQualifier: TemporalQualifier;
  episodeType: 'single' | 'continuous' | 'recurrent';
  breakReason?: string; // e.g., "explicit resolution", "long gap", "contradictory documentation"
  generatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface SemanticAnalysis {
  id: string;
  patientId: string;
  canonicalConcepts: CanonicalConcept[];
  semanticRelationships: SemanticRelationship[];
  episodes: Episode[];
  analysisVersion: string;
  generatedAt: string;
  eventIds: string[];
  sourceRecordIds: string[];
}

export interface SemanticReviewDecision {
  id: string;
  relationshipId: string;
  action: 'confirm' | 'reject';
  reason: string;
  reviewerId: string;
  timestamp: string;
  analysisVersion: string;
}

export interface SemanticThresholds {
  highSimilarity: number; // e.g., 0.85
  mediumSimilarity: number; // e.g., 0.70
  lowSimilarity: number; // e.g., 0.50
  maxEpisodeGapDays: number; // e.g., 180 days
}

// ============================================================================
// PHASE 13: Trust, Evidence Validation & AI Reliability Types
// ============================================================================

/**
 * Evidence validation status
 */
export type ValidationStatus = 'valid' | 'invalid' | 'partial' | 'pending' | 'failed';

/**
 * Confidence levels for data, evidence, and AI interpretations
 */
export type DataConfidence = 'high' | 'moderate' | 'low';
export type AIInterpretationConfidence = 'high' | 'moderate' | 'low';

/**
 * Statement layer type for three-layer UI
 */
export type StatementLayer = 'documented' | 'detected_pattern' | 'ai_interpretation';

/**
 * Validation error types
 */
export type ValidationErrorType =
  | 'invalid_json'
  | 'missing_required_field'
  | 'invalid_data_type'
  | 'invalid_enum_value'
  | 'max_length_exceeded'
  | 'invalid_evidence_id'
  | 'invalid_candidate_id'
  | 'invalid_event_id'
  | 'numerical_mismatch'
  | 'date_mismatch'
  | 'medication_not_found'
  | 'diagnosis_not_found'
  | 'negation_error'
  | 'temporal_error'
  | 'causality_violation'
  | 'unsupported_probability'
  | 'missing_evidence'
  | 'contradictory_evidence'
  | 'hallucination_detected';

/**
 * Single validation error
 */
export interface ValidationError {
  type: ValidationErrorType;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
  actualValue?: unknown;
  expectedValue?: unknown;
  evidenceId?: string;
}

/**
 * Validated AI statement
 */
export interface ValidatedStatement {
  id: string;
  text: string;
  layer: StatementLayer;
  evidenceIds: string[];
  validationStatus: ValidationStatus;
  validationErrors: ValidationError[];
  confidence: AIInterpretationConfidence;
  category?: 'observation' | 'interpretation' | 'summary';
  metadata?: Record<string, unknown>;
}

/**
 * Data quality assessment
 */
export interface DataQualityAssessment {
  recordCompleteness: number; // 0-1 percentage
  ocrQuality: DataConfidence;
  extractionQuality: DataConfidence;
  missingDateCount: number;
  missingFieldCount: number;
  duplicateRecordCount: number;
  conflictingValueCount: number;
  totalRecordsProcessed: number;
  yearsRepresented: number;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
}

/**
 * Conflict detection result
 */
export interface ConflictDetection {
  conflicts: Array<{
    field: string;
    eventIds: string[];
    values: unknown[];
    dates: string[];
    sources: string[];
  }>;
  totalConflicts: number;
}

/**
 * Duplicate detection result
 */
export interface DuplicateDetection {
  duplicateGroups: Array<{
    groupId: string;
    eventIds: string[];
    similarity: number;
    reason: string;
  }>;
  totalDuplicates: number;
}

/**
 * Validation log entry
 */
export interface ValidationLog {
  analysisId: string;
  model: string;
  validatedStatements: number;
  rejectedStatements: number;
  validationStatus: ValidationStatus;
  timestamp: string;
  knowledgeVersion: string;
  semanticVersion: string;
  validationErrors: ValidationError[];
  processingTimeMs: number;
}

/**
 * Structured Ollama output schema
 */
export interface StructuredOllamaOutput {
  summary: string;
  observations: Array<{
    text: string;
    evidenceIds: string[];
    category?: 'symptom' | 'diagnosis' | 'laboratory' | 'medication' | 'pattern' | 'other';
  }>;
  interpretations: Array<{
    text: string;
    evidenceIds: string[];
    confidence: 'high' | 'moderate' | 'low';
    category?: string;
  }>;
  questionsForReview?: string[];
  missingInformation?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * User feedback on AI interpretation
 */
export interface AIInterpretationFeedback {
  id: string;
  statementId: string;
  analysisId: string;
  feedback: 'helpful' | 'not_supported' | 'incorrect';
  reason?: 'wrong_fact' | 'wrong_date' | 'wrong_relationship' | 'unsupported_inference' | 'other';
  details?: string;
  timestamp: string;
  reviewerId: string;
}

/**
 * Evaluation test case
 */
export interface EvaluationTestCase {
  id: string;
  name: string;
  category: 'factual_accuracy' | 'date_accuracy' | 'numerical_accuracy' | 'medication_accuracy' | 'diagnosis_accuracy' | 'negation' | 'temporal_reasoning' | 'causality' | 'evidence_references' | 'missing_evidence' | 'contradiction_handling' | 'hallucination_resistance';
  sourceRecords: string[];
  expectedFacts: Array<{
    field: string;
    value: unknown;
    eventId?: string;
  }>;
  expectedPatterns: string[];
  expectedRelationships: Array<{
    eventId1: string;
    eventId2: string;
    relationship: string;
  }>;
  forbiddenConclusions: string[];
  expectedValidationStatus: ValidationStatus;
}

/**
 * Red-team test case
 */
export interface RedTeamTest {
  id: string;
  name: string;
  category: 'prompt_injection' | 'jailbreak' | 'role_reversal' | 'context_manipulation' | 'output_manipulation' | 'adversarial_examples' | 'edge_case' | 'other';
  prompt: string;
  expectedBehavior: 'reject' | 'refuse' | 'handle_safely' | 'flag_uncertainty';
  mitigation: string;
}

// ============================================================================
// PHASE 14: LONGITUDINAL HEALTH JOURNEY RECONSTRUCTION
// ============================================================================

/**
 * Episode type
 */
export type EpisodeType = 'symptom_episode' | 'investigation_episode' | 'treatment_episode' | 'hospitalization_episode' | 'diagnosis_episode' | 'mixed_episode';

/**
 * Episode status
 */
export type EpisodeStatus = 'active_in_records' | 'resolved_in_records' | 'recurring' | 'historical' | 'uncertain';

/**
 * Health episode - a grouping of related documented events
 */
export interface HealthEpisode {
  id: string;
  patientId: string;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  status: EpisodeStatus;
  type: EpisodeType;
  eventIds: string[];
  patternIds: string[];
  sourceRecordIds: string[];
  summary: string;
  themes: string[];
  transitions: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transition type
 */
export type TransitionType = 'new_symptom' | 'recurrence' | 'investigation' | 'treatment' | 'persistence' | 'resolution' | 'reappearance' | 'escalation_in_documentation' | 'fragmentation';

/**
 * Episode transition - meaningful change between episodes
 */
export interface EpisodeTransition {
  id: string;
  patientId: string;
  fromEpisodeId: string | null;
  toEpisodeId: string | null;
  type: TransitionType;
  date: string | null;
  description: string;
  evidenceEventIds: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Longitudinal theme - pattern spanning multiple episodes
 */
export interface LongitudinalTheme {
  id: string;
  patientId: string;
  name: string;
  description: string;
  canonicalConcept: string;
  episodeIds: string[];
  eventIds: string[];
  firstObserved: string | null;
  lastObserved: string | null;
  status: 'recurring' | 'persistent' | 'historical' | 'uncertain';
  patternIds: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Open thread - unresolved issue in available history
 */
export interface OpenThread {
  id: string;
  patientId: string;
  title: string;
  description: string;
  category: 'recurring_symptom' | 'abnormal_finding' | 'investigation_without_outcome' | 'repeated_issue' | 'care_gap' | 'other';
  episodeIds: string[];
  eventIds: string[];
  firstObserved: string | null;
  lastObserved: string | null;
  severity: 'low' | 'medium' | 'high';
  relatedCareGapIds: string[];
  relatedPatternIds: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Record coverage analysis
 */
export interface RecordCoverage {
  patientId: string;
  earliestDate: string | null;
  latestDate: string | null;
  totalYears: number;
  missingPeriods: Array<{
    startDate: string;
    endDate: string;
    durationDays: number;
  }>;
  totalRecords: number;
  recordsByYear: Record<string, number>;
  completeness: 'complete' | 'mostly_complete' | 'fragmented' | 'sparse';
}

/**
 * Current documented state
 */
export interface CurrentState {
  patientId: string;
  asOfDate: string;
  summary: string;
  activeSymptoms: string[];
  activeDiagnoses: string[];
  activeMedications: string[];
  recentInvestigations: string[];
  lastRecordDate: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Temporal window configuration for episode grouping
 */
export interface TemporalWindowConfig {
  defaultGapDays: number;
  symptomGapDays: number;
  investigationGapDays: number;
  treatmentGapDays: number;
  hospitalizationGapDays: number;
  maxEpisodeDurationDays: number;
  minEpisodeEvents: number;
}

/**
 * Journey chapter - chronological section of the story
 */
export interface JourneyChapter {
  id: string;
  title: string;
  period: string;
  startDate: string;
  endDate: string;
  summary: string;
  eventIds: string[];
  episodeIds: string[];
  themeIds: string[];
  openThreadIds: string[];
}

/**
 * Health journey - complete longitudinal journey
 */
export interface HealthJourney {
  id: string;
  patientId: string;
  analysisId: string;
  overview: string;
  startDate: string | null;
  endDate: string | null;
  totalYears: number;
  episodes: HealthEpisode[];
  transitions: EpisodeTransition[];
  themes: LongitudinalTheme[];
  openThreads: OpenThread[];
  recordCoverage: RecordCoverage;
  currentState: CurrentState;
  conflicts: Array<{
    eventId1: string;
    eventId2: string;
    description: string;
  }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Journey story - narrative output from Ollama
 */
export interface JourneyStory {
  id: string;
  journeyId: string;
  patientId: string;
  overview: string;
  chapters: JourneyChapter[];
  majorThemes: Array<{
    name: string;
    description: string;
    firstObserved: string;
    lastObserved: string;
  }>;
  openThreads: Array<{
    title: string;
    description: string;
    lastObserved: string;
  }>;
  recordCoverageSummary: string;
  disclaimer: string;
  validationErrors: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  model: string;
  dataVersion: string;
  semanticVersion: string;
  knowledgeVersion: string;
  episodeVersion: string;
}

/**
 * Journey story version - for tracking analysis versions
 */
export interface JourneyStoryVersion {
  id: string;
  journeyId: string;
  patientId: string;
  version: number;
  story: JourneyStory;
  dataVersion: string;
  semanticVersion: string;
  knowledgeVersion: string;
  episodeVersion: string;
  createdAt: string;
  reason: 'initial' | 'data_change' | 'regeneration' | 'other';
}
