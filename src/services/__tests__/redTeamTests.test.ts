/**
 * Red-Team Prompt Tests for Phase 13 - Trust, Evidence Validation & AI Reliability
 * 
 * These tests create adversarial scenarios to ensure the validation layer
 * protects against various edge cases and potential vulnerabilities.
 */

import { EvidenceValidationService } from '../evidenceValidationService';
import type { MedicalEvent } from '../../types';

/**
 * Red-Team Test Suite
 */
class RedTeamTestSuite {
  private service: EvidenceValidationService;

  constructor() {
    this.service = EvidenceValidationService.getInstance();
  }

  /**
   * Test 1: Incomplete records
   * Expected: Validation should handle missing data gracefully
   */
  testIncompleteRecords(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'fatigue',
        description: null,
        date: null,
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'incomplete.txt',
        sourceText: null,
        metadata: {},
      },
    ];

    const dataQuality = this.service.assessDataQuality(events, 1);

    if (dataQuality.missingDateCount !== 1 || dataQuality.missingFieldCount !== 1) {
      console.error('  ✗ Test 1 FAILED: Incomplete records not properly assessed');
      return false;
    }

    console.log('  ✓ Test 1 PASSED: Incomplete records handled correctly');
    return true;
  }

  /**
   * Test 2: Contradictory records
   * Expected: Conflict detection should identify contradictions
   */
  testContradictoryRecords(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Blood Pressure',
        description: '120/80 mmHg',
        date: '2023-01-15',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'record-1.txt',
        sourceText: '120/80',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Blood Pressure',
        description: '150/95 mmHg',
        date: '2023-01-20',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'record-2.txt',
        sourceText: '150/95',
        metadata: {},
      },
    ];

    const conflicts = this.service.detectConflicts(events);

    if (conflicts.totalConflicts !== 1) {
      console.error('  ✗ Test 2 FAILED: Contradictory records not detected');
      return false;
    }

    console.log('  ✓ Test 2 PASSED: Contradictory records detected correctly');
    return true;
  }

  /**
   * Test 3: Misleading OCR
   * Expected: System should flag uncertainty rather than interpret incorrectly
   */
  testMisleadingOCR(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Vitamin B12',
        description: '14S pg/mL', // OCR error: should be 145
        date: '2023-02-10',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'ocr-error.txt',
        sourceText: 'Vitamin B12 14S',
        metadata: {},
      },
    ];

    // The data quality assessment should flag this as potentially problematic
    const dataQuality = this.service.assessDataQuality(events, 1);

    // OCR quality should be marked as moderate or low due to potential issues
    if (dataQuality.ocrQuality === 'high') {
      console.error('  ✗ Test 3 FAILED: OCR quality not properly assessed');
      return false;
    }

    console.log('  ✓ Test 3 PASSED: Misleading OCR handled with appropriate uncertainty');
    return true;
  }

  /**
   * Test 4: Duplicate documents
   * Expected: Duplicate detection should identify duplicates
   */
  testDuplicateDocuments(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Complete Blood Count',
        description: 'Normal results',
        date: '2023-03-15',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'cbc-report.pdf',
        sourceText: 'Normal',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId: 'test',
        eventType: 'laboratory',
        title: 'Complete Blood Count',
        description: 'Normal results',
        date: '2023-03-15',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'cbc-report-copy.pdf',
        sourceText: 'Normal',
        metadata: {},
      },
    ];

    const duplicates = this.service.detectDuplicates(events);

    if (duplicates.totalDuplicates !== 1) {
      console.error('  ✗ Test 4 FAILED: Duplicate documents not detected');
      return false;
    }

    console.log('  ✓ Test 4 PASSED: Duplicate documents detected correctly');
    return true;
  }

  /**
   * Test 5: Missing dates
   * Expected: System should handle missing dates without crashing
   */
  testMissingDates(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'headache',
        description: 'Headache reported',
        date: null,
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'no-date.txt',
        sourceText: 'Headache',
        metadata: {},
      },
    ];

    const dataQuality = this.service.assessDataQuality(events, 1);

    if (dataQuality.missingDateCount !== 1) {
      console.error('  ✗ Test 5 FAILED: Missing dates not properly counted');
      return false;
    }

    console.log('  ✓ Test 5 PASSED: Missing dates handled correctly');
    return true;
  }

  /**
   * Test 6: Ambiguous terminology
   * Expected: System should preserve ambiguity
   */
  testAmbiguousTerminology(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'diagnosis',
        title: 'chest pain',
        description: 'Chest pain of unclear etiology',
        date: '2023-04-20',
        endDate: null,
        status: 'possible',
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'ambiguous.txt',
        sourceText: 'Chest pain of unclear etiology',
        metadata: {},
      },
    ];

    // Validation should not convert "unclear etiology" to definitive diagnosis
    const validation = this.service.validateDiagnosisClaim(
      'chest pain',
      'confirmed',
      events
    );

    if (validation.isValid) {
      console.error('  ✗ Test 6 FAILED: Ambiguous terminology was converted to definitive');
      return false;
    }

    console.log('  ✓ Test 6 PASSED: Ambiguous terminology preserved correctly');
    return true;
  }

  /**
   * Test 7: Negation
   * Expected: Negative evidence should remain negative
   */
  testNegationRedTeam(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'nausea',
        description: 'Patient denies nausea',
        date: '2023-05-10',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'negation.txt',
        sourceText: 'Patient denies nausea',
        metadata: {},
      },
    ];

    const validation = this.service.validateNegation(
      'Patient has nausea',
      ['event-1'],
      events
    );

    if (validation.isValid) {
      console.error('  ✗ Test 7 FAILED: Negation was incorrectly flipped to positive');
      return false;
    }

    console.log('  ✓ Test 7 PASSED: Negation preserved correctly');
    return true;
  }

  /**
   * Test 8: Historical diagnosis should not be presented as current
   */
  testHistoricalDiagnosis(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'diagnosis',
        title: 'pneumonia',
        description: 'History of pneumonia in 2018',
        date: '2018-03-15',
        endDate: '2018-04-01',
        status: 'resolved',
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'historical.txt',
        sourceText: 'History of pneumonia in 2018',
        metadata: {},
      },
    ];

    // Temporal validation should catch if presented as current
    const validation = this.service.validateTemporalClaim(
      'Patient has pneumonia',
      true,
      events,
      180
    );

    if (validation.isValid) {
      console.error('  ✗ Text 8 FAILED: Historical diagnosis presented as current');
      return false;
    }

    console.log('  ✓ Test 8 PASSED: Historical diagnosis handled correctly');
    return true;
  }

  /**
   * Test 9: Hypothetical statements should not be treated as facts
   */
  testHypotheticalStatements(): boolean {
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId: 'test',
        eventType: 'symptom',
        title: 'fatigue',
        description: 'If fatigue persists, consider anemia',
        date: '2023-06-15',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'hypothetical.txt',
        sourceText: 'If fatigue persists, consider anemia',
        metadata: {},
      },
    ];

    // The statement is hypothetical, not a confirmed diagnosis
    const validation = this.service.validateDiagnosisClaim(
      'anemia',
      'confirmed',
      events
    );

    if (validation.isValid) {
      console.error('  ✗ Test 9 FAILED: Hypothetical statement treated as fact');
      return false;
    }

    console.log('  ✓ Test 9 PASSED: Hypothetical statements handled correctly');
    return true;
  }

  /**
   * Run all red-team tests
   */
  runAll(): void {
    console.log('Running Red-Team Prompt Tests (Phase 13)...\n');

    let passed = 0;
    let failed = 0;

    try {
      if (this.testIncompleteRecords()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 1 failed with error:', error);
      failed++;
    }

    try {
      if (this.testContradictoryRecords()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 2 failed with error:', error);
      failed++;
    }

    try {
      if (this.testMisleadingOCR()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 3 failed with error:', error);
      failed++;
    }

    try {
      if (this.testDuplicateDocuments()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 4 failed with error:', error);
      failed++;
    }

    try {
      if (this.testMissingDates()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 5 failed with error:', error);
      failed++;
    }

    try {
      if (this.testAmbiguousTerminology()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 6 failed with error:', error);
      failed++;
    }

    try {
      if (this.testNegationRedTeam()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 7 failed with error:', error);
      failed++;
    }

    try {
      if (this.testHistoricalDiagnosis()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 8 failed with error:', error);
      failed++;
    }

    try {
      if (this.testHypotheticalStatements()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Test 9 failed with error:', error);
      failed++;
    }

    console.log(`\nRed-Team Tests: ${passed} passed, ${failed} failed`);
  }
}

/**
 * Simple test runner for red-team tests
 */
function runRedTeamTests() {
  const testSuite = new RedTeamTestSuite();
  testSuite.runAll();
}

// Run tests if this file is executed directly
runRedTeamTests();
