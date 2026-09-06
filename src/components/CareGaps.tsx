import { useState } from 'react';
import type { CareGap, CareGapType } from '../types';
import { formatDate, formatEventType, formatCount } from '../utils/dataFormatting';

interface CareGapsProps {
  careGaps: CareGap[];
  onGapClick?: (gap: CareGap) => void;
  onHighlightTimelineEvents?: (eventIds: string[]) => void;
  onDismissGap?: (gapId: string, reason: string) => void;
  filter?: CareGapType | 'all';
}

export function CareGaps({ 
  careGaps, 
  onGapClick, 
  onHighlightTimelineEvents,
  onDismissGap,
  filter = 'all'
}: CareGapsProps) {
  const [selectedGap, setSelectedGap] = useState<CareGap | null>(null);
  const [dismissalReason, setDismissalReason] = useState('');
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [localFilter, setLocalFilter] = useState<CareGapType | 'all'>(filter);

  const filteredGaps = localFilter === 'all' 
    ? careGaps 
    : careGaps.filter(g => g.gapType === localFilter);

  const getGapTypeLabel = (type: CareGapType): string => {
    switch (type) {
      case 'recurring_issue': return 'Recurring Issue';
      case 'persistent_abnormal_finding': return 'Persistent Finding';
      case 'potential_follow_up_gap': return 'Follow-up Gap';
      case 'repeated_visits_same_issue': return 'Repeated Visits';
      case 'treatment_followed_by_continued_issue': return 'Continued Issue';
      case 'investigation_without_clear_outcome': return 'Unresolved Investigation';
      case 'diagnosis_without_supporting_detail': return 'Diagnosis Without Detail';
      case 'fragmented_care': return 'Fragmented Care';
      case 'unresolved_status': return 'Unresolved Status';
      default: return type;
    }
  };

  const getGapTypeColor = (type: CareGapType): string => {
    switch (type) {
      case 'recurring_issue': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'persistent_abnormal_finding': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'potential_follow_up_gap': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'repeated_visits_same_issue': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'treatment_followed_by_continued_issue': return 'bg-red-50 text-red-700 border-red-200';
      case 'investigation_without_clear_outcome': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'diagnosis_without_supporting_detail': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'fragmented_care': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'unresolved_status': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getConfidenceLabel = (confidence: string): string => {
    switch (confidence) {
      case 'clearly_documented': return 'Clearly Documented';
      case 'potential': return 'Potential';
      case 'insufficient_information': return 'Insufficient Information';
      default: return confidence;
    }
  };

  const handleGapClick = (gap: CareGap) => {
    setSelectedGap(gap);
    if (onGapClick) {
      onGapClick(gap);
    }
    if (onHighlightTimelineEvents) {
      onHighlightTimelineEvents(gap.eventIds);
    }
  };

  const handleDismissClick = (gap: CareGap) => {
    setSelectedGap(gap);
    setShowDismissModal(true);
  };

  const handleDismissSubmit = () => {
    if (selectedGap && onDismissGap && dismissalReason.trim()) {
      onDismissGap(selectedGap.id, dismissalReason);
      setShowDismissModal(false);
      setDismissalReason('');
      setSelectedGap(null);
    }
  };

  const formatDateSafe = (dateString: string | null): string => {
    return formatDate(dateString);
  };

  if (filteredGaps.length === 0) {
    return (
      <div className="p-6 text-center text-text-tertiary">
        <p className="text-sm">No care gaps identified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <select
          value={localFilter}
          onChange={(e) => setLocalFilter(e.target.value as CareGapType | 'all')}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-background text-text-secondary"
        >
          <option value="all">All Types</option>
          <option value="recurring_issue">Recurring Issues</option>
          <option value="persistent_abnormal_finding">Persistent Findings</option>
          <option value="potential_follow_up_gap">Follow-up Gaps</option>
          <option value="repeated_visits_same_issue">Repeated Visits</option>
          <option value="treatment_followed_by_continued_issue">Continued Issues</option>
          <option value="investigation_without_clear_outcome">Unresolved Investigations</option>
          <option value="diagnosis_without_supporting_detail">Diagnosis Without Detail</option>
          <option value="fragmented_care">Fragmented Care</option>
          <option value="unresolved_status">Unresolved Status</option>
        </select>
        <span className="text-sm text-text-tertiary">{filteredGaps.length} gap{filteredGaps.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Care Gap List */}
      <div className="space-y-3">
        {filteredGaps.map((gap) => (
          <div
            key={gap.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedGap?.id === gap.id ? 'border-accent bg-accent/5' : 'border-border'
            }`}
            onClick={() => handleGapClick(gap)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getGapTypeColor(gap.gapType)}`}>
                    {getGapTypeLabel(gap.gapType)}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {getConfidenceLabel(gap.confidence)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-1">{gap.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2">{gap.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                  <span>{formatDateSafe(gap.firstObserved)} - {formatDateSafe(gap.lastObserved)}</span>
                  <span>{formatCount(gap.occurrenceCount, 'occurrence', 'occurrences')}</span>
                </div>
              </div>
              {gap.status !== 'dismissed' && onDismissGap && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismissClick(gap);
                  }}
                  className="text-xs text-text-tertiary hover:text-text-secondary px-2 py-1"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Gap Detail */}
      {selectedGap && (
        <div className="border border-border rounded-lg p-5 bg-background">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getGapTypeColor(selectedGap.gapType)}`}>
                  {getGapTypeLabel(selectedGap.gapType)}
                </span>
                <span className="text-xs text-text-tertiary">
                  {getConfidenceLabel(selectedGap.confidence)}
                </span>
              </div>
              <h3 className="text-base font-medium text-text-primary">{selectedGap.title}</h3>
            </div>
            <button
              onClick={() => setSelectedGap(null)}
              className="text-text-tertiary hover:text-text-secondary"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-text-secondary mb-4">{selectedGap.description}</p>

          {/* Observed */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-primary mb-2">OBSERVED</h4>
            <div className="space-y-1">
              {selectedGap.evidence.map((evidence, index) => (
                <div key={index} className="text-xs text-text-secondary">
                  {evidence.date && formatDate(evidence.date)} — {evidence.description}
                </div>
              ))}
            </div>
          </div>

          {/* What BACKBONE Found */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-primary mb-2">WHAT BACKBONE FOUND</h4>
            <p className="text-xs text-text-secondary">
              {selectedGap.occurrenceCount} occurrence{selectedGap.occurrenceCount !== 1 ? 's' : ''} across {selectedGap.metadata.uniqueEncounters} unique encounter{selectedGap.metadata.uniqueEncounters !== 1 ? 's' : ''}.
              {selectedGap.metadata.timeSpanYears && ` Time span: ${Math.round(selectedGap.metadata.timeSpanYears * 10) / 10} year${selectedGap.metadata.timeSpanYears !== 1 ? 's' : ''}.`}
            </p>
          </div>

          {/* Important */}
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-xs font-medium text-text-primary mb-1">IMPORTANT</h4>
            <p className="text-xs text-text-secondary">
              This does not establish that a care gap actually occurred. Follow-up or evaluation may have occurred outside the records available to BACKBONE.
            </p>
          </div>

          {/* Review Questions */}
          {selectedGap.reviewQuestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-text-primary mb-2">REVIEW</h4>
              <ul className="space-y-1">
                {selectedGap.reviewQuestions.map((question, index) => (
                  <li key={index} className="text-xs text-text-secondary">
                    • {question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Information */}
          {selectedGap.missingInformation.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-text-primary mb-2">MISSING INFORMATION</h4>
              <ul className="space-y-1">
                {selectedGap.missingInformation.map((info, index) => (
                  <li key={index} className="text-xs text-text-secondary">
                    • {info}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence */}
          <div>
            <h4 className="text-xs font-medium text-text-primary mb-2">EVIDENCE</h4>
            <p className="text-xs text-text-secondary mb-2">
              {selectedGap.evidence.length} source record{selectedGap.evidence.length !== 1 ? 's' : ''}
            </p>
            {onHighlightTimelineEvents && (
              <button
                onClick={() => onHighlightTimelineEvents(selectedGap.eventIds)}
                className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent/90"
              >
                Highlight on Timeline
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dismiss Modal */}
      {showDismissModal && selectedGap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-medium text-text-primary mb-2">Dismiss Care Gap</h3>
            <p className="text-sm text-text-secondary mb-4">
              Why are you dismissing this care gap? This reason will be recorded for reference.
            </p>
            <textarea
              value={dismissalReason}
              onChange={(e) => setDismissalReason(e.target.value)}
              placeholder="Enter dismissal reason..."
              className="w-full px-3 py-2 text-sm rounded-md border border-border mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDismissModal(false);
                  setDismissalReason('');
                  setSelectedGap(null);
                }}
                className="px-4 py-2 text-sm rounded-md border border-border text-text-secondary hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDismissSubmit}
                disabled={!dismissalReason.trim()}
                className="px-4 py-2 text-sm rounded-md bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
