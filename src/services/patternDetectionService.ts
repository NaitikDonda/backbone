import type { MedicalEvent, Pattern, PatternEvidence, PatternType, SemanticAnalysis } from '../types';

export class PatternDetectionService {
  private static instance: PatternDetectionService;
  
  // Minimum occurrences for pattern detection
  private readonly MIN_OCCURRENCES = 2;
  
  // Minimum years for multi-year recurrence
  private readonly MIN_YEAR_SPAN = 2;

  private constructor() {}

  static getInstance(): PatternDetectionService {
    if (!PatternDetectionService.instance) {
      PatternDetectionService.instance = new PatternDetectionService();
    }
    return PatternDetectionService.instance;
  }

  /**
   * Detect all patterns from medical events
   */
  detectPatterns(events: MedicalEvent[], patientId: string, semanticAnalysis?: SemanticAnalysis): Pattern[] {
    const patterns: Pattern[] = [];

    // Only process dated events for pattern detection
    const datedEvents = events.filter(e => e.date !== null);

    // 1. Recurring symptom detection
    patterns.push(...this.detectRecurringSymptoms(datedEvents, patientId, semanticAnalysis));

    // 2. Persistent finding detection
    patterns.push(...this.detectPersistentFindings(datedEvents, patientId, semanticAnalysis));

    // 3. Repeated lab abnormality detection
    patterns.push(...this.detectRepeatedLabAbnormalities(datedEvents, patientId, semanticAnalysis));

    // 4. Symptom co-occurrence detection
    patterns.push(...this.detectSymptomCoOccurrence(datedEvents, patientId));

    // 5. Cross-domain pattern detection
    patterns.push(...this.detectCrossDomainPatterns(datedEvents, patientId));

    // 6. Multi-year recurrence detection
    patterns.push(...this.detectMultiYearRecurrence(datedEvents, patientId, semanticAnalysis));

    // 7. Potential unresolved issue detection
    patterns.push(...this.detectPotentialUnresolvedIssues(datedEvents, patientId, semanticAnalysis));

    // 8. Repeated visits detection
    patterns.push(...this.detectRepeatedVisits(datedEvents, patientId, semanticAnalysis));

    // Deduplicate patterns
    return this.deduplicatePatterns(patterns);
  }

  /**
   * Detect recurring symptoms
   */
  private detectRecurringSymptoms(events: MedicalEvent[], patientId: string, _semanticAnalysis?: SemanticAnalysis): Pattern[] {
    const patterns: Pattern[] = [];
    const symptomEvents = events.filter(e => e.eventType === 'symptom');

    // Group by normalized symptom name
    const symptomGroups = this.groupByNormalizedTitle(symptomEvents);

    for (const [normalizedTitle, groupEvents] of symptomGroups) {
      if (groupEvents.length >= this.MIN_OCCURRENCES) {
        const sortedEvents = this.sortByDate(groupEvents);
        const firstDate = sortedEvents[0].date;
        const lastDate = sortedEvents[sortedEvents.length - 1].date;
        
        // Check if events span multiple dates (not same day)
        const uniqueDates = new Set(sortedEvents.map(e => e.date));
        if (uniqueDates.size < 2) continue;

        const pattern = this.createPattern(
          patientId,
          'recurring_symptom',
          `Recurring ${normalizedTitle}`,
          `${normalizedTitle} appears ${groupEvents.length} time${groupEvents.length > 1 ? 's' : ''} across multiple encounters.`,
          firstDate,
          lastDate,
          groupEvents.length,
          sortedEvents,
          {
            timeSpanYears: this.calculateYearSpan(firstDate, lastDate),
            uniqueEncounters: this.countUniqueEncounters(sortedEvents),
          }
        );

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect persistent findings (diagnoses that persist)
   */
  private detectPersistentFindings(events: MedicalEvent[], patientId: string, _semanticAnalysis?: SemanticAnalysis): Pattern[] {
    const patterns: Pattern[] = [];
    const diagnosisEvents = events.filter(e => e.eventType === 'diagnosis');

    // Group by normalized diagnosis name
    const diagnosisGroups = this.groupByNormalizedTitle(diagnosisEvents);

    for (const [normalizedTitle, groupEvents] of diagnosisGroups) {
      if (groupEvents.length >= this.MIN_OCCURRENCES) {
        const sortedEvents = this.sortByDate(groupEvents);
        const firstDate = sortedEvents[0].date;
        const lastDate = sortedEvents[sortedEvents.length - 1].date;
        
        const yearSpan = this.calculateYearSpan(firstDate, lastDate);
        if (yearSpan === null || yearSpan < 1) continue;

        const pattern = this.createPattern(
          patientId,
          'persistent_finding',
          `Persistent ${normalizedTitle}`,
          `${normalizedTitle} documented across ${yearSpan}+ year${yearSpan > 1 ? 's' : ''}.`,
          firstDate,
          lastDate,
          groupEvents.length,
          sortedEvents,
          {
            timeSpanYears: yearSpan,
            uniqueEncounters: this.countUniqueEncounters(sortedEvents),
          }
        );

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect repeated lab abnormalities
   */
  private detectRepeatedLabAbnormalities(events: MedicalEvent[], patientId: string, _semanticAnalysis?: SemanticAnalysis): Pattern[] {
    const patterns: Pattern[] = [];
    const labEvents = events.filter(e => 
      e.eventType === 'laboratory' && 
      e.status === 'abnormal'
    );

    // Group by normalized lab test name
    const labGroups = this.groupByNormalizedTitle(labEvents);

    for (const [normalizedTitle, groupEvents] of labGroups) {
      if (groupEvents.length >= this.MIN_OCCURRENCES) {
        const sortedEvents = this.sortByDate(groupEvents);
        const firstDate = sortedEvents[0].date;
        const lastDate = sortedEvents[sortedEvents.length - 1].date;

        const pattern = this.createPattern(
          patientId,
          'repeated_lab_abnormality',
          `Repeated abnormal ${normalizedTitle}`,
          `${normalizedTitle} result${groupEvents.length > 1 ? 's' : ''} outside normal range documented ${groupEvents.length} time${groupEvents.length > 1 ? 's' : ''}.`,
          firstDate,
          lastDate,
          groupEvents.length,
          sortedEvents,
          {
            timeSpanYears: this.calculateYearSpan(firstDate, lastDate),
            uniqueEncounters: this.countUniqueEncounters(sortedEvents),
          }
        );

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect symptom co-occurrence
   */
  private detectSymptomCoOccurrence(events: MedicalEvent[], patientId: string): Pattern[] {
    const patterns: Pattern[] = [];
    const symptomEvents = events.filter(e => e.eventType === 'symptom');

    // Group events by encounter
    const encounterGroups = this.groupByEncounter(symptomEvents);

    // Find symptom pairs that co-occur in multiple encounters
    const coOccurrences = new Map<string, MedicalEvent[][]>();

    for (const [, groupEvents] of encounterGroups) {
      if (groupEvents.length < 2) continue;

      // Check all pairs in this encounter
      for (let i = 0; i < groupEvents.length; i++) {
        for (let j = i + 1; j < groupEvents.length; j++) {
          const event1 = groupEvents[i];
          const event2 = groupEvents[j];
          
          // Create a normalized key for the pair
          const key = this.createPairKey(event1.title, event2.title);
          
          if (!coOccurrences.has(key)) {
            coOccurrences.set(key, []);
          }
          coOccurrences.get(key)!.push([event1, event2]);
        }
      }
    }

    // Create patterns for pairs that co-occur multiple times
    for (const [key, pairs] of coOccurrences) {
      if (pairs.length >= this.MIN_OCCURRENCES) {
        const [title1, title2] = key.split('|');
        const allEvents = pairs.flat();
        const sortedEvents = this.sortByDate(allEvents);
        const firstDate = sortedEvents[0].date;
        const lastDate = sortedEvents[sortedEvents.length - 1].date;

        const pattern = this.createPattern(
          patientId,
          'symptom_co_occurrence',
          `Co-occurring: ${title1} + ${title2}`,
          `${title1} and ${title2} repeatedly appear together across ${pairs.length} encounter${pairs.length > 1 ? 's' : ''}.`,
          firstDate,
          lastDate,
          allEvents.length,
          sortedEvents,
          {
            timeSpanYears: this.calculateYearSpan(firstDate, lastDate),
            uniqueEncounters: pairs.length,
          }
        );

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect cross-domain patterns (e.g., symptom + lab finding)
   */
  private detectCrossDomainPatterns(events: MedicalEvent[], patientId: string): Pattern[] {
    const patterns: Pattern[] = [];
    
    // Group events by encounter
    const encounterGroups = this.groupByEncounter(events);

    // Track cross-domain relationships
    const relationships = new Map<string, MedicalEvent[][]>();

    for (const [, groupEvents] of encounterGroups) {
      const symptomEvents = groupEvents.filter((e: MedicalEvent) => e.eventType === 'symptom');
      const labEvents = groupEvents.filter((e: MedicalEvent) => e.eventType === 'laboratory');

      // Check symptom-lab relationships
      for (const symptom of symptomEvents) {
        for (const lab of labEvents) {
          const key = this.createPairKey(symptom.title, lab.title);
          
          if (!relationships.has(key)) {
            relationships.set(key, []);
          }
          relationships.get(key)!.push([symptom, lab]);
        }
      }
    }

    // Create patterns for repeated cross-domain relationships
    for (const [key, pairs] of relationships) {
      if (pairs.length >= this.MIN_OCCURRENCES) {
        const [title1, title2] = key.split('|');
        const allEvents = pairs.flat();
        const sortedEvents = this.sortByDate(allEvents);
        const firstDate = sortedEvents[0].date;
        const lastDate = sortedEvents[sortedEvents.length - 1].date;

        const pattern = this.createPattern(
          patientId,
          'cross_domain_pattern',
          `Cross-domain: ${title1} ↔ ${title2}`,
          `${title1} repeatedly appears during periods where ${title2} was documented.`,
          firstDate,
          lastDate,
          allEvents.length,
          sortedEvents,
          {
            timeSpanYears: this.calculateYearSpan(firstDate, lastDate),
            uniqueEncounters: pairs.length,
          }
        );

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect multi-year recurrence
   */
  private detectMultiYearRecurrence(events: MedicalEvent[], patientId: string, _semanticAnalysis?: SemanticAnalysis): Pattern[] {
    const patterns: Pattern[] = [];

    // Group all events by normalized title
    const allGroups = this.groupByNormalizedTitle(events);

    for (const [normalizedTitle, groupEvents] of allGroups) {
      if (groupEvents.length >= this.MIN_OCCURRENCES) {
        const sortedEvents = this.sortByDate(groupEvents);
        const firstDate = sortedEvents[0].date;
        const lastDate = sortedEvents[sortedEvents.length - 1].date;
        
        const yearSpan = this.calculateYearSpan(firstDate, lastDate);
        if (yearSpan === null || yearSpan < this.MIN_YEAR_SPAN) continue;

        // Count unique years
        const uniqueYears = new Set(
          sortedEvents.map(e => new Date(e.date!).getFullYear())
        );

        if (uniqueYears.size >= this.MIN_YEAR_SPAN) {
          const pattern = this.createPattern(
            patientId,
            'multi_year_recurrence',
            `Multi-year recurrence: ${normalizedTitle}`,
            `${normalizedTitle} appears across ${uniqueYears.size} different year${uniqueYears.size > 1 ? 's' : ''}.`,
            firstDate,
            lastDate,
            groupEvents.length,
            sortedEvents,
            {
              timeSpanYears: yearSpan,
              uniqueEncounters: this.countUniqueEncounters(sortedEvents),
            }
          );

          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Detect potential unresolved issues
   */
  private detectPotentialUnresolvedIssues(events: MedicalEvent[], patientId: string, _semanticAnalysis?: SemanticAnalysis): Pattern[] {
    const patterns: Pattern[] = [];
    
    // Focus on symptoms and diagnoses
    const relevantEvents = events.filter(e => 
      e.eventType === 'symptom' || e.eventType === 'diagnosis'
    );

    // Group by normalized title
    const groups = this.groupByNormalizedTitle(relevantEvents);

    for (const [normalizedTitle, groupEvents] of groups) {
      if (groupEvents.length < 3) continue; // Need at least 3 occurrences

      const sortedEvents = this.sortByDate(groupEvents);
      const firstDate = sortedEvents[0].date;
      const lastDate = sortedEvents[sortedEvents.length - 1].date;
      
      const yearSpan = this.calculateYearSpan(firstDate, lastDate);
      if (yearSpan === null || yearSpan < 1) continue;

      // Check if any event has a resolved status
      const hasResolution = groupEvents.some(e => 
        e.status?.toLowerCase().includes('resolved') ||
        e.status?.toLowerCase().includes('resolved')
      );

      if (!hasResolution) {
        const pattern = this.createPattern(
          patientId,
          'potential_unresolved_issue',
          `Potential unresolved: ${normalizedTitle}`,
          `${normalizedTitle} documented ${groupEvents.length} times over ${yearSpan}+ year${yearSpan > 1 ? 's' : ''} without documented resolution.`,
          firstDate,
          lastDate,
          groupEvents.length,
          sortedEvents,
          {
            timeSpanYears: yearSpan,
            uniqueEncounters: this.countUniqueEncounters(sortedEvents),
          }
        );

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect repeated visits for similar issues
   */
  private detectRepeatedVisits(events: MedicalEvent[], patientId: string, _semanticAnalysis?: SemanticAnalysis): Pattern[] {
    const patterns: Pattern[] = [];
    
    // Focus on consultation and hospital visit events
    const visitEvents = events.filter(e => 
      e.eventType === 'consultation' || e.eventType === 'hospital_visit'
    );

    // Group by encounter
    const encounterGroups = this.groupByEncounter(visitEvents);

    // For each encounter, get the symptoms/diagnoses
    const encounterComplaints = new Map<string, Set<string>>();

    for (const [encounterId] of encounterGroups) {
      const complaints = new Set<string>();
      
      // Get all symptoms and diagnoses from this encounter's events
      const encounterAllEvents = events.filter(e => 
        e.metadata.encounterId === encounterId
      );
      
      for (const event of encounterAllEvents) {
        if (event.eventType === 'symptom' || event.eventType === 'diagnosis') {
          complaints.add(this.normalizeTitle(event.title));
        }
      }

      if (complaints.size > 0) {
        encounterComplaints.set(encounterId, complaints);
      }
    }

    // Find complaints that appear in multiple encounters
    const complaintOccurrences = new Map<string, string[]>();

    for (const [encounterId, complaints] of encounterComplaints) {
      for (const complaint of complaints) {
        if (!complaintOccurrences.has(complaint)) {
          complaintOccurrences.set(complaint, []);
        }
        complaintOccurrences.get(complaint)!.push(encounterId);
      }
    }

    // Create patterns for complaints appearing in multiple encounters
    for (const [complaint, encounterIds] of complaintOccurrences) {
      if (encounterIds.length >= this.MIN_OCCURRENCES) {
        const relevantEvents = events.filter(e => 
          encounterIds.includes(e.metadata.encounterId || '') &&
          this.normalizeTitle(e.title) === complaint
        );
        
        const sortedEvents = this.sortByDate(relevantEvents);
        const firstDate = sortedEvents[0].date;
        const lastDate = sortedEvents[sortedEvents.length - 1].date;

        const pattern = this.createPattern(
          patientId,
          'repeated_visits',
          `Repeated clinical attention: ${complaint}`,
          `Similar complaint documented across ${encounterIds.length} encounter${encounterIds.length > 1 ? 's' : ''}.`,
          firstDate,
          lastDate,
          relevantEvents.length,
          sortedEvents,
          {
            timeSpanYears: this.calculateYearSpan(firstDate, lastDate),
            uniqueEncounters: encounterIds.length,
          }
        );

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Create a pattern from events
   */
  private createPattern(
    patientId: string,
    patternType: PatternType,
    title: string,
    description: string,
    firstDate: string | null,
    lastDate: string | null,
    occurrenceCount: number,
    events: MedicalEvent[],
    metadata: {
      timeSpanYears: number | null;
      uniqueEncounters: number;
      relatedPatterns?: string[];
    }
  ): Pattern {
    const eventIds = events.map(e => e.id);
    const sourceRecordIds = Array.from(new Set(events.map(e => e.sourceRecordId)));
    
    const evidence: PatternEvidence[] = events.map(e => ({
      eventId: e.id,
      date: e.date,
      description: e.description || e.title,
      sourceRecordId: e.sourceRecordId,
      sourceDocumentName: e.sourceDocumentName,
    }));

    return {
      id: `pattern-${patternType}-${this.normalizeTitle(title)}-${Date.now()}`,
      patientId,
      patternType,
      title,
      description,
      firstObserved: firstDate,
      lastObserved: lastDate,
      occurrenceCount,
      eventIds,
      sourceRecordIds,
      evidence,
      confidence: null,
      severity: null,
      metadata,
    };
  }

  /**
   * Deduplicate patterns
   */
  private deduplicatePatterns(patterns: Pattern[]): Pattern[] {
    const patternMap = new Map<string, Pattern>();

    for (const pattern of patterns) {
      const key = this.getPatternKey(pattern);
      
      // Keep the pattern with more occurrences
      const existing = patternMap.get(key);
      if (!existing || pattern.occurrenceCount > existing.occurrenceCount) {
        patternMap.set(key, pattern);
      }
    }

    return Array.from(patternMap.values());
  }

  /**
   * Get a unique key for pattern deduplication
   */
  private getPatternKey(pattern: Pattern): string {
    return `${pattern.patientId}|${pattern.patternType}|${this.normalizeTitle(pattern.title)}`;
  }

  /**
   * Group events by normalized title
   */
  private groupByNormalizedTitle(events: MedicalEvent[]): Map<string, MedicalEvent[]> {
    const groups = new Map<string, MedicalEvent[]>();
    
    for (const event of events) {
      const normalized = this.normalizeTitle(event.title);
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized)!.push(event);
    }

    return groups;
  }

  /**
   * Group events by encounter
   */
  private groupByEncounter(events: MedicalEvent[]): Map<string, MedicalEvent[]> {
    const groups = new Map<string, MedicalEvent[]>();
    
    for (const event of events) {
      const encounterId = event.metadata.encounterId || 'unknown';
      if (!groups.has(encounterId)) {
        groups.set(encounterId, []);
      }
      groups.get(encounterId)!.push(event);
    }

    return groups;
  }

  /**
   * Normalize a title for grouping
   */
  private normalizeTitle(title: string): string {
    return title.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Create a normalized key for a pair
   */
  private createPairKey(title1: string, title2: string): string {
    const normalized1 = this.normalizeTitle(title1);
    const normalized2 = this.normalizeTitle(title2);
    // Sort alphabetically to ensure consistent keys
    return [normalized1, normalized2].sort().join('|');
  }

  /**
   * Sort events by date
   */
  private sortByDate(events: MedicalEvent[]): MedicalEvent[] {
    return events.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  /**
   * Calculate year span between two dates
   */
  private calculateYearSpan(startDate: string | null, endDate: string | null): number | null {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
    
    return Math.round(diffYears);
  }

  /**
   * Count unique encounters in events
   */
  private countUniqueEncounters(events: MedicalEvent[]): number {
    const encounters = new Set(
      events.map(e => e.metadata.encounterId).filter(Boolean)
    );
    return encounters.size;
  }
}
