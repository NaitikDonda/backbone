/**
 * Hallucination Tests for Phase 13 - Trust, Evidence Validation & AI Reliability
 * 
 * These tests create deliberate traps to ensure the validation layer
 * protects against AI hallucinations even when Ollama makes mistakes.
 */

import { EvidenceValidationService } from '../evidenceValidationService';
import type { MedicalEvent, StructuredOllamaOutput } from '../../types';

/**
 * Hallucination Test Suite
 */
class HallucinationTestSuite {
  private service: EvidenceValidationService;

  constructor() {
    this.service = EvidenceValidationService.getInstance();
  }

  /**
   * Test 1: Record does not contain a medication
   * Expected: No medication claim should be validated
   */
  testNoMedicationHallucination(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'routine checkup',
        description: 'No current medications',
        date: '2023-07-10',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'eval-test-6-no-medication.txt',
        sourceText: 'No current medications',
        metadata: {},
      },
    ];

    // Simulate AI hallucination - claiming medication that doesn't exist
    const hallucinatedOutput: StructuredOllamaOutput = {
      summary: 'Patient is on Metformin',
      observations: [
        {
          text: 'Patient is taking Metformin for diabetes',
          evidenceIds: ['event-1'],
          category: 'medication',
        },
      ],
      interpretations: [
        {
          text: 'Metformin treatment indicates diabetes management',
          evidenceIds: ['event-1'],
          confidence: 'high',
        },
      ],
    };

    const result = this.service.validateCompleteOutput(hallucinatedOutput, events);

    // The medication validation should catch this
    const medicationValidation = this.service.validateMedicationClaim('Metformin', events);

    if (medicationValidation.isValid) {
      console.error('  ✗ Test 1 FAILED: Hallucinated medication was not caught');
      return false;
    }

    console.log('  ✓ Test 1 PASSED: No medication hallucination correctly rejected');
    return true;
  }

  /**
   * Test 2: Record contains B12=145, model attempts B12=105
   * Expected: Numerical mismatch should be rejected
   */
  testNumericalHallucination(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Vitamin B12',
        description: '145 pg/mL',
        date: '2023-08-05',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'eval-test-7-hallucination-lab.txt',
        sourceText: 'Vitamin B12: 145 pg/mL',
        metadata: {},
      },
    ];

    // Simulate AI hallucination - wrong numerical value
    const actualValue = 145;
    const hallucinatedValue = 105;

    const validation = this.service.validateNumericalFact(
      'B12 was 105 pg/mL',
      actualValue,
      hallucinatedValue
    );

    if (validation.isValid) {
      console.error('  ✗ Test 2 FAILED: Numerical hallucination was not caught');
      return false;
    }

    console.log('  ✓ Test 2 PASSED: Numerical hallucination correctly rejected');
    return true;
  }

  /**
   * Test 3: Record says "possible anemia"
   * Expected: Should not say "confirmed anemia"
   */
  testDiagnosisQualifierHallucination(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'diagnosis',
        title: 'anemia',
        description: 'Possible anemia',
        date: '2023-09-12',
        endDate: null,
        status: 'possible',
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'eval-test-8-hallucination-diagnosis.txt',
        sourceText: 'Possible anemia',
        metadata: {},
      },
    ];

    // Simulate AI hallucination - converting "possible" to "confirmed"
    const validation = this.service.validateDiagnosisClaim(
      'anemia',
      'confirmed',
      events
    );

    if (validation.isValid) {
      console.error('  ✗ Test 3 FAILED: Diagnosis qualifier hallucination was not caught');
      return false;
    }

    console.log('  ✓ Test 3 PASSED: Diagnosis qualifier hallucination correctly rejected');
    return true;
  }

  /**
   * Test 4: Record says "denies numbness"
   * Expected: Should not say positive numbness finding
   */
  testNegationHallucination(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'numbness',
        description: 'Patient denies any numbness',
        date: '2023-10-20',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'eval-test-9-hallucination-negation.txt',
        sourceText: 'Patient denies any numbness',
        metadata: {},
      },
    ];

    // Simulate AI hallucination - presenting negation as positive
    const validation = this.service.validateNegation(
      'Patient has numbness',
      ['event-1'],
      events
    );

    if (validation.isValid) {
      console.error('  ✗ Test 4 FAILED: Negation hallucination was not caught');
      return false;
    }

    console.log('  ✓ Test 4 PASSED: Negation hallucination correctly rejected');
    return true;
  }

  /**
   * Test 5: No evidence for candidate condition
   * Expected: Candidate should not be presented as supported
   */
  testCandidateHallucination(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'fatigue',
        description: 'Fatigue and weakness',
        date: '2023-11-15',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'eval-test-10-hallucination-candidate.txt',
        sourceText: 'Fatigue and weakness',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Hemoglobin',
        description: '12.1 g/dL',
        date: '2023-11-15',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'eval-test-10-hallucination-candidate.txt',
        sourceText: '12.1 g/dL',
        metadata: {},
      },
    ];

    // Simulate AI hallucination - presenting unsupported candidate condition
    const hallucinatedOutput: StructuredOllamaOutput = {
      summary: 'Patient has pernicious anemia',
      observations: [
        {
          text: 'Patient has pernicious anemia',
          evidenceIds: ['event-1', 'event-2'],
          category: 'diagnosis',
        },
      ],
      interpretations: [
        {
          text: 'Pernicious anemia is confirmed based on findings',
          evidenceIds: ['event-1', 'event-2'],
          confidence: 'high',
        },
      ],
    };

    const result = this.service.validateCompleteOutput(hallucinatedOutput, events);

    // The diagnosis validation should catch this - no actual diagnosis in records
    const diagnosisValidation = this.service.validateDiagnosisClaim(
      'pernicious anemia',
      'confirmed',
      events
    );

    if (diagnosisValidation.isValid) {
      console.error('  ✗ Test 5 FAILED: Unsupported candidate condition was not caught');
      return false;
    }

    console.log('  ✓ Test 5 PASSED: Unsupported candidate condition correctly rejected');
    return true;
  }

  /**
   * Run all hallucination tests
   */
  runAll(): void {
    console.log('Running Hallucination Tests (Phase 13)...\n');

    let passed = 0;
    let failed = 0;

    try {
      if (this.testNoMedicationHallucination()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 1 failed with error:', error);
      failed++;
    }

    try {
      if (this.testNumericalHallucination()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 2 failed with error:', error);
      failed++;
    }

    try {
      if (this.testDiagnosisQualifierHallucination()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 3 failed with error:', error);
      failed++;
    }

    try {
      if (this.testNegationHallucination()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 4 failed with error:', error);
      failed++;
    }

    try {
      if (this.testCandidateHallucination()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 5 failed with error:', error);
      failed++;
    }

    console.log(`\nHallucination Tests: ${passed} passed, ${failed} failed`);
  }
}

/**
 * Simple test runner for hallucination tests
 */
function runHallucinationTests() {
  const testSuite = new HallucinationTestSuite();
  testSuite.runAll();
}

// Run tests if this file is executed directly
runHallucinationTests();
