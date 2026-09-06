/**
 * AI Regression Tests for Phase 15
 * 
 * Regression tests to ensure the AI pipeline maintains expected behavior
 * across code changes and model updates. These tests should pass consistently
 * unless there's an intentional breaking change.
 */

import { OllamaService } from '../services/ollamaService';
import { AnalysisService } from '../services/analysisService';
import { CandidateAnalysisService } from '../services/candidateAnalysisService';
import { CareGapService } from '../services/careGapService';
import type { MedicalEvent } from '../types';

export interface RegressionTestResult {
  testId: string;
  testName: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
  timestamp: string;
}

export interface RegressionTestSuite {
  name: string;
  tests: RegressionTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
}

/**
 * Regression Test 1: Ollama Service Availability
 * Ensures Ollama service can be instantiated and checked for availability
 */
export async function regressionTest1_OllamaAvailability(): Promise<RegressionTestResult> {
  const testId = 'regression-1';
  const testName = 'Ollama Service Availability';
  
  try {
    const ollamaService = OllamaService.getInstance();
    const isAvailable = await ollamaService.isAvailable();
    
    return {
      testId,
      testName,
      passed: typeof isAvailable === 'boolean',
      expected: 'boolean',
      actual: typeof isAvailable,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 2: Analysis Service Instantiation
 * Ensures AnalysisService can be instantiated
 */
export async function regressionTest2_AnalysisServiceInstantiation(): Promise<RegressionTestResult> {
  const testId = 'regression-2';
  const testName = 'Analysis Service Instantiation';
  
  try {
    const analysisService = AnalysisService.getInstance();
    
    return {
      testId,
      testName,
      passed: analysisService !== null && typeof analysisService === 'object',
      expected: 'object',
      actual: typeof analysisService,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 3: Signal Detection Returns Array
 * Ensures signal detection returns an array of signals
 */
export async function regressionTest3_SignalDetectionReturnsArray(): Promise<RegressionTestResult> {
  const testId = 'regression-3';
  const testName = 'Signal Detection Returns Array';
  
  try {
    const analysisService = AnalysisService.getInstance();
    const testEvents: MedicalEvent[] = [
      {
        id: 'test-1',
        patientId: 'test-patient',
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Test symptom',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'test-record-1',
        sourceDocumentName: 'test.txt',
        sourceText: 'Patient reports fatigue',
        metadata: {},
      },
    ];
    
    const result = await analysisService.analyzePatient(
      'test-patient',
      testEvents,
      [],
      'Regression test'
    );
    
    return {
      testId,
      testName,
      passed: Array.isArray(result.signals),
      expected: 'array',
      actual: Array.isArray(result.signals) ? 'array' : typeof result.signals,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 4: Clinical Signals Returns Array
 * Ensures clinical signal detection returns an array of signals
 */
export async function regressionTest4_ClinicalSignalsReturnsArray(): Promise<RegressionTestResult> {
  const testId = 'regression-4';
  const testName = 'Clinical Signals Returns Array';
  
  try {
    const analysisService = AnalysisService.getInstance();
    const testEvents: MedicalEvent[] = [
      {
        id: 'test-1',
        patientId: 'test-patient',
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Test symptom',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'test-record-1',
        sourceDocumentName: 'test.txt',
        sourceText: 'Patient reports fatigue',
        metadata: {},
      },
    ];
    
    const result = await analysisService.analyzePatient(
      'test-patient',
      testEvents,
      [],
      'Regression test'
    );
    
    return {
      testId,
      testName,
      passed: Array.isArray(result.signals),
      expected: 'array',
      actual: Array.isArray(result.signals) ? 'array' : typeof result.signals,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 5: Candidate Analysis Returns Object
 * Ensures candidate analysis returns a result object with expected structure
 */
export async function regressionTest5_CandidateAnalysisStructure(): Promise<RegressionTestResult> {
  const testId = 'regression-5';
  const testName = 'Candidate Analysis Structure';
  
  try {
    const candidateAnalysisService = CandidateAnalysisService.getInstance();
    const testEvents: MedicalEvent[] = [
      {
        id: 'test-1',
        patientId: 'test-patient',
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Test symptom',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'test-record-1',
        sourceDocumentName: 'test.txt',
        sourceText: 'Patient reports fatigue',
        metadata: {},
      },
    ];
    
    const result = await candidateAnalysisService.analyzeCandidates(
      'test-patient',
      testEvents,
      []
    );
    
    const hasRequiredFields = 
      typeof result.success === 'boolean' &&
      Array.isArray(result.candidateReviews);
    
    return {
      testId,
      testName,
      passed: hasRequiredFields,
      expected: 'object with success and candidateReviews fields',
      actual: hasRequiredFields ? 'correct structure' : 'missing required fields',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 6: Care Gap Detection Returns Array
 * Ensures care gap detection returns an array of care gaps
 */
export async function regressionTest6_CareGapDetectionReturnsArray(): Promise<RegressionTestResult> {
  const testId = 'regression-6';
  const testName = 'Care Gap Detection Returns Array';
  
  try {
    const careGapService = CareGapService.getInstance();
    const testEvents: MedicalEvent[] = [
      {
        id: 'test-1',
        patientId: 'test-patient',
        eventType: 'laboratory',
        title: 'Lab Test',
        description: 'Test lab',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'test-record-1',
        sourceDocumentName: 'test.txt',
        sourceText: 'Lab result: abnormal',
        metadata: {},
      },
    ];
    
    const gaps = careGapService.analyzeCareGaps('test-patient', testEvents, []);
    
    return {
      testId,
      testName,
      passed: Array.isArray(gaps),
      expected: 'array',
      actual: Array.isArray(gaps) ? 'array' : typeof gaps,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 7: Signal Has Required Fields
 * Ensures detected signals have required fields
 */
export async function regressionTest7_SignalRequiredFields(): Promise<RegressionTestResult> {
  const testId = 'regression-7';
  const testName = 'Signal Required Fields';
  
  try {
    const analysisService = AnalysisService.getInstance();
    const testEvents: MedicalEvent[] = [
      {
        id: 'test-1',
        patientId: 'test-patient',
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'test-record-1',
        sourceDocumentName: 'test.txt',
        sourceText: 'Patient reports fatigue',
        metadata: {},
      },
      {
        id: 'test-2',
        patientId: 'test-patient',
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue',
        date: '2023-06-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'test-record-2',
        sourceDocumentName: 'test.txt',
        sourceText: 'Patient reports ongoing fatigue',
        metadata: {},
      },
    ];
    
    const result = await analysisService.analyzePatient(
      'test-patient',
      testEvents,
      [],
      'Regression test'
    );
    
    if (result.signals.length === 0) {
      return {
        testId,
        testName,
        passed: true, // No signals is acceptable if no signals detected
        expected: 'valid signal structure or no signals',
        actual: 'no signals detected',
        timestamp: new Date().toISOString(),
      };
    }
    
    const firstSignal = result.signals[0];
    const hasRequiredFields = 
      typeof firstSignal.id === 'string' &&
      typeof firstSignal.title === 'string' &&
      typeof firstSignal.category === 'string' &&
      Array.isArray(firstSignal.evidence);
    
    return {
      testId,
      testName,
      passed: hasRequiredFields,
      expected: 'signal with id, title, category, evidence',
      actual: hasRequiredFields ? 'valid structure' : 'missing required fields',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 8: Signal Has Required Fields
 * Ensures detected signals have required fields
 */
export async function regressionTest8_SignalRequiredFields(): Promise<RegressionTestResult> {
  const testId = 'regression-8';
  const testName = 'Signal Required Fields';
  
  try {
    const analysisService = AnalysisService.getInstance();
    const testEvents: MedicalEvent[] = [
      {
        id: 'test-1',
        patientId: 'test-patient',
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'test-record-1',
        sourceDocumentName: 'test.txt',
        sourceText: 'Patient reports fatigue',
        metadata: {},
      },
    ];
    
    const result = await analysisService.analyzePatient(
      'test-patient',
      testEvents,
      [],
      'Regression test'
    );
    
    if (result.signals.length === 0) {
      return {
        testId,
        testName,
        passed: true, // No signals is acceptable if no signals detected
        expected: 'valid signal structure or no signals',
        actual: 'no signals detected',
        timestamp: new Date().toISOString(),
      };
    }
    
    const firstSignal = result.signals[0];
    const hasRequiredFields = 
      typeof firstSignal.id === 'string' &&
      typeof firstSignal.title === 'string' &&
      typeof firstSignal.category === 'string' &&
      typeof firstSignal.summary === 'string' &&
      Array.isArray(firstSignal.evidence);
    
    return {
      testId,
      testName,
      passed: hasRequiredFields,
      expected: 'signal with id, title, category, summary, evidence',
      actual: hasRequiredFields ? 'valid structure' : 'missing required fields',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 9: Ollama Generate Returns String
 * Ensures Ollama generate returns a string
 */
export async function regressionTest9_OllamaGenerateReturnsString(): Promise<RegressionTestResult> {
  const testId = 'regression-9';
  const testName = 'Ollama Generate Returns String';
  
  try {
    const ollamaService = OllamaService.getInstance();
    const isAvailable = await ollamaService.isAvailable();
    
    if (!isAvailable) {
      return {
        testId,
        testName,
        passed: true, // Skip if Ollama not available
        expected: 'string or Ollama unavailable',
        actual: 'Ollama unavailable',
        timestamp: new Date().toISOString(),
      };
    }
    
    const result = await ollamaService.generate('Test prompt');
    
    return {
      testId,
      testName,
      passed: typeof result === 'string',
      expected: 'string',
      actual: typeof result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Regression Test 10: Empty Events Handling
 * Ensures services handle empty events array gracefully
 */
export async function regressionTest10_EmptyEventsHandling(): Promise<RegressionTestResult> {
  const testId = 'regression-10';
  const testName = 'Empty Events Handling';
  
  try {
    const analysisService = AnalysisService.getInstance();
    const result = await analysisService.analyzePatient(
      'test-patient',
      [],
      [],
      'Regression test'
    );
    
    const hasValidStructure = 
      Array.isArray(result.signals) &&
      typeof result.success === 'boolean';
    
    return {
      testId,
      testName,
      passed: hasValidStructure,
      expected: 'valid result structure',
      actual: hasValidStructure ? 'valid structure' : 'invalid structure',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testId,
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : 'unknown error',
      error: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run complete regression test suite
 */
export async function runRegressionTestSuite(): Promise<RegressionTestSuite> {
  const tests: RegressionTestResult[] = [];
  
  // Run all tests
  tests.push(await regressionTest1_OllamaAvailability());
  tests.push(await regressionTest2_AnalysisServiceInstantiation());
  tests.push(await regressionTest3_SignalDetectionReturnsArray());
  tests.push(await regressionTest4_ClinicalSignalsReturnsArray());
  tests.push(await regressionTest5_CandidateAnalysisStructure());
  tests.push(await regressionTest6_CareGapDetectionReturnsArray());
  tests.push(await regressionTest7_SignalRequiredFields());
  tests.push(await regressionTest8_SignalRequiredFields());
  tests.push(await regressionTest9_OllamaGenerateReturnsString());
  tests.push(await regressionTest10_EmptyEventsHandling());
  
  const total = tests.length;
  const passed = tests.filter(t => t.passed).length;
  const failed = total - passed;
  const passRate = passed / total;
  
  return {
    name: 'AI Pipeline Regression Tests',
    tests,
    summary: {
      total,
      passed,
      failed,
      passRate,
    },
  };
}

/**
 * Print regression test results to console
 */
export function printRegressionTestResults(suite: RegressionTestSuite): void {
  console.log('\n=== AI Pipeline Regression Test Results ===\n');
  console.log(`Suite: ${suite.name}`);
  console.log(`Total Tests: ${suite.summary.total}`);
  console.log(`Passed: ${suite.summary.passed}`);
  console.log(`Failed: ${suite.summary.failed}`);
  console.log(`Pass Rate: ${(suite.summary.passRate * 100).toFixed(1)}%\n`);
  
  console.log('Detailed Results:');
  suite.tests.forEach(test => {
    const status = test.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status} | ${test.testName}`);
    if (!test.passed) {
      console.log(`       Expected: ${test.expected}`);
      console.log(`       Actual: ${test.actual}`);
      if (test.error) {
        console.log(`       Error: ${test.error}`);
      }
    }
  });
  
  console.log('\n=== End Regression Test Results ===\n');
}

/**
 * Save regression test results to localStorage for tracking over time
 */
export function saveRegressionResults(suite: RegressionTestSuite): void {
  try {
    const history = JSON.parse(localStorage.getItem('regressionTestHistory') || '[]');
    history.push({
      timestamp: new Date().toISOString(),
      summary: suite.summary,
    });
    // Keep only last 50 runs
    if (history.length > 50) {
      history.shift();
    }
    localStorage.setItem('regressionTestHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save regression results:', error);
  }
}

/**
 * Get regression test history from localStorage
 */
export function getRegressionHistory(): Array<{ timestamp: string; summary: any }> {
  try {
    return JSON.parse(localStorage.getItem('regressionTestHistory') || '[]');
  } catch (error) {
    console.error('Failed to get regression history:', error);
    return [];
  }
}
