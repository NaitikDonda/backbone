import { useState, useEffect } from 'react';
import type { MedicalEvent, Pattern, ClinicalSignal, CandidateReview, EvidenceGraph, CareGap } from '../types';
import type { EventFilter } from '../services/timelineService';
import type { HealthJourneyMetrics } from '../services/longitudinalService';
import { Modal } from './Modal';
import { EvidenceGraph as EvidenceGraphComponent } from './EvidenceGraph';
import { CareGaps } from './CareGaps';
import { formatDate, formatEventType, formatCount, formatText, formatYears } from '../utils/dataFormatting';

interface TimelineProps {
  events: MedicalEvent[];
  undatedEvents: MedicalEvent[];
  summary: string;
  metrics: HealthJourneyMetrics;
  patterns: Pattern[];
  clinicalSignals: ClinicalSignal[];
  candidateReviews: CandidateReview[];
  evidenceGraph?: EvidenceGraph;
  careGaps?: CareGap[];
  isAnalysisAvailable: boolean;
  onRunAnalysis: () => void;
  onRunCandidateAnalysis: () => void;
  isAnalyzing: boolean;
}

export function Timeline({ 
  events, 
  undatedEvents, 
  summary, 
  patterns, 
  clinicalSignals, 
  candidateReviews,
  evidenceGraph,
  careGaps,
  isAnalysisAvailable, 
  onRunAnalysis, 
  onRunCandidateAnalysis,
  isAnalyzing 
}: TimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<MedicalEvent | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<ClinicalSignal | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateReview | null>(null);
  const [showEvidenceGraph, setShowEvidenceGraph] = useState(false);
  const [highlightedEventIds, setHighlightedEventIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<EventFilter>('all');

  // Clear highlighted events when evidence graph closes
  useEffect(() => {
    if (!showEvidenceGraph) {
      setHighlightedEventIds(new Set());
    }
  }, [showEvidenceGraph]);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'symptoms') return event.eventType === 'symptom';
    if (filter === 'diagnoses') return event.eventType === 'diagnosis';
    if (filter === 'laboratory') return event.eventType === 'laboratory';
    if (filter === 'medications') return event.eventType === 'medication';
    if (filter === 'visits') return event.eventType === 'consultation' || event.eventType === 'hospital_visit';
    if (filter === 'procedures') return event.eventType === 'procedure';
    return true;
  });

  const years = Array.from(new Set(filteredEvents
    .filter(e => e.date !== null)
    .map(e => new Date(e.date!).getFullYear())
  )).sort((a, b) => a - b);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'symptom': return '●';
      case 'diagnosis': return '◆';
      case 'laboratory': return '▪';
      case 'medication': return '▴';
      case 'procedure': return '▸';
      case 'consultation':
      case 'hospital_visit': return '⬡';
      default: return '•';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'symptom': return 'text-orange-500';
      case 'diagnosis': return 'text-red-500';
      case 'laboratory': return 'text-blue-500';
      case 'medication': return 'text-green-500';
      case 'procedure': return 'text-purple-500';
      case 'consultation':
      case 'hospital_visit': return 'text-indigo-500';
      default: return 'text-text-secondary';
    }
  };

  const formatDateSafe = (dateStr: string | null) => {
    return formatDate(dateStr);
  };

  // Empty state
  if (events.length === 0 && undatedEvents.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-12 text-center">
        <div className="text-text-tertiary mb-4">Your patient's journey starts here.</div>
        <div className="text-text-secondary mb-6">Upload medical records to begin reconstructing their history.</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border border-border rounded-lg p-8">
        {/* Summary Section */}
        <div className="mb-8 pb-6 border-b border-border">
          <p className="text-text-secondary">{summary}</p>
        </div>

        {/* Patterns Section */}
        {patterns.length > 0 && (
          <div className="mb-8 pb-6 border-b border-border">
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-4">
              Detected Patterns ({patterns.length})
            </h3>
            <div className="space-y-3">
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  onClick={() => setSelectedPattern(pattern)}
                  className="group relative pl-4 cursor-pointer transition-all duration-200 hover:bg-background rounded-lg p-3 -ml-2 border-l-2 border-accent"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-text-primary group-hover:text-accent transition-colors duration-200">
                        {pattern.title}
                      </div>
                      <div className="text-sm text-text-secondary mt-1">{pattern.description}</div>
                      <div className="text-xs text-text-tertiary">
                        {pattern.occurrenceCount} occurrence{pattern.occurrenceCount !== 1 ? 's' : ''} • {pattern.metadata.timeSpanYears ? formatYears(pattern.metadata.timeSpanYears) : 'Recent'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Signals Section */}
        <div className="mb-8 pb-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider">
              AI-Generated Insights
            </h3>
            {isAnalysisAvailable ? (
              <button
                onClick={onRunAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 text-sm rounded-md transition-colors bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : clinicalSignals.length > 0 ? 'Re-analyze' : 'Run Analysis'}
              </button>
            ) : (
              <span className="text-xs text-text-tertiary">Ollama not available</span>
            )}
          </div>
          
          {!isAnalysisAvailable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                Ollama is not available. Please ensure Ollama is running locally to use AI-generated insights.
              </p>
            </div>
          )}

          {clinicalSignals.length > 0 ? (
            <div className="space-y-3">
              {clinicalSignals.map((signal) => (
                <div
                  key={signal.id}
                  onClick={() => setSelectedSignal(signal)}
                  className="group relative pl-4 cursor-pointer transition-all duration-200 hover:bg-background rounded-lg p-3 -ml-2 border-l-2 border-purple-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-text-primary group-hover:text-purple-600 transition-colors duration-200">
                        {signal.title}
                      </div>
                      <div className="text-sm text-text-secondary mt-1">{signal.summary}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          {signal.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {signal.evidence.length} evidence item{signal.evidence.length !== 1 ? 's' : ''}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          signal.strength === 'high' ? 'bg-red-100 text-red-700' :
                          signal.strength === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {signal.strength} strength
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-text-tertiary mt-3 italic">
                Generated locally by BACKBONE using {clinicalSignals[0]?.modelName || 'Ollama'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-tertiary">
              No AI-generated insights yet. Click "Run Analysis" to generate insights using Ollama.
            </div>
          )}
        </div>

        {/* Candidate Reviews Section */}
        <div className="mb-8 pb-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider">
              Candidate Conditions for Review
            </h3>
            <div className="flex items-center gap-2">
              {evidenceGraph && (
                <button
                  onClick={() => setShowEvidenceGraph(true)}
                  className="px-3 py-1.5 text-sm rounded-md transition-colors bg-gray-100 text-text-secondary hover:bg-gray-200"
                >
                  Explore Evidence
                </button>
              )}
              {isAnalysisAvailable ? (
                <button
                  onClick={onRunCandidateAnalysis}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 text-sm rounded-md transition-colors bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : candidateReviews.length > 0 ? 'Re-analyze' : 'Run Candidate Analysis'}
                </button>
              ) : (
                <span className="text-xs text-text-tertiary">Ollama not available</span>
              )}
            </div>
          </div>

          {candidateReviews.length > 0 ? (
            <div className="space-y-3">
              {candidateReviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => setSelectedCandidate(review)}
                  className="group relative pl-4 cursor-pointer transition-all duration-200 hover:bg-background rounded-lg p-3 -ml-2 border-l-2 border-orange-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-text-primary group-hover:text-orange-600 transition-colors duration-200">
                        {review.candidateName}
                      </div>
                      <div className="text-sm text-text-secondary mt-1">{review.summary}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          review.matchLevel === 'strong' ? 'bg-red-100 text-red-700' :
                          review.matchLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          review.matchLevel === 'weak' ? 'bg-gray-100 text-gray-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {review.matchLevel} match
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {review.supportingEvidence.length} supporting evidence
                        </span>
                        {review.missingInformation.length > 0 && (
                          <span className="text-xs text-text-tertiary">
                            {review.missingInformation.length} missing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-text-tertiary mt-3 italic">
                Knowledge base version: {candidateReviews[0]?.knowledgeVersion || 'unknown'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-tertiary">
              No candidate conditions identified yet. Click "Run Candidate Analysis" to match patient history against the development knowledge base.
            </div>
          )}
        </div>

        {/* Care Gaps Section */}
        {careGaps && careGaps.length > 0 && (
          <div className="mb-8 pb-6 border-b border-border">
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-4">
              Potential Gaps in Available Records
            </h3>
            <CareGaps
              careGaps={careGaps}
              onHighlightTimelineEvents={(eventIds) => {
                setHighlightedEventIds(new Set(eventIds));
              }}
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'symptoms', 'diagnoses', 'laboratory', 'medications', 'visits', 'procedures'] as EventFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === f
                  ? 'bg-accent text-white'
                  : 'bg-background text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Timeline Years */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-4">
            Health Journey
          </h3>
          {years.length > 0 ? (
            <div className="flex items-center justify-between overflow-x-auto pb-4">
              {years.map((year) => (
                <div key={year} className="flex items-center">
                  <div className="text-center min-w-[80px]">
                    <div className="text-2xl font-semibold text-text-primary">{year}</div>
                  </div>
                  {year !== years[years.length - 1] && (
                    <div className="flex-1 h-px bg-border mx-4 min-w-[40px]" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-secondary text-sm">No dated events</div>
          )}
        </div>

        {/* Events */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-text-secondary text-center py-8">No events match the selected filter</div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="group relative pl-8 cursor-pointer transition-all duration-200 hover:bg-background rounded-lg p-4 -ml-4"
              >
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 text-lg ${getEventColor(event.eventType)} group-hover:scale-125 transition-transform duration-200`}>
                  {getEventIcon(event.eventType)}
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-text-tertiary mb-1">{formatDateSafe(event.date)}</div>
                    <div className="font-medium text-text-primary group-hover:text-accent transition-colors duration-200">
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="text-sm text-text-secondary mt-1">{event.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-text-tertiary capitalize ml-4">
                    {formatEventType(event.eventType)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Undated Events Section */}
        {undatedEvents.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-4">
              Undated Records ({undatedEvents.length})
            </h3>
            <div className="space-y-3">
              {undatedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="group relative pl-8 cursor-pointer transition-all duration-200 hover:bg-background rounded-lg p-3 -ml-4"
                >
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 text-lg ${getEventColor(event.eventType)}`}>
                    {getEventIcon(event.eventType)}
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-text-primary group-hover:text-accent transition-colors duration-200">
                        {event.title}
                      </div>
                      {event.description && (
                        <div className="text-sm text-text-secondary mt-1">{event.description}</div>
                      )}
                    </div>
                    <div className="text-xs text-text-tertiary capitalize ml-4">
                      {formatEventType(event.eventType)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div>
              <span className="text-sm text-text-tertiary">Type</span>
              <p className="text-text-primary font-medium">{formatEventType(selectedEvent.eventType)}</p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Date</span>
              <p className="text-text-primary font-medium">{formatDateSafe(selectedEvent.date)}</p>
            </div>
            {selectedEvent.endDate && (
              <div>
                <span className="text-sm text-text-tertiary">End Date</span>
                <p className="text-text-primary font-medium">{formatDateSafe(selectedEvent.endDate)}</p>
              </div>
            )}
            {selectedEvent.description && (
              <div>
                <span className="text-sm text-text-tertiary">Description</span>
                <p className="text-text-primary">{selectedEvent.description}</p>
              </div>
            )}
            {selectedEvent.status && (
              <div>
                <span className="text-sm text-text-tertiary">Status</span>
                <p className="text-text-primary font-medium capitalize">{selectedEvent.status}</p>
              </div>
            )}
            {selectedEvent.severity && (
              <div>
                <span className="text-sm text-text-tertiary">Severity</span>
                <p className="text-text-primary font-medium capitalize">{selectedEvent.severity}</p>
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary">Source</span>
              <p className="text-text-primary font-medium">{selectedEvent.sourceDocumentName}</p>
              {selectedEvent.sourceText && (
                <p className="text-sm text-text-secondary mt-1 italic">"{selectedEvent.sourceText}"</p>
              )}
            </div>
            {selectedEvent.metadata.isDuplicate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  This event appears in multiple documents and has been deduplicated.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Pattern Detail Modal */}
      <Modal
        isOpen={selectedPattern !== null}
        onClose={() => setSelectedPattern(null)}
        title={selectedPattern?.title}
      >
        {selectedPattern && (
          <div className="space-y-4">
            <div>
              <span className="text-sm text-text-tertiary">Type</span>
              <p className="text-text-primary font-medium capitalize">
                {selectedPattern.patternType.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Description</span>
              <p className="text-text-primary">{selectedPattern.description}</p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Occurrences</span>
              <p className="text-text-primary font-medium">{selectedPattern.occurrenceCount}</p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Time Span</span>
              <p className="text-text-primary font-medium">
                {selectedPattern.metadata.timeSpanYears 
                  ? `${selectedPattern.metadata.timeSpanYears}+ years` 
                  : 'Recent'}
              </p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Unique Encounters</span>
              <p className="text-text-primary font-medium">{selectedPattern.metadata.uniqueEncounters}</p>
            </div>
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary">First Observed</span>
              <p className="text-text-primary font-medium">{formatDateSafe(selectedPattern.firstObserved)}</p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Last Observed</span>
              <p className="text-text-primary font-medium">{formatDateSafe(selectedPattern.lastObserved)}</p>
            </div>
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary mb-2 block">Evidence ({selectedPattern.evidence.length})</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedPattern.evidence.map((evidence, index) => (
                  <div key={index} className="bg-background rounded p-2 text-sm">
                    <div className="text-text-primary font-medium">{formatDateSafe(evidence.date)}</div>
                    <div className="text-text-secondary">{evidence.description}</div>
                    <div className="text-text-tertiary text-xs mt-1">{evidence.sourceDocumentName}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary">Source Records</span>
              <p className="text-text-primary font-medium">{selectedPattern.sourceRecordIds.length} document{selectedPattern.sourceRecordIds.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Clinical Signal Detail Modal */}
      <Modal
        isOpen={selectedSignal !== null}
        onClose={() => setSelectedSignal(null)}
        title={selectedSignal?.title}
      >
        {selectedSignal && (
          <div className="space-y-4">
            <div>
              <span className="text-sm text-text-tertiary">Category</span>
              <p className="text-text-primary font-medium capitalize">
                {selectedSignal.category.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Summary</span>
              <p className="text-text-primary">{selectedSignal.summary}</p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Strength</span>
              <p className="text-text-primary font-medium capitalize">{selectedSignal.strength}</p>
              <p className="text-sm text-text-secondary">{selectedSignal.strengthReason}</p>
            </div>
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary mb-2 block">Evidence ({selectedSignal.evidence.length})</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedSignal.evidence.map((evidence, index) => (
                  <div key={index} className="bg-background rounded p-2 text-sm">
                    <div className="text-text-primary font-medium">{formatDateSafe(evidence.date)}</div>
                    <div className="text-text-secondary">{evidence.description}</div>
                    <div className="text-text-tertiary text-xs mt-1">{evidence.sourceDocumentName}</div>
                  </div>
                ))}
              </div>
            </div>
            {selectedSignal.possibleExplanations.length > 0 && (
              <div className="pt-4 border-t border-border">
                <span className="text-sm text-text-tertiary mb-2 block">Possible Explanations</span>
                <ul className="space-y-1">
                  {selectedSignal.possibleExplanations.map((explanation, index) => (
                    <li key={index} className="text-sm text-text-secondary">• {explanation}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedSignal.questionsForReview.length > 0 && (
              <div className="pt-4 border-t border-border">
                <span className="text-sm text-text-tertiary mb-2 block">Questions for Clinical Review</span>
                <ul className="space-y-1">
                  {selectedSignal.questionsForReview.map((question, index) => (
                    <li key={index} className="text-sm text-text-secondary">• {question}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary">Generated</span>
              <p className="text-text-primary font-medium">{formatDateSafe(selectedSignal.generatedAt)}</p>
              <p className="text-xs text-text-tertiary">Model: {selectedSignal.modelName}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800">
                This insight was generated locally by BACKBONE using {selectedSignal.modelName}. It does not provide a medical diagnosis.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Candidate Review Detail Modal */}
      <Modal
        isOpen={selectedCandidate !== null}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate?.candidateName}
      >
        {selectedCandidate && (
          <div className="space-y-4">
            {/* Why This Matters Panel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Why BACKBONE Surfed This</h4>
              <p className="text-sm text-blue-800">
                BACKBONE surfaced this candidate because {selectedCandidate.supportingEvidence.length} evidence items overlap with the development knowledge profile. 
                {selectedCandidate.supportingEvidence.length >= 3 && ' The findings recur across multiple encounters, suggesting a longitudinal pattern.'}
                {selectedCandidate.missingInformation.length > 0 && ` However, ${selectedCandidate.missingInformation.length} required information item${selectedCandidate.missingInformation.length !== 1 ? 's are' : ' is'} not found in available records.`}
              </p>
            </div>

            <div>
              <span className="text-sm text-text-tertiary">Match Level</span>
              <p className="text-text-primary font-medium capitalize">{selectedCandidate.matchLevel}</p>
              <p className="text-sm text-text-secondary">Evidence Match Score: {selectedCandidate.evidenceMatchScore.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Summary</span>
              <p className="text-text-primary">{selectedCandidate.summary}</p>
            </div>
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary mb-2 block">Supporting Evidence ({selectedCandidate.supportingEvidence.length})</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedCandidate.supportingEvidence.map((evidence, index) => (
                  <div key={index} className="bg-background rounded p-2 text-sm">
                    <div className="text-text-primary font-medium">{formatDateSafe(evidence.date)}</div>
                    <div className="text-text-secondary">{evidence.description}</div>
                    <div className="text-xs text-text-tertiary mt-1">
                      {evidence.matchType} • {evidence.sourceDocumentName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedCandidate.contradictingEvidence.length > 0 && (
              <div className="pt-4 border-t border-border">
                <span className="text-sm text-text-tertiary mb-2 block">Contradicting Evidence ({selectedCandidate.contradictingEvidence.length})</span>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedCandidate.contradictingEvidence.map((evidence, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                      <div className="text-text-primary font-medium">{formatDateSafe(evidence.date)}</div>
                      <div className="text-text-secondary">{evidence.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedCandidate.missingInformation.length > 0 && (
              <div className="pt-4 border-t border-border">
                <span className="text-sm text-text-tertiary mb-2 block">Not Found in Available Records ({selectedCandidate.missingInformation.length})</span>
                <ul className="space-y-1">
                  {selectedCandidate.missingInformation.map((missing, index) => (
                    <li key={index} className="text-sm text-text-secondary">• {missing}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary">Longitudinal Reasoning</span>
              <p className="text-text-primary">{selectedCandidate.longitudinalReasoning}</p>
            </div>
            {selectedCandidate.reviewQuestions.length > 0 && (
              <div className="pt-4 border-t border-border">
                <span className="text-sm text-text-tertiary mb-2 block">Questions for Clinical Review</span>
                <ul className="space-y-1">
                  {selectedCandidate.reviewQuestions.map((question, index) => (
                    <li key={index} className="text-sm text-text-secondary">• {question}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <span className="text-sm text-text-tertiary">Generated</span>
              <p className="text-text-primary font-medium">{formatDateSafe(selectedCandidate.generatedAt)}</p>
              <p className="text-xs text-text-tertiary">Model: {selectedCandidate.modelName}</p>
              <p className="text-xs text-text-tertiary">Knowledge Base: {selectedCandidate.knowledgeVersion}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                This is an evidence-based research signal, not a medical diagnosis. The candidate condition appeared based on pattern matching against the development knowledge base.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Evidence Graph Modal */}
      <Modal
        isOpen={showEvidenceGraph}
        onClose={() => setShowEvidenceGraph(false)}
        title="Evidence Graph"
      >
        {evidenceGraph && (
          <div className="space-y-4">
            <div className="text-sm text-text-tertiary">
              Explore the evidence chain from candidates → patterns → events → source records.
              Click on nodes to inspect details and trace evidence to its source.
            </div>
            <EvidenceGraphComponent
              graph={evidenceGraph}
              onHighlightTimelineEvents={(eventIds) => {
                setHighlightedEventIds(new Set(eventIds));
              }}
              onNavigateToSource={(sourceRecordId) => {
                // Find events from this source record and select the first one
                const sourceEvents = events.filter(e => e.sourceRecordId === sourceRecordId);
                if (sourceEvents.length > 0) {
                  setSelectedEvent(sourceEvents[0]);
                  setShowEvidenceGraph(false);
                }
              }}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
