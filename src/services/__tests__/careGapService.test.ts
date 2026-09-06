/**
 * Unit Tests for CareGapService
 * 
 * These tests verify the deterministic detection logic for each care gap type.
 * Run with: npx ts-node src/services/__tests__/careGapService.test.ts
 */

import { CareGapService } from '../careGapService';
import type { MedicalEvent } from '../../types';

// Mock patient ID
const TEST_PATIENT_ID = 'test-patient-001';

// Helper function to create a medical event
function createEvent(
  id: string,
  title: string,
  date: string,
  sourceDocumentName: string,
  eventType: 'symptom' | 'laboratory' | 'medication' = 'symptom'
): MedicalEvent {
  return {
    id,
    patientId: TEST_PATIENT_ID,
    eventType,
    title,
    description: title,
    date,
    endDate: null,
    status: null,
    severity: null,
    sourceRecordId: id,
    sourceDocumentName,
    sourceText: null,
    metadata: {},
  };
}

// Run tests
console.log('Running CareGapService unit tests...\n');

// Simple test runner
function runTests() {
  let passed = 0;
  let failed = 0;

  const testCases = [
    // Recurring Issue Detection
    () => {
      const careGapService = CareGapService.getInstance();
      const events: MedicalEvent[] = [
        createEvent('1', 'Fatigue', '2021-03-15', 'consultation-2021.txt', 'symptom'),
        createEvent('2', 'Fatigue', '2022-07-20', 'consultation-2022.txt', 'symptom'),
        createEvent('3', 'Fatigue', '2024-01-10', 'consultation-2024.txt', 'symptom'),
      ];
      const careGaps = careGapService.analyzeCareGaps(TEST_PATIENT_ID, events, []);
      const recurringIssue = careGaps.find(g => g.gapType === 'recurring_issue');
      if (recurringIssue) {
        console.log('✓ Recurring issue detection works');
        passed++;
      } else {
        console.log('✗ Recurring issue detection failed');
        failed++;
      }
    },
    // Persistent Abnormal Finding Detection
    () => {
      const careGapService = CareGapService.getInstance();
      const events: MedicalEvent[] = [
        createEvent('1', 'Hemoglobin 9.4 g/dL', '2021-05-10', 'lab-2021.txt', 'laboratory'),
        createEvent('2', 'Hemoglobin 9.2 g/dL', '2022-08-15', 'lab-2022.txt', 'laboratory'),
        createEvent('3', 'Hemoglobin 9.3 g/dL', '2024-02-20', 'lab-2024.txt', 'laboratory'),
      ];
      const careGaps = careGapService.analyzeCareGaps(TEST_PATIENT_ID, events, []);
      const persistentFinding = careGaps.find(g => g.gapType === 'persistent_abnormal_finding');
      if (persistentFinding) {
        console.log('✓ Persistent abnormal finding detection works');
        passed++;
      } else {
        console.log('✗ Persistent abnormal finding detection failed');
        failed++;
      }
    },
    // Follow-up Gap Detection
    () => {
      const careGapService = CareGapService.getInstance();
      const events: MedicalEvent[] = [
        createEvent('1', 'ALT 85 U/L', '2023-03-15', 'lab-2023.txt', 'laboratory'),
      ];
      const careGaps = careGapService.analyzeCareGaps(TEST_PATIENT_ID, events, []);
      const followUpGap = careGaps.find(g => g.gapType === 'potential_follow_up_gap');
      if (followUpGap) {
        console.log('✓ Follow-up gap detection works');
        passed++;
      } else {
        console.log('✗ Follow-up gap detection failed');
        failed++;
      }
    },
    // Evidence Validation
    () => {
      const careGapService = CareGapService.getInstance();
      const events: MedicalEvent[] = [
        createEvent('1', 'Fatigue', '2021-03-15', 'consultation-2021.txt', 'symptom'),
        createEvent('2', 'Fatigue', '2022-07-20', 'consultation-2022.txt', 'symptom'),
      ];
      const careGaps = careGapService.analyzeCareGaps(TEST_PATIENT_ID, events, []);
      const recurringIssue = careGaps.find(g => g.gapType === 'recurring_issue');
      if (recurringIssue && recurringIssue.evidence.length > 0) {
        console.log('✓ Evidence validation works');
        passed++;
      } else {
        console.log('✗ Evidence validation failed');
        failed++;
      }
    },
    // Source Traceability
    () => {
      const careGapService = CareGapService.getInstance();
      const events: MedicalEvent[] = [
        createEvent('1', 'Fatigue', '2021-03-15', 'consultation-2021.txt', 'symptom'),
        createEvent('2', 'Fatigue', '2022-07-20', 'consultation-2022.txt', 'symptom'),
      ];
      const careGaps = careGapService.analyzeCareGaps(TEST_PATIENT_ID, events, []);
      const recurringIssue = careGaps.find(g => g.gapType === 'recurring_issue');
      if (recurringIssue && recurringIssue.eventIds.length > 0) {
        console.log('✓ Source traceability works');
        passed++;
      } else {
        console.log('✗ Source traceability failed');
        failed++;
      }
    },
    // Analysis Versioning
    () => {
      const careGapService = CareGapService.getInstance();
      const events: MedicalEvent[] = [
        createEvent('1', 'Fatigue', '2021-03-15', 'consultation-2021.txt', 'symptom'),
      ];
      const version1 = careGapService.getCurrentAnalysisVersion();
      careGapService.regenerateAnalysis(TEST_PATIENT_ID, events, []);
      const version2 = careGapService.getCurrentAnalysisVersion();
      if (version2 === version1 + 1) {
        console.log('✓ Analysis versioning works');
        passed++;
      } else {
        console.log('✗ Analysis versioning failed');
        failed++;
      }
    },
    // Dismissal Workflow
    () => {
      const careGapService = CareGapService.getInstance();
      const events: MedicalEvent[] = [
        createEvent('1', 'Fatigue', '2021-03-15', 'consultation-2021.txt', 'symptom'),
        createEvent('2', 'Fatigue', '2022-07-20', 'consultation-2022.txt', 'symptom'),
      ];
      const careGaps = careGapService.analyzeCareGaps(TEST_PATIENT_ID, events, []);
      const recurringIssue = careGaps.find(g => g.gapType === 'recurring_issue');
      if (recurringIssue) {
        careGapService.dismissCareGap(recurringIssue.id, 'Test dismissal');
        const updatedGaps = careGapService.analyzeCareGaps(TEST_PATIENT_ID, events, []);
        const dismissedGap = updatedGaps.find(g => g.id === recurringIssue.id);
        if (dismissedGap && dismissedGap.status === 'dismissed') {
          console.log('✓ Dismissal workflow works');
          passed++;
        } else {
          console.log('✗ Dismissal workflow failed');
          failed++;
        }
      } else {
        console.log('✗ Dismissal workflow failed - no gap found');
        failed++;
      }
    },
  ];

  testCases.forEach(test => test());

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run if executed directly
runTests();

export { runTests };
