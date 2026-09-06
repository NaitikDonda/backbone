/**
 * Unit Tests for Semantic Normalization Service (Phase 12)
 */

import { SemanticNormalizationService } from '../semanticNormalizationService';
import type { MedicalEvent } from '../../types';

/**
 * Test suite for SemanticNormalizationService
 */
class SemanticNormalizationTestSuite {
  private service: SemanticNormalizationService;

  constructor() {
    this.service = SemanticNormalizationService.getInstance();
    this.service.clearRejectedRelationships();
  }

  /**
   * Test 1: Synonym detection between events
   */
  async testSynonymDetection(): Promise<boolean> {
    const patientId = 'test-patient-001';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'fatigue',
        description: 'Patient reports fatigue',
        date: '2019-03-15',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Patient reports fatigue',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'tiredness',
        description: 'Patient reports tiredness',
        date: '2021-07-20',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'doc-2.txt',
        sourceText: 'Patient reports tiredness',
        metadata: {},
      },
    ];

    const analysis = await this.service.analyzeSemanticRelationships(patientId, events);

    if (analysis.semanticRelationships.length === 0) {
      console.error('  ✗ Expected at least 1 semantic relationship');
      return false;
    }

    if (analysis.semanticRelationships[0].canonicalConceptName !== 'fatigue') {
      console.error('  ✗ Expected canonical concept name to be "fatigue"');
      return false;
    }

    if (analysis.semanticRelationships[0].matchingMethod !== 'synonym_mapping') {
      console.error('  ✗ Expected matching method to be "synonym_mapping"');
      return false;
    }

    if (analysis.semanticRelationships[0].relationshipStrength !== 'high') {
      console.error('  ✗ Expected relationship strength to be "high"');
      return false;
    }

    console.log('  ✓ Synonym detection test passed');
    return true;
  }

  /**
   * Test 2: Deterministic normalization relationships
   */
  async testDeterministicNormalization(): Promise<boolean> {
    const patientId = 'test-patient-001';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'laboratory',
        title: 'Vitamin B12',
        description: 'Low Vitamin B12',
        date: '2019-04-08',
        endDate: null,
        status: 'abnormal',
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Low Vitamin B12',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'laboratory',
        title: 'B12',
        description: 'Low B12',
        date: '2021-09-15',
        endDate: null,
        status: 'abnormal',
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'doc-2.txt',
        sourceText: 'Low B12',
        metadata: {},
      },
    ];

    const analysis = await this.service.analyzeSemanticRelationships(patientId, events);

    if (analysis.semanticRelationships.length === 0) {
      console.error('  ✗ Expected at least 1 semantic relationship');
      return false;
    }

    if (analysis.semanticRelationships[0].canonicalConceptName !== 'vitamin b12') {
      console.error('  ✗ Expected canonical concept name to be "vitamin b12"');
      return false;
    }

    if (analysis.semanticRelationships[0].matchingMethod !== 'deterministic_dictionary') {
      console.error('  ✗ Expected matching method to be "deterministic_dictionary"');
      return false;
    }

    console.log('  ✓ Deterministic normalization test passed');
    return true;
  }

  /**
   * Test 3: Negation handling - should not create relationships for negated events
   */
  async testNegationHandling(): Promise<boolean> {
    const patientId = 'test-patient-001';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'headache',
        description: 'Patient reports headache',
        date: '2020-02-05',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Patient reports headache',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'headache',
        description: 'Patient denies headache',
        date: '2021-03-10',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'doc-2.txt',
        sourceText: 'Patient denies headache',
        metadata: {},
      },
    ];

    const analysis = await this.service.analyzeSemanticRelationships(patientId, events);

    // Should not create relationship because event-2 is negated
    if (analysis.semanticRelationships.length !== 0) {
      console.error('  ✗ Expected no semantic relationships due to negation');
      return false;
    }

    console.log('  ✓ Negation handling test passed');
    return true;
  }

  /**
   * Test 4: Historical qualifier detection
   */
  async testHistoricalQualifier(): Promise<boolean> {
    const patientId = 'test-patient-001';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'nausea',
        description: 'Patient reports nausea',
        date: '2018-06-12',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Patient reports nausea',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'nausea',
        description: 'History of nausea in 2018, no current symptoms',
        date: '2022-11-20',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'doc-2.txt',
        sourceText: 'History of nausea in 2018, no current symptoms',
        metadata: {},
      },
    ];

    const analysis = await this.service.analyzeSemanticRelationships(patientId, events);

    if (analysis.semanticRelationships.length === 0) {
      console.error('  ✗ Expected at least 1 semantic relationship');
      return false;
    }

    if (!analysis.semanticRelationships[0].isHistorical) {
      console.error('  ✗ Expected relationship to be marked as historical');
      return false;
    }

    if (analysis.semanticRelationships[0].temporalQualifier !== 'historical') {
      console.error('  ✗ Expected temporal qualifier to be "historical"');
      return false;
    }

    console.log('  ✓ Historical qualifier test passed');
    return true;
  }

  /**
   * Test 5: Episode grouping
   */
  async testEpisodeGrouping(): Promise<boolean> {
    const patientId = 'test-patient-001';
    const events: MedicalEvent[] = [
      {
        id: 'event-1',
        patientId,
        eventType: 'symptom',
        title: 'dizziness',
        description: 'Patient reports dizziness',
        date: '2020-03-05',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-1',
        sourceDocumentName: 'doc-1.txt',
        sourceText: 'Patient reports dizziness',
        metadata: {},
      },
      {
        id: 'event-2',
        patientId,
        eventType: 'symptom',
        title: 'dizziness',
        description: 'Continued dizziness',
        date: '2020-06-15',
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: 'record-2',
        sourceDocumentName: 'doc-2.txt',
        sourceText: 'Continued dizziness',
        metadata: {},
      },
    ];

    const analysis = await this.service.analyzeSemanticRelationships(patientId, events);

    if (analysis.episodes.length === 0) {
      console.error('  ✗ Expected at least 1 episode');
      return false;
    }

    if (analysis.episodes[0].episodeType !== 'continuous') {
      console.error('  ✗ Expected episode type to be "continuous"');
      return false;
    }

    if (!analysis.episodes[0].eventIds.includes('event-1') || !analysis.episodes[0].eventIds.includes('event-2')) {
      console.error('  ✗ Expected episode to include both events');
      return false;
    }

    console.log('  ✓ Episode grouping test passed');
    return true;
  }

  /**
   * Test 6: Thresholds
   */
  testThresholds(): boolean {
    const thresholds = this.service.getThresholds();

    if (thresholds.highSimilarity !== 0.85) {
      console.error('  ✗ Expected high similarity threshold to be 0.85');
      return false;
    }

    if (thresholds.mediumSimilarity !== 0.70) {
      console.error('  ✗ Expected medium similarity threshold to be 0.70');
      return false;
    }

    if (thresholds.lowSimilarity !== 0.50) {
      console.error('  ✗ Expected low similarity threshold to be 0.50');
      return false;
    }

    if (thresholds.maxEpisodeGapDays !== 180) {
      console.error('  ✗ Expected max episode gap days to be 180');
      return false;
    }

    // Test setting custom thresholds
    this.service.setThresholds({
      highSimilarity: 0.90,
      mediumSimilarity: 0.75,
    });

    const newThresholds = this.service.getThresholds();

    if (newThresholds.highSimilarity !== 0.90) {
      console.error('  ✗ Expected updated high similarity threshold to be 0.90');
      return false;
    }

    if (newThresholds.mediumSimilarity !== 0.75) {
      console.error('  ✗ Expected updated medium similarity threshold to be 0.75');
      return false;
    }

    // Reset to defaults
    this.service.setThresholds({
      highSimilarity: 0.85,
      mediumSimilarity: 0.70,
    });

    console.log('  ✓ Thresholds test passed');
    return true;
  }

  /**
   * Test 7: Reviewer override system
   */
  testReviewerOverride(): boolean {
    const relationshipId = 'semantic-rel-event-1-event-2';
    const reason = 'Not semantically related';

    this.service.reviewRelationship(relationshipId, 'reject', reason);

    // Test confirming a relationship
    this.service.reviewRelationship(relationshipId, 'confirm', 'Confirmed as semantically related');

    // Test clearing rejected relationships
    this.service.clearRejectedRelationships();

    console.log('  ✓ Reviewer override test passed');
    return true;
  }

  /**
   * Test 8: Analysis version
   */
  testAnalysisVersion(): boolean {
    const version = this.service.getAnalysisVersion();

    if (version !== 'development-0.1') {
      console.error('  ✗ Expected analysis version to be "development-0.1"');
      return false;
    }

    this.service.setAnalysisVersion('test-1.0');

    const newVersion = this.service.getAnalysisVersion();

    if (newVersion !== 'test-1.0') {
      console.error('  ✗ Expected updated analysis version to be "test-1.0"');
      return false;
    }

    // Reset to default
    this.service.setAnalysisVersion('development-0.1');

    console.log('  ✓ Analysis version test passed');
    return true;
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<void> {
    console.log('Running Semantic Normalization Service Tests...\n');

    let passed = 0;
    let failed = 0;

    try {
      if (await this.testSynonymDetection()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Synonym detection test failed with error:', error);
      failed++;
    }

    try {
      if (await this.testDeterministicNormalization()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Deterministic normalization test failed with error:', error);
      failed++;
    }

    try {
      if (await this.testNegationHandling()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Negation handling test failed with error:', error);
      failed++;
    }

    try {
      if (await this.testHistoricalQualifier()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Historical qualifier test failed with error:', error);
      failed++;
    }

    try {
      if (await this.testEpisodeGrouping()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Episode grouping test failed with error:', error);
      failed++;
    }

    try {
      if (this.testThresholds()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Thresholds test failed with error:', error);
      failed++;
    }

    try {
      if (this.testReviewerOverride()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Reviewer override test failed with error:', error);
      failed++;
    }

    try {
      if (this.testAnalysisVersion()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Analysis version test failed with error:', error);
      failed++;
    }

    console.log(`\nSemantic Normalization Tests: ${passed} passed, ${failed} failed`);
  }
}

/**
 * Simple test runner for semantic normalization tests
 */
async function runSemanticNormalizationTests() {
  const testSuite = new SemanticNormalizationTestSuite();
  await testSuite.runAll();
}

// Run tests if this file is executed directly
runSemanticNormalizationTests().catch(error => {
  console.error('Test execution failed:', error);
});

