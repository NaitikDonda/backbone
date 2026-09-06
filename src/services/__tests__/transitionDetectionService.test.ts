/**
 * Transition Detection Service Tests - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Tests for transition detection between episodes.
 */

import { TransitionDetectionService } from '../transitionDetectionService';
import type { MedicalEvent, HealthEpisode } from '../../types';

/**
 * Transition Detection Test Suite
 */
class TransitionDetectionTestSuite {
  private service: TransitionDetectionService;

  constructor() {
    this.service = TransitionDetectionService.getInstance();
  }

  /**
   * Test 1: Basic transition detection
   */
  testBasicTransitionDetection(): boolean {
    console.log('  Test 1: Basic transition detection');

    const patientId = 'test-patient-1';
    const episodes: HealthEpisode[] = [
      {
        id: 'episode-1',
        patientId,
        title: 'Fatigue Episode',
        description: 'Initial fatigue',
        summary: 'Fatigue documented',
        type: 'symptom_episode',
        status: 'resolved_in_records',
        startDate: '2020-01-15',
        endDate: '2020-03-15',
        eventIds: ['event-1', 'event-2'],
        patternIds: [],
        sourceRecordIds: ['record-1', 'record-2'],
        themes: [],
        transitions: [],
        metadata: {},
        createdAt: '2020-01-15T00:00:00Z',
        updatedAt: '2020-03-15T00:00:00Z',
      },
      {
        id: 'episode-2',
        patientId,
        title: 'Fatigue Recurrence',
        description: 'Fatigue returned',
        summary: 'Fatigue recurrence',
        type: 'symptom_episode',
        status: 'active_in_records',
        startDate: '2020-06-15',
        endDate: null,
        eventIds: ['event-3'],
        patternIds: [],
        sourceRecordIds: ['record-3'],
        themes: [],
        transitions: [],
        metadata: {},
        createdAt: '2020-06-15T00:00:00Z',
        updatedAt: '2020-06-15T00:00:00Z',
      },
    ];

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

    const transitions = this.service.detectTransitions(patientId, episodes, events);

    if (transitions.length === 0) {
      console.error('  ✗ Test 1 FAILED: No transitions detected');
      return false;
    }

    console.log('  ✓ Test 1 PASSED: Basic transition detection works');
    return true;
  }

  /**
   * Test 2: Initial transition for first episode
   */
  testInitialTransition(): boolean {
    console.log('  Test 2: Initial transition for first episode');

    const patientId = 'test-patient-2';
    const episode: HealthEpisode = {
      id: 'episode-1',
      patientId,
      title: 'Initial Episode',
      description: 'First episode',
      summary: 'Initial symptoms',
      type: 'symptom_episode',
      status: 'active_in_records',
      startDate: '2020-01-15',
      endDate: null,
      eventIds: ['event-1'],
      patternIds: [],
      sourceRecordIds: ['record-1'],
      themes: [],
      transitions: [],
      metadata: {},
      createdAt: '2020-01-15T00:00:00Z',
      updatedAt: '2020-01-15T00:00:00Z',
    };

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

    const transitions = this.service.detectInitialTransitions(patientId, episode, events);

    if (transitions.length === 0) {
      console.error('  ✗ Test 2 FAILED: No initial transition created');
      return false;
    }

    if (transitions[0].fromEpisodeId !== null) {
      console.error('  ✗ Test 2 FAILED: Initial transition should have null fromEpisodeId');
      return false;
    }

    console.log('  ✓ Test 2 PASSED: Initial transition created correctly');
    return true;
  }

  /**
   * Test 3: Empty episodes array
   */
  testEmptyEpisodes(): boolean {
    console.log('  Test 3: Empty episodes array');

    const patientId = 'test-patient-3';
    const episodes: HealthEpisode[] = [];
    const events: MedicalEvent[] = [];

    const transitions = this.service.detectTransitions(patientId, episodes, events);

    if (transitions.length !== 0) {
      console.error(`  ✗ Test 3 FAILED: Expected 0 transitions for empty episodes, got ${transitions.length}`);
      return false;
    }

    console.log('  ✓ Test 3 PASSED: Empty episodes handled correctly');
    return true;
  }

  /**
   * Test 4: Single episode (no transitions)
   */
  testSingleEpisode(): boolean {
    console.log('  Test 4: Single episode (no transitions)');

    const patientId = 'test-patient-4';
    const episodes: HealthEpisode[] = [
      {
        id: 'episode-1',
        patientId,
        title: 'Single Episode',
        description: 'Only episode',
        summary: 'Single episode',
        type: 'symptom_episode',
        status: 'active_in_records',
        startDate: '2020-01-15',
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

    const transitions = this.service.detectTransitions(patientId, episodes, events);

    if (transitions.length !== 0) {
      console.error(`  ✗ Test 4 FAILED: Expected 0 transitions for single episode, got ${transitions.length}`);
      return false;
    }

    console.log('  ✓ Test 4 PASSED: Single episode handled correctly');
    return true;
  }

  /**
   * Run all tests
   */
  runAllTests(): void {
    console.log('Running Transition Detection Service Tests (Phase 14)...');
    console.log('');

    const results = [
      this.testBasicTransitionDetection(),
      this.testInitialTransition(),
      this.testEmptyEpisodes(),
      this.testSingleEpisode(),
    ];

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    console.log('');
    console.log(`Transition Detection Service Tests: ${passed} passed, ${failed} failed`);
  }
}

// Run tests
const testSuite = new TransitionDetectionTestSuite();
testSuite.runAllTests();
