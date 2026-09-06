/**
 * Unit Tests for Evidence Validation Service (Phase 13)
 */

import { EvidenceValidationService } from '../evidenceValidationService';
import type { MedicalEvent, StructuredOllamaOutput } from '../../types';

/**
 * Test suite for EvidenceValidationService
 */
class EvidenceValidationTestSuite {
  private service: EvidenceValidationService;

  constructor() {
    this.service = EvidenceValidationService.getInstance();
  }

  /**
   * Test 1: JSON schema validation
   */
  testJsonSchemaValidation(): boolean {
    const validOutput: StructuredOllamaOutput = {
      summary: 'Test summary',
      observations: [
        {
          text: 'Test observation',
          evidenceIds: ['event-1'],
          category: 'symptom',
        },
      ],
      interpretations: [
        {
          text: 'Test interpretation',
          evidenceIds: ['event-1'],
          confidence: 'moderate',
        },
      ],
    };

    const result = this.service.validateStructuredOutput(validOutput);

    if (!result.isValid) {
      console.error('  ✗ Valid JSON schema failed validation');
      return false;
    }

    const invalidOutput = { invalid: 'structure' };
    const invalidResult = this.service.validateStructuredOutput(invalidOutput);

    if (invalidResult.isValid) {
      console.error('  ✗ Invalid JSON schema passed validation');
      return false;
    }

    console.log('  ✓ JSON schema validation test passed');
    return true;
  }

  /**
   * Test 2: Evidence ID validation
   */
  testEvidenceIdValidation(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'fatigue',
        description: 'Fatigue',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Fatigue',
        metadata: {},
      },
    ];

    const validIds = ['event-1'];
    const invalidIds = ['event-1', 'event-999'];

    const validResult = this.service.validateEvidenceIds(validIds, events);
    const invalidResult = this.service.validateEvidenceIds(invalidIds, events);

    if (!validResult.isValid) {
      console.error('  ✗ Valid evidence IDs failed validation');
      return false;
    }

    if (invalidResult.isValid) {
      console.error('  ✗ Invalid evidence IDs passed validation');
      return false;
    }

    if (invalidResult.invalidIds.length !== 1 || invalidResult.invalidIds[0] !== 'event-999') {
      console.error('  ✗ Invalid evidence IDs not correctly identified');
      return false;
    }

    console.log('  ✓ Evidence ID validation test passed');
    return true;
  }

  /**
   * Test 3: Numerical fact validation
   */
  testNumericalFactValidation(): boolean {
    const validResult = this.service.validateNumericalFact('B12 is 145', 145, 145);
    const invalidResult = this.service.validateNumericalFact('B12 is 145', 145, 105);

    if (!validResult.isValid) {
      console.error('  ✗ Valid numerical fact failed validation');
      return false;
    }

    if (invalidResult.isValid) {
      console.error('  ✗ Invalid numerical fact passed validation');
      return false;
    }

    console.log('  ✓ Numerical fact validation test passed');
    return true;
  }

  /**
   * Test 4: Negation validation
   */
  testNegationValidation(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'headache',
        description: 'Patient denies headache',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Patient denies headache',
        metadata: {},
      },
    ];

    const validStatement = 'Patient reports no headache';
    const invalidStatement = 'Patient has headache';

    const validResult = this.service.validateNegation(validStatement, ['event-1'], events);
    const invalidResult = this.service.validateNegation(invalidStatement, ['event-1'], events);

    if (!validResult.isValid) {
      console.error('  ✗ Valid negation statement failed validation');
      return false;
    }

    if (invalidResult.isValid) {
      console.error('  ✗ Invalid negation statement passed validation');
      return false;
    }

    console.log('  ✓ Negation validation test passed');
    return true;
  }

  /**
   * Test 5: Causality protection
   */
  testCausalityProtection(): boolean {
    const validStatement = 'Fatigue and low B12 were documented together';
    const invalidStatement = 'Low B12 caused the fatigue';

    const validResult = this.service.validateCausality(validStatement);
    const invalidResult = this.service.validateCausality(invalidStatement);

    if (!validResult.isValid) {
      console.error('  ✗ Valid causality statement failed validation');
      return false;
    }

    if (invalidResult.isValid) {
      console.error('  ✗ Invalid causality statement passed validation');
      return false;
    }

    console.log('  ✓ Causality protection test passed');
    return true;
  }

  /**
   * Test 6: Probability protection
   */
  testProbabilityProtection(): boolean {
    const validStatement = 'Strong evidence match';
    const invalidStatement = '85% likely to have condition';

    const validResult = this.service.validateProbabilityClaim(validStatement);
    const invalidResult = this.service.validateProbabilityClaim(invalidStatement);

    if (!validResult.isValid) {
      console.error('  ✗ Valid probability statement failed validation');
      return false;
    }

    if (invalidResult.isValid) {
      console.error('  ✗ Invalid probability statement passed validation');
      return false;
    }

    console.log('  ✓ Probability protection test passed');
    return true;
  }

  /**
   * Test 7: Data quality assessment
   */
  testDataQualityAssessment(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'fatigue',
        description: 'Fatigue',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Fatigue',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId: 'test',
        eventType: 'symptom',
        title: 'headache',
        description: null,
        date: null,
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'doc-2.txt',
        sourceText: null,
        metadata: {},
      },
    ];

    const assessment = this.service.assessDataQuality(events, 2);

    if (assessment.missingDateCount !== 1) {
      console.error('  ✗ Missing date count incorrect');
      return false;
    }

    if (assessment.missingFieldCount !== 1) {
      console.error('  ✗ Missing field count incorrect');
      return false;
    }

    if (assessment.totalRecordsProcessed !== 2) {
      console.error('  ✗ Total records processed incorrect');
      return false;
    }

    console.log('  ✓ Data quality assessment test passed');
    return true;
  }

  /**
   * Test 8: Conflict detection
   */
  testConflictDetection(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Hemoglobin',
        description: '12.1 g/dL',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: '12.1',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Hemoglobin',
        description: '13.5 g/dL',
        date: '2023-02-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'doc-2.txt',
        sourceText: '13.5',
        metadata: {},
      },
    ];

    const conflicts = this.service.detectConflicts(events);

    if (conflicts.totalConflicts !== 1) {
      console.error('  ✗ Conflict detection failed to find conflict');
      return false;
    }

    console.log('  ✓ Conflict detection test passed');
    return true;
  }

  /**
   * Test 9: Duplicate detection
   */
  testDuplicateDetection(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Hemoglobin',
        description: '12.1 g/dL',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: '12.1',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Hemoglobin',
        description: '12.1 g/dL',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'doc-2.txt',
        sourceText: '12.1',
        metadata: {},
      },
    ];

    const duplicates = this.service.detectDuplicates(events);

    if (duplicates.totalDuplicates !== 1) {
      console.error('  ✗ Duplicate detection failed to find duplicate');
      return false;
    }

    console.log('  ✓ Duplicate detection test passed');
    return true;
  }

  /**
   * Test 10: Complete output validation
   */
  testCompleteOutputValidation(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'fatigue',
        description: 'Fatigue',
        date: '2023-01-01',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Fatigue',
        metadata: {},
      },
    ];

    const validOutput: StructuredOllamaOutput = {
      summary: 'Test summary',
      observations: [
        {
          text: 'Fatigue was documented',
          evidenceIds: ['event-1'],
          category: 'symptom',
        },
      ],
      interpretations: [
        {
          text: 'Fatigue may warrant review',
          evidenceIds: ['event-1'],
          confidence: 'moderate',
        },
      ],
    };

    const result = this.service.validateCompleteOutput(validOutput, events);

    if (!result.isValid) {
      console.error('  ✗ Valid complete output failed validation');
      return false;
    }

    if (result.validatedStatements.length !== 2) {
      console.error('  ✗ Valid complete output did not validate all statements');
      return false;
    }

    console.log('  ✓ Complete output validation test passed');
    return true;
  }

  /**
   * Run all tests
   */
  runAll(): void {
    console.log('Running Evidence Validation Service Tests...\n');

    let passed = 0;
    let failed = 0;

    try {
      if (this.testJsonSchemaValidation()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ JSON schema validation test failed with error:', error);
      failed++;
    }

    try {
      if (this.testEvidenceIdValidation()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Evidence ID validation test failed with error:', error);
      failed++;
    }

    try {
      if (this.testNumericalFactValidation()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Numerical fact validation test failed with error:', error);
      failed++;
    }

    try {
      if (this.testNegationValidation()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Negation validation test failed with error:', error);
      failed++;
    }

    try {
      if (this.testCausalityProtection()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Causality protection test failed with error:', error);
      failed++;
    }

    try {
      if (this.testProbabilityProtection()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Probability protection test failed with error:', error);
      failed++;
    }

    try {
      if (this.testDataQualityAssessment()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Data quality assessment test failed with error:', error);
      failed++;
    }

    try {
      if (this.testConflictDetection()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Conflict detection test failed with error:', error);
      failed++;
    }

    try {
      if (this.testDuplicateDetection()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Duplicate detection test failed with error:', error);
      failed++;
    }

    try {
      if (this.testCompleteOutputValidation()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Complete output validation test failed with error:', error);
      failed++;
    }

    console.log(`\nEvidence Validation Service Tests: ${passed} passed, ${failed} failed`);
  }
}

/**
 * Simple test runner for evidence validation tests
 */
function runEvidenceValidationTests() {
  const testSuite = new EvidenceValidationTestSuite();
  testSuite.runAll();
}

// Run tests if this file is executed directly
runEvidenceValidationTests();
