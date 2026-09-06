import type { MedicalEvent, Pattern, CareGap, CareGapEvidence, SemanticAnalysis } from '../types';
import { getTemporalWindows, calculateTimeSpanYears, getTemporalWindowLabel } from '../config/temporalWindows';
import { AnalysisAuditService } from './analysisAuditService';
import { OllamaService } from './ollamaService';
import { CARE_GAP_SYSTEM_PROMPT, generateCareGapUserPrompt } from './careGapSystemPrompt';
import type { AnalysisAudit } from '../types';

/**
 * Care Gap Detection Service
 * 
 * Detects potential gaps in the available medical records using deterministic rules.
 * This is an information analysis tool, not a clinical decision system.
 */
export class CareGapService {
  private static instance: CareGapService;
  private auditService: AnalysisAuditService;
  private ollamaService: OllamaService;
  private analysisVersion: number = 1;

  private constructor() {
    this.auditService = AnalysisAuditService.getInstance();
    this.ollamaService = OllamaService.getInstance();
  }

  static getInstance(): CareGapService {
    if (!CareGapService.instance) {
      CareGapService.instance = new CareGapService();
    }
    return CareGapService.instance;
  }

  /**
   * Analyze patient records for care gaps
   */
  analyzeCareGaps(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    semanticAnalysis?: SemanticAnalysis,
    analysisId?: string
  ): CareGap[] {
    const gaps: CareGap[] = [];
    const windows = getTemporalWindows();

    // 1. Detect recurring issues
    const recurringIssues = this.detectRecurringIssues(patientId, events, patterns, semanticAnalysis);
    gaps.push(...recurringIssues);

    // 2. Detect persistent abnormal findings
    const persistentFindings = this.detectPersistentAbnormalFindings(patientId, events, patterns, semanticAnalysis);
    gaps.push(...persistentFindings);

    // 3. Detect potential follow-up gaps
    const followUpGaps = this.detectPotentialFollowUpGaps(patientId, events, patterns, windows, semanticAnalysis);
    gaps.push(...followUpGaps);

    // 4. Detect repeated visits for same issue
    const repeatedVisits = this.detectRepeatedVisitsSameIssue(patientId, events, patterns, semanticAnalysis);
    gaps.push(...repeatedVisits);

    // 5. Detect treatment followed by continued issue
    const treatmentContinued = this.detectTreatmentFollowedByContinuedIssue(patientId, events, semanticAnalysis);
    gaps.push(...treatmentContinued);

    // 6. Detect investigation without clear outcome
    const investigationOutcomes = this.detectInvestigationWithoutClearOutcome(patientId, events, windows);
    gaps.push(...investigationOutcomes);

    // 7. Detect diagnosis without supporting detail
    const diagnosisWithoutDetail = this.detectDiagnosisWithoutSupportingDetail(patientId, events, patterns);
    gaps.push(...diagnosisWithoutDetail);

    // 8. Detect fragmented care
    const fragmentedCare = this.detectFragmentedCare(patientId, events, patterns, semanticAnalysis);
    gaps.push(...fragmentedCare);

    // 9. Detect unresolved status
    const unresolvedStatus = this.detectUnresolvedStatus(patientId, events, windows, semanticAnalysis);
    gaps.push(...unresolvedStatus);

    // Record audit
    if (gaps.length > 0) {
      const auditId = this.auditService.generateAuditId();
      const audit: AnalysisAudit = {
        id: auditId,
        patientId,
        analysisType: 'care_gap',
        analysisId: analysisId || auditId,
        timestamp: new Date().toISOString(),
        modelName: 'deterministic',
        eventIds: gaps.flatMap(g => g.eventIds),
        patternIds: gaps.flatMap(g => g.metadata.relatedPatternIds || []),
        sourceRecordIds: gaps.flatMap(g => g.sourceRecordIds),
      };
      this.auditService.recordAudit(audit);
    }

    return gaps;
  }

  /**
   * 1. Detect recurring issues
   * A symptom, finding, or problem that repeatedly appears across different encounters
   */
  private detectRecurringIssues(patientId: string, events: MedicalEvent[], _patterns: Pattern[], _semanticAnalysis?: SemanticAnalysis): CareGap[] {
    const gaps: CareGap[] = [];
    
    // Group events by normalized title
    const groupedEvents = this.groupEventsByTitle(events);
    
    for (const [title, eventGroup] of groupedEvents.entries()) {
      // Filter for symptom/finding events
      const relevantEvents = eventGroup.filter(e => 
        e.eventType === 'symptom' || e.eventType === 'finding'
      );
      
      if (relevantEvents.length < 2) continue;
      
      // Check if events span multiple encounters
      const uniqueSourceRecords = new Set(relevantEvents.map(e => e.sourceRecordId));
      if (uniqueSourceRecords.size < 2) continue;
      
      // Calculate time span
      const sortedEvents = relevantEvents.filter(e => e.date).sort((a, b) => 
        new Date(a.date!).getTime() - new Date(b.date!).getTime()
      );
      
      if (sortedEvents.length < 2) continue;
      
      const firstDate = sortedEvents[0].date!;
      const lastDate = sortedEvents[sortedEvents.length - 1].date!;
      const timeSpanYears = calculateTimeSpanYears(firstDate, lastDate);
      
      // Only flag if spans at least 6 months
      if (timeSpanYears < 0.5) continue;
      
      const gapId = `care-gap-recurring-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
      
      const evidence: CareGapEvidence[] = relevantEvents.map(e => ({
        eventId: e.id,
        date: e.date,
        description: e.description || e.title,
        sourceRecordId: e.sourceRecordId,
        sourceDocumentName: e.sourceDocumentName,
        eventType: e.eventType,
      }));
      
      gaps.push({
        id: gapId,
        patientId,
        gapType: 'recurring_issue',
        title: `Recurring Issue: ${title}`,
        description: `${title} appears across ${relevantEvents.length} encounter${relevantEvents.length !== 1 ? 's' : ''} over ${Math.round(timeSpanYears * 10) / 10} year${timeSpanYears !== 1 ? 's' : ''}.`,
        status: 'potential',
        confidence: 'clearly_documented',
        firstObserved: firstDate,
        lastObserved: lastDate,
        occurrenceCount: relevantEvents.length,
        eventIds: relevantEvents.map(e => e.id),
        sourceRecordIds: Array.from(uniqueSourceRecords),
        evidence,
        missingInformation: [],
        reviewQuestions: [
          `Has ${title} been evaluated further?`,
          `Is there documentation of resolution?`,
        ],
        analysisId: `care-gap-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        metadata: {
          timeSpanYears,
          uniqueEncounters: uniqueSourceRecords.size,
          relatedPatternIds: _patterns
            .filter((p: Pattern) => p.eventIds.some((id: string) => relevantEvents.map(e => e.id).includes(id)))
            .map((p: Pattern) => p.id),
        },
      });
    }
    
    return gaps;
  }

  /**
   * 2. Detect persistent abnormal findings
   * Repeated laboratory or clinical findings that persist over time
   */
  private detectPersistentAbnormalFindings(patientId: string, events: MedicalEvent[], _patterns: Pattern[], _semanticAnalysis?: SemanticAnalysis): CareGap[] {
    const gaps: CareGap[] = [];
    
    // Group lab events by test name
    const labEvents = events.filter(e => e.eventType === 'laboratory');
    const groupedLabs = this.groupEventsByTitle(labEvents);
    
    for (const [testName, eventGroup] of groupedLabs.entries()) {
      if (eventGroup.length < 2) continue;
      
      // Check for abnormal flag in metadata or description
      const abnormalEvents = eventGroup.filter(e => {
        const desc = (e.description || '').toLowerCase();
        const isAbnormal = desc.includes('abnormal') || desc.includes('low') || desc.includes('high');
        return isAbnormal;
      });
      
      if (abnormalEvents.length < 2) continue;
      
      const sortedEvents = abnormalEvents.filter(e => e.date).sort((a, b) => 
        new Date(a.date!).getTime() - new Date(b.date!).getTime()
      );
      
      if (sortedEvents.length < 2) continue;
      
      const firstDate = sortedEvents[0].date!;
      const lastDate = sortedEvents[sortedEvents.length - 1].date!;
      const timeSpanYears = calculateTimeSpanYears(firstDate, lastDate);
      
      // Only flag if spans at least 3 months
      if (timeSpanYears < 0.25) continue;
      
      const gapId = `care-gap-persistent-${testName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
      
      const evidence: CareGapEvidence[] = abnormalEvents.map(e => ({
        eventId: e.id,
        date: e.date,
        description: e.description || e.title,
        sourceRecordId: e.sourceRecordId,
        sourceDocumentName: e.sourceDocumentName,
        eventType: e.eventType,
      }));
      
      gaps.push({
        id: gapId,
        patientId,
        gapType: 'persistent_abnormal_finding',
        title: `Persistent Finding: ${testName}`,
        description: `Repeated ${testName} measurements were documented across multiple years.`,
        status: 'potential',
        confidence: 'potential',
        firstObserved: firstDate,
        lastObserved: lastDate,
        occurrenceCount: abnormalEvents.length,
        eventIds: abnormalEvents.map(e => e.id),
        sourceRecordIds: Array.from(new Set(abnormalEvents.map(e => e.sourceRecordId))),
        evidence,
        missingInformation: [],
        reviewQuestions: [
          `Was the finding subsequently evaluated?`,
          `Is there documentation of resolution?`,
        ],
        analysisId: `care-gap-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        metadata: {
          timeSpanYears,
          uniqueEncounters: new Set(abnormalEvents.map(e => e.sourceRecordId)).size,
          relatedPatternIds: _patterns
            .filter((p: Pattern) => p.eventIds.some((id: string) => abnormalEvents.map(e => e.id).includes(id)))
            .map((p: Pattern) => p.id),
        },
      });
    }
    
    return gaps;
  }

  /**
   * 3. Detect potential follow-up gaps
   * Investigation or abnormal finding where no obvious follow-up is found
   */
  private detectPotentialFollowUpGaps(
    patientId: string,
    events: MedicalEvent[],
    _patterns: Pattern[],
    windows: ReturnType<typeof getTemporalWindows>,
    _semanticAnalysis?: SemanticAnalysis
  ): CareGap[] {
    const gaps: CareGap[] = [];
    
    // Look for abnormal lab results
    const abnormalLabs = events.filter(e => {
      if (e.eventType !== 'laboratory') return false;
      const desc = (e.description || '').toLowerCase();
      return desc.includes('abnormal') || desc.includes('low') || desc.includes('high');
    });
    
    for (const lab of abnormalLabs) {
      if (!lab.date) continue;
      
      const labDate = new Date(lab.date);
      const followUpWindow = labDate.getTime() + (windows.shortTermFollowUpDays * 24 * 60 * 60 * 1000);
      
      // Look for follow-up events within window
      const followUpEvents = events.filter(e => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        const isAfter = eventDate.getTime() > labDate.getTime();
        const isWithinWindow = eventDate.getTime() <= followUpWindow;
        
        // Check if related (same test type or consultation)
        const isRelated = 
          e.eventType === 'laboratory' && e.title === lab.title ||
          e.eventType === 'consultation';
        
        return isAfter && isWithinWindow && isRelated;
      });
      
      // If no follow-up found, flag as potential gap
      if (followUpEvents.length === 0) {
        const gapId = `care-gap-followup-${lab.id}`;
        
        gaps.push({
          id: gapId,
          patientId,
          gapType: 'potential_follow_up_gap',
          title: `Potential Follow-up Gap: ${lab.title}`,
          description: `BACKBONE did not identify a subsequent related result in the available records after ${lab.date}.`,
          status: 'potential',
          confidence: 'potential',
          firstObserved: lab.date,
          lastObserved: lab.date,
          occurrenceCount: 1,
          eventIds: [lab.id],
          sourceRecordIds: [lab.sourceRecordId],
          evidence: [{
            eventId: lab.id,
            date: lab.date,
            description: lab.description || lab.title,
            sourceRecordId: lab.sourceRecordId,
            sourceDocumentName: lab.sourceDocumentName,
            eventType: lab.eventType,
          }],
          missingInformation: ['Subsequent related result'],
          reviewQuestions: [
            'Was follow-up performed outside the records available to BACKBONE?',
            'Was the abnormal finding subsequently reassessed?',
          ],
          analysisId: `care-gap-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          metadata: {
            timeSpanYears: null,
            uniqueEncounters: 1,
            temporalWindow: getTemporalWindowLabel(windows.shortTermFollowUpDays),
          },
        });
      }
    }
    
    return gaps;
  }

  /**
   * 4. Detect repeated visits for same issue
   * Similar symptoms documented across multiple encounters
   */
  private detectRepeatedVisitsSameIssue(patientId: string, events: MedicalEvent[], _patterns: Pattern[], _semanticAnalysis?: SemanticAnalysis): CareGap[] {
    const gaps: CareGap[] = [];
    
    // Group consultation events by symptom keywords
    const consultations = events.filter(e => e.eventType === 'consultation');
    const groupedConsultations = this.groupEventsByTitle(consultations);
    
    for (const [title, eventGroup] of groupedConsultations.entries()) {
      if (eventGroup.length < 3) continue; // Need at least 3 visits
      
      const sortedEvents = eventGroup.filter(e => e.date).sort((a, b) => 
        new Date(a.date!).getTime() - new Date(b.date!).getTime()
      );
      
      if (sortedEvents.length < 3) continue;
      
      const firstDate = sortedEvents[0].date!;
      const lastDate = sortedEvents[sortedEvents.length - 1].date!;
      const timeSpanYears = calculateTimeSpanYears(firstDate, lastDate);
      
      const gapId = `care-gap-repeated-visits-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
      
      const evidence: CareGapEvidence[] = sortedEvents.map(e => ({
        eventId: e.id,
        date: e.date,
        description: e.description || e.title,
        sourceRecordId: e.sourceRecordId,
        sourceDocumentName: e.sourceDocumentName,
        eventType: e.eventType,
      }));
      
      gaps.push({
        id: gapId,
        patientId,
        gapType: 'repeated_visits_same_issue',
        title: `Repeated Clinical Attention: ${title}`,
        description: `Similar symptoms were documented across ${sortedEvents.length} encounter${sortedEvents.length !== 1 ? 's' : ''}.`,
        status: 'potential',
        confidence: 'clearly_documented',
        firstObserved: firstDate,
        lastObserved: lastDate,
        occurrenceCount: sortedEvents.length,
        eventIds: sortedEvents.map(e => e.id),
        sourceRecordIds: Array.from(new Set(sortedEvents.map(e => e.sourceRecordId))),
        evidence,
        missingInformation: [],
        reviewQuestions: [
          'Is there documentation of resolution?',
          'Was the issue evaluated further?',
        ],
        analysisId: `care-gap-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        metadata: {
          timeSpanYears,
          uniqueEncounters: new Set(sortedEvents.map(e => e.sourceRecordId)).size,
        },
      });
    }
    
    return gaps;
  }

  /**
   * 5. Detect treatment followed by continued issue
   * Treatment documented, then same symptom appears later
   */
  private detectTreatmentFollowedByContinuedIssue(patientId: string, events: MedicalEvent[], _semanticAnalysis?: SemanticAnalysis): CareGap[] {
    const gaps: CareGap[] = [];
    
    const medications = events.filter(e => e.eventType === 'medication');
    const symptoms = events.filter(e => e.eventType === 'symptom');
    
    for (const med of medications) {
      if (!med.date) continue;
      
      const medDate = new Date(med.date);
      
      // Look for same symptom appearing after medication
      for (const symptom of symptoms) {
        if (!symptom.date) continue;
        
        const symptomDate = new Date(symptom.date);
        
        // Check if symptom appears after medication (within 6 months)
        const isAfter = symptomDate.getTime() > medDate.getTime();
        const timeDiffDays = (symptomDate.getTime() - medDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (isAfter && timeDiffDays <= 180) {
          // Check if symptom title is related to medication (simple keyword match)
          const medTitle = med.title.toLowerCase();
          const symptomTitle = symptom.title.toLowerCase();
          
          // This is a simple heuristic - could be improved with more sophisticated matching
          const isRelated = medTitle.includes(symptomTitle) || symptomTitle.includes(medTitle.split(' ')[0]);
          
          if (isRelated) {
            const gapId = `care-gap-treatment-continued-${med.id}-${symptom.id}`;
            
            gaps.push({
              id: gapId,
              patientId,
              gapType: 'treatment_followed_by_continued_issue',
              title: `Continued Issue After Treatment: ${symptom.title}`,
              description: `${symptom.title} remained documented after treatment was recorded on ${med.date}.`,
              status: 'potential',
              confidence: 'potential',
              firstObserved: med.date,
              lastObserved: symptom.date,
              occurrenceCount: 2,
              eventIds: [med.id, symptom.id],
              sourceRecordIds: [med.sourceRecordId, symptom.sourceRecordId],
              evidence: [
                {
                  eventId: med.id,
                  date: med.date,
                  description: med.description || med.title,
                  sourceRecordId: med.sourceRecordId,
                  sourceDocumentName: med.sourceDocumentName,
                  eventType: med.eventType,
                },
                {
                  eventId: symptom.id,
                  date: symptom.date,
                  description: symptom.description || symptom.title,
                  sourceRecordId: symptom.sourceRecordId,
                  sourceDocumentName: symptom.sourceDocumentName,
                  eventType: symptom.eventType,
                },
              ],
              missingInformation: [],
              reviewQuestions: [
                'Was the treatment effective?',
                'Was the symptom re-evaluated?',
              ],
              analysisId: `care-gap-${Date.now()}`,
              generatedAt: new Date().toISOString(),
              metadata: {
                timeSpanYears: timeDiffDays / 365.25,
                uniqueEncounters: new Set([med.sourceRecordId, symptom.sourceRecordId]).size,
              },
            });
          }
        }
      }
    }
    
    return gaps;
  }

  /**
   * 6. Detect investigation without clear outcome
   * Imaging or procedure performed with no documented follow-up
   */
  private detectInvestigationWithoutClearOutcome(
    patientId: string,
    events: MedicalEvent[],
    windows: ReturnType<typeof getTemporalWindows>
  ): CareGap[] {
    const gaps: CareGap[] = [];
    
    // Look for procedures and imaging
    const investigations = events.filter(e => 
      e.eventType === 'procedure' || e.eventType === 'finding'
    );
    
    for (const investigation of investigations) {
      if (!investigation.date) continue;
      
      const invDate = new Date(investigation.date);
      const followUpWindow = invDate.getTime() + (windows.investigationFollowUpDays * 24 * 60 * 60 * 1000);
      
      // Look for follow-up events
      const followUpEvents = events.filter(e => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        const isAfter = eventDate.getTime() > invDate.getTime();
        const isWithinWindow = eventDate.getTime() <= followUpWindow;
        
        // Check if related (consultation, diagnosis, or related procedure)
        const isRelated = 
          e.eventType === 'consultation' ||
          e.eventType === 'diagnosis' ||
          (e.eventType === 'procedure' && e.title === investigation.title);
        
        return isAfter && isWithinWindow && isRelated;
      });
      
      if (followUpEvents.length === 0) {
        const gapId = `care-gap-investigation-${investigation.id}`;
        
        gaps.push({
          id: gapId,
          patientId,
          gapType: 'investigation_without_clear_outcome',
          title: `Potential Unresolved Investigation: ${investigation.title}`,
          description: `BACKBONE did not identify a subsequent related evaluation in the available records after ${investigation.date}.`,
          status: 'potential',
          confidence: 'potential',
          firstObserved: investigation.date,
          lastObserved: investigation.date,
          occurrenceCount: 1,
          eventIds: [investigation.id],
          sourceRecordIds: [investigation.sourceRecordId],
          evidence: [{
            eventId: investigation.id,
            date: investigation.date,
            description: investigation.description || investigation.title,
            sourceRecordId: investigation.sourceRecordId,
            sourceDocumentName: investigation.sourceDocumentName,
            eventType: investigation.eventType,
          }],
          missingInformation: ['Subsequent related evaluation'],
          reviewQuestions: [
            'Was the finding subsequently evaluated?',
            'Is there documentation of resolution?',
          ],
          analysisId: `care-gap-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          metadata: {
            timeSpanYears: null,
            uniqueEncounters: 1,
            temporalWindow: getTemporalWindowLabel(windows.investigationFollowUpDays),
          },
        });
      }
    }
    
    return gaps;
  }

  /**
   * 7. Detect diagnosis without supporting detail
   * Diagnosis appears repeatedly but with little supporting information
   */
  private detectDiagnosisWithoutSupportingDetail(patientId: string, events: MedicalEvent[], _patterns: Pattern[], _semanticAnalysis?: SemanticAnalysis): CareGap[] {
    const gaps: CareGap[] = [];
    
    // Group diagnoses by name
    const diagnoses = events.filter(e => e.eventType === 'diagnosis');
    const groupedDiagnoses = this.groupEventsByTitle(diagnoses);
    
    for (const [diagnosisName, eventGroup] of groupedDiagnoses.entries()) {
      if (eventGroup.length < 2) continue; // Need at least 2 occurrences
      
      // Check for supporting evidence (labs, procedures, symptoms)
      const diagnosisIds = eventGroup.map(e => e.id);
      const relatedPatterns = _patterns.filter(p => 
        p.eventIds.some(id => diagnosisIds.includes(id))
      );
      
      // If diagnosis appears multiple times but has limited supporting patterns
      if (relatedPatterns.length === 0) {
        const sortedEvents = eventGroup.filter(e => e.date).sort((a, b) => 
          new Date(a.date!).getTime() - new Date(b.date!).getTime()
        );
        
        if (sortedEvents.length < 2) continue;
        
        const gapId = `care-gap-diagnosis-detail-${diagnosisName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
        
        const evidence: CareGapEvidence[] = sortedEvents.map(e => ({
          eventId: e.id,
          date: e.date,
          description: e.description || e.title,
          sourceRecordId: e.sourceRecordId,
          sourceDocumentName: e.sourceDocumentName,
          eventType: e.eventType,
        }));
        
        gaps.push({
          id: gapId,
          patientId,
          gapType: 'diagnosis_without_supporting_detail',
          title: `Diagnosis with Limited Supporting Information: ${diagnosisName}`,
          description: `Documented diagnosis with limited supporting information in the available records.`,
          status: 'potential',
          confidence: 'potential',
          firstObserved: sortedEvents[0].date,
          lastObserved: sortedEvents[sortedEvents.length - 1].date,
          occurrenceCount: sortedEvents.length,
          eventIds: sortedEvents.map(e => e.id),
          sourceRecordIds: Array.from(new Set(sortedEvents.map(e => e.sourceRecordId))),
          evidence,
          missingInformation: ['Supporting investigation', 'Supporting findings'],
          reviewQuestions: [
            'Is there additional supporting documentation?',
            'Was the diagnosis confirmed through investigation?',
          ],
          analysisId: `care-gap-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          metadata: {
            timeSpanYears: calculateTimeSpanYears(sortedEvents[0].date!, sortedEvents[sortedEvents.length - 1].date!),
            uniqueEncounters: new Set(sortedEvents.map(e => e.sourceRecordId)).size,
          },
        });
      }
    }
    
    return gaps;
  }

  /**
   * 8. Detect fragmented care
   * Related information distributed across multiple sources
   */
  private detectFragmentedCare(patientId: string, events: MedicalEvent[], _patterns: Pattern[], _semanticAnalysis?: SemanticAnalysis): CareGap[] {
    const gaps: CareGap[] = [];
    
    // Group events by symptom/finding keywords
    const symptomEvents = events.filter(e => e.eventType === 'symptom' || e.eventType === 'finding');
    const groupedSymptoms = this.groupEventsByTitle(symptomEvents);
    
    for (const [title, eventGroup] of groupedSymptoms.entries()) {
      if (eventGroup.length < 2) continue;
      
      // Check if events span multiple source records
      const uniqueSourceRecords = new Set(eventGroup.map(e => e.sourceRecordId));
      
      if (uniqueSourceRecords.size >= 3) {
        const sortedEvents = eventGroup.filter(e => e.date).sort((a, b) => 
          new Date(a.date!).getTime() - new Date(b.date!).getTime()
        );
        
        if (sortedEvents.length < 2) continue;
        
        const gapId = `care-gap-fragmented-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
        
        const evidence: CareGapEvidence[] = sortedEvents.map(e => ({
          eventId: e.id,
          date: e.date,
          description: e.description || e.title,
          sourceRecordId: e.sourceRecordId,
          sourceDocumentName: e.sourceDocumentName,
          eventType: e.eventType,
        }));
        
        gaps.push({
          id: gapId,
          patientId,
          gapType: 'fragmented_care',
          title: `Fragmented Care: ${title}`,
          description: `Related information appears across ${uniqueSourceRecords.size} healthcare encounters and source records.`,
          status: 'potential',
          confidence: 'potential',
          firstObserved: sortedEvents[0].date,
          lastObserved: sortedEvents[sortedEvents.length - 1].date,
          occurrenceCount: sortedEvents.length,
          eventIds: sortedEvents.map(e => e.id),
          sourceRecordIds: Array.from(uniqueSourceRecords),
          evidence,
          missingInformation: [],
          reviewQuestions: [
            'Is there a complete record across all providers?',
            'Was information shared between providers?',
          ],
          analysisId: `care-gap-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          metadata: {
            timeSpanYears: calculateTimeSpanYears(sortedEvents[0].date!, sortedEvents[sortedEvents.length - 1].date!),
            uniqueEncounters: uniqueSourceRecords.size,
          },
        });
      }
    }
    
    return gaps;
  }

  /**
   * 9. Detect unresolved status
   * Source explicitly states follow-up required but no corresponding event found
   */
  private detectUnresolvedStatus(
    patientId: string,
    events: MedicalEvent[],
    windows: ReturnType<typeof getTemporalWindows>,
    _semanticAnalysis?: SemanticAnalysis
  ): CareGap[] {
    const gaps: CareGap[] = [];
    
    // Look for explicit follow-up requirements in descriptions
    const followUpKeywords = ['follow-up', 'follow up', 'recheck', 'review after', 'return in', 'repeat'];
    
    for (const event of events) {
      if (!event.description) continue;
      
      const desc = event.description.toLowerCase();
      const hasFollowUpRequirement = followUpKeywords.some(keyword => desc.includes(keyword));
      
      if (hasFollowUpRequirement && event.date) {
        const eventDate = new Date(event.date);
        const followUpWindow = eventDate.getTime() + (windows.shortTermFollowUpDays * 24 * 60 * 60 * 1000);
        
        // Look for corresponding follow-up event
        const followUpEvents = events.filter(e => {
          if (!e.date) return false;
          const eventDate2 = new Date(e.date);
          const isAfter = eventDate2.getTime() > eventDate.getTime();
          const isWithinWindow = eventDate2.getTime() <= followUpWindow;
          return isAfter && isWithinWindow;
        });
        
        if (followUpEvents.length === 0) {
          const gapId = `care-gap-unresolved-${event.id}`;
          
          gaps.push({
            id: gapId,
            patientId,
            gapType: 'unresolved_status',
            title: `Potential Unresolved Follow-up`,
            description: `Follow-up was recommended/documented, but a corresponding event was not identified in the available records after ${event.date}.`,
            status: 'documented',
            confidence: 'clearly_documented',
            firstObserved: event.date,
            lastObserved: event.date,
            occurrenceCount: 1,
            eventIds: [event.id],
            sourceRecordIds: [event.sourceRecordId],
            evidence: [{
              eventId: event.id,
              date: event.date,
              description: event.description,
              sourceRecordId: event.sourceRecordId,
              sourceDocumentName: event.sourceDocumentName,
              eventType: event.eventType,
            }],
            missingInformation: ['Corresponding follow-up event'],
            reviewQuestions: [
              'Was follow-up performed outside the records available to BACKBONE?',
              'Is there documentation of the recommended follow-up?',
            ],
            analysisId: `care-gap-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            metadata: {
              timeSpanYears: null,
              uniqueEncounters: 1,
              temporalWindow: getTemporalWindowLabel(windows.shortTermFollowUpDays),
              isExplicitFollowUp: true,
            },
          });
        }
      }
    }
    
    return gaps;
  }

  /**
   * Helper: Group events by normalized title
   */
  private groupEventsByTitle(events: MedicalEvent[]): Map<string, MedicalEvent[]> {
    const grouped = new Map<string, MedicalEvent[]>();
    
    for (const event of events) {
      const normalizedTitle = event.title.toLowerCase().trim();
      if (!grouped.has(normalizedTitle)) {
        grouped.set(normalizedTitle, []);
      }
      grouped.get(normalizedTitle)!.push(event);
    }
    
    return grouped;
  }

  /**
   * Dismiss a care gap
   */
  dismissCareGap(gapId: string, reason: string): void {
    // This would update the gap status in a persistent store
    // For now, this is a placeholder
    console.log(`Dismissing care gap ${gapId} with reason: ${reason}`);
  }

  /**
   * Get current analysis version
   */
  getCurrentAnalysisVersion(): number {
    return this.analysisVersion;
  }

  /**
   * Regenerate care gap analysis
   */
  regenerateAnalysis(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[]
  ): CareGap[] {
    this.analysisVersion++;
    return this.analyzeCareGaps(patientId, events, patterns);
  }

  /**
   * Analyze care gaps with Ollama for contextual explanation
   * This is optional - deterministic analysis is always performed first
   */
  async analyzeWithOllama(
    _patientId: string,
    _events: MedicalEvent[],
    _patterns: Pattern[],
    careGaps: CareGap[]
  ): Promise<CareGap[]> {
    if (careGaps.length === 0) {
      return careGaps;
    }

    try {
      const userPrompt = generateCareGapUserPrompt(careGaps, _events);
      
      const response = await this.ollamaService.generateJson<{
        careGaps: Array<{
          id: string;
          type: string;
          title: string;
          summary: string;
          longitudinalContext: string;
          missingInformation: string[];
          reviewQuestions: string[];
        }>;
      }>(userPrompt, CARE_GAP_SYSTEM_PROMPT);

      if (response && response.careGaps) {
        // Merge Ollama insights with existing care gaps
        const enhancedGaps = careGaps.map(gap => {
          const ollamaGap = response.careGaps.find(og => og.id === gap.id);
          if (ollamaGap) {
            return {
              ...gap,
              description: ollamaGap.summary || gap.description,
              missingInformation: [
                ...new Set([...gap.missingInformation, ...ollamaGap.missingInformation]),
              ],
              reviewQuestions: [
                ...new Set([...gap.reviewQuestions, ...ollamaGap.reviewQuestions]),
              ],
            };
          }
          return gap;
        });

        return enhancedGaps;
      }
    } catch (error) {
      console.error('Ollama care gap analysis failed:', error);
      // Return original gaps if Ollama fails
    }

    return careGaps;
  }
}
