import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockPatient } from '../data/mockData';
import { useRecordStorage } from '../hooks/useRecordStorage';
import { TimelineService } from '../services/timelineService';
import { AnalysisService } from '../services/analysisService';
import type { ClinicalSignal } from '../types';

export function Overview() {
  const { records, deleteAllRecords } = useRecordStorage(mockPatient.id);
  const timelineService = TimelineService.getInstance();
  const analysisService = AnalysisService.getInstance();
  
  const [clinicalSignals, setClinicalSignals] = useState<ClinicalSignal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisAvailable, setIsAnalysisAvailable] = useState(false);
  
  const timelineData = timelineService.getTimeline(records);

  // Extract patient age from records
  const patientAge = (() => {
    for (const record of records) {
      if (record.structuredExtraction?.patient?.age) {
        const ageStr = String(record.structuredExtraction.patient.age);
        const ageNum = parseInt(ageStr.replace(/\D/g, ''));
        if (!isNaN(ageNum) && ageNum > 0) {
          return ageNum;
        }
      }
    }
    return mockPatient.age;
  })();

  // Extract patient name from records
  const patientName = (() => {
    for (const record of records) {
      if (record.structuredExtraction?.patient?.name) {
        return record.structuredExtraction.patient.name;
      }
    }
    return mockPatient.name;
  })();

  // Load saved analysis from localStorage
  useEffect(() => {
    const savedSignals = localStorage.getItem(`signals_${mockPatient.id}`);
    if (savedSignals) setClinicalSignals(JSON.parse(savedSignals));
    
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

  const handleAnalyzeHealthHistory = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analysisService.analyzePatient(
        mockPatient.id,
        timelineData.events,
        timelineData.patterns,
        timelineData.summary
      );
      
      if (result.success) {
        setClinicalSignals(result.signals);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetAnalysis = () => {
    localStorage.removeItem(`signals_${mockPatient.id}`);
    setClinicalSignals([]);
  };

  const handleResetRecords = () => {
    if (confirm('Are you sure you want to delete all records? This cannot be undone.')) {
      deleteAllRecords();
      handleResetAnalysis();
    }
  };

  const hasRecords = records.length > 0;
  const hasSignals = clinicalSignals.length > 0;

  return (
    <div className="max-w-4xl">
      {/* Patient Story Header */}
      <div className="mb-16">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-display text-text-primary mb-4">{patientName}</h1>
            <p className="text-h2 text-text-secondary font-light">
              {patientAge} years old • {records.length} document{records.length !== 1 ? 's' : ''}
            </p>
          </div>
          {hasRecords && (
            <button
              onClick={handleResetRecords}
              className="btn btn-ghost text-small"
            >
              Reset Records
            </button>
          )}
        </div>
        
        {hasRecords && (
          <div className="prose prose-lg max-w-none">
            <p className="text-body-large text-text-secondary leading-relaxed">
              {timelineData.summary || 'The health journey is being reconstructed from uploaded medical records.'}
            </p>
          </div>
        )}
      </div>

      {!hasRecords && (
        <div className="text-center py-24">
          <div className="text-6xl mb-6 text-text-muted">○</div>
          <h2 className="text-h2 text-text-primary mb-4">Begin the Journey</h2>
          <p className="text-body-large text-text-secondary mb-8 max-w-xl mx-auto">
            Upload medical documents to reconstruct the health story and discover patterns across time.
          </p>
          <Link to="/workspace/records" className="btn btn-primary text-lg px-8 py-4">
            Upload Documents
          </Link>
        </div>
      )}

      {hasRecords && (
        <>
          {/* What BACKBONE Found */}
          {hasSignals && (
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-h2 text-text-primary">What BACKBONE Detected</h2>
                <button
                  onClick={handleResetAnalysis}
                  className="btn btn-ghost text-small"
                >
                  Reset Analysis
                </button>
              </div>
              <div className="space-y-6">
                {clinicalSignals.slice(0, 3).map((signal) => (
                  <div
                    key={signal.id}
                    className="bg-surface rounded-lg border border-border-light p-8 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="badge badge-primary">AI</span>
                          <span className="text-small text-text-tertiary capitalize">
                            {signal.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className="text-h3 text-text-primary mb-2">{signal.title}</h3>
                      </div>
                    </div>
                    
                    {signal.whatWasDetected && (
                      <div className="mb-4">
                        <p className="text-tiny text-text-tertiary mb-1 uppercase tracking-wider">What Was Detected</p>
                        <p className="text-body text-text-secondary leading-relaxed">{signal.whatWasDetected}</p>
                      </div>
                    )}
                    
                    {signal.whatIsTheIssue && (
                      <div className="mb-4">
                        <p className="text-tiny text-text-tertiary mb-1 uppercase tracking-wider">Why This Matters</p>
                        <p className="text-body text-text-secondary leading-relaxed">{signal.whatIsTheIssue}</p>
                      </div>
                    )}
                    
                    <div className="text-small text-text-tertiary">
                      {signal.evidence.length} evidence source{signal.evidence.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
              
              {clinicalSignals.length > 3 && (
                <div className="mt-8 text-center">
                  <Link to="/workspace/signals" className="text-accent-primary hover:text-accent-secondary transition-colors">
                    View all {clinicalSignals.length} insights →
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Journey Summary */}
          <section className="mb-16">
            <h2 className="text-h2 text-text-primary mb-8">The Health Journey</h2>
            <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
              <p className="text-body-large text-text-secondary leading-relaxed mb-6">
                {timelineData.summary || 'The health journey spans multiple events across time, revealing patterns and relationships that tell the patient\'s story.'}
              </p>
              <div className="flex items-center gap-8 text-small text-text-tertiary">
                <span>{timelineData.events.length} events</span>
                <span>•</span>
                <span>{timelineData.patterns.length} patterns</span>
                <span>•</span>
                <span>{records.length} documents</span>
              </div>
              <div className="mt-6 pt-6 border-t border-border-light">
                <Link to="/workspace/journey" className="text-accent-primary hover:text-accent-secondary transition-colors">
                  View full journey →
                </Link>
              </div>
            </div>
          </section>

          {/* Analysis CTA */}
          {!hasSignals && isAnalysisAvailable && (
            <section className="mb-16">
              <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="text-4xl text-text-muted">◈</div>
                  <div className="flex-1">
                    <h3 className="text-h3 text-text-primary mb-3">Discover Patterns</h3>
                    <p className="text-body-large text-text-secondary mb-6 leading-relaxed">
                      Run an AI analysis to detect patterns, care gaps, and insights from the medical records.
                    </p>
                    <button
                      onClick={handleAnalyzeHealthHistory}
                      disabled={isAnalyzing}
                      className="btn btn-primary"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Health History'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Quick Navigation */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/workspace/journey" className="bg-surface rounded-lg border border-border-light p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-h4 text-text-primary mb-2">Health Journey</h3>
              <p className="text-body text-text-secondary">View the chronological timeline</p>
            </Link>
            <Link to="/workspace/records" className="bg-surface rounded-lg border border-border-light p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-h4 text-text-primary mb-2">Records</h3>
              <p className="text-body text-text-secondary">Explore source documents</p>
            </Link>
            <Link to="/workspace/signals" className="bg-surface rounded-lg border border-border-light p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-h4 text-text-primary mb-2">Insights</h3>
              <p className="text-body text-text-secondary">Review AI findings</p>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
