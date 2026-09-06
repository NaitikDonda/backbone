import type {
  MedicalEvent,
  Pattern,
  CandidateReview,
  CareGap,
  EvidenceGraph,
  EvidenceNode,
  EvidenceRelationship,
  EvidenceNodeType,
  FocusedGraphQuery,
  EvidenceStrength,
  SemanticAnalysis,
} from '../types';

export class EvidenceGraphService {
  private static instance: EvidenceGraphService;

  private constructor() {}

  static getInstance(): EvidenceGraphService {
    if (!EvidenceGraphService.instance) {
      EvidenceGraphService.instance = new EvidenceGraphService();
    }
    return EvidenceGraphService.instance;
  }

  /**
   * Generate full evidence graph for a patient
   */
  generateFullGraph(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    candidateReviews: CandidateReview[],
    careGaps?: CareGap[],
    semanticAnalysis?: SemanticAnalysis,
    analysisId?: string
  ): EvidenceGraph {
    const nodes: EvidenceNode[] = [];
    const relationships: EvidenceRelationship[] = [];

    // Generate nodes
    nodes.push(...this.generateEventNodes(patientId, events));
    nodes.push(...this.generatePatternNodes(patientId, patterns));
    nodes.push(...this.generateCandidateNodes(patientId, candidateReviews));
    nodes.push(...this.generateSourceRecordNodes(patientId, events));
    nodes.push(...this.generateMissingEvidenceNodes(patientId, candidateReviews));
    nodes.push(...this.generateCareGapNodes(patientId, careGaps || []));
    nodes.push(...this.generateSemanticConceptNodes(patientId, semanticAnalysis));

    // Generate relationships
    relationships.push(...this.generatePatternEventRelationships(patientId, patterns, events));
    relationships.push(...this.generateCandidatePatternRelationships(patientId, candidateReviews, patterns));
    relationships.push(...this.generateEventSourceRelationships(patientId, events));
    relationships.push(...this.generateCandidateContradictionRelationships(patientId, candidateReviews));
    relationships.push(...this.generateCandidateMissingEvidenceRelationships(patientId, candidateReviews));
    relationships.push(...this.generateCareGapRelationships(patientId, careGaps || []));
    relationships.push(...this.generateSemanticRelationships(patientId, semanticAnalysis));

    return {
      patientId,
      nodes,
      relationships,
      analysisId,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate focused graph based on query
   */
  generateFocusedGraph(
    query: FocusedGraphQuery,
    events: MedicalEvent[],
    patterns: Pattern[],
    candidateReviews: CandidateReview[],
    semanticAnalysis?: SemanticAnalysis,
    analysisId?: string
  ): EvidenceGraph {
    const fullGraph = this.generateFullGraph(query.patientId, events, patterns, candidateReviews, undefined, semanticAnalysis, analysisId);
    
    const maxDepth = query.maxDepth || 3;
    const relevantNodeIds = new Set<string>();
    const relevantRelationshipIds = new Set<string>();

    // Start from focus node(s)
    if (query.focusType === 'candidate' && query.focusId) {
      this.collectReachableNodes(query.focusId, fullGraph, relevantNodeIds, relevantRelationshipIds, maxDepth);
    } else if (query.focusType === 'pattern' && query.focusId) {
      this.collectReachableNodes(query.focusId, fullGraph, relevantNodeIds, relevantRelationshipIds, maxDepth);
    } else if (query.focusType === 'event' && query.focusId) {
      this.collectReachableNodes(query.focusId, fullGraph, relevantNodeIds, relevantRelationshipIds, maxDepth);
    } else if (query.focusType === 'time_range' && query.startDate && query.endDate) {
      // Filter by time range
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      
      for (const node of fullGraph.nodes) {
        if (node.date) {
          const nodeDate = new Date(node.date);
          if (nodeDate >= startDate && nodeDate <= endDate) {
            this.collectReachableNodes(node.id, fullGraph, relevantNodeIds, relevantRelationshipIds, maxDepth);
          }
        }
      }
    }

    // Filter graph to relevant nodes and relationships
    const filteredNodes = fullGraph.nodes.filter(n => relevantNodeIds.has(n.id));
    const filteredRelationships = fullGraph.relationships.filter(r => 
      relevantRelationshipIds.has(r.id) &&
      relevantNodeIds.has(r.sourceId) &&
      relevantNodeIds.has(r.targetId)
    );

    return {
      patientId: fullGraph.patientId,
      nodes: filteredNodes,
      relationships: filteredRelationships,
      analysisId: fullGraph.analysisId,
      generatedAt: fullGraph.generatedAt,
    };
  }

  /**
   * Collect nodes reachable from a starting node up to maxDepth
   */
  private collectReachableNodes(
    startNodeId: string,
    graph: EvidenceGraph,
    nodeIds: Set<string>,
    relationshipIds: Set<string>,
    maxDepth: number,
    currentDepth: number = 0
  ): void {
    if (currentDepth > maxDepth || nodeIds.has(startNodeId)) {
      return;
    }

    nodeIds.add(startNodeId);

    // Find all relationships connected to this node
    const connectedRelationships = graph.relationships.filter(
      r => r.sourceId === startNodeId || r.targetId === startNodeId
    );

    for (const relationship of connectedRelationships) {
      relationshipIds.add(relationship.id);
      
      const neighborId = relationship.sourceId === startNodeId 
        ? relationship.targetId 
        : relationship.sourceId;
      
      this.collectReachableNodes(neighborId, graph, nodeIds, relationshipIds, maxDepth, currentDepth + 1);
    }
  }

  /**
   * Generate event nodes
   */
  private generateEventNodes(patientId: string, events: MedicalEvent[]): EvidenceNode[] {
    return events.map(event => ({
      id: event.id,
      type: 'event' as EvidenceNodeType,
      patientId,
      title: event.title,
      description: event.description || undefined,
      date: event.date,
      metadata: {
        eventType: event.eventType,
        sourceRecordId: event.sourceRecordId,
        sourceDocumentName: event.sourceDocumentName,
      },
    }));
  }

  /**
   * Generate pattern nodes
   */
  private generatePatternNodes(patientId: string, patterns: Pattern[]): EvidenceNode[] {
    return patterns.map(pattern => ({
      id: pattern.id,
      type: 'pattern' as EvidenceNodeType,
      patientId,
      title: pattern.title,
      description: pattern.description,
      date: pattern.firstObserved,
      metadata: {
        evidenceCount: pattern.evidence.length,
        patternType: pattern.patternType,
      },
    }));
  }

  /**
   * Generate candidate nodes
   */
  private generateCandidateNodes(patientId: string, candidateReviews: CandidateReview[]): EvidenceNode[] {
    return candidateReviews.map(review => ({
      id: review.id,
      type: 'candidate' as EvidenceNodeType,
      patientId,
      title: review.candidateName,
      description: review.summary,
      date: review.generatedAt,
      metadata: {
        matchLevel: review.matchLevel,
        evidenceMatchScore: review.evidenceMatchScore,
        knowledgeVersion: review.knowledgeVersion,
        status: review.status,
      },
    }));
  }

  /**
   * Generate source record nodes
   */
  private generateSourceRecordNodes(patientId: string, events: MedicalEvent[]): EvidenceNode[] {
    const sourceRecords = new Map<string, { name: string; eventCount: number }>();
    
    for (const event of events) {
      if (!sourceRecords.has(event.sourceRecordId)) {
        sourceRecords.set(event.sourceRecordId, {
          name: event.sourceDocumentName,
          eventCount: 0,
        });
      }
      sourceRecords.get(event.sourceRecordId)!.eventCount++;
    }

    return Array.from(sourceRecords.entries()).map(([recordId, data]) => ({
      id: recordId,
      type: 'source_record' as EvidenceNodeType,
      patientId,
      title: data.name,
      description: `${data.eventCount} event${data.eventCount !== 1 ? 's' : ''}`,
      date: null,
      metadata: {
        eventCount: data.eventCount,
      },
    }));
  }

  /**
   * Generate missing evidence nodes
   */
  private generateMissingEvidenceNodes(patientId: string, candidateReviews: CandidateReview[]): EvidenceNode[] {
    const nodes: EvidenceNode[] = [];
    
    for (const review of candidateReviews) {
      for (const missing of review.missingInformation) {
        const nodeId = `missing-${review.id}-${missing.replace(/\s+/g, '-').toLowerCase()}`;
        
        nodes.push({
          id: nodeId,
          type: 'missing_evidence' as EvidenceNodeType,
          patientId,
          title: missing,
          description: `Required information not found in available records`,
          date: null,
          metadata: {
            candidateId: review.id,
            candidateName: review.candidateName,
          },
        });
      }
    }
    
    return nodes;
  }

  /**
   * Generate care gap nodes
   */
  private generateCareGapNodes(patientId: string, careGaps: CareGap[]): EvidenceNode[] {
    return careGaps.map(gap => ({
      id: gap.id,
      type: 'care_gap' as EvidenceNodeType,
      patientId,
      title: gap.title,
      description: gap.description,
      date: gap.firstObserved,
      metadata: {
        gapType: gap.gapType,
        status: gap.status,
        confidence: gap.confidence,
        occurrenceCount: gap.occurrenceCount,
      },
    }));
  }

  /**
   * Generate semantic concept nodes
   */
  private generateSemanticConceptNodes(patientId: string, semanticAnalysis?: SemanticAnalysis): EvidenceNode[] {
    if (!semanticAnalysis) return [];

    const conceptNodes = new Map<string, EvidenceNode>();

    for (const relationship of semanticAnalysis.semanticRelationships) {
      if (!conceptNodes.has(relationship.canonicalConceptId)) {
        conceptNodes.set(relationship.canonicalConceptId, {
          id: relationship.canonicalConceptId,
          type: 'semantic_concept' as EvidenceNodeType,
          patientId,
          title: relationship.canonicalConceptName,
          description: `Canonical concept for semantically related events`,
          date: relationship.sourceDate,
          metadata: {
            relationshipCount: 1,
            matchingMethod: relationship.matchingMethod,
            conceptType: relationship.metadata?.conceptType,
          },
        });
      } else {
        // Increment relationship count
        const node = conceptNodes.get(relationship.canonicalConceptId)!;
        if (node.metadata) {
          node.metadata.relationshipCount = (node.metadata.relationshipCount as number || 0) + 1;
        }
      }
    }

    return Array.from(conceptNodes.values());
  }

  /**
   * Generate pattern → event relationships (derived_from)
   */
  private generatePatternEventRelationships(
    patientId: string,
    patterns: Pattern[],
    events: MedicalEvent[]
  ): EvidenceRelationship[] {
    const relationships: EvidenceRelationship[] = [];
    let relationshipIndex = 0;

    for (const pattern of patterns) {
      for (const patternEvidence of pattern.evidence) {
        const event = events.find(e => e.id === patternEvidence.eventId);
        if (event) {
          const strength = this.calculateEvidenceStrength(pattern.evidence.length);
          const temporalDistance = this.calculateTemporalDistance(pattern.firstObserved, event.date);

          relationships.push({
            id: `rel-pattern-event-${relationshipIndex++}`,
            patientId,
            sourceType: 'pattern',
            sourceId: pattern.id,
            targetType: 'event',
            targetId: event.id,
            relationshipType: 'derived_from',
            strength,
            reason: `Pattern derived from ${pattern.evidence.length} event${pattern.evidence.length !== 1 ? 's' : ''}`,
            sourceCount: pattern.evidence.length,
            temporalDistance,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Generate candidate → pattern relationships (supported_by)
   */
  private generateCandidatePatternRelationships(
    patientId: string,
    candidateReviews: CandidateReview[],
    patterns: Pattern[]
  ): EvidenceRelationship[] {
    const relationships: EvidenceRelationship[] = [];
    let relationshipIndex = 0;

    for (const review of candidateReviews) {
      // Find patterns that support this candidate
      // This is a simplified approach - in practice, you'd need to track which patterns
      // contributed to which candidate during the matching process
      for (const pattern of patterns) {
        const hasOverlap = review.supportingEvidence.some(
          e => pattern.evidence.some(pe => pe.eventId === e.eventId)
        );

        if (hasOverlap) {
          const strength = this.calculateEvidenceStrength(review.supportingEvidence.length);

          relationships.push({
            id: `rel-candidate-pattern-${relationshipIndex++}`,
            patientId,
            sourceType: 'candidate',
            sourceId: review.id,
            targetType: 'pattern',
            targetId: pattern.id,
            relationshipType: 'supported_by',
            strength,
            reason: `Candidate supported by pattern with ${review.supportingEvidence.length} evidence items`,
            sourceCount: review.supportingEvidence.length,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Generate event → source record relationships (observed_in)
   */
  private generateEventSourceRelationships(
    patientId: string,
    events: MedicalEvent[]
  ): EvidenceRelationship[] {
    const relationships: EvidenceRelationship[] = [];
    let relationshipIndex = 0;

    for (const event of events) {
      relationships.push({
        id: `rel-event-source-${relationshipIndex++}`,
        patientId,
        sourceType: 'event',
        sourceId: event.id,
        targetType: 'source_record',
        targetId: event.sourceRecordId,
        relationshipType: 'observed_in',
        strength: 'strong',
        reason: 'Event observed in source document',
        sourceCount: 1,
      });
    }

    return relationships;
  }

  /**
   * Generate candidate → contradiction relationships (contradicts)
   */
  private generateCandidateContradictionRelationships(
    patientId: string,
    candidateReviews: CandidateReview[]
  ): EvidenceRelationship[] {
    const relationships: EvidenceRelationship[] = [];
    let relationshipIndex = 0;

    for (const review of candidateReviews) {
      for (const contradiction of review.contradictingEvidence) {
        relationships.push({
          id: `rel-candidate-contradiction-${relationshipIndex++}`,
          patientId,
          sourceType: 'candidate',
          sourceId: review.id,
          targetType: 'event',
          targetId: contradiction.eventId,
          relationshipType: 'contradicts',
          strength: 'moderate',
          reason: 'Candidate contradicted by documented finding',
          sourceCount: 1,
          temporalDistance: this.calculateTemporalDistance(review.generatedAt, contradiction.date),
        });
      }
    }

    return relationships;
  }

  /**
   * Generate candidate → missing evidence relationships (missing_evidence_for)
   */
  private generateCandidateMissingEvidenceRelationships(
    patientId: string,
    candidateReviews: CandidateReview[]
  ): EvidenceRelationship[] {
    const relationships: EvidenceRelationship[] = [];
    let relationshipIndex = 0;
    let missingIndex = 0;

    for (const review of candidateReviews) {
      for (const _missing of review.missingInformation) {
        const missingNodeId = `missing-${review.id}-${missingIndex++}`;
        
        relationships.push({
          id: `rel-candidate-missing-${relationshipIndex++}`,
          patientId,
          sourceType: 'candidate',
          sourceId: review.id,
          targetType: 'missing_evidence',
          targetId: missingNodeId,
          relationshipType: 'missing_evidence_for',
          strength: 'weak',
          reason: 'Candidate analysis identified missing information',
          sourceCount: 0,
          temporalDistance: undefined,
        });
      }
    }

    return relationships;
  }

  /**
   * Generate care gap → event/pattern relationships (indicates)
   */
  private generateCareGapRelationships(patientId: string, careGaps: CareGap[]): EvidenceRelationship[] {
    const relationships: EvidenceRelationship[] = [];
    let relationshipIndex = 0;

    for (const gap of careGaps) {
      for (const eventId of gap.eventIds) {
        relationships.push({
          id: `rel-caregap-event-${relationshipIndex++}`,
          patientId,
          sourceType: 'care_gap',
          sourceId: gap.id,
          targetType: 'event',
          targetId: eventId,
          relationshipType: 'indicates',
          strength: gap.confidence === 'clearly_documented' ? 'strong' : gap.confidence === 'potential' ? 'moderate' : 'weak',
          reason: gap.description,
          sourceCount: gap.occurrenceCount,
          temporalDistance: gap.firstObserved && gap.lastObserved 
            ? this.calculateTemporalDistance(gap.firstObserved, gap.lastObserved)
            : undefined,
        });
      }
    }

    return relationships;
  }

  /**
   * Generate semantic concept → event relationships (semantically_related)
   */
  private generateSemanticRelationships(patientId: string, semanticAnalysis?: SemanticAnalysis): EvidenceRelationship[] {
    const relationships: EvidenceRelationship[] = [];
    let relationshipIndex = 0;

    if (!semanticAnalysis) return relationships;

    for (const semanticRel of semanticAnalysis.semanticRelationships) {
      // Create relationship from semantic concept to source event
      relationships.push({
        id: `rel-semantic-source-${relationshipIndex++}`,
        patientId,
        sourceType: 'semantic_concept',
        sourceId: semanticRel.canonicalConceptId,
        targetType: 'event',
        targetId: semanticRel.sourceEventId,
        relationshipType: 'semantically_related',
        strength: semanticRel.relationshipStrength === 'high' ? 'strong' : semanticRel.relationshipStrength === 'medium' ? 'moderate' : 'weak',
        reason: `Semantic relationship via ${semanticRel.matchingMethod}`,
        sourceCount: 1,
        temporalDistance: this.calculateTemporalDistance(semanticRel.sourceDate, semanticRel.targetDate),
        metadata: {
          canonicalConceptName: semanticRel.canonicalConceptName,
          matchingMethod: semanticRel.matchingMethod,
          similarityScore: semanticRel.similarityScore,
        },
      });

      // Create relationship from semantic concept to target event
      relationships.push({
        id: `rel-semantic-target-${relationshipIndex++}`,
        patientId,
        sourceType: 'semantic_concept',
        sourceId: semanticRel.canonicalConceptId,
        targetType: 'event',
        targetId: semanticRel.targetEventId,
        relationshipType: 'semantically_related',
        strength: semanticRel.relationshipStrength === 'high' ? 'strong' : semanticRel.relationshipStrength === 'medium' ? 'moderate' : 'weak',
        reason: `Semantic relationship via ${semanticRel.matchingMethod}`,
        sourceCount: 1,
        temporalDistance: this.calculateTemporalDistance(semanticRel.sourceDate, semanticRel.targetDate),
        metadata: {
          canonicalConceptName: semanticRel.canonicalConceptName,
          matchingMethod: semanticRel.matchingMethod,
          similarityScore: semanticRel.similarityScore,
        },
      });
    }

    return relationships;
  }

  /**
   * Calculate evidence strength based on source count
   */
  private calculateEvidenceStrength(sourceCount: number): EvidenceStrength {
    if (sourceCount >= 4) return 'strong';
    if (sourceCount >= 2) return 'moderate';
    if (sourceCount >= 1) return 'weak';
    return 'insufficient';
  }

  /**
   * Calculate temporal distance between two dates
   */
  private calculateTemporalDistance(date1: string | null | undefined, date2: string | null | undefined): string | undefined {
    if (!date1 || !date2) return undefined;

    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1) return 'same day';
    if (diffDays < 7) return `${Math.round(diffDays)} day${diffDays !== 1 ? 's' : ''}`;
    if (diffDays < 30) return `${Math.round(diffDays / 7)} week${Math.round(diffDays / 7) !== 1 ? 's' : ''}`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} month${Math.round(diffDays / 30) !== 1 ? 's' : ''}`;
    return `${Math.round(diffDays / 365)} year${Math.round(diffDays / 365) !== 1 ? 's' : ''}`;
  }

  /**
   * Get node by ID
   */
  getNodeById(graph: EvidenceGraph, nodeId: string): EvidenceNode | undefined {
    return graph.nodes.find(n => n.id === nodeId);
  }

  /**
   * Get relationships for a node
   */
  getRelationshipsForNode(graph: EvidenceGraph, nodeId: string): EvidenceRelationship[] {
    return graph.relationships.filter(r => r.sourceId === nodeId || r.targetId === nodeId);
  }

  /**
   * Get connected nodes
   */
  getConnectedNodes(graph: EvidenceGraph, nodeId: string): EvidenceNode[] {
    const relationships = this.getRelationshipsForNode(graph, nodeId);
    const connectedIds = new Set<string>();

    for (const rel of relationships) {
      if (rel.sourceId === nodeId) {
        connectedIds.add(rel.targetId);
      } else {
        connectedIds.add(rel.sourceId);
      }
    }

    return graph.nodes.filter(n => connectedIds.has(n.id));
  }
}
