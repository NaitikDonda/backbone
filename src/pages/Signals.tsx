import { useState, useEffect } from 'react';
import { mockPatient } from '../data/mockData';
import { useRecordStorage } from '../hooks/useRecordStorage';
import { AnalysisService } from '../services/analysisService';
import { CandidateAnalysisService } from '../services/candidateAnalysisService';
import { CareGapService } from '../services/careGapService';
import { TimelineService } from '../services/timelineService';
import type { ClinicalSignal, CandidateReview, CareGap } from '../types';
import { formatDate } from '../utils/dataFormatting';

export function Signals() {
  const { records } = useRecordStorage(mockPatient.id);
  const timelineService = TimelineService.getInstance();
  const analysisService = AnalysisService.getInstance();
  const candidateAnalysisService = CandidateAnalysisService.getInstance();
  const careGapService = CareGapService.getInstance();
  
  const [clinicalSignals, setClinicalSignals] = useState<ClinicalSignal[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<string>('');
  const [candidateReviews, setCandidateReviews] = useState<CandidateReview[]>([]);
  const [careGaps, setCareGaps] = useState<CareGap[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<ClinicalSignal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisAvailable, setIsAnalysisAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState<'signals' | 'candidates' | 'gaps'>('signals');

  const timelineData = timelineService.getTimeline(records);

  // Load saved analysis from localStorage on mount
  useEffect(() => {
    const savedSignals = localStorage.getItem(`signals_${mockPatient.id}`);
    const savedCandidates = localStorage.getItem(`candidates_${mockPatient.id}`);
    const savedGaps = localStorage.getItem(`gaps_${mockPatient.id}`);
    const savedSummary = localStorage.getItem(`summary_${mockPatient.id}`);
    
    if (savedSignals) setClinicalSignals(JSON.parse(savedSignals));
    if (savedCandidates) setCandidateReviews(JSON.parse(savedCandidates));
    if (savedGaps) setCareGaps(JSON.parse(savedGaps));
    if (savedSummary) setAnalysisSummary(savedSummary);
    
    analysisService.isAnalysisAvailable().then(({ available }) => {
      setIsAnalysisAvailable(available);
    });
  }, [analysisService]);

  // Save analysis to localStorage whenever it changes
  useEffect(() => {
    if (clinicalSignals.length > 0) {
      localStorage.setItem(`signals_${mockPatient.id}`, JSON.stringify(clinicalSignals));
    }
  }, [clinicalSignals, mockPatient.id]);

  useEffect(() => {
    if (analysisSummary) {
      localStorage.setItem(`summary_${mockPatient.id}`, analysisSummary);
    }
  }, [analysisSummary, mockPatient.id]);

  useEffect(() => {
    if (candidateReviews.length > 0) {
      localStorage.setItem(`candidates_${mockPatient.id}`, JSON.stringify(candidateReviews));
    }
  }, [candidateReviews, mockPatient.id]);

  useEffect(() => {
    if (careGaps.length > 0) {
      localStorage.setItem(`gaps_${mockPatient.id}`, JSON.stringify(careGaps));
    }
  }, [careGaps, mockPatient.id]);

  const handleRunFullAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      console.log('Starting full analysis...');
      console.log('Timeline events:', timelineData.events.length);
      console.log('Timeline patterns:', timelineData.patterns.length);
      
      // Run clinical signals analysis
      const signalResult = await analysisService.analyzePatient(
        mockPatient.id,
        timelineData.events,
        timelineData.patterns,
        timelineData.summary
      );
      console.log('Signal result:', signalResult);
      if (signalResult.success) {
        setClinicalSignals(signalResult.signals);
        setAnalysisSummary(signalResult.summary || '');
        console.log('Clinical signals set:', signalResult.signals.length);
        console.log('Summary set:', signalResult.summary);
      } else {
        console.error('Signal analysis failed:', signalResult.error);
      }

      // Run candidate conditions analysis
      const candidateResult = await candidateAnalysisService.analyzeCandidates(
        mockPatient.id,
        timelineData.events,
        timelineData.patterns
      );
      console.log('Candidate result:', candidateResult);
      if (candidateResult.success) {
        setCandidateReviews(candidateResult.candidateReviews);
        console.log('Candidate reviews set:', candidateResult.candidateReviews.length);
        
        // Run care gaps analysis
        const gaps = careGapService.analyzeCareGaps(
          mockPatient.id,
          timelineData.events,
          timelineData.patterns
        );
        setCareGaps(gaps);
        console.log('Care gaps set:', gaps.length);
      } else {
        console.error('Candidate analysis failed:', candidateResult.error);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please check the console for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasSignals = clinicalSignals.length > 0;
  const hasCandidates = candidateReviews.length > 0;
  const hasGaps = careGaps.length > 0;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-display text-text-primary mb-4">Insights</h1>
        <p className="text-h2 text-text-secondary font-light mb-8">
          AI-detected patterns, care gaps, and clinical signals
        </p>
        {isAnalysisAvailable && (
          <button
            onClick={handleRunFullAnalysis}
            disabled={isAnalyzing}
            className="btn btn-primary"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        )}
      </div>

      {!isAnalysisAvailable && (
        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="text-4xl text-text-muted">◈</div>
            <div className="flex-1">
              <h3 className="text-h3 text-text-primary mb-3">No Analysis Available</h3>
              <p className="text-body-large text-text-secondary leading-relaxed mb-6">
                Upload medical records and run an analysis to detect patterns, care gaps, and insights from the health journey.
              </p>
            </div>
          </div>
        </div>
      )}

      {isAnalysisAvailable && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-12 border-b border-border-light">
            <button
              onClick={() => setActiveTab('signals')}
              className={`px-6 py-4 text-sm font-medium transition-colors duration-base ${
                activeTab === 'signals'
                  ? 'text-text-primary border-b-2 border-accent-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Clinical Signals
              {hasSignals && <span className="ml-2 badge badge-primary">{clinicalSignals.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-6 py-4 text-sm font-medium transition-colors duration-base ${
                activeTab === 'candidates'
                  ? 'text-text-primary border-b-2 border-accent-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Candidate Conditions
              {hasCandidates && <span className="ml-2 badge badge-primary">{candidateReviews.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('gaps')}
              className={`px-6 py-4 text-sm font-medium transition-colors duration-base ${
                activeTab === 'gaps'
                  ? 'text-text-primary border-b-2 border-accent-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Care Gaps
              {hasGaps && <span className="ml-2 badge badge-primary">{careGaps.length}</span>}
            </button>
          </div>

          {/* Clinical Signals Tab */}
          {activeTab === 'signals' && (
            <div className="space-y-12">
              {/* Summary Section */}
              {analysisSummary && (
                <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="badge badge-primary">AI Summary</span>
                  </div>
                  <p className="text-body-large text-text-secondary leading-relaxed">
                    {analysisSummary}
                  </p>
                </div>
              )}

              {!hasSignals && (
                <div className="text-center py-24">
                  <div className="text-6xl mb-6 text-text-muted">◈</div>
                  <h2 className="text-h2 text-text-primary mb-4">No Clinical Signals</h2>
                  <p className="text-body-large text-text-secondary max-w-xl mx-auto">
                    Run analysis to generate AI-detected clinical signals from the health journey.
                  </p>
                </div>
              )}
              {hasSignals && (
                clinicalSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden"
                  >
                    <div
                      className="p-8 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedSignal(selectedSignal?.id === signal.id ? null : signal)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="badge badge-primary">AI</span>
                            <span className="text-body text-text-tertiary capitalize">
                              {signal.category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-body text-text-tertiary">
                              • {signal.strength} confidence
                            </span>
                          </div>
                          <h3 className="text-h3 text-text-primary mb-3">{signal.title}</h3>
                          <p className="text-body-large text-text-secondary leading-relaxed line-clamp-3">
                            {signal.summary}
                          </p>
                        </div>
                        <svg
                          className={`w-6 h-6 text-text-tertiary transition-transform duration-base ml-6 flex-shrink-0 ${
                            selectedSignal?.id === signal.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {selectedSignal?.id === signal.id && (
                      <div className="border-t border-border-light p-8 bg-background">
                        <div className="space-y-8">
                          {signal.whatWasDetected && (
                            <div>
                              <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">What Was Detected</p>
                              <p className="text-body-large text-text-secondary leading-relaxed">{signal.whatWasDetected}</p>
                            </div>
                          )}
                          
                          {signal.whatIsTheIssue && (
                            <div>
                              <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">Why This Matters</p>
                              <p className="text-body-large text-text-secondary leading-relaxed">{signal.whatIsTheIssue}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-tiny text-text-tertiary mb-3 uppercase tracking-wider">Evidence ({signal.evidence.length})</p>
                            <div className="space-y-3">
                              {signal.evidence.map((evidence, index) => (
                                <div key={index} className="flex items-start gap-3 text-body text-text-secondary">
                                  <span className="text-text-tertiary mt-1">→</span>
                                  <span className="flex-1">{evidence.description}</span>
                                  <span className="text-text-tertiary">({evidence.sourceDocumentName})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-small text-text-tertiary">
                            Generated {formatDate(signal.generatedAt)} using {signal.modelName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Candidate Conditions Tab */}
          {activeTab === 'candidates' && (
            <div className="space-y-12">
              {!hasCandidates && (
                <div className="text-center py-24">
                  <div className="text-6xl mb-6 text-text-muted">◈</div>
                  <h2 className="text-h2 text-text-primary mb-4">No Candidate Conditions</h2>
                  <p className="text-body-large text-text-secondary max-w-xl mx-auto">
                    Run analysis to detect candidate conditions from the health journey.
                  </p>
                </div>
              )}
              {hasCandidates && (
                candidateReviews.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-surface rounded-lg border border-border-light shadow-sm p-8"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-h3 text-text-primary mb-3">{candidate.candidateName}</h3>
                        <div className="flex items-center gap-4 text-body text-text-tertiary">
                          <span>Match Score: {candidate.evidenceMatchScore.toFixed(2)}</span>
                          <span>•</span>
                          <span className="capitalize">{candidate.matchLevel}</span>
                        </div>
                      </div>
                      <span className="badge badge-primary">Candidate</span>
                    </div>
                    <p className="text-body-large text-text-secondary leading-relaxed mb-6">{candidate.summary}</p>
                    <div className="text-body text-text-tertiary">
                      {candidate.supportingEvidence.length} supporting evidence items
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Care Gaps Tab */}
          {activeTab === 'gaps' && (
            <div className="space-y-12">
              {!hasGaps && (
                <div className="text-center py-24">
                  <div className="text-6xl mb-6 text-text-muted">◈</div>
                  <h2 className="text-h2 text-text-primary mb-4">No Care Gaps</h2>
                  <p className="text-body-large text-text-secondary max-w-xl mx-auto">
                    Run analysis to detect care gaps from the health journey.
                  </p>
                </div>
              )}
              {hasGaps && (
                careGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="bg-surface rounded-lg border border-border-light shadow-sm p-8"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-h3 text-text-primary mb-3">{gap.title}</h3>
                        <div className="flex items-center gap-4 text-body text-text-tertiary">
                          <span>{gap.gapType.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span className="capitalize">{gap.status}</span>
                        </div>
                      </div>
                      <span className="badge badge-primary">Gap</span>
                    </div>
                    <p className="text-body-large text-text-secondary leading-relaxed mb-6">{gap.description}</p>
                    <div className="text-body text-text-tertiary">
                      {gap.evidence.length} evidence item{gap.evidence.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
