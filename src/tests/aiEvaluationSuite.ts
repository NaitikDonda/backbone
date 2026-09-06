/**
 * AI Evaluation Suite for Phase 15
 * 
 * Synthetic test cases to evaluate the local Ollama AI pipeline.
 * Each test case includes input data, expected outputs, and evaluation criteria.
 */

import type { MedicalEvent, Pattern, ClinicalSignal, CandidateReview } from '../types';

export interface AITestCase {
  id: string;
  name: string;
  description: string;
  category: 'pattern_detection' | 'clinical_signal' | 'candidate_condition' | 'care_gap' | 'longitudinal';
  input: {
    events: MedicalEvent[];
    patterns: Pattern[];
    context?: string;
  };
  expected: {
    shouldDetect: boolean;
    expectedFindings: string[];
    minConfidence?: number;
    maxHallucinations?: number;
  };
  evaluation: {
    fidelity: number; // 0-1, how accurate the output is
    latency: number; // max acceptable latency in ms
    completeness: number; // 0-1, how complete the output is
  };
}

/**
 * Test Case 1: Recurring Fatigue Pattern
 * Tests detection of recurring symptoms over multiple years
 */
export const testCase1: AITestCase = {
  id: 'test-1',
  name: 'Recurring Fatigue Pattern',
  description: 'Detect recurring fatigue symptoms documented across 3 years',
  category: 'pattern_detection',
  input: {
    events: [
      // Would be populated from test-case-1-recurring-fatigue-*.txt files
    ],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['recurring_symptom', 'fatigue'],
    minConfidence: 0.7,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.9,
    latency: 5000,
    completeness: 0.95,
  },
};

/**
 * Test Case 2: Numerical Extraction
 * Tests accurate extraction of numerical values (lab results, dosages)
 */
export const testCase2: AITestCase = {
  id: 'test-2',
  name: 'Numerical Extraction',
  description: 'Accurately extract numerical values from lab reports',
  category: 'pattern_detection',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['laboratory_observation', 'numerical_value'],
    minConfidence: 0.85,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.95,
    latency: 3000,
    completeness: 1.0,
  },
};

/**
 * Test Case 3: Diagnosis Qualifier Detection
 * Tests detection of qualified diagnoses (probable, suspected, ruled out)
 */
export const testCase3: AITestCase = {
  id: 'test-3',
  name: 'Diagnosis Qualifier Detection',
  description: 'Detect and correctly interpret diagnosis qualifiers',
  category: 'clinical_signal',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['diagnosis', 'qualifier'],
    minConfidence: 0.8,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.9,
    latency: 4000,
    completeness: 0.9,
  },
};

/**
 * Test Case 4: Temporal Reasoning
 * Tests understanding of temporal relationships (before, after, during)
 */
export const testCase4: AITestCase = {
  id: 'test-4',
  name: 'Temporal Reasoning',
  description: 'Understand temporal relationships between events',
  category: 'longitudinal',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['temporal_relationship', 'chronology'],
    minConfidence: 0.75,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.85,
    latency: 5000,
    completeness: 0.85,
  },
};

/**
 * Test Case 5: Medication Extraction
 * Tests extraction of medication names, dosages, and status
 */
export const testCase5: AITestCase = {
  id: 'test-5',
  name: 'Medication Extraction',
  description: 'Extract medication information accurately',
  category: 'pattern_detection',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['medication', 'dosage', 'status'],
    minConfidence: 0.85,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.95,
    latency: 3000,
    completeness: 0.95,
  },
};

/**
 * Test Case 6: No Medication Hallucination
 * Tests that AI does not hallucinate medications when none are present
 */
export const testCase6: AITestCase = {
  id: 'test-6',
  name: 'No Medication Hallucination',
  description: 'Should not hallucinate medications when none are documented',
  category: 'pattern_detection',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: false,
    expectedFindings: [],
    minConfidence: 0,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 1.0,
    latency: 2000,
    completeness: 1.0,
  },
};

/**
 * Test Case 7: Lab Hallucination Prevention
 * Tests that AI does not hallucinate lab values
 */
export const testCase7: AITestCase = {
  id: 'test-7',
  name: 'Lab Hallucination Prevention',
  description: 'Should not hallucinate laboratory observations',
  category: 'pattern_detection',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: false,
    expectedFindings: [],
    minConfidence: 0,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 1.0,
    latency: 2000,
    completeness: 1.0,
  },
};

/**
 * Test Case 8: Diagnosis Hallucination Prevention
 * Tests that AI does not hallucinate diagnoses
 */
export const testCase8: AITestCase = {
  id: 'test-8',
  name: 'Diagnosis Hallucination Prevention',
  description: 'Should not hallucinate diagnoses',
  category: 'clinical_signal',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: false,
    expectedFindings: [],
    minConfidence: 0,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 1.0,
    latency: 2000,
    completeness: 1.0,
  },
};

/**
 * Test Case 9: Negation Handling
 * Tests correct handling of negated statements
 */
export const testCase9: AITestCase = {
  id: 'test-9',
  name: 'Negation Handling',
  description: 'Correctly interpret negated statements',
  category: 'pattern_detection',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['negation', 'exclusion'],
    minConfidence: 0.9,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.95,
    latency: 3000,
    completeness: 0.95,
  },
};

/**
 * Test Case 10: Candidate Condition Hallucination
 * Tests that AI does not hallucinate candidate conditions
 */
export const testCase10: AITestCase = {
  id: 'test-10',
  name: 'Candidate Condition Hallucination',
  description: 'Should not hallucinate candidate conditions without evidence',
  category: 'candidate_condition',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: false,
    expectedFindings: [],
    minConfidence: 0,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 1.0,
    latency: 3000,
    completeness: 1.0,
  },
};

/**
 * Test Case 11: Investigation Without Resolution
 * Tests detection of investigations that lack follow-up
 */
export const testCase11: AITestCase = {
  id: 'test-11',
  name: 'Investigation Without Resolution',
  description: 'Detect investigations that were never followed up',
  category: 'care_gap',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['care_gap', 'missing_followup'],
    minConfidence: 0.7,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.85,
    latency: 4000,
    completeness: 0.8,
  },
};

/**
 * Test Case 12: Diagnosis Without Detail
 * Tests detection of diagnoses lacking supporting detail
 */
export const testCase12: AITestCase = {
  id: 'test-12',
  name: 'Diagnosis Without Detail',
  description: 'Detect diagnoses without sufficient documentation',
  category: 'care_gap',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['care_gap', 'insufficient_documentation'],
    minConfidence: 0.75,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.8,
    latency: 4000,
    completeness: 0.85,
  },
};

/**
 * Test Case 13: Abnormal Lab With Follow-up
 * Tests that abnormal labs with follow-up are not flagged as care gaps
 */
export const testCase13: AITestCase = {
  id: 'test-13',
  name: 'Abnormal Lab With Follow-up',
  description: 'Should not flag abnormal labs that have appropriate follow-up',
  category: 'care_gap',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: false,
    expectedFindings: [],
    minConfidence: 0,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.95,
    latency: 3000,
    completeness: 0.9,
  },
};

/**
 * Test Case 14: Medication Discontinuation
 * Tests detection of medication discontinuation without explanation
 */
export const testCase14: AITestCase = {
  id: 'test-14',
  name: 'Medication Discontinuation',
  description: 'Detect medications discontinued without documented reason',
  category: 'care_gap',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['care_gap', 'medication_change'],
    minConfidence: 0.7,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.8,
    latency: 4000,
    completeness: 0.85,
  },
};

/**
 * Test Case 15: Longitudinal Theme Detection
 * Tests detection of themes spanning multiple episodes
 */
export const testCase15: AITestCase = {
  id: 'test-15',
  name: 'Longitudinal Theme Detection',
  description: 'Detect recurring concepts across multiple health episodes',
  category: 'longitudinal',
  input: {
    events: [],
    patterns: [],
  },
  expected: {
    shouldDetect: true,
    expectedFindings: ['longitudinal_theme', 'recurrence'],
    minConfidence: 0.7,
    maxHallucinations: 0,
  },
  evaluation: {
    fidelity: 0.85,
    latency: 6000,
    completeness: 0.8,
  },
};

/**
 * Complete test suite
 */
export const aiEvaluationSuite: AITestCase[] = [
  testCase1,
  testCase2,
  testCase3,
  testCase4,
  testCase5,
  testCase6,
  testCase7,
  testCase8,
  testCase9,
  testCase10,
  testCase11,
  testCase12,
  testCase13,
  testCase14,
  testCase15,
];

/**
 * Evaluation result interface
 */
export interface EvaluationResult {
  testCaseId: string;
  passed: boolean;
  actualFindings: string[];
  confidence: number;
  hallucinations: number;
  latency: number;
  fidelity: number;
  completeness: number;
  errors: string[];
}

/**
 * Run a single test case
 */
export async function runTestCase(
  testCase: AITestCase,
  analysisService: any
): Promise<EvaluationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let passed = false;
  let actualFindings: string[] = [];
  let confidence = 0;
  let hallucinations = 0;

  try {
    // Run analysis based on test case category
    if (testCase.category === 'pattern_detection') {
      const result = await analysisService.analyzePatient(
        'test-patient',
        testCase.input.events,
        testCase.input.patterns,
        testCase.input.context || ''
      );
      actualFindings = result.patterns.map((p: Pattern) => p.patternType);
      confidence = result.patterns.length > 0 ? 0.8 : 0;
    } else if (testCase.category === 'clinical_signal') {
      const result = await analysisService.analyzePatient(
        'test-patient',
        testCase.input.events,
        testCase.input.patterns,
        testCase.input.context || ''
      );
      actualFindings = result.signals.map((s: ClinicalSignal) => s.category);
      confidence = result.signals.length > 0 ? 0.8 : 0;
    } else if (testCase.category === 'candidate_condition') {
      const result = await analysisService.analyzeCandidates(
        'test-patient',
        testCase.input.events,
        testCase.input.patterns
      );
      actualFindings = result.candidateReviews.map((c: CandidateReview) => c.candidateName);
      confidence = result.candidateReviews.length > 0 ? 0.7 : 0;
    } else if (testCase.category === 'care_gap') {
      const gaps = analysisService.analyzeCareGaps(
        'test-patient',
        testCase.input.events,
        testCase.input.patterns
      );
      actualFindings = gaps.map((g: any) => g.gapType);
      confidence = gaps.length > 0 ? 0.7 : 0;
    } else if (testCase.category === 'longitudinal') {
      const journey = analysisService.generateJourney(
        'test-patient',
        testCase.input.events
      );
      actualFindings = journey.themes.map((t: any) => t.name);
      confidence = journey.themes.length > 0 ? 0.7 : 0;
    }

    const latency = Date.now() - startTime;

    // Check if test passed
    const shouldDetect = testCase.expected.shouldDetect;
    const didDetect = actualFindings.length > 0;
    passed = shouldDetect === didDetect;

    // Check hallucinations (simplified - would need more sophisticated check)
    hallucinations = shouldDetect && !didDetect ? 1 : 0;

    // Calculate fidelity and completeness (simplified)
    const fidelity = passed ? testCase.evaluation.fidelity : 0;
    const completeness = actualFindings.length > 0 ? testCase.evaluation.completeness : 0;

    return {
      testCaseId: testCase.id,
      passed,
      actualFindings,
      confidence,
      hallucinations,
      latency,
      fidelity,
      completeness,
      errors,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      testCaseId: testCase.id,
      passed: false,
      actualFindings,
      confidence,
      hallucinations,
      latency,
      fidelity: 0,
      completeness: 0,
      errors,
    };
  }
}

/**
 * Run complete evaluation suite
 */
export async function runEvaluationSuite(
  analysisService: any
): Promise<{
  results: EvaluationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    avgFidelity: number;
    avgLatency: number;
    avgCompleteness: number;
  };
}> {
  const results: EvaluationResult[] = [];

  for (const testCase of aiEvaluationSuite) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    const result = await runTestCase(testCase, analysisService);
    results.push(result);
  }

  const passed = results.filter(r => r.passed).length;
  const avgFidelity = results.reduce((sum, r) => sum + r.fidelity, 0) / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const avgCompleteness = results.reduce((sum, r) => sum + r.completeness, 0) / results.length;

  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      avgFidelity,
      avgLatency,
      avgCompleteness,
    },
  };
}
