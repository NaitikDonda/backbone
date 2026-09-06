/**
 * Integration Test for Evidence Graph with Semantic Relationships (Phase 12)
 */

import { EvidenceGraphService } from '../evidenceGraphService';
import { SemanticNormalizationService } from '../semanticNormalizationService';
import type { MedicalEvent, SemanticAnalysis } from '../../types';

/**
 * Test suite for evidence graph semantic integration
 */
class EvidenceGraphSemanticTestSuite {
  private evidenceGraphService: EvidenceGraphService;
  private semanticService: SemanticNormalizationService;

  constructor() {
    this.evidenceGraphService = EvidenceGraphService.getInstance();
    this.semanticService = SemanticNormalizationService.getInstance();
  }

  /**
   * Test evidence graph generation with semantic analysis
   */
  async testEvidenceGraphWithSemanticAnalysis(): Promise<boolean> {
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

    // Generate semantic analysis
    const semanticAnalysis: SemanticAnalysis = await this.semanticService.analyzeSemanticRelationships(patientId, events);

    // Generate evidence graph with semantic analysis
    const graph = this.evidenceGraphService.generateFullGraph(
      patientId,
      events,
      [],
      [],
      undefined,
      semanticAnalysis
    );

    // Check that semantic concept nodes were created
    const semanticConceptNodes = graph.nodes.filter(n => n.type === 'semantic_concept');

    if (semanticConceptNodes.length === 0) {
      console.error('  ✗ Expected semantic concept nodes to be created');
      return false;
    }

    // Check that semantic relationships were created
    const semanticRelationships = graph.relationships.filter(r => r.relationshipType === 'semantically_related');

    if (semanticRelationships.length === 0) {
      console.error('  ✗ Expected semantic relationships to be created');
      return false;
    }

    console.log('  ✓ Evidence graph semantic integration test passed');
    return true;
  }

  /**
   * Test evidence graph without semantic analysis (should still work)
   */
  async testEvidenceGraphWithoutSemanticAnalysis(): Promise<boolean> {
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
    ];

    // Generate evidence graph without semantic analysis
    const graph = this.evidenceGraphService.generateFullGraph(
      patientId,
      events,
      [],
      []
    );

    // Should still generate event nodes
    const eventNodes = graph.nodes.filter(n => n.type === 'event');

    if (eventNodes.length === 0) {
      console.error('  ✗ Expected event nodes to be created');
      return false;
    }

    // Should not have semantic concept nodes
    const semanticConceptNodes = graph.nodes.filter(n => n.type === 'semantic_concept');

    if (semanticConceptNodes.length !== 0) {
      console.error('  ✗ Expected no semantic concept nodes without semantic analysis');
      return false;
    }

    console.log('  ✓ Evidence graph without semantic analysis test passed');
    return true;
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<void> {
    console.log('Running Evidence Graph Semantic Integration Tests...\n');

    let passed = 0;
    let failed = 0;

    try {
      if (await this.testEvidenceGraphWithSemanticAnalysis()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Evidence graph with semantic analysis test failed with error:', error);
      failed++;
    }

    try {
      if (await this.testEvidenceGraphWithoutSemanticAnalysis()) passed++; else failed++;
    } catch (error) {
      console.error('  ✗ Evidence graph without semantic analysis test failed with error:', error);
      failed++;
    }

    console.log(`\nEvidence Graph Semantic Integration Tests: ${passed} passed, ${failed} failed`);
  }
}

/**
 * Simple test runner for evidence graph semantic integration tests
 */
async function runEvidenceGraphSemanticTests() {
  const testSuite = new EvidenceGraphSemanticTestSuite();
  await testSuite.runAll();
}

// Run tests if this file is executed directly
runEvidenceGraphSemanticTests().catch(error => {
  console.error('Test execution failed:', error);
});
