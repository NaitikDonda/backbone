# Phase 12: Semantic Medical Event Linking

## Overview

Phase 12 implements semantic linking between medical events to recognize when different records describe the same or closely related issues using varying terminology. The system preserves original events and creates semantic relationships rather than merging, maintaining data integrity while enabling cross-record analysis.

## Architecture

### Core Components

#### 1. Type Extensions (`src/types/index.ts`)

New types added for semantic linking:

- **SemanticRelationship**: Represents a semantic link between two events
  - `canonicalConceptId`: ID of the canonical concept
  - `canonicalConceptName`: Normalized name for the concept
  - `relationshipStrength`: 'high' | 'medium' | 'low'
  - `matchingMethod`: How the relationship was detected
  - `similarityScore`: 0-1 score for embedding-based matches
  - `isNegated`: Whether either event is negated
  - `isHistorical`: Whether the relationship is historical
  - `isResolved`: Whether the condition has resolved

- **CanonicalConcept**: Represents a normalized medical concept
  - `canonicalName`: The standard name
  - `synonyms`: Alternative terms
  - `variants`: Common variations
  - `conceptType`: 'symptom' | 'diagnosis' | 'laboratory' | 'medication' | 'procedure' | 'finding'

- **Episode**: Groups related events into clinical episodes
  - `episodeType`: 'single' | 'continuous' | 'recurrent'
  - `startDate` / `endDate`: Episode boundaries
  - `eventIds`: Events in the episode

- **SemanticAnalysis**: Complete semantic analysis result
  - `canonicalConcepts`: All concepts found
  - `semanticRelationships`: All relationships detected
  - `episodes`: Grouped episodes

- **SemanticThresholds**: Configurable matching thresholds
  - `highSimilarity`: 0.85 (default)
  - `mediumSimilarity`: 0.70 (default)
  - `lowSimilarity`: 0.50 (default)
  - `maxEpisodeGapDays`: 180 (default)

#### 2. Semantic Vocabulary (`src/config/semanticVocabulary.ts`)

Development vocabulary for semantic normalization:

- **DETERMINISTIC_NORMALIZATION_RULES**: Simple string transformations
  - Abbreviations to full terms (e.g., "B12" → "vitamin b12")
  - Plural/singular normalization
  - Hyphenation variations
  - Common prefix removal

- **DEVELOPMENT_VOCABULARY**: Curated synonym mappings
  - Symptoms: fatigue, headache, nausea, dizziness, dyspnea, weakness
  - Laboratories: Vitamin B12, Hemoglobin, Hematocrit, CBC, TSH, Glucose, Creatinine, ALT, AST
  - Each concept includes synonyms and variants

- **NEGATION_PATTERNS**: Terms indicating absence
  - "no", "denies", "negative for", "without", "absence of", "rule out"

- **TEMPORAL_QUALIFIER_PATTERNS**: Temporal context
  - "history of" → historical
  - "resolved" → resolved
  - "recurrent" → recurrent
  - "chronic" → chronic

- **Helper functions**:
  - `getCanonicalConcept(term, conceptType)`: Find canonical concept
  - `normalizeTerm(term)`: Apply deterministic rules
  - `containsNegation(text)`: Check for negation
  - `extractTemporalQualifier(text)`: Extract temporal context
  - `indicatesResolution(text)`: Check for resolution

#### 3. Semantic Normalization Service (`src/services/semanticNormalizationService.ts`)

Main service for semantic analysis:

**Key Methods**:

- `analyzeSemanticRelationships(patientId, events)`: Main entry point
  - Groups events by concept type
  - Finds relationships within each type
  - Groups events into episodes
  - Returns complete SemanticAnalysis

- `createRelationship(event1, event2, conceptType)`: Creates semantic relationship
  - **Layer 1**: Deterministic normalization (exact match after normalization)
  - **Layer 2**: Synonym mapping (via development vocabulary)
  - **Layer 3**: Semantic similarity (via Ollama embeddings, optional)

- `groupEpisodes(events, relationships, conceptType)`: Groups related events
  - Groups by canonical concept
  - Detects episode boundaries based on:
    - Temporal gaps (maxEpisodeGapDays)
    - Explicit resolution
  - Creates single, continuous, or recurrent episodes

- `reviewRelationship(relationshipId, action, reason)`: Reviewer override
  - Allows manual confirmation/rejection
  - Caches rejected relationships

**Safety Features**:

- Negation handling: Skips relationships if either event is negated
- Temporal qualifiers: Preserves historical/resolved context
- Graceful degradation: Falls back if Ollama is unavailable
- No clinical inference: Only links based on terminology, not medical judgment

#### 4. Evidence Graph Integration (`src/services/evidenceGraphService.ts`)

Extended to include semantic relationships:

- **New node type**: `semantic_concept`
  - Represents canonical concepts
  - Tracks relationship count
  - Stores matching method and concept type

- **New relationship type**: `semantically_related`
  - Links semantic concepts to events
  - Strength based on relationship strength
  - Includes similarity score and matching method

- **Updated methods**:
  - `generateFullGraph()`: Accepts optional `semanticAnalysis` parameter
  - `generateSemanticConceptNodes()`: Creates concept nodes
  - `generateSemanticRelationships()`: Creates semantic edges

#### 5. Pattern Detection Integration (`src/services/patternDetectionService.ts`)

Updated to accept semantic analysis:

- `detectPatterns(events, patientId, semanticAnalysis?)`: Optional semantic parameter
- All detection methods accept `_semanticAnalysis` parameter for future enhancement
- Current implementation uses existing normalization
- Future: Could use canonical concepts for cross-terminology pattern detection

#### 6. Care Gap Analysis Integration (`src/services/careGapService.ts`)

Updated to accept semantic analysis:

- `analyzeCareGaps(events, patterns, semanticAnalysis?)`: Optional semantic parameter
- All detection methods accept `_semanticAnalysis` parameter for future enhancement
- Current implementation uses existing grouping
- Future: Could use semantic relationships for cross-record gap detection

## Implementation Details

### Layered Normalization Approach

**Layer 1: Deterministic Normalization**
- Simple string transformations
- Fast, no external dependencies
- Handles obvious variations (abbreviations, capitalization, spacing)
- Example: "B12" → "vitamin b12"

**Layer 2: Synonym Mapping**
- Curated development vocabulary
- Maps semantically equivalent terms
- Conservative - only maps clearly equivalent terms
- Example: "fatigue" ↔ "tiredness" ↔ "low energy"

**Layer 3: Semantic Similarity (Optional)**
- Uses Ollama for embedding-based similarity
- Configurable thresholds (high: 0.85, medium: 0.70, low: 0.50)
- Graceful degradation if Ollama unavailable
- Example: Similar terms not in vocabulary

### Negation Handling

The system preserves negative evidence:

- Negation patterns detected in source text
- Relationships not created if either event is negated
- Examples: "no headache", "denies fatigue", "negative for nausea"

### Temporal Qualifiers

Temporal context is preserved:

- **Historical**: "history of", "previous", "past"
- **Resolved**: "resolved", "recovered", "improved"
- **Recurrent**: "recurrent", "recurrence"
- **Chronic**: "chronic", "ongoing"
- **Acute**: "acute"

### Episode Grouping

Events grouped into clinical episodes:

- **Single episode**: One occurrence
- **Continuous episode**: Multiple occurrences within maxEpisodeGapDays (180 days)
- **Recurrent episode**: Multiple occurrences separated by gaps > maxEpisodeGapDays

Episode boundaries detected by:
- Temporal gaps exceeding threshold
- Explicit resolution documentation
- Contradictory documentation

### Laboratory Normalization

Specific handling for laboratory tests:

- Vitamin B12 ↔ B12 ↔ Cobalamin
- Hemoglobin ↔ Hb ↔ Hgb
- Hematocrit ↔ Hct
- Complete Blood Count ↔ CBC ↔ FBC
- And more in development vocabulary

## Usage

### Basic Usage

```typescript
import { SemanticNormalizationService } from './services/semanticNormalizationService';

const service = SemanticNormalizationService.getInstance();

// Analyze semantic relationships
const analysis = await service.analyzeSemanticRelationships(patientId, events);

// Access results
console.log(`Found ${analysis.semanticRelationships.length} semantic relationships`);
console.log(`Created ${analysis.episodes.length} episodes`);
```

### Integration with Evidence Graph

```typescript
import { EvidenceGraphService } from './services/evidenceGraphService';
import { SemanticNormalizationService } from './services/semanticNormalizationService';

const semanticService = SemanticNormalizationService.getInstance();
const evidenceService = EvidenceGraphService.getInstance();

// Generate semantic analysis
const semanticAnalysis = await semanticService.analyzeSemanticRelationships(patientId, events);

// Generate evidence graph with semantic relationships
const graph = evidenceService.generateFullGraph(
  patientId,
  events,
  patterns,
  candidateReviews,
  careGaps,
  semanticAnalysis
);
```

### Configuring Thresholds

```typescript
const service = SemanticNormalizationService.getInstance();

// Set custom thresholds
service.setThresholds({
  highSimilarity: 0.90,
  mediumSimilarity: 0.75,
  maxEpisodeGapDays: 200
});

// Get current thresholds
const thresholds = service.getThresholds();
```

### Reviewer Override

```typescript
const service = SemanticNormalizationService.getInstance();

// Reject a relationship
service.reviewRelationship('semantic-rel-event-1-event-2', 'reject', 'Not semantically related');

// Confirm a relationship
service.reviewRelationship('semantic-rel-event-3-event-4', 'confirm', 'Confirmed as related');

// Clear rejected relationships cache
service.clearRejectedRelationships();
```

## Testing

### Test Data

8 synthetic test cases created in `test-documents/`:

1. **semantic-test-1-synonyms**: Synonym detection (fatigue ↔ tiredness ↔ low energy)
2. **semantic-test-2-similar-distinct**: Similar but distinct concepts (fatigue vs sleepiness)
3. **semantic-test-3-negation**: Negation handling (headache vs denies headache)
4. **semantic-test-4-historical**: Historical qualifier detection
5. **semantic-test-5-lab-b12**: Laboratory normalization (Vitamin B12 ↔ B12)
6. **semantic-test-6-lab-cbc**: CBC normalization (Complete Blood Count ↔ CBC)
7. **semantic-test-7-episode**: Episode grouping (continuous vs separate episodes)
8. **semantic-test-8-lab-cbc**: Additional CBC test case

### Unit Tests

**Semantic Normalization Service Tests** (`src/services/__tests__/semanticNormalizationService.test.ts`):

- Synonym detection
- Deterministic normalization
- Negation handling
- Historical qualifier detection
- Episode grouping
- Thresholds configuration
- Reviewer override system
- Analysis version management

**Evidence Graph Integration Tests** (`src/services/__tests__/evidenceGraphSemanticIntegration.test.ts`):

- Evidence graph with semantic analysis
- Evidence graph without semantic analysis (backward compatibility)

### Running Tests

```bash
# Run semantic normalization tests
npx ts-node src/services/__tests__/semanticNormalizationService.test.ts

# Run evidence graph integration tests
npx ts-node src/services/__tests__/evidenceGraphSemanticIntegration.test.ts
```

## Safety Principles

1. **No Clinical Equivalence Assumptions**: The system links based on terminology similarity, not medical judgment. It does not assume clinical equivalence.

2. **Preserve Original Events**: Original events are never merged. Semantic relationships are separate entities.

3. **Preserve Negation**: Negative evidence is preserved and not linked to positive evidence.

4. **Preserve Temporal Context**: Historical, resolved, chronic, and acute qualifiers are preserved.

5. **Local-Only Processing**: All processing is local via Ollama. No external medical AI services are used.

6. **Graceful Degradation**: If Ollama is unavailable, the system falls back to deterministic and synonym-based matching.

7. **Reviewer Override**: Users can confirm or reject semantic relationships.

8. **Configurable Thresholds**: Similarity thresholds are configurable and can be adjusted based on use case.

## Limitations

1. **Development Vocabulary**: The synonym vocabulary is intentionally conservative and limited. It can be extended as needed.

2. **No Medical Inference**: The system does not make medical inferences or clinical judgments.

3. **Ollama Dependency**: Layer 3 (semantic similarity) requires Ollama. If unavailable, only Layers 1 and 2 are used.

4. **English Only**: Current implementation is English-only.

5. **No External Medical Databases**: The system does not integrate with external medical terminologies like SNOMED CT or UMLS.

## Future Enhancements

1. **Timeline Integration**: Display semantic relationships in the timeline UI.

2. **Search Improvements**: Use canonical concepts for search to find related events across different terminology.

3. **UI Components**: Create UI components to display and manage semantic relationships.

4. **Expanded Vocabulary**: Extend the development vocabulary with more synonyms and variants.

5. **Pattern Detection Enhancement**: Use canonical concepts to detect patterns across different terminology.

6. **Care Gap Enhancement**: Use semantic relationships to detect care gaps across records with different terminology.

7. **Performance Testing**: Test with large event sets to ensure scalability.

8. **Embedding Model Failure Testing**: Test graceful degradation when embedding models fail.

## Version Information

- **Analysis Version**: development-0.1
- **Vocabulary Version**: development-0.1
- **Implementation Date**: September 2026

## Files Modified/Created

### Modified Files
- `src/types/index.ts`: Added semantic relationship types
- `src/services/evidenceGraphService.ts`: Added semantic concept nodes and relationships
- `src/services/patternDetectionService.ts`: Added semantic analysis parameter
- `src/services/careGapService.ts`: Added semantic analysis parameter

### Created Files
- `src/config/semanticVocabulary.ts`: Development vocabulary and normalization rules
- `src/services/semanticNormalizationService.ts`: Main semantic normalization service
- `src/services/__tests__/semanticNormalizationService.test.ts`: Unit tests
- `src/services/__tests__/evidenceGraphSemanticIntegration.test.ts`: Integration tests
- `test-documents/semantic-test-*.txt`: 8 synthetic test cases

## Summary

Phase 12 successfully implements semantic medical event linking with a layered normalization approach, preserving original events while creating semantic relationships. The system handles negation, temporal qualifiers, and episode grouping, integrates with the evidence graph, pattern detection, and care gap analysis, and includes comprehensive testing. All processing is local-only with graceful degradation, following the safety principles of no clinical inference and preserving original data integrity.
