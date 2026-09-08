import type { MedicalRecord, MedicalEvent, Pattern } from '../types';
import { MedicalEventService } from './medicalEventService';
import { LongitudinalService } from './longitudinalService';
import { PatternDetectionService } from './patternDetectionService';
import type { HealthJourneyMetrics } from './longitudinalService';

export interface TimelineData {
  events: MedicalEvent[];
  undatedEvents: MedicalEvent[];
  metrics: HealthJourneyMetrics;
  summary: string;
  patterns: Pattern[];
}

export type EventFilter = 'all' | 'symptoms' | 'diagnoses' | 'laboratory' | 'medications' | 'visits' | 'procedures';

export class TimelineService {
  private static instance: TimelineService;
  private medicalEventService: MedicalEventService;
  private longitudinalService: LongitudinalService;
  private patternDetectionService: PatternDetectionService;

  private constructor() {
    this.medicalEventService = MedicalEventService.getInstance();
    this.longitudinalService = LongitudinalService.getInstance();
    this.patternDetectionService = PatternDetectionService.getInstance();
  }

  static getInstance(): TimelineService {
    if (!TimelineService.instance) {
      TimelineService.instance = new TimelineService();
    }
    return TimelineService.instance;
  }

  /**
   * Get the complete timeline for a patient
   */
  getTimeline(records: MedicalRecord[]): TimelineData {
    console.log('[TimelineService] Creating timeline from', records.length, 'records');

    // Create events from all records
    const allEvents = records.flatMap(record =>
      this.medicalEventService.createEventsFromRecord(record)
    );

    console.log('[TimelineService] Created', allEvents.length, 'events from records');

    // Deduplicate events
    const deduplicatedEvents = this.medicalEventService.deduplicateEvents(allEvents);

    console.log('[TimelineService] After deduplication:', deduplicatedEvents.length, 'events');

    // Separate dated and undated events
    const { dated, undated } = this.medicalEventService.separateByDate(deduplicatedEvents);

    console.log('[TimelineService] Dated events:', dated.length, 'Undated events:', undated.length);

    // Sort dated events chronologically
    const sortedEvents = this.medicalEventService.sortEventsChronologically(dated);

    // Calculate metrics
    const metrics = this.longitudinalService.calculateMetrics(records, deduplicatedEvents);

    // Generate summary
    const summary = this.longitudinalService.generateSummary(records, deduplicatedEvents);

    // Detect patterns
    const patientId = records[0]?.patientId || '';
    const patterns = this.patternDetectionService.detectPatterns(deduplicatedEvents, patientId);

    console.log('[TimelineService] Patterns detected:', patterns.length);

    // Include both dated and undated events in the timeline
    // Undated events will be shown at the end
    const allSortedEvents = [...sortedEvents, ...undated];

    return {
      events: allSortedEvents,
      undatedEvents: undated,
      metrics,
      summary,
      patterns,
    };
  }

  /**
   * Filter events by type
   */
  filterEvents(events: MedicalEvent[], filter: EventFilter): MedicalEvent[] {
    if (filter === 'all') return events;

    const filterMap: Record<EventFilter, string[]> = {
      'all': [],
      'symptoms': ['symptom'],
      'diagnoses': ['diagnosis'],
      'laboratory': ['laboratory'],
      'medications': ['medication'],
      'visits': ['consultation', 'hospital_visit'],
      'procedures': ['procedure'],
    };

    const allowedTypes = filterMap[filter];
    return events.filter(event => allowedTypes.includes(event.eventType));
  }

  /**
   * Filter events by year range
   */
  filterEventsByYear(events: MedicalEvent[], startYear: number, endYear: number): MedicalEvent[] {
    return events.filter(event => {
      if (!event.date) return false;
      const year = new Date(event.date).getFullYear();
      return year >= startYear && year <= endYear;
    });
  }

  /**
   * Get events for a specific year
   */
  getEventsForYear(events: MedicalEvent[], year: number): MedicalEvent[] {
    return events.filter(event => {
      if (!event.date) return false;
      return new Date(event.date).getFullYear() === year;
    });
  }

  /**
   * Get all unique years from events
   */
  getUniqueYears(events: MedicalEvent[]): number[] {
    const years = events
      .filter(e => e.date !== null)
      .map(e => new Date(e.date!).getFullYear())
      .filter(y => !isNaN(y));
    
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }

  /**
   * Get events grouped by encounter
   */
  getEventsByEncounter(events: MedicalEvent[]): Map<string, MedicalEvent[]> {
    return this.medicalEventService.groupEventsByEncounter(events);
  }

  /**
   * Get event by ID
   */
  getEventById(events: MedicalEvent[], eventId: string): MedicalEvent | undefined {
    return events.find(e => e.id === eventId);
  }

  /**
   * Get related events for a given event
   */
  getRelatedEvents(events: MedicalEvent[], event: MedicalEvent): MedicalEvent[] {
    const relatedIds = event.metadata.relatedEventIds || [];
    return events.filter(e => relatedIds.includes(e.id));
  }
}
