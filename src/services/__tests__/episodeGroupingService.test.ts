/**
 * Episode Grouping Service Tests - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Tests for episode grouping, temporal window configuration, resolution detection,
 * and recurrence detection.
 */

import { EpisodeGroupingService } from '../episodeGroupingService';
import type { MedicalEvent, Pattern } from '../../types';

/**
 * Episode Grouping Test Suite
 */
class EpisodeGroupingTestSuite {
  private service: EpisodeGroupingService;

  constructor() {
    this.service = EpisodeGroupingService.getInstance();
  }

  /**
   * Test 1: Basic episode grouping with temporal proximity
   */
  testBasicEpisodeGrouping(): boolean {
    console.log('  Test 1: Basic episode grouping with temporal proximity');

    const patientId = 'test-patient-1';
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
        eventType: 'consultation',
        title: 'Follow-up',
        description: 'Follow-up visit',
        date: '2020-02-15',
        endDate: null,
        status: 'active',
        severity: null,
        sourceRecordId: 'record-3',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Follow-up visit',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length === 0) {
      console.error('  ✗ Test 1 FAILED: No episodes created');
      return false;
    }

    if (episodes.length !== 1) {
      console.error(`  ✗ Test 1 FAILED: Expected 1 episode, got ${episodes.length}`);
      return false;
    }

    if (episodes[0].eventIds.length !== 3) {
      console.error(`  ✗ Test 1 FAILED: Expected 3 events in episode, got ${episodes[0].eventIds.length}`);
      return false;
    }

    console.log('  ✓ Test 1 PASSED: Basic episode grouping works correctly');
    return true;
  }

  /**
   * Test 2: Episode separation by temporal gap
   */
  testTemporalGapSeparation(): boolean {
    console.log('  Test 2: Episode separation by temporal gap');

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
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue recurrence',
        date: '2021-01-15', // 1 year gap
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-2',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue recurrence',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length !== 2) {
      console.error(`  ✗ Test 2 FAILED: Expected 2 episodes due to temporal gap, got ${episodes.length}`);
      return false;
    }

    console.log('  ✓ Test 2 PASSED: Temporal gap creates separate episodes');
    return true;
  }

  /**
   * Test 3: Explicit resolution detection
   */
  testExplicitResolutionDetection(): boolean {
    console.log('  Test 3: Explicit resolution detection');

    const patientId = 'test-patient-3';
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
        description: 'Symptoms resolved',
        date: '2020-03-15',
        endDate: null,
        status: 'resolved',
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Symptoms resolved',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length === 0) {
      console.error('  ✗ Test 3 FAILED: No episodes created');
      return false;
    }

    const resolvedEpisode = episodes.find(e => e.status === 'resolved_in_records');
    if (!resolvedEpisode) {
      console.error('  ✗ Test 3 FAILED: Resolution not detected');
      return false;
    }

    console.log('  ✓ Test 3 PASSED: Explicit resolution detected correctly');
    return true;
  }

  /**
   * Test 4: Recurrence detection
   */
  testRecurrenceDetection(): boolean {
    console.log('  Test 4: Recurrence detection');

    const patientId = 'test-patient-4';
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
        description: 'Symptoms resolved',
        date: '2020-03-15',
        endDate: null,
        status: 'resolved',
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Symptoms resolved',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-3',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue returned',
        date: '2020-06-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-3',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue returned',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length < 2) {
      console.error(`  ✗ Test 4 FAILED: Expected at least 2 episodes, got ${episodes.length}`);
      return false;
    }

    const recurrences = this.service.detectRecurrenceAfterResolution(episodes, events);
    if (recurrences.length === 0) {
      console.error('  ✗ Test 4 FAILED: Recurrence not detected');
      return false;
    }

    console.log('  ✓ Test 4 PASSED: Recurrence detected correctly');
    return true;
  }

  /**
   * Test 5: Longitudinal theme generation
   */
  testLongitudinalThemeGeneration(): boolean {
    console.log('  Test 5: Longitudinal theme generation');

    const patientId = 'test-patient-5';
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
        date: '2021-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-2',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-3',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: '2022-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-3',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Fatigue',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);
    const themes = this.service.detectRecurringConcepts(episodes, events, patterns);

    if (themes.length === 0) {
      console.error('  ✗ Test 5 FAILED: No themes generated');
      return false;
    }

    if (themes[0].canonicalConcept !== 'fatigue') {
      console.error(`  ✗ Test 5 FAILED: Expected theme for 'fatigue', got '${themes[0].canonicalConcept}'`);
      return false;
    }

    console.log('  ✓ Test 5 PASSED: Longitudinal theme generated correctly');
    return true;
  }

  /**
   * Test 6: Temporal window configuration
   */
  testTemporalWindowConfiguration(): boolean {
    console.log('  Test 6: Temporal window configuration');

    const defaultConfig = this.service.getTemporalConfig();

    if (defaultConfig.defaultGapDays !== 90) {
      console.error(`  ✗ Test 6 FAILED: Expected defaultGapDays 90, got ${defaultConfig.defaultGapDays}`);
      return false;
    }

    this.service.setTemporalConfig({ defaultGapDays: 120 });
    const updatedConfig = this.service.getTemporalConfig();

    if (updatedConfig.defaultGapDays !== 120) {
      console.error(`  ✗ Test 6 FAILED: Configuration not updated correctly`);
      return false;
    }

    // Reset to default
    this.service.setTemporalConfig({ defaultGapDays: 90 });

    console.log('  ✓ Test 6 PASSED: Temporal window configuration works correctly');
    return true;
  }

  /**
   * Test 7: Undated events handling
   */
  testUndatedEventsHandling(): boolean {
    console.log('  Test 7: Undated events handling');

    const patientId = 'test-patient-7';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Fatigue',
        description: 'Fatigue documented',
        date: null, // Undated
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
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length === 0) {
      console.error('  ✗ Test 7 FAILED: Undated event not handled');
      return false;
    }

    if (episodes[0].startDate !== null) {
      console.error('  ✗ Test 7 FAILED: Undated episode should have null startDate');
      return false;
    }

    console.log('  ✓ Test 7 PASSED: Undated events handled correctly');
    return true;
  }

  /**
   * Test 8: Empty events array
   */
  testEmptyEventsArray(): boolean {
    console.log('  Test 8: Empty events array');

    const patientId = 'test-patient-8';
    const events: MedicalEvent[] = [];
    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);

    if (episodes.length !== 0) {
      console.error(`  ✗ Test 8 FAILED: Expected 0 episodes for empty events array, got ${episodes.length}`);
      return false;
    }

    console.log('  ✓ Test 8 PASSED: Empty events array handled correctly');
    return true;
  }

  /**
   * Run all tests
   */
  runAllTests(): void {
    console.log('Running Episode Grouping Service Tests (Phase 14)...');
    console.log('');

    const results = [
      this.testBasicEpisodeGrouping(),
      this.testTemporalGapSeparation(),
      this.testExplicitResolutionDetection(),
      this.testRecurrenceDetection(),
      this.testLongitudinalThemeGeneration(),
      this.testTemporalWindowConfiguration(),
      this.testUndatedEventsHandling(),
      this.testEmptyEventsArray(),
    ];

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    console.log('');
    console.log(`Episode Grouping Service Tests: ${passed} passed, ${failed} failed`);
  }
}

// Run tests
const testSuite = new EpisodeGroupingTestSuite();
testSuite.runAllTests();
