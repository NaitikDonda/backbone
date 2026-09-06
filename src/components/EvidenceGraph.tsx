import { useState } from 'react';
import type { EvidenceGraph, EvidenceNode, EvidenceRelationship, EvidenceNodeType } from '../types';
import { Modal } from './Modal';

interface EvidenceGraphProps {
  graph: EvidenceGraph;
  focusNodeId?: string;
  onNodeClick?: (node: EvidenceNode) => void;
  onHighlightTimelineEvents?: (eventIds: string[]) => void;
  onNavigateToSource?: (sourceRecordId: string) => void;
}

export function EvidenceGraph({ graph, focusNodeId, onNodeClick, onHighlightTimelineEvents, onNavigateToSource }: EvidenceGraphProps) {
  const [selectedNode, setSelectedNode] = useState<EvidenceNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get relationships for a node
  const getNodeRelationships = (nodeId: string): EvidenceRelationship[] => {
    return graph.relationships.filter(r => r.sourceId === nodeId || r.targetId === nodeId);
  };

  // Get connected nodes
  const getConnectedNodes = (nodeId: string): EvidenceNode[] => {
    const relationships = getNodeRelationships(nodeId);
    const connectedIds = new Set<string>();

    for (const rel of relationships) {
      if (rel.sourceId === nodeId) {
        connectedIds.add(rel.targetId);
      } else {
        connectedIds.add(rel.sourceId);
      }
    }

    return graph.nodes.filter(n => connectedIds.has(n.id));
  };

  // Toggle node expansion
  const toggleExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Handle node selection
  const handleNodeClick = (node: EvidenceNode) => {
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node);
    }
    
    // Highlight timeline events if this is an event node
    if (node.type === 'event' && onHighlightTimelineEvents) {
      onHighlightTimelineEvents([node.id]);
    }
  };

  // Get node type color and label
  const getNodeColor = (type: EvidenceNodeType): string => {
    switch (type) {
      case 'candidate': return 'border-orange-500 bg-orange-50';
      case 'pattern': return 'border-purple-500 bg-purple-50';
      case 'event': return 'border-blue-500 bg-blue-50';
      case 'source_record': return 'border-gray-500 bg-gray-50';
      case 'missing_evidence': return 'border-red-300 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getNodeLabel = (type: EvidenceNodeType): string => {
    switch (type) {
      case 'candidate': return 'INTERPRETATION';
      case 'pattern': return 'PATTERN';
      case 'event': return 'FACT';
      case 'source_record': return 'SOURCE';
      case 'missing_evidence': return 'MISSING';
      default: return type.toUpperCase();
    }
  };

  // Get relationship label
  const getRelationshipLabel = (rel: EvidenceRelationship): string => {
    switch (rel.relationshipType) {
      case 'derived_from': return 'derived from';
      case 'supported_by': return 'supported by';
      case 'observed_in': return 'observed in';
      case 'associated_with': return 'associated with';
      case 'contradicts': return 'contradicted by';
      case 'missing_evidence_for': return 'missing evidence for';
      default: return rel.relationshipType;
    }
  };

  // Render a node and its children
  const renderNode = (node: EvidenceNode, depth: number = 0): React.ReactElement => {
    const isExpanded = expandedNodes.has(node.id);
    const connectedNodes = getConnectedNodes(node.id);
    const relationships = getNodeRelationships(node.id);
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="ml-4">
        <div
          onClick={() => handleNodeClick(node)}
          className={`cursor-pointer p-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${
            getNodeColor(node.type)
          } ${isSelected ? 'ring-2 ring-accent' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium text-text-primary text-sm">{node.title}</div>
              {node.description && (
                <div className="text-xs text-text-secondary mt-1">{node.description}</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white text-text-tertiary font-medium">
                  {getNodeLabel(node.type)}
                </span>
                {node.date && (
                  <span className="text-xs text-text-tertiary">{formatDate(node.date)}</span>
                )}
              </div>
            </div>
            {connectedNodes.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion(node.id);
                }}
                className="ml-2 text-text-tertiary hover:text-text-primary"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
          </div>
        </div>

        {isExpanded && connectedNodes.length > 0 && (
          <div className="mt-2 space-y-2">
            {connectedNodes.map((connectedNode) => {
              const rel = relationships.find(
                r => r.sourceId === node.id && r.targetId === connectedNode.id ||
                     r.sourceId === connectedNode.id && r.targetId === node.id
              );
              return (
                <div key={connectedNode.id}>
                  {rel && (
                    <div className="ml-4 text-xs text-text-tertiary mb-1">
                      {getRelationshipLabel(rel)}
                      {rel.strength && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100">
                          {rel.strength}
                        </span>
                      )}
                    </div>
                  )}
                  {renderNode(connectedNode, depth + 1)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Find root nodes (candidates or patterns with no incoming relationships)
  const getRootNodes = (): EvidenceNode[] => {
    const nodeIdsWithIncoming = new Set<string>();
    
    for (const rel of graph.relationships) {
      nodeIdsWithIncoming.add(rel.targetId);
    }

    return graph.nodes.filter(n => !nodeIdsWithIncoming.has(n.id));
  };

  const rootNodes = focusNodeId 
    ? graph.nodes.filter(n => n.id === focusNodeId)
    : getRootNodes();

  return (
    <div className="evidence-graph">
      <div className="space-y-2">
        {rootNodes.length === 0 ? (
          <div className="text-sm text-text-tertiary p-4 bg-background rounded-lg">
            No evidence relationships found.
          </div>
        ) : (
          rootNodes.map(node => renderNode(node))
        )}
      </div>

      {/* Evidence Inspector Modal */}
      <Modal
        isOpen={selectedNode !== null}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.title}
      >
        {selectedNode && (
          <div className="space-y-4">
            <div>
              <span className="text-sm text-text-tertiary">Type</span>
              <p className="text-text-primary font-medium capitalize">
                {selectedNode.type.replace(/_/g, ' ')}
              </p>
            </div>
            
            {selectedNode.description && (
              <div>
                <span className="text-sm text-text-tertiary">Description</span>
                <p className="text-text-primary">{selectedNode.description}</p>
              </div>
            )}

            {selectedNode.date && (
              <div>
                <span className="text-sm text-text-tertiary">Date</span>
                <p className="text-text-primary font-medium">{formatDate(selectedNode.date)}</p>
              </div>
            )}

            {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
              <div className="pt-4 border-t border-border">
                <span className="text-sm text-text-tertiary mb-2 block">Metadata</span>
                <div className="space-y-1">
                  {Object.entries(selectedNode.metadata).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-text-tertiary">{key}:</span>{' '}
                      <span className="text-text-secondary">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source record navigation button */}
            {selectedNode.type === 'source_record' && onNavigateToSource && (
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => onNavigateToSource(selectedNode.id)}
                  className="w-full px-4 py-2 text-sm rounded-md transition-colors bg-accent text-white hover:bg-accent/90"
                >
                  Open Source Record
                </button>
              </div>
            )}

            {/* Show connected relationships */}
            {(() => {
              const relationships = getNodeRelationships(selectedNode.id);
              if (relationships.length === 0) return null;
              
              return (
                <div className="pt-4 border-t border-border">
                  <span className="text-sm text-text-tertiary mb-2 block">
                    Connected Evidence ({relationships.length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {relationships.map(rel => {
                      const connectedId = rel.sourceId === selectedNode.id 
                        ? rel.targetId 
                        : rel.sourceId;
                      const connectedNode = graph.nodes.find(n => n.id === connectedId);
                      
                      return (
                        <div key={rel.id} className="bg-background rounded p-2 text-sm">
                          <div className="text-text-primary font-medium">
                            {getRelationshipLabel(rel)}
                          </div>
                          {connectedNode && (
                            <div className="text-text-secondary mt-1">
                              → {connectedNode.title}
                            </div>
                          )}
                          {rel.reason && (
                            <div className="text-text-tertiary text-xs mt-1">{rel.reason}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Undated';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
