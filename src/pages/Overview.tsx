import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mockPatient } from '../data/mockData';
import { useRecordStorage } from '../hooks/useRecordStorage';
import { TimelineService } from '../services/timelineService';
import { AnalysisService } from '../services/analysisService';
import type { ClinicalSignal, MedicalEvent } from '../types';

export function Overview() {
  const { records, deleteAllRecords } = useRecordStorage(mockPatient.id);
  const timelineService = TimelineService.getInstance();
  const analysisService = AnalysisService.getInstance();
  
  const [clinicalSignals, setClinicalSignals] = useState<ClinicalSignal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const timelineData = timelineService.getTimeline(records);
  const events = timelineData.events;

  // Debug logging to verify data consistency
  useEffect(() => {
    console.log('[Overview] Records loaded:', records.length);
    console.log('[Overview] Timeline events:', timelineData.events.length);
    console.log('[Overview] Timeline patterns:', timelineData.patterns.length);
    console.log('[Overview] Event types:', timelineData.events.map(e => e.eventType));
  }, [records, timelineData]);

  // Extract patient demographics from records
  const patientDemographics = useMemo(() => {
    let name: string | null = null;
    let age: number | null = null;
    let sex: string | null = null;
    let dateOfBirth: string | null = null;
    let patientId: string | null = null;

    for (const record of records) {
      const patient = record.structuredExtraction?.patient;
      if (patient) {
        if (!name && patient.name) {
          // Additional validation in Overview - reject if name contains document metadata
          const invalidKeywords = [
            'Date of Birth', 'Gender', 'Patient ID', 'Location', 'Report Period',
            'INDEX OF REPORTS', 'Collection Date', 'Reason for Visit', 'Total Reports',
            'Included', 'Clinical Impression', 'History of Present Illness'
          ];
          const nameLower = patient.name.toLowerCase();
          const hasInvalidKeyword = invalidKeywords.some(keyword => 
            nameLower.includes(keyword.toLowerCase())
          );
          const isTooLong = patient.name.length > 100;
          const hasDocumentStructure = patient.name.includes(':') && patient.name.split(':').length > 2;
          
          if (!hasInvalidKeyword && !isTooLong && !hasDocumentStructure) {
            name = patient.name;
          }
        }
        if (!age && patient.age) {
          const ageStr = String(patient.age);
          const ageNum = parseInt(ageStr.replace(/\D/g, ''));
          if (!isNaN(ageNum) && ageNum > 0) age = ageNum;
        }
        if (!sex && patient.sex) sex = patient.sex;
        if (!dateOfBirth && patient.dateOfBirth) dateOfBirth = patient.dateOfBirth;
        if (!patientId && patient.patientId) patientId = patient.patientId;
      }
    }

    // Calculate age from DOB if not directly available
    if (!age && dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const calculatedAge = Math.floor((new Date().getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (calculatedAge > 0 && calculatedAge < 150) age = calculatedAge;
      }
    }

    return { name, age, sex, dateOfBirth, patientId };
  }, [records]);

  // Load saved analysis from localStorage
  useEffect(() => {
    const savedSignals = localStorage.getItem(`signals_${mockPatient.id}`);
    if (savedSignals) setClinicalSignals(JSON.parse(savedSignals));
  }, [mockPatient.id]);

  // Save analysis to localStorage whenever it changes
  useEffect(() => {
    if (clinicalSignals.length > 0) {
      localStorage.setItem(`signals_${mockPatient.id}`, JSON.stringify(clinicalSignals));
    }
  }, [clinicalSignals, mockPatient.id]);

  const handleAnalyzeHealthHistory = async () => {
    setIsAnalyzing(true);
    try {
      console.log('[Overview] Starting analysis with events:', timelineData.events.length);
      console.log('[Overview] Events sample:', timelineData.events.slice(0, 3));
      console.log('[Overview] All events source documents:', [...new Set(timelineData.events.map(e => e.sourceDocumentName))]);
      console.log('[Overview] Patterns:', timelineData.patterns.length);
      console.log('[Overview] Summary:', timelineData.summary);
      
      const result = await analysisService.analyzePatient(
        mockPatient.id,
        timelineData.events,
        timelineData.patterns,
        timelineData.summary
      );
      
      console.log('[Overview] Analysis result:', result);
      console.log('[Overview] Signals received:', result.signals.length);
      
      if (result.success) {
        setClinicalSignals(result.signals);
      } else {
        console.error('[Overview] Analysis failed:', result.error);
      }
    } catch (error) {
      console.error('[Overview] Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetAnalysis = () => {
    localStorage.removeItem(`signals_${mockPatient.id}`);
    localStorage.removeItem(`candidates_${mockPatient.id}`);
    localStorage.removeItem(`gaps_${mockPatient.id}`);
    localStorage.removeItem(`summary_${mockPatient.id}`);
    setClinicalSignals([]);
  };

  const handleResetRecords = () => {
    if (confirm('Are you sure you want to delete all records? This cannot be undone.')) {
      deleteAllRecords();
      handleResetAnalysis();
      // Clear analysis service cache
      const analysisService = AnalysisService.getInstance();
      analysisService.clearCache(mockPatient.id);
    }
  };

  // Calculate date range from events
  const dateRange = useMemo(() => {
    const validDates = events
      .map(e => e.date ? new Date(e.date).getTime() : null)
      .filter((d): d is number => d !== null && !isNaN(d));
    
    if (validDates.length === 0) return { start: null, end: null };
    
    return {
      start: new Date(Math.min(...validDates)).getFullYear(),
      end: new Date(Math.max(...validDates)).getFullYear(),
    };
  }, [events]);

  // Count events by type
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.eventType] = (counts[e.eventType] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Get key health story events (major developments across years)
  const keyHealthStory = useMemo(() => {
    const eventsByYear = new Map<number, MedicalEvent[]>();
    events.forEach(e => {
      if (e.date) {
        const year = new Date(e.date).getFullYear();
        if (!isNaN(year)) {
          if (!eventsByYear.has(year)) eventsByYear.set(year, []);
          eventsByYear.get(year)!.push(e);
        }
      }
    });

    const years = Array.from(eventsByYear.keys()).sort((a, b) => a - b);
    const story: Array<{ year: number; description: string }> = [];

    years.forEach(year => {
      const yearEvents = eventsByYear.get(year) || [];
      // Prioritize diagnoses, procedures, and significant events
      const significant = yearEvents.filter(e => 
        e.eventType === 'diagnosis' || 
        e.eventType === 'procedure' || 
        e.eventType === 'hospital_visit'
      );
      
      if (significant.length > 0) {
        story.push({
          year,
          description: significant[0].title,
        });
      } else if (yearEvents.length > 0) {
        story.push({
          year,
          description: yearEvents[0].title,
        });
      }
    });

    return story.slice(0, 6); // Limit to 6 key moments
  }, [events]);

  // Calculate key findings
  const keyFindings = useMemo(() => {
    const findings: Array<{ type: string; description: string; count: number }> = [];
    
    // Progression: conditions that changed over time
    const diagnoses = events.filter(e => e.eventType === 'diagnosis');
    if (diagnoses.length > 1) {
      findings.push({
        type: 'Progression',
        description: 'Multiple diagnoses documented over time',
        count: diagnoses.length,
      });
    }

    // Persistent: findings that appeared repeatedly
    const eventCountsByTitle = new Map<string, number>();
    events.forEach(e => {
      eventCountsByTitle.set(e.title, (eventCountsByTitle.get(e.title) || 0) + 1);
    });
    const persistent = Array.from(eventCountsByTitle.entries())
      .filter(([_, count]) => count > 1)
      .slice(0, 2);
    
    if (persistent.length > 0) {
      findings.push({
        type: 'Persistent',
        description: `${persistent[0][0]} appeared ${persistent[0][1]} times`,
        count: persistent[0][1],
      });
    }

    // Resolved: events with resolved/completed status
    const resolved = events.filter(e => 
      e.status && (e.status.toLowerCase().includes('resolved') || e.status.toLowerCase().includes('completed'))
    );
    if (resolved.length > 0) {
      findings.push({
        type: 'Resolved',
        description: `${resolved.length} documented issue${resolved.length > 1 ? 's' : ''} resolved`,
        count: resolved.length,
      });
    }

    // Unresolved: ongoing or unresolved status
    const unresolved = events.filter(e => 
      e.status && (e.status.toLowerCase().includes('ongoing') || e.status.toLowerCase().includes('unresolved'))
    );
    if (unresolved.length > 0) {
      findings.push({
        type: 'Unresolved',
        description: `${unresolved.length} ongoing issue${unresolved.length > 1 ? 's' : ''}`,
        count: unresolved.length,
      });
    }

    return findings.slice(0, 4);
  }, [events]);

  // Format date for display
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Not documented';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Not documented';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Safe value display
  const safeDisplay = (value: any): string => {
    if (value === null || value === undefined) return 'Not documented';
    if (value === 'NaN' || value === 'None' || value === 'Invalid Date') return 'Not documented';
    return String(value);
  };

  const hasRecords = records.length > 0;
  const hasSignals = clinicalSignals.length > 0;

  return (
    <div className="max-w-5xl">
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
          {/* Patient Header */}
          <div className="mb-12">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-display text-text-primary mb-2">
                  {safeDisplay(patientDemographics.name || 'Patient')}
                </h1>
                <p className="text-h2 text-text-secondary font-light mb-8">
                  {patientDemographics.age !== null ? `${patientDemographics.age} years old` : 'Age not documented'}
                  {patientDemographics.sex ? ` · ${safeDisplay(patientDemographics.sex)}` : ''}
                </p>
              </div>
              <button
                onClick={handleResetRecords}
                className="btn btn-ghost text-small"
              >
                Reset Records
              </button>
            </div>
            
            {/* Secondary Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-small text-text-tertiary">
              <div>
                <p className="mb-1">Date of birth</p>
                <p className="text-text-secondary">{formatDate(patientDemographics.dateOfBirth)}</p>
              </div>
              <div>
                <p className="mb-1">Patient ID</p>
                <p className="text-text-secondary">{safeDisplay(patientDemographics.patientId)}</p>
              </div>
              <div>
                <p className="mb-1">Records</p>
                <p className="text-text-secondary">{records.length} document{records.length !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="mb-1">Events</p>
                <p className="text-text-secondary">{events.length}</p>
              </div>
            </div>
          </div>

          {/* Health History Section */}
          <section className="mb-16">
            <div className="mb-4">
              <p className="text-tiny text-text-tertiary uppercase tracking-wider mb-2">Health History</p>
              <h2 className="text-h2 text-text-primary">
                {dateRange.start && dateRange.end ? `${dateRange.start} — ${dateRange.end}` : 'Records available'}
              </h2>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="text-body-large text-text-secondary leading-relaxed">
                {timelineData.summary || 'The health journey is being reconstructed from uploaded medical records.'}
              </p>
            </div>
          </section>

          {/* Key Health Story */}
          {keyHealthStory.length > 0 && (
            <section className="mb-16">
              <h2 className="text-h2 text-text-primary mb-8">Key Health Story</h2>
              <div className="relative">
                {keyHealthStory.map((item, index) => (
                  <div key={item.year} className="flex items-start gap-6 pb-8">
                    <div className="flex-shrink-0 w-20 text-right">
                      <p className="text-h3 text-text-primary">{item.year}</p>
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-body-large text-text-secondary">{item.description}</p>
                    </div>
                    {index < keyHealthStory.length - 1 && (
                      <div className="absolute left-20 top-8 bottom-0 w-px bg-border-light" style={{ left: '5rem' }} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Findings */}
          {keyFindings.length > 0 && (
            <section className="mb-16">
              <h2 className="text-h2 text-text-primary mb-8">Key Findings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {keyFindings.map((finding, index) => (
                  <div key={index} className="bg-surface rounded-lg border border-border-light p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-tiny text-text-tertiary uppercase tracking-wider">{finding.type}</span>
                    </div>
                    <p className="text-body text-text-secondary">{finding.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Record Snapshot */}
          <section className="mb-16">
            <h2 className="text-h2 text-text-primary mb-8">Record Snapshot</h2>
            <div className="bg-surface rounded-lg border border-border-light p-8">
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <p className="text-display text-text-primary mb-2">{records.length}</p>
                  <p className="text-small text-text-tertiary uppercase tracking-wider">Documents</p>
                </div>
                <div className="text-center">
                  <p className="text-display text-text-primary mb-2">{events.length}</p>
                  <p className="text-small text-text-tertiary uppercase tracking-wider">Events</p>
                </div>
                <div className="text-center">
                  <p className="text-display text-text-primary mb-2">
                    {dateRange.start && dateRange.end ? `${dateRange.end - dateRange.start + 1}` : '-'}
                  </p>
                  <p className="text-small text-text-tertiary uppercase tracking-wider">Years</p>
                </div>
              </div>
              
              <div className="border-t border-border-light pt-6">
                <p className="text-tiny text-text-tertiary uppercase tracking-wider mb-4">Event Types</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-small">
                  <div>
                    <p className="text-text-tertiary">Symptoms</p>
                    <p className="text-text-secondary">{eventCounts.symptom || 0}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Diagnoses</p>
                    <p className="text-text-secondary">{eventCounts.diagnosis || 0}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Laboratory</p>
                    <p className="text-text-secondary">{eventCounts.laboratory || 0}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Medications</p>
                    <p className="text-text-secondary">{eventCounts.medication || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Health Journey Preview */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-h2 text-text-primary">Health Journey</h2>
              <Link to="/workspace/journey" className="text-accent-primary hover:text-accent-secondary transition-colors text-small">
                View complete health journey →
              </Link>
            </div>
            <div className="bg-surface rounded-lg border border-border-light p-8">
              {keyHealthStory.length > 0 ? (
                <div className="space-y-4">
                  {keyHealthStory.slice(0, 5).map((item) => (
                    <div key={item.year} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 text-right">
                        <p className="text-h4 text-text-primary">{item.year}</p>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-body text-text-secondary">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body text-text-secondary">
                  {events.length} events across the timeline
                </p>
              )}
            </div>
          </section>

          {/* Insights Preview */}
          <section className="mb-16">
            {hasSignals ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-h2 text-text-primary">Insights</h2>
                  <Link to="/workspace/signals" className="text-accent-primary hover:text-accent-secondary transition-colors text-small">
                    View all insights →
                  </Link>
                </div>
                <div className="space-y-4">
                  {clinicalSignals.slice(0, 3).map((signal) => (
                    <div
                      key={signal.id}
                      className="bg-surface rounded-lg border border-border-light p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <span className="badge badge-primary">AI</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-h4 text-text-primary mb-2">{signal.title}</h3>
                          <p className="text-body text-text-secondary leading-relaxed">
                            {signal.summary || signal.whatWasDetected}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-surface rounded-lg border border-border-light p-8">
                <h3 className="text-h3 text-text-primary mb-3">Discover what may be hidden in the records</h3>
                <p className="text-body-large text-text-secondary mb-6 leading-relaxed">
                  BACKBONE can analyze the longitudinal history for recurring patterns, unresolved issues, and relationships between medical events.
                </p>
                <button
                  onClick={handleAnalyzeHealthHistory}
                  disabled={isAnalyzing}
                  className="btn btn-primary"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Health History'}
                </button>
              </div>
            )}
          </section>

          {/* Documents Preview */}
          <section className="mb-16">
            <h2 className="text-h2 text-text-primary mb-8">Documents</h2>
            <div className="space-y-3">
              {records.map((record) => (
                <Link
                  key={record.id}
                  to={`/workspace/records`}
                  className="block bg-surface rounded-lg border border-border-light p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-body text-text-secondary mb-1">{record.filename}</p>
                      <p className="text-small text-text-tertiary">
                        {record.documentType}
                        {record.recordDate && ` · ${formatDate(record.recordDate)}`}
                      </p>
                    </div>
                    <div className="text-text-muted">→</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Reset Controls */}
          {hasSignals && (
            <div className="flex items-center gap-4 pt-8 border-t border-border-light">
              <button
                onClick={handleResetAnalysis}
                className="btn btn-ghost text-small"
              >
                Reset Analysis
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
