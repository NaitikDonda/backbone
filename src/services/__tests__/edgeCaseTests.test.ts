/**
 * Edge Case Tests - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Tests for edge cases and boundary conditions in journey reconstruction.
 */

import { EpisodeGroupingService } from '../episodeGroupingService';
import { TransitionDetectionService } from '../transitionDetectionService';
import { RecordCoverageService } from '../recordCoverageService';
import { ConflictDetectionService } from '../conflictDetectionService';
import type { MedicalEvent, Pattern, HealthEpisode } from '../../types';

/**
 * Edge Case Test Suite
 */
class EdgeCaseTestSuite {
  private episodeService: EpisodeGroupingService;
  private transitionService: TransitionDetectionService;
  private coverageService: RecordCoverageService;
  private conflictService: ConflictDetectionService;

  constructor() {
    this.episodeService = EpisodeGroupingService.getInstance();
    this.transitionService = TransitionDetectionService.getInstance();
    this.coverageService = RecordCoverageService.getInstance();
    this.conflictService = ConflictDetectionService.getInstance();
  }

  /**
   * Test 1: All undated events
   */
  testAllUndatedEvents(): boolean {
    console.log('  Test 1: All undated events');

    const patientId = 'test-patient-1';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: null,
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: null,
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-2',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.episodeService.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length === 0) {
      console.error('  ✗ Test 1 FAILED: Undated events should still create episodes');
      return false;
    }

    if (episodes[0].startDate !== null) {
      console.error('  ✗ Test 1 FAILED: Undated episode should have null startDate');
      return false;
    }

    console.log('  ✓ Test 1 PASSED: All undated events handled correctly');
    return true;
  }

  /**
   * Test 2: Single event
   */
  testSingleEvent(): boolean {
    console.log('  Test 2: Single event');

    const patientId = 'test-patient-2';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: '2020-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.episodeService.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length !== 1) {
      console.error(`  ✗ Test 2 FAILED: Expected 1 episode for single event, got ${episodes.length}`);
      return false;
    }

    if (episodes[0].eventIds.length !== 1) {
      console.error('  ✗ Test 2 FAILED: Episode should contain single event');
      return false;
    }

    console.log('  ✓ Test 2 PASSED: Single event handled correctly');
    return true;
  }

  /**
   * Test 3: Very large temporal gap (10 years)
   */
  testLargeTemporalGap(): boolean {
    console.log('  Test 3: Very large temporal gap (10 years)');

    const patientId = 'test-patient-3';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: '2010-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: '2020-01-15', // 10 year gap
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-2',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.episodeService.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length !== 2) {
      console.error(`  ✗ Test 3 FAILED: Expected 2 episodes for 10 year gap, got ${episodes.length}`);
      return false;
    }

    console.log('  ✓ Test 3 PASSED: Large temporal gap creates separate episodes');
    return true;
  }

  /**
   * Test 4: Empty events array
   */
  testEmptyEventsArray(): boolean {
    console.log('  Test 4: Empty events array');

    const patientId = 'test-patient-4';
    const events: MedicalEvent[] = [];
    const patterns: Pattern[] = [];
    const episodes = this.episodeService.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length !== 0) {
      console.error(`  ✗ Test 4 FAILED: Expected 0 episodes for empty events, got ${episodes.length}`);
      return false;
    }

    console.log('  ✓ Test 4 PASSED: Empty events array handled correctly');
    return true;
  }

  /**
   * Test 5: Record coverage with no dates
   */
  testRecordCoverageNoDates(): boolean {
    console.log('  Test 5: Record coverage with no dates');

    const patientId = 'test-patient-5';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: null,
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const coverage = this.coverageService.analyzeRecordCoverage(patientId, events);

    if (coverage.earliestDate !== null || coverage.latestDate !== null) {
      console.error('  ✗ Test 5 FAILED: Coverage should have null dates for undated events');
      return false;
    }

    if (coverage.completeness !== 'sparse') {
      console.error(`  ✗ Test 5 FAILED: Expected 'sparse' completeness, got ${coverage.completeness}`);
      return false;
    }

    console.log('  ✓ Test 5 PASSED: Record coverage with no dates handled correctly');
    return true;
  }

  /**
   * Test 6: Conflict detection with no conflicts
   */
  testNoConflicts(): boolean {
    console.log('  Test 6: Conflict detection with no conflicts');

    const patientId = 'test-patient-6';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: '2020-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const conflicts = this.conflictService.detectConflicts(events);

    if (conflicts.length !== 0) {
      console.error(`  ✗ Test 6 FAILED: Expected 0 conflicts, got ${conflicts.length}`);
      return false;
    }

    console.log('  ✓ Test 6 PASSED: No conflicts detected correctly');
    return true;
  }

  /**
   * Test 7: Conflict detection with negation conflict
   */
  testNegationConflict(): boolean {
    console.log('  Test 7: Conflict detection with negation conflict');

    const patientId = 'test-patient-7';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Patient reports fatigue',
        date: '2020-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Patient reports fatigue',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Patient denies fatigue',
        date: '2020-02-15',
        endDate: null,
        status: 'active',
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Patient denies fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const conflicts = this.conflictService.detectConflicts(events);

    if (conflicts.length === 0) {
      console.error('  ✗ Test 7 FAILED: Negation conflict not detected');
      return false;
    }

    const negationConflict = conflicts.find(c => c.description.includes('negation'));
    if (!negationConflict) {
      console.error('  ✗ Test 7 FAILED: Negation conflict not found in results');
      return false;
    }

    console.log('  ✓ Test 7 PASSED: Negation conflict detected correctly');
    return true;
  }

  /**
   * Test 8: Transition detection with undated episodes
   */
  testTransitionUndatedEpisodes(): boolean {
    console.log('  Test 8: Transition detection with undated episodes');

    const patientId = 'test-patient-8';
    const episodes: HealthEpisode[] = [
      {
        id: 'episode-1',
        patientId,
        title: 'Undated Episode',
        description: 'Episode without dates',
        summary: 'Undated',
        type: 'symptom_episode',
        status: 'active_in_records',
        startDate: null,
        endDate: null,
        eventIds: ['event-1'],
        patternIds: [],
        sourceRecordIds: ['record-1'],
        themes: [],
        transitions: [],
        metadata: {},
        createdAt: '2020-01-15T00:00:00Z',
        updatedAt: '2020-01-15T00:00:00Z',
      },
    ];

    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: null,
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const transitions = this.transitionService.detectTransitions(patientId, episodes, events);

    if (transitions.length !== 0) {
      console.error(`  ✗ Test 8 FAILED: Expected 0 transitions for undated episodes, got ${transitions.length}`);
      return false;
    }

    console.log('  ✓ Test 8 PASSED: Undated episodes handled correctly in transition detection');
    return true;
  }

  /**
   * Test 9: Duplicate events
   */
  testDuplicateEvents(): boolean {
    console.log('  Test 9: Duplicate events');

    const patientId = 'test-patient-9';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: '2020-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: '2020-01-15', // Same date
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-2',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.episodeService.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length === 0) {
      console.error('  ✗ Test 9 FAILED: Duplicate events should still create episodes');
      return false;
    }

    console.log('  ✓ Test 9 PASSED: Duplicate events handled correctly');
    return true;
  }

  /**
   * Test 10: Mixed event types
   */
  testMixedEventTypes(): boolean {
    console.log('  Test 10: Mixed event types');

    const patientId = 'test-patient-10';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: '2020-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'laboratory',
        title: 'CBC',
        description: 'Complete blood count',
        date: '2020-01-20',
        endDate: null,
        status: 'active',
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'lab-report.txt',
        sourceText: 'CBC ordered',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-3',
        patientId,
        eventType: 'medication',
        title: 'Vitamin B12',
        description: 'B12 supplement',
        date: '2020-01-25',
        endDate: null,
        status: 'active',
        severity: null,
        sourceRecordId: 'record-3',
        sourceDocumentName: 'prescription.txt',
        sourceText: 'B12 supplement',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.episodeService.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length === 0) {
      console.error('  ✗ Test 10 FAILED: Mixed event types should create episodes');
      return false;
    }

    if (episodes[0].type !== 'mixed_episode') {
      console.error(`  ✗ Test 10 FAILED: Expected 'mixed_episode' type, got ${episodes[0].type}`);
      return false;
    }

    console.log('  ✓ Test 10 PASSED: Mixed event types handled correctly');
    return true;
  }

  /**
   * Run all tests
   */
  runAllTests(): void {
    console.log('Running Edge Case Tests (Phase 14)...');
    console.log('');

    const results = [
      this.testAllUndatedEvents(),
      this.testSingleEvent(),
      this.testLargeTemporalGap(),
      this.testEmptyEventsArray(),
      this.testRecordCoverageNoDates(),
      this.testNoConflicts(),
      this.testNegationConflict(),
      this.testTransitionUndatedEpisodes(),
      this.testDuplicateEvents(),
      this.testMixedEventTypes(),
    ];

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    console.log('');
    console.log(`Edge Case Tests: ${passed} passed, ${failed} failed`);
  }
}

// Run tests
const testSuite = new EdgeCaseTestSuite();
testSuite.runAllTests();
