import type { MedicalEvent, Pattern } from '../types';

export interface AnalysisContext {
  patientId: string;
  summary: string;
  timelineEvents: TimelineEventContext[];
  patterns: PatternContext[];
  timeSpan: {
    firstDate: string | null;
    lastDate: string | null;
    years: number | null;
  };
  eventCounts: {
    total: number;
    symptoms: number;
    diagnoses: number;
    laboratory: number;
    medications: number;
    visits: number;
  };
}

export interface TimelineEventContext {
  id: string;
  date: string | null;
  eventType: string;
  title: string;
  description: string | null;
  sourceDocumentName: string;
}

export interface PatternContext {
  id: string;
  patternType: string;
  title: string;
  description: string;
  occurrenceCount: number;
  firstObserved: string | null;
  lastObserved: string | null;
  timeSpanYears: number | null;
  uniqueEncounters: number;
  evidenceCount: number;
}

export class ContextBuilderService {
  private static instance: ContextBuilderService;

  // Maximum number of events to include in context
  private readonly MAX_EVENTS = 30;
  
  // Maximum number of patterns to include in context
  private readonly MAX_PATTERNS = 10;

  private constructor() {}

  static getInstance(): ContextBuilderService {
    if (!ContextBuilderService.instance) {
      ContextBuilderService.instance = new ContextBuilderService();
    }
    return ContextBuilderService.instance;
  }

  /**
   * Build analysis context from timeline data
   */
  buildAnalysisContext(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    summary: string
  ): AnalysisContext {
    // Prioritize events for context
    const prioritizedEvents = this.prioritizeEvents(events).slice(0, this.MAX_EVENTS);
    
    // Prioritize patterns for context
    const prioritizedPatterns = this.prioritizePatterns(patterns).slice(0, this.MAX_PATTERNS);

    // Calculate time span
    const datedEvents = events.filter(e => e.date !== null && e.date !== '');
    const validDates: Date[] = [];
    
    for (const event of datedEvents) {
      try {
        const date = new Date(event.date!);
        if (!isNaN(date.getTime())) {
          validDates.push(date);
        }
      } catch (error) {
        // Skip invalid dates
        console.warn(`Invalid date in event ${event.id}: ${event.date}`);
      }
    }
    
    validDates.sort((a, b) => a.getTime() - b.getTime());
    const firstDate = validDates.length > 0 ? validDates[0].toISOString().split('T')[0] : null;
    const lastDate = validDates.length > 0 ? validDates[validDates.length - 1].toISOString().split('T')[0] : null;
    
    let years: number | null = null;
    if (firstDate && lastDate && validDates.length >= 2) {
      const diffTime = validDates[validDates.length - 1].getTime() - validDates[0].getTime();
      years = Math.round(diffTime / (1000 * 60 * 60 * 24 * 365));
    }

    // Count events by type
    const eventCounts = {
      total: events.length,
      symptoms: events.filter(e => e.eventType === 'symptom').length,
      diagnoses: events.filter(e => e.eventType === 'diagnosis').length,
      laboratory: events.filter(e => e.eventType === 'laboratory').length,
      medications: events.filter(e => e.eventType === 'medication').length,
      visits: events.filter(e => e.eventType === 'consultation' || e.eventType === 'hospital_visit').length,
    };

    return {
      patientId,
      summary,
      timelineEvents: prioritizedEvents.map(e => ({
        id: e.id,
        date: e.date,
        eventType: e.eventType,
        title: e.title,
        description: e.description,
        sourceDocumentName: e.sourceDocumentName,
      })),
      patterns: prioritizedPatterns.map(p => ({
        id: p.id,
        patternType: p.patternType,
        title: p.title,
        description: p.description,
        occurrenceCount: p.occurrenceCount,
        firstObserved: p.firstObserved,
        lastObserved: p.lastObserved,
        timeSpanYears: p.metadata.timeSpanYears,
        uniqueEncounters: p.metadata.uniqueEncounters,
        evidenceCount: p.evidence.length,
      })),
      timeSpan: {
        firstDate,
        lastDate,
        years,
      },
      eventCounts,
    };
  }

  /**
   * Convert context to prompt text for Ollama
   */
  contextToPrompt(context: AnalysisContext): string {
    let prompt = '';

    // Patient summary
    prompt += `PATIENT SUMMARY\n${context.summary}\n\n`;

    // Time span
    if (context.timeSpan.firstDate && context.timeSpan.lastDate) {
      prompt += `TIME SPAN\n`;
      prompt += `First record: ${context.timeSpan.firstDate}\n`;
      prompt += `Last record: ${context.timeSpan.lastDate}\n`;
      if (context.timeSpan.years) {
        prompt += `Duration: ${context.timeSpan.years} year${context.timeSpan.years !== 1 ? 's' : ''}\n`;
      }
      prompt += '\n';
    }

    // Event counts
    prompt += `EVENT COUNTS\n`;
    prompt += `Total events: ${context.eventCounts.total}\n`;
    prompt += `Symptoms: ${context.eventCounts.symptoms}\n`;
    prompt += `Diagnoses: ${context.eventCounts.diagnoses}\n`;
    prompt += `Laboratory: ${context.eventCounts.laboratory}\n`;
    prompt += `Medications: ${context.eventCounts.medications}\n`;
    prompt += `Visits: ${context.eventCounts.visits}\n\n`;

    // Timeline events
    prompt += `TIMELINE EVENTS (${context.timelineEvents.length} shown)\n`;
    for (const event of context.timelineEvents) {
      prompt += `- Event ID: ${event.id}\n`;
      prompt += `  Date: ${event.date || 'Undated'}\n`;
      prompt += `  Type: ${event.eventType}\n`;
      prompt += `  Title: ${event.title}\n`;
      if (event.description) {
        prompt += `  Description: ${event.description}\n`;
      }
      prompt += `  Source: ${event.sourceDocumentName}\n`;
    }
    prompt += '\n';

    // Patterns
    if (context.patterns.length > 0) {
      prompt += `DETECTED PATTERNS (${context.patterns.length} shown)\n`;
      for (const pattern of context.patterns) {
        prompt += `- ${pattern.patternType}: ${pattern.title}\n`;
        prompt += `  ${pattern.description}\n`;
        prompt += `  Occurrences: ${pattern.occurrenceCount} | Encounters: ${pattern.uniqueEncounters}\n`;
        if (pattern.timeSpanYears) {
          prompt += `  Time span: ${pattern.timeSpanYears}+ years\n`;
        }
      }
      prompt += '\n';
    }

    return prompt;
  }

  /**
   * Prioritize events for context inclusion
   */
  private prioritizeEvents(events: MedicalEvent[]): MedicalEvent[] {
    // Sort by date (most recent first)
    const sorted = [...events].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Boost priority for certain event types
    const priorityMap: Record<string, number> = {
      'symptom': 3,
      'diagnosis': 3,
      'laboratory': 2,
      'medication': 2,
      'consultation': 1,
      'hospital_visit': 1,
      'procedure': 1,
      'finding': 1,
      'other': 0,
    };

    return sorted.sort((a, b) => {
      const priorityA = priorityMap[a.eventType] || 0;
      const priorityB = priorityMap[b.eventType] || 0;
      return priorityB - priorityA;
    });
  }

  /**
   * Prioritize patterns for context inclusion
   */
  private prioritizePatterns(patterns: Pattern[]): Pattern[] {
    // Sort by occurrence count and time span
    return [...patterns].sort((a, b) => {
      // Higher occurrence count first
      if (b.occurrenceCount !== a.occurrenceCount) {
        return b.occurrenceCount - a.occurrenceCount;
      }
      // Longer time span first
      const spanA = a.metadata.timeSpanYears || 0;
      const spanB = b.metadata.timeSpanYears || 0;
      return spanB - spanA;
    });
  }
}
