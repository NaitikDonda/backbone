import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { MedicalEvent, Pattern, ClinicalSignal, CandidateReview, HealthEpisode, LongitudinalTheme, OpenThread } from '../types';
import { formatDate, formatEventType, formatStatus, formatSeverity, formatCount, formatYears } from '../utils/dataFormatting';

interface ContextualDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function ContextualDetailPanel({ isOpen, onClose, title, subtitle, children }: ContextualDetailPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-lg bg-surface border-l border-border shadow-panel overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-card py-card z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {subtitle && (
                <div className="text-tiny text-text-muted uppercase tracking-wider mb-1">
                  {subtitle}
                </div>
              )}
              <h2 className="text-section-title text-text-primary">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-text-muted hover:text-text-secondary transition-colors p-1"
              aria-label="Close panel"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-card py-card">
          {children}
        </div>
      </div>
    </div>
  );
}

// Detail sections for different types

interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-tiny text-text-muted uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="mb-3">
      <div className="text-tiny text-text-muted mb-1">{label}</div>
      <div className="text-body text-text-primary">{value}</div>
    </div>
  );
}

interface EvidenceItemProps {
  date: string | null;
  description: string;
  sourceDocumentName: string;
}

export function EvidenceItem({ date, description, sourceDocumentName }: EvidenceItemProps) {
  return (
    <div className="bg-background rounded p-3 text-sm mb-2">
      <div className="text-text-primary font-medium">{formatDate(date)}</div>
      <div className="text-text-secondary mt-1">{description}</div>
      <div className="text-text-tertiary text-xs mt-1">{sourceDocumentName}</div>
    </div>
  );
}

// Type-specific detail views

interface EventDetailProps {
  event: MedicalEvent;
}

export function EventDetail({ event }: EventDetailProps) {
  return (
    <>
      <DetailSection title="DOCUMENTED FACT">
        <DetailRow label="Type" value={formatEventType(event.eventType)} />
        <DetailRow label="Date" value={formatDate(event.date)} />
        {event.endDate && (
          <DetailRow label="End Date" value={formatDate(event.endDate)} />
        )}
        {event.description && (
          <DetailRow label="Description" value={event.description} />
        )}
        {event.status && (
          <DetailRow label="Status" value={formatStatus(event.status)} />
        )}
        {event.severity && (
          <DetailRow label="Severity" value={formatSeverity(event.severity)} />
        )}
      </DetailSection>

      <DetailSection title="SOURCE">
        <DetailRow label="Document" value={event.sourceDocumentName} />
        {event.sourceText && (
          <div className="bg-background rounded p-3 text-sm italic text-text-secondary">
            "{event.sourceText}"
          </div>
        )}
      </DetailSection>

      {event.metadata.isDuplicate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">
            This event appears in multiple documents and has been deduplicated.
          </p>
        </div>
      )}
    </>
  );
}

interface PatternDetailProps {
  pattern: Pattern;
}

export function PatternDetail({ pattern }: PatternDetailProps) {
  return (
    <>
      <DetailSection title="DETECTED PATTERN">
        <DetailRow label="Type" value={pattern.patternType.replace(/_/g, ' ')} />
        <DetailRow label="Description" value={pattern.description} />
        <DetailRow label="Occurrences" value={pattern.occurrenceCount} />
        <DetailRow 
          label="Time Span" 
          value={pattern.metadata.timeSpanYears ? formatYears(pattern.metadata.timeSpanYears) : 'Recent'} 
        />
        <DetailRow label="Unique Encounters" value={pattern.metadata.uniqueEncounters} />
      </DetailSection>

      <DetailSection title="OBSERVED">
        <DetailRow label="First Observed" value={formatDate(pattern.firstObserved)} />
        <DetailRow label="Last Observed" value={formatDate(pattern.lastObserved)} />
      </DetailSection>

      <DetailSection title={`EVIDENCE (${pattern.evidence.length})`}>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {pattern.evidence.map((evidence, index) => (
            <EvidenceItem
              key={index}
              date={evidence.date}
              description={evidence.description}
              sourceDocumentName={evidence.sourceDocumentName}
            />
          ))}
        </div>
      </DetailSection>

      <DetailSection title="SOURCE RECORDS">
        <DetailRow 
          label="Documents" 
          value={formatCount(pattern.sourceRecordIds.length, 'document', 'documents')} 
        />
      </DetailSection>
    </>
  );
}

interface SignalDetailProps {
  signal: ClinicalSignal;
}

export function SignalDetail({ signal }: SignalDetailProps) {
  return (
    <>
      <DetailSection title="AI INTERPRETATION">
        <DetailRow label="Category" value={signal.category.replace(/_/g, ' ')} />
        <DetailRow label="Summary" value={signal.summary} />
        {signal.whatWasDetected && (
          <DetailRow label="What Was Detected" value={signal.whatWasDetected} />
        )}
        {signal.whatIsTheIssue && (
          <DetailRow label="What Is The Issue" value={signal.whatIsTheIssue} />
        )}
        <DetailRow label="Strength" value={signal.strength} />
        {signal.strengthReason && (
          <DetailRow label="Reason" value={signal.strengthReason} />
        )}
      </DetailSection>

      <DetailSection title={`EVIDENCE (${signal.evidence.length})`}>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {signal.evidence.map((evidence, index) => (
            <EvidenceItem
              key={index}
              date={evidence.date}
              description={evidence.description}
              sourceDocumentName={evidence.sourceDocumentName}
            />
          ))}
        </div>
      </DetailSection>

      {signal.possibleExplanations.length > 0 && (
        <DetailSection title="POSSIBLE EXPLANATIONS">
          <ul className="space-y-2">
            {signal.possibleExplanations.map((explanation, index) => (
              <li key={index} className="text-sm text-text-secondary">• {explanation}</li>
            ))}
          </ul>
        </DetailSection>
      )}

      {signal.questionsForReview.length > 0 && (
        <DetailSection title="QUESTIONS FOR CLINICAL REVIEW">
          <ul className="space-y-2">
            {signal.questionsForReview.map((question, index) => (
              <li key={index} className="text-sm text-text-secondary">• {question}</li>
            ))}
          </ul>
        </DetailSection>
      )}

      <DetailSection title="GENERATED">
        <DetailRow label="Date" value={formatDate(signal.generatedAt)} />
        <DetailRow label="Model" value={signal.modelName} />
      </DetailSection>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-purple-800">
          This insight was generated locally by BACKBONE using {signal.modelName}. It does not provide a medical diagnosis.
        </p>
      </div>
    </>
  );
}

interface CandidateDetailProps {
  candidate: CandidateReview;
}

export function CandidateDetail({ candidate }: CandidateDetailProps) {
  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-blue-900 mb-2">WHY BACKBONE SURFACED THIS</h4>
        <p className="text-sm text-blue-800">
          BACKBONE surfaced this candidate because {candidate.supportingEvidence.length} evidence items overlap with the development knowledge profile.
          {candidate.supportingEvidence.length >= 3 && ' The findings recur across multiple encounters, suggesting a longitudinal pattern.'}
          {candidate.missingInformation.length > 0 && ` However, ${candidate.missingInformation.length} required information item${candidate.missingInformation.length !== 1 ? 's are' : ' is'} not found in available records.`}
        </p>
      </div>

      <DetailSection title="EVIDENCE MATCH">
        <DetailRow label="Match Level" value={candidate.matchLevel} />
        <DetailRow label="Score" value={candidate.evidenceMatchScore.toFixed(2)} />
        <DetailRow label="Summary" value={candidate.summary} />
      </DetailSection>

      <DetailSection title={`SUPPORTING EVIDENCE (${candidate.supportingEvidence.length})`}>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {candidate.supportingEvidence.map((evidence, index) => (
            <div key={index} className="bg-background rounded p-3 text-sm">
              <div className="text-text-primary font-medium">{formatDate(evidence.date)}</div>
              <div className="text-text-secondary">{evidence.description}</div>
              <div className="text-text-tertiary text-xs mt-1">
                {evidence.matchType} • {evidence.sourceDocumentName}
              </div>
            </div>
          ))}
        </div>
      </DetailSection>

      {candidate.contradictingEvidence.length > 0 && (
        <DetailSection title={`CONTRADICTING EVIDENCE (${candidate.contradictingEvidence.length})`}>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {candidate.contradictingEvidence.map((evidence, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                <div className="text-text-primary font-medium">{formatDate(evidence.date)}</div>
                <div className="text-text-secondary">{evidence.description}</div>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {candidate.missingInformation.length > 0 && (
        <DetailSection title={`NOT FOUND IN AVAILABLE RECORDS (${candidate.missingInformation.length})`}>
          <ul className="space-y-2">
            {candidate.missingInformation.map((missing, index) => (
              <li key={index} className="text-sm text-text-secondary">• {missing}</li>
            ))}
          </ul>
        </DetailSection>
      )}

      <DetailSection title="LONGITUDINAL REASONING">
        <DetailRow label="Analysis" value={candidate.longitudinalReasoning} />
      </DetailSection>

      {candidate.reviewQuestions.length > 0 && (
        <DetailSection title="QUESTIONS FOR CLINICAL REVIEW">
          <ul className="space-y-2">
            {candidate.reviewQuestions.map((question, index) => (
              <li key={index} className="text-sm text-text-secondary">• {question}</li>
            ))}
          </ul>
        </DetailSection>
      )}

      <DetailSection title="GENERATED">
        <DetailRow label="Date" value={formatDate(candidate.generatedAt)} />
        <DetailRow label="Model" value={candidate.modelName} />
        <DetailRow label="Knowledge Base" value={candidate.knowledgeVersion} />
      </DetailSection>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-orange-800">
          This is an evidence-based research signal, not a medical diagnosis. The candidate condition appeared based on pattern matching against the development knowledge base.
        </p>
      </div>
    </>
  );
}

// Episode and theme detail views (for Phase 14 integration)

interface EpisodeDetailProps {
  episode: HealthEpisode;
}

export function EpisodeDetail({ episode }: EpisodeDetailProps) {
  return (
    <>
      <DetailSection title="HEALTH EPISODE">
        <DetailRow label="Type" value={episode.type.replace(/_/g, ' ')} />
        <DetailRow label="Status" value={episode.status.replace(/_/g, ' ')} />
        <DetailRow label="Description" value={episode.description} />
        <DetailRow label="Summary" value={episode.summary} />
      </DetailSection>

      <DetailSection title="TIMEFRAME">
        <DetailRow label="Start Date" value={formatDate(episode.startDate)} />
        <DetailRow label="End Date" value={formatDate(episode.endDate)} />
      </DetailSection>

      <DetailSection title="CONTENTS">
        <DetailRow label="Events" value={formatCount(episode.eventIds.length, 'event', 'events')} />
        <DetailRow label="Patterns" value={formatCount(episode.patternIds.length, 'pattern', 'patterns')} />
        <DetailRow label="Source Records" value={formatCount(episode.sourceRecordIds.length, 'record', 'records')} />
      </DetailSection>

      {episode.themes.length > 0 && (
        <DetailSection title="RELATED THEMES">
          <ul className="space-y-2">
            {episode.themes.map((theme, index) => (
              <li key={index} className="text-sm text-text-secondary">• {theme}</li>
            ))}
          </ul>
        </DetailSection>
      )}

      {episode.transitions.length > 0 && (
        <DetailSection title="TRANSITIONS">
          <ul className="space-y-2">
            {episode.transitions.map((trans, index) => (
              <li key={index} className="text-sm text-text-secondary">• {trans}</li>
            ))}
          </ul>
        </DetailSection>
      )}
    </>
  );
}

interface ThemeDetailProps {
  theme: LongitudinalTheme;
}

export function ThemeDetail({ theme }: ThemeDetailProps) {
  return (
    <>
      <DetailSection title="LONGITUDINAL THEME">
        <DetailRow label="Name" value={theme.name} />
        <DetailRow label="Description" value={theme.description} />
        <DetailRow label="Canonical Concept" value={theme.canonicalConcept} />
        <DetailRow label="Status" value={theme.status} />
      </DetailSection>

      <DetailSection title="OBSERVED">
        <DetailRow label="First Observed" value={formatDate(theme.firstObserved)} />
        <DetailRow label="Last Observed" value={formatDate(theme.lastObserved)} />
      </DetailSection>

      <DetailSection title="CONTENTS">
        <DetailRow label="Episodes" value={formatCount(theme.episodeIds.length, 'episode', 'episodes')} />
        <DetailRow label="Events" value={formatCount(theme.eventIds.length, 'event', 'events')} />
        <DetailRow label="Patterns" value={formatCount(theme.patternIds.length, 'pattern', 'patterns')} />
      </DetailSection>
    </>
  );
}

interface ThreadDetailProps {
  thread: OpenThread;
}

export function ThreadDetail({ thread }: ThreadDetailProps) {
  return (
    <>
      <DetailSection title="OPEN THREAD">
        <DetailRow label="Category" value={thread.category.replace(/_/g, ' ')} />
        <DetailRow label="Description" value={thread.description} />
        <DetailRow label="Severity" value={thread.severity} />
      </DetailSection>

      <DetailSection title="OBSERVED">
        <DetailRow label="First Observed" value={formatDate(thread.firstObserved)} />
        <DetailRow label="Last Observed" value={formatDate(thread.lastObserved)} />
      </DetailSection>

      <DetailSection title="CONTENTS">
        <DetailRow label="Episodes" value={formatCount(thread.episodeIds.length, 'episode', 'episodes')} />
        <DetailRow label="Events" value={formatCount(thread.eventIds.length, 'event', 'events')} />
      </DetailSection>

      {thread.relatedCareGapIds.length > 0 && (
        <DetailSection title="RELATED CARE GAPS">
          <ul className="space-y-2">
            {thread.relatedCareGapIds.map((gapId, index) => (
              <li key={index} className="text-sm text-text-secondary">• {gapId}</li>
            ))}
          </ul>
        </DetailSection>
      )}

      {thread.relatedPatternIds.length > 0 && (
        <DetailSection title="RELATED PATTERNS">
          <ul className="space-y-2">
            {thread.relatedPatternIds.map((patternId, index) => (
              <li key={index} className="text-sm text-text-secondary">• {patternId}</li>
            ))}
          </ul>
        </DetailSection>
      )}
    </>
  );
}
