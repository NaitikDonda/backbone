/**
 * Longitudinal Theme Tests - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Tests for longitudinal theme generation.
 */

import { EpisodeGroupingService } from '../episodeGroupingService';
import type { MedicalEvent, Pattern } from '../../types';

/**
 * Longitudinal Theme Test Suite
 */
class LongitudinalThemeTestSuite {
  private service: EpisodeGroupingService;

  constructor() {
    this.service = EpisodeGroupingService.getInstance();
  }

  /**
   * Test 1: Theme generation for recurring concept
   */
  testRecurringConceptTheme(): boolean {
    console.log('  Test 1: Theme generation for recurring concept');

    const patientId = 'test-patient-1';
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
      console.error('  ✗ Test 1 FAILED: No themes generated for recurring concept');
      return false;
    }

    if (themes[0].canonicalConcept !== 'fatigue') {
      console.error(`  ✗ Test 1 FAILED: Expected theme for 'fatigue', got '${themes[0].canonicalConcept}'`);
      return false;
    }

    if (themes[0].episodeIds.length < 2) {
      console.error(`  ✗ Test 1 FAILED: Theme should span multiple episodes`);
      return false;
    }

    console.log('  ✓ Test 1 PASSED: Recurring concept theme generated correctly');
    return true;
  }

  /**
   * Test 2: No theme for single occurrence
   */
  testSingleOccurrenceNoTheme(): boolean {
    console.log('  Test 2: No theme for single occurrence');

    const patientId = 'test-patient-2';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'Headache',
        description: 'Headache documented',
        date: '2020-01-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-1',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Headache',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);
    const themes = this.service.detectRecurringConcepts(episodes, events, patterns);

    if (themes.length !== 0) {
      console.error(`  ✗ Test 2 FAILED: Expected 0 themes for single occurrence, got ${themes.length}`);
      return false;
    }

    console.log('  ✓ Test 2 PASSED: No theme generated for single occurrence');
    return true;
  }

  /**
   * Test 3: Multiple themes for different concepts
   */
  testMultipleThemes(): boolean {
    console.log('  Test 3: Multiple themes for different concepts');

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
        title: 'Headache',
        description: 'Headache documented',
        date: '2020-02-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-3',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Headache',
        metadata: { isDuplicate: false },
      },
      {
        id: 'event-4',
        patientId,
        eventType: 'symptom',
        title: 'Headache',
        description: 'Headache documented',
        date: '2021-02-15',
        endDate: null,
        status: 'active',
        severity: 'mild',
        sourceRecordId: 'record-4',
        sourceDocumentName: 'consultation.txt',
        sourceText: 'Headache',
        metadata: { isDuplicate: false },
      },
    ];

    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);
    const themes = this.service.detectRecurringConcepts(episodes, events, patterns);

    if (themes.length < 2) {
      console.error(`  ✗ Test 3 FAILED: Expected at least 2 themes, got ${themes.length}`);
      return false;
    }

    const concepts = themes.map(t => t.canonicalConcept);
    if (!concepts.includes('fatigue') || !concepts.includes('headache')) {
      console.error('  ✗ Test 3 FAILED: Expected themes for both fatigue and headache');
      return false;
    }

    console.log('  ✓ Test 3 PASSED: Multiple themes generated correctly');
    return true;
  }

  /**
   * Test 4: Theme metadata
   */
  testThemeMetadata(): boolean {
    console.log('  Test 4: Theme metadata');

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
    ];

    const patterns: Pattern[] = [];
    const episodes = this.service.groupEventsIntoEpisodes(patientId, events, patterns);
    const themes = this.service.detectRecurringConcepts(episodes, events, patterns);

    if (themes.length === 0) {
      console.error('  ✗ Test 4 FAILED: No themes generated');
      return false;
    }

    const theme = themes[0];
    if (!theme.metadata || !theme.metadata.episodeCount || !theme.metadata.eventCount) {
      console.error('  ✗ Test 4 FAILED: Theme metadata incomplete');
      return false;
    }

    if ((theme.metadata.episodeCount as number) < 2) {
      console.error('  ✗ Test 4 FAILED: Episode count should be at least 2');
      return false;
    }

    console.log('  ✓ Test 4 PASSED: Theme metadata generated correctly');
    return true;
  }

  /**
   * Run all tests
   */
  runAllTests(): void {
    console.log('Running Longitudinal Theme Tests (Phase 14)...');
    console.log('');

    const results = [
      this.testRecurringConceptTheme(),
      this.testSingleOccurrenceNoTheme(),
      this.testMultipleThemes(),
      this.testThemeMetadata(),
    ];

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    console.log('');
    console.log(`Longitudinal Theme Tests: ${passed} passed, ${failed} failed`);
  }
}

// Run tests
const testSuite = new LongitudinalThemeTestSuite();
testSuite.runAllTests();
