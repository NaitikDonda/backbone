# Phase 14: Longitudinal Health Journey Reconstruction - Architecture Documentation

## Overview

Phase 14 transforms fragmented medical records into a structured, understandable health journey. The core idea is to group individual events into higher-level episodes, identify transitions between these episodes, and detect longitudinal themes that span multiple episodes.

## Objectives

- Group medical events into meaningful health episodes using deterministic heuristics
- Detect transitions between episodes (new symptoms, recurrence, investigation, treatment, etc.)
- Identify longitudinal themes that span multiple episodes
- Detect unresolved issues (open threads) in the available history
- Generate a factual "current documented state" based on most recent records
- Analyze record coverage and identify missing periods
- Detect conflicting records
- Generate narrative journey summaries using Ollama with validation and hallucination protection
- Support story versioning for tracking changes over time

## Architecture

### Core Services

#### 1. EpisodeGroupingService (`src/services/episodeGroupingService.ts`)

**Purpose**: Groups medical events into health episodes based on temporal proximity and semantic relationships.

**Key Methods**:
- `groupEventsIntoEpisodes()`: Main method for grouping events into episodes
- `detectRecurringConcepts()`: Identifies longitudinal themes across episodes
- `detectRecurrenceAfterResolution()`: Detects recurrence after documented resolution
- `hasExplicitResolution()`: Checks for explicit resolution in event text
- `calculateGapDays()`: Calculates temporal gap between events
- `shouldStartNewEpisode()`: Determines if a new episode should start based on heuristics

**Temporal Window Configuration**:
- `defaultGapDays`: 90 days
- `symptomGapDays`: 120 days
- `investigationGapDays`: 60 days
- `treatmentGapDays`: 180 days
- `hospitalizationGapDays`: 30 days
- `maxEpisodeDurationDays`: 365 days
- `minEpisodeEvents`: 1

**Grouping Heuristics**:
1. Temporal proximity: Events within configured gap days are grouped
2. Semantic similarity: Events with similar concepts are grouped (placeholder for semantic analysis integration)
3. Event types: Different event types have different gap thresholds
4. Explicit resolution: Resolution text triggers episode boundary
5. Source records: Events from same source are more likely to be grouped

#### 2. TransitionDetectionService (`src/services/transitionDetectionService.ts`)

**Purpose**: Detects meaningful transitions between health episodes.

**Transition Types**:
- `new_symptom`: New symptom appears
- `recurrence`: Same concept reappears after resolution
- `investigation`: Laboratory or procedure episode
- `treatment`: Medication or treatment episode
- `persistence`: Same concept continues within temporal window
- `resolution`: Episode shows explicit resolution
- `reappearance`: Concept reappears after resolution
- `escalation_in_documentation`: More extensive documentation
- `fragmentation`: Significant gap in records

**Key Methods**:
- `detectTransitions()`: Main method for detecting transitions between episodes
- `detectInitialTransitions()`: Creates initial transition for first episode
- `detectTransitionBetweenEpisodes()`: Determines transition type between two episodes

#### 3. OpenThreadDetectionService (`src/services/openThreadDetectionService.ts`)

**Purpose**: Detects unresolved issues in the available history.

**Thread Categories**:
- `recurring_symptom`: Recurring symptoms without documented resolution
- `abnormal_finding`: Abnormal findings with no later result found
- `investigation_without_outcome`: Investigations without documented outcome
- `repeated_issue`: Repeated issues across several episodes

**Key Methods**:
- `detectOpenThreads()`: Main method for detecting open threads
- `detectRecurringSymptoms()`: Detects recurring symptoms without resolution
- `detectAbnormalFindings()`: Detects abnormal findings without follow-up
- `detectInvestigationsWithoutOutcome()`: Detects investigations without outcome
- `detectRepeatedIssues()`: Detects repeated issues across episodes

#### 4. CurrentStateService (`src/services/currentStateService.ts`)

**Purpose**: Generates a factual "latest documented state" based on most recent records.

**Key Methods**:
- `generateCurrentState()`: Main method for generating current state
- `extractActiveSymptoms()`: Extracts active symptoms from recent events (negation-aware)
- `extractActiveDiagnoses()`: Extracts active diagnoses (historical qualifier-aware)
- `extractActiveMedications()`: Extracts active medications (discontinuation-aware)
- `extractRecentInvestigations()`: Extracts recent investigations

**Safety Rules**:
- Does not assume current symptoms unless explicitly documented in latest records
- Preserves negation (e.g., "denies headache" ≠ "has headache")
- Preserves historical qualifiers (e.g., "history of" ≠ current)
- Preserves discontinuation markers
- Only considers events from last 6 months as "recent"

#### 5. RecordCoverageService (`src/services/recordCoverageService.ts`)

**Purpose**: Analyzes record coverage and identifies missing periods.

**Completeness Levels**:
- `complete`: ≥80% years covered, <20% gaps
- `mostly_complete`: ≥60% years covered, <40% gaps
- `fragmented`: ≥30% years covered
- `sparse`: <30% years covered

**Key Methods**:
- `analyzeRecordCoverage()`: Main method for analyzing record coverage
- `detectMissingPeriods()`: Identifies gaps >180 days
- `determineCompleteness()`: Determines completeness level based on coverage and gaps

#### 6. ConflictDetectionService (`src/services/conflictDetectionService.ts`)

**Purpose**: Identifies conflicting records where the same field has different values.

**Conflict Types**:
- Negation conflicts: "has X" vs "denies X"
- Resolution conflicts: "resolved" vs "active"
- Date conflicts: Significant date differences (>1 year)
- Status conflicts: Conflicting status values

**Key Methods**:
- `detectConflicts()`: Main method for detecting conflicts in events
- `detectDescriptionConflicts()`: Detects conflicts in descriptions
- `detectDateConflicts()`: Detects date conflicts
- `detectStatusConflicts()`: Detects status conflicts
- `detectEpisodeConflicts()`: Detects conflicts within episodes

**Note**: Does not automatically resolve conflicts - flags them for user review.

#### 7. LongitudinalStoryService (`src/services/longitudinalStoryService.ts`)

**Purpose**: Orchestrates all journey reconstruction services to create a complete HealthJourney.

**Key Methods**:
- `generateHealthJourney()`: Main method that orchestrates all services
- `regenerateHealthJourney()`: Regenerates journey when data changes
- `getJourneySummary()`: Returns summary statistics
- `getEpisodesByType()`: Filters episodes by type
- `getEpisodesByStatus()`: Filters episodes by status
- `getActiveEpisodes()`: Returns active episodes
- `getHighSeverityThreads()`: Returns high-severity open threads

**Journey Generation Pipeline**:
1. Group events into episodes (EpisodeGroupingService)
2. Detect transitions between episodes (TransitionDetectionService)
3. Detect longitudinal themes (EpisodeGroupingService)
4. Detect open threads (OpenThreadDetectionService)
5. Generate current state (CurrentStateService)
6. Analyze record coverage (RecordCoverageService)
7. Detect conflicts (ConflictDetectionService)
8. Generate overview
9. Calculate date range
10. Link episodes to themes and transitions

#### 8. JourneyStoryValidationService (`src/services/journeyStoryValidationService.ts`)

**Purpose**: Validates AI-generated journey stories using the existing validation layer from Phase 13.

**Validation Checks**:
- Chapter event IDs: Validates that all referenced event IDs exist in the journey
- Chapter episode IDs: Validates that all referenced episode IDs exist in the journey
- Chapter dates: Validates date ranges and chronological order
- Theme dates: Validates theme date ranges
- Narrative claims: Validates causal language, probability claims, negation preservation
- Hallucination patterns: Checks for unsupported diagnosis, treatment success, progression claims

**Key Methods**:
- `validateJourneyStory()`: Main validation method
- `validateChapterEventIds()`: Validates chapter event IDs
- `validateChapterEpisodeIds()`: Validates chapter episode IDs
- `validateChapterDates()`: Validates chapter date ranges
- `validateThemeDates()`: Validates theme date ranges
- `validateNarrativeClaims()`: Validates narrative claims using evidence validation
- `checkForHallucinations()`: Checks for hallucination patterns

#### 9. JourneyStoryVersioningService (`src/services/journeyStoryVersioningService.ts`)

**Purpose**: Manages versioning of journey stories to track changes over time.

**Version Reasons**:
- `initial`: First version
- `data_change`: Underlying data changed
- `regeneration`: Story regenerated
- `other`: Other reasons

**Key Methods**:
- `createStoryVersion()`: Creates a new story version
- `getLatestStoryVersion()`: Returns the latest version
- `getAllStoryVersions()`: Returns all versions for a journey
- `getStoryVersion()`: Returns a specific version by number
- `needsRegeneration()`: Checks if story needs regeneration based on version changes
- `cleanupOldVersions()`: Keeps only latest N versions
- `deleteAllVersions()`: Deletes all versions for a journey
- `getVersionHistorySummary()`: Returns version history summary

## Data Models

### HealthEpisode

```typescript
interface HealthEpisode {
  id: string;
  patientId: string;
  title: string;
  description: string;
  summary: string;
  type: EpisodeType;
  status: EpisodeStatus;
  startDate: string | null;
  endDate: string | null;
  eventIds: string[];
  patternIds: string[];
  sourceRecordIds: string[];
  themes: string[];
  transitions: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

**Episode Types**:
- `symptom_episode`: Symptom-focused episode
- `investigation_episode`: Laboratory/procedure episode
- `treatment_episode`: Medication/treatment episode
- `hospitalization_episode`: Hospital visit episode
- `diagnosis_episode`: Diagnosis episode
- `mixed_episode`: Mixed event types

**Episode Statuses**:
- `active_in_records`: Currently active in records
- `resolved_in_records`: Explicitly resolved in records
- `status_unclear`: Status unclear from records

### EpisodeTransition

```typescript
interface EpisodeTransition {
  id: string;
  patientId: string;
  fromEpisodeId: string | null;
  toEpisodeId: string;
  type: TransitionType;
  date: string | null;
  description: string;
  evidenceEventIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
}
```

**Transition Types**: See TransitionDetectionService section.

### LongitudinalTheme

```typescript
interface LongitudinalTheme {
  id: string;
  patientId: string;
  name: string;
  description: string;
  canonicalConcept: string;
  episodeIds: string[];
  eventIds: string[];
  firstObserved: string | null;
  lastObserved: string | null;
  status: 'recurring' | 'resolved' | 'active';
  patternIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### OpenThread

```typescript
interface OpenThread {
  id: string;
  patientId: string;
  title: string;
  description: string;
  category: 'recurring_symptom' | 'abnormal_finding' | 'investigation_without_outcome' | 'repeated_issue';
  episodeIds: string[];
  eventIds: string[];
  firstObserved: string | null;
  lastObserved: string | null;
  severity: 'low' | 'medium' | 'high';
  relatedCareGapIds: string[];
  relatedPatternIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### CurrentState

```typescript
interface CurrentState {
  patientId: string;
  asOfDate: string;
  summary: string;
  activeSymptoms: string[];
  activeDiagnoses: string[];
  activeMedications: string[];
  recentInvestigations: string[];
  lastRecordDate: string | null;
  metadata: Record<string, unknown>;
}
```

### RecordCoverage

```typescript
interface RecordCoverage {
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
```

### HealthJourney

```typescript
interface HealthJourney {
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
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### JourneyStory

```typescript
interface JourneyStory {
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
```

### JourneyStoryVersion

```typescript
interface JourneyStoryVersion {
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
```

## Ollama Prompts

### Journey Summary System Prompt (`src/services/systemPrompt.ts`)

**Key Rules**:
- Use factual language: "was documented," "appeared in records," "was observed"
- Avoid causal language unless explicitly documented
- Preserve uncertainty: if status is "possible," say "possible," not "confirmed"
- Preserve negation: if records say "denies," do NOT say "has"
- Every chapter must reference actual episode IDs and event IDs
- Do NOT create chapters without supporting episodes/events
- Always include disclaimer about record limitations
- Acknowledge gaps in records

**Output Format**:
- Overview: Brief factual overview
- Chapters: 3-7 chronological chapters with evidence IDs
- Major Themes: Recurring themes with dates
- Open Threads: Unresolved issues
- Record Coverage Summary: Statement about coverage and limitations
- Disclaimer: Standard disclaimer

## Safety Rules

1. **No Autonomous Diagnosis**: The system does NOT diagnose patients or provide medical recommendations
2. **Factual Language Only**: Uses cautious, non-diagnostic language
3. **Preserve Uncertainty**: Uses phrases like "may warrant," "could suggest," "might indicate"
4. **Evidence-Based**: Every claim must reference actual event IDs and dates
5. **Preserve Negation**: "denies headache" ≠ "has headache"
6. **Preserve Qualifiers**: "possible anemia" ≠ "confirmed anemia"
7. **No Causal Language**: "caused," "due to" only if explicitly documented
8. **No Probability Claims**: "85% likely" prohibited - use evidence strength instead
9. **Hallucination Protection**: Validation layer checks for unsupported claims
10. **Record Limitations**: Always acknowledges gaps and limitations in available records

## Testing

### Test Files

1. **Episode Grouping Tests** (`src/services/__tests__/episodeGroupingService.test.ts`)
   - Basic episode grouping with temporal proximity
   - Episode separation by temporal gap
   - Explicit resolution detection
   - Recurrence detection
   - Longitudinal theme generation
   - Temporal window configuration
   - Undated events handling
   - Empty events array

2. **Transition Detection Tests** (`src/services/__tests__/transitionDetectionService.test.ts`)
   - Basic transition detection
   - Initial transition for first episode
   - Empty episodes array
   - Single episode (no transitions)

3. **Longitudinal Theme Tests** (`src/services/__tests__/longitudinalThemeTest.test.ts`)
   - Theme generation for recurring concept
   - No theme for single occurrence
   - Multiple themes for different concepts
   - Theme metadata

4. **Edge Case Tests** (`src/services/__tests__/edgeCaseTests.test.ts`)
   - All undated events
   - Single event
   - Very large temporal gap (10 years)
   - Empty events array
   - Record coverage with no dates
   - Conflict detection with no conflicts
   - Conflict detection with negation conflict
   - Transition detection with undated episodes
   - Duplicate events
   - Mixed event types

### Synthetic Test Patient

**File**: `test-documents/synthetic-patient-7-year-journey.txt`

**Coverage**: 7-year health journey (2019-2025)

**Expected Journey Structure**:
- Episode 1 (2019-2020): Initial fatigue episode
- Episode 2 (2020): B12 deficiency investigation
- Episode 3 (2021): Neurological symptoms emerge
- Episode 4 (2022): Treatment and resolution
- Episode 5 (2023-2025): Recurring fatigue

**Expected Themes**:
- Recurring fatigue (appears across multiple episodes)
- Peripheral neuropathy (episodes 3-4)

**Expected Open Threads**:
- Recurring fatigue without clear etiology
- Fatigue persists despite normal laboratory findings

**Expected Transitions**:
- New symptom (numbness appears in 2021)
- Investigation (laboratory workup in 2020, 2023, 2024)
- Treatment (gabapentin in 2022)
- Resolution (neuropathy resolved in 2022)
- Recurrence (fatigue returns in 2023)

**Expected Conflicts**:
- Conflicting symptom reports in 2024

**Expected Care Gaps**:
- Sleep study referral in 2023 (no follow-up documented)
- Fatigue clinic referral in 2025 (no follow-up documented yet)

## Integration Points

### Existing Systems

1. **Timeline**: Episodes link to existing timeline events via event IDs
2. **Search**: Journey components (episodes, themes, threads) are searchable
3. **Evidence Graph**: Episodes link to patterns and care gaps
4. **Semantic Analysis**: Placeholder for integration with Phase 12 semantic analysis
5. **Validation Layer**: Journey story validation uses Phase 13 evidence validation
6. **Ollama**: Journey summary generation uses existing Ollama service

### Preserved IDs and Relationships

- All existing event IDs are preserved
- All existing pattern IDs are preserved
- All existing care gap IDs are preserved
- Episodes reference existing event IDs
- Themes reference existing pattern IDs
- Open threads reference existing care gap IDs and pattern IDs

## Performance Considerations

1. **Deterministic Grouping**: Episode grouping uses deterministic heuristics for consistent results
2. **Scalability**: Services are designed to handle large patient histories (5-7+ years)
3. **Caching**: Story versioning allows regeneration without losing previous versions
4. **Incremental Updates**: Journey can be regenerated when underlying data changes

## Future Enhancements (Not Implemented)

1. **UI Components**: Health Journey View UI (pending)
2. **Timeline/Story Switch**: Toggle between timeline and story views (pending)
3. **Episode Expansion UI**: Expand/collapse episodes (pending)
4. **Transition Visualization**: Visual representation of transitions (pending)
5. **Journey Summary UI**: Display journey summary (pending)
6. **Unified Search Integration**: Search across journey components (pending)
7. **Evidence Traceability UI**: Trace evidence from story to source records (pending)

## Files Created/Modified

### New Files

1. `src/services/episodeGroupingService.ts` - Episode grouping with temporal heuristics
2. `src/services/transitionDetectionService.ts` - Transition detection between episodes
3. `src/services/openThreadDetectionService.ts` - Open thread detection
4. `src/services/currentStateService.ts` - Current state generation
5. `src/services/recordCoverageService.ts` - Record coverage analysis
6. `src/services/conflictDetectionService.ts` - Conflict detection
7. `src/services/longitudinalStoryService.ts` - Main journey orchestration service
8. `src/services/journeyStoryValidationService.ts` - AI story validation
9. `src/services/journeyStoryVersioningService.ts` - Story versioning
10. `test-documents/synthetic-patient-7-year-journey.txt` - Synthetic test patient
11. `src/services/__tests__/episodeGroupingService.test.ts` - Episode grouping tests
12. `src/services/__tests__/transitionDetectionService.test.ts` - Transition detection tests
13. `src/services/__tests__/longitudinalThemeTest.test.ts` - Theme tests
14. `src/services/__tests__/edgeCaseTests.test.ts` - Edge case tests

### Modified Files

1. `src/types/index.ts` - Added Phase 14 types (EpisodeType, EpisodeStatus, HealthEpisode, EpisodeTransition, LongitudinalTheme, OpenThread, RecordCoverage, CurrentState, TemporalWindowConfig, JourneyChapter, HealthJourney, JourneyStory, JourneyStoryVersion)
2. `src/services/systemPrompt.ts` - Added JOURNEY_SUMMARY_SYSTEM_PROMPT and JOURNEY_SUMMARY_USER_PROMPT_TEMPLATE

## Validation Results

- **TypeScript Compilation**: No errors
- **Linting**: No errors (15 pre-existing warnings in other files)
- **Test Coverage**: 4 test files created with comprehensive coverage

## Summary

Phase 14 successfully implements the backend infrastructure for longitudinal health journey reconstruction. The system can now:

1. Group medical events into meaningful health episodes using deterministic heuristics
2. Detect transitions between episodes
3. Identify longitudinal themes spanning multiple episodes
4. Detect unresolved issues (open threads)
5. Generate factual current state
6. Analyze record coverage
7. Detect conflicting records
8. Orchestrate all services into a complete HealthJourney
9. Validate AI-generated stories with hallucination protection
10. Manage story versioning for tracking changes

The implementation follows all safety rules, preserves existing IDs and relationships, and is ready for UI integration in future phases.
