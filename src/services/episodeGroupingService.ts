/**
 * Episode Grouping Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Groups related medical events into meaningful health episodes based on:
 * - Temporal proximity
 * - Semantic relationships
 * - Event types
 * - Source records
 * - Existing patterns
 */

import type {
  MedicalEvent,
  Pattern,
  HealthEpisode,
  EpisodeType,
  EpisodeStatus,
  TemporalWindowConfig,
  LongitudinalTheme
} from '../types';

/**
 * Default temporal window configuration
 */
const DEFAULT_TEMPORAL_CONFIG: TemporalWindowConfig = {
  defaultGapDays: 90,
  symptomGapDays: 120,
  investigationGapDays: 60,
  treatmentGapDays: 180,
  hospitalizationGapDays: 30,
  maxEpisodeDurationDays: 365,
  minEpisodeEvents: 1,
};

export class EpisodeGroupingService {
  private static instance: EpisodeGroupingService;
  private temporalConfig: TemporalWindowConfig;

  private constructor() {
    this.temporalConfig = { ...DEFAULT_TEMPORAL_CONFIG };
  }

  static getInstance(): EpisodeGroupingService {
    if (!EpisodeGroupingService.instance) {
      EpisodeGroupingService.instance = new EpisodeGroupingService();
    }
    return EpisodeGroupingService.instance;
  }

  /**
   * Set temporal window configuration
   */
  setTemporalConfig(config: Partial<TemporalWindowConfig>): void {
    this.temporalConfig = { ...this.temporalConfig, ...config };
  }

  /**
   * Get temporal window configuration
   */
  getTemporalConfig(): TemporalWindowConfig {
    return { ...this.temporalConfig };
  }

  /**
   * Group events into episodes
   */
  groupEventsIntoEpisodes(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    semanticAnalysis?: any
  ): HealthEpisode[] {
    if (events.length === 0) {
      return [];
    }

    // Sort events by date
    const sortedEvents = events
      .filter(e => e.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    if (sortedEvents.length === 0) {
      // Handle undated events - each undated event becomes its own episode
      return events.map(event => this.createSingleEventEpisode(patientId, event));
    }

    const episodes: HealthEpisode[] = [];
    const usedEventIds = new Set<string>();

    // Group events by temporal proximity and semantic similarity
    let currentEpisodeEvents: MedicalEvent[] = [sortedEvents[0]];
    let currentEpisodeStartDate = sortedEvents[0].date!;

    for (let i = 1; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const prevEvent = sortedEvents[i - 1];
      const gapDays = this.calculateGapDays(prevEvent.date!, event.date!);

      // Determine if this event should start a new episode
      const shouldStartNewEpisode = this.shouldStartNewEpisode(
        currentEpisodeEvents,
        event,
        gapDays,
        semanticAnalysis
      );

      if (shouldStartNewEpisode && currentEpisodeEvents.length >= this.temporalConfig.minEpisodeEvents) {
        // Create episode from current events
        const episode = this.createEpisodeFromEvents(
          patientId,
          currentEpisodeEvents,
          patterns,
          currentEpisodeStartDate,
          prevEvent.date!
        );
        episodes.push(episode);
        currentEpisodeEvents.forEach(e => usedEventIds.add(e.id));

        // Start new episode
        currentEpisodeEvents = [event];
        currentEpisodeStartDate = event.date!;
      } else {
        // Add to current episode
        currentEpisodeEvents.push(event);
      }
    }

    // Create final episode
    if (currentEpisodeEvents.length >= this.temporalConfig.minEpisodeEvents) {
      const episode = this.createEpisodeFromEvents(
        patientId,
        currentEpisodeEvents,
        patterns,
        currentEpisodeStartDate,
        currentEpisodeEvents[currentEpisodeEvents.length - 1].date!
      );
      episodes.push(episode);
      currentEpisodeEvents.forEach(e => usedEventIds.add(e.id));
    }

    // Handle undated events
    const undatedEvents = events.filter(e => !e.date);
    undatedEvents.forEach(event => {
      if (!usedEventIds.has(event.id)) {
        const episode = this.createSingleEventEpisode(patientId, event);
        episodes.push(episode);
        usedEventIds.add(event.id);
      }
    });

    return episodes;
  }

  /**
   * Calculate gap in days between two dates
   */
  private calculateGapDays(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine if an event should start a new episode
   */
  private shouldStartNewEpisode(
    currentEvents: MedicalEvent[],
    newEvent: MedicalEvent,
    gapDays: number,
    semanticAnalysis?: any
  ): boolean {
    // Check temporal gap
    const eventType = newEvent.eventType;
    let maxGap = this.temporalConfig.defaultGapDays;

    switch (eventType) {
      case 'symptom':
        maxGap = this.temporalConfig.symptomGapDays;
        break;
      case 'laboratory':
      case 'procedure':
        maxGap = this.temporalConfig.investigationGapDays;
        break;
      case 'medication':
        maxGap = this.temporalConfig.treatmentGapDays;
        break;
      case 'hospital_visit':
        maxGap = this.temporalConfig.hospitalizationGapDays;
        break;
    }

    if (gapDays > maxGap) {
      return true;
    }

    // Check for explicit resolution in current events
    const hasResolution = this.hasExplicitResolution(currentEvents);
    if (hasResolution) {
      return true;
    }

    // Check semantic similarity if available
    if (semanticAnalysis) {
      const isSemanticallyRelated = this.checkSemanticRelation(
        currentEvents,
        newEvent,
        semanticAnalysis
      );
      if (!isSemanticallyRelated && gapDays > 30) {
        return true;
      }
    }

    // Check for different canonical concepts
    const currentConcepts = this.getCanonicalConcepts(currentEvents);
    const newConcept = this.getCanonicalConcept(newEvent);
    if (currentConcepts.size > 0 && !currentConcepts.has(newConcept) && gapDays > 60) {
      return true;
    }

    // Check episode duration
    const episodeDuration = this.calculateEpisodeDuration(currentEvents);
    if (episodeDuration > this.temporalConfig.maxEpisodeDurationDays) {
      return true;
    }

    return false;
  }

  /**
   * Check if events contain explicit resolution
   */
  private hasExplicitResolution(events: MedicalEvent[]): boolean {
    const resolutionPatterns = ['resolved', 'resolved', 'improved', 'cleared', 'no longer'];
    const text = events
      .map(e => (e.sourceText || e.description || '').toLowerCase())
      .join(' ');

    return resolutionPatterns.some(pattern => text.includes(pattern));
  }

  /**
   * Check semantic relation between events
   */
  private checkSemanticRelation(
    _events: MedicalEvent[],
    _newEvent: MedicalEvent,
    _semanticAnalysis: any
  ): boolean {
    // Placeholder for semantic analysis integration
    // This would use the semantic analysis from Phase 12
    return true;
  }

  /**
   * Get canonical concepts from events
   */
  private getCanonicalConcepts(events: MedicalEvent[]): Set<string> {
    const concepts = new Set<string>();
    events.forEach(event => {
      const concept = this.getCanonicalConcept(event);
      if (concept) {
        concepts.add(concept);
      }
    });
    return concepts;
  }

  /**
   * Get canonical concept from event
   */
  private getCanonicalConcept(event: MedicalEvent): string {
    // Simple heuristic: use normalized title
    return event.title.toLowerCase().trim();
  }

  /**
   * Calculate episode duration in days
   */
  private calculateEpisodeDuration(events: MedicalEvent[]): number {
    const datedEvents = events.filter(e => e.date);
    if (datedEvents.length < 2) {
      return 0;
    }

    const dates = datedEvents.map(e => new Date(e.date!)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    return (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
  }

  /**
   * Create episode from events
   */
  private createEpisodeFromEvents(
    patientId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    startDate: string,
    endDate: string
  ): HealthEpisode {
    const eventType = this.determineEpisodeType(events);
    const status = this.determineEpisodeStatus(events);
    const title = this.generateEpisodeTitle(events, eventType);
    const description = this.generateEpisodeDescription(events);
    const summary = this.generateEpisodeSummary(events);

    const eventIds = events.map(e => e.id);
    const patternIds = patterns
      .filter(p => p.evidence.some(e => eventIds.includes(e.eventId)))
      .map(p => p.id);
    const sourceRecordIds = [...new Set(events.map(e => e.sourceRecordId))];

    const now = new Date().toISOString();

    return {
      id: `episode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      title,
      description,
      startDate,
      endDate,
      status,
      type: eventType,
      eventIds,
      patternIds,
      sourceRecordIds,
      summary,
      themes: [],
      transitions: [],
      metadata: {
        eventCount: events.length,
        uniqueSourceRecords: sourceRecordIds.length,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Create single-event episode
   */
  private createSingleEventEpisode(patientId: string, event: MedicalEvent): HealthEpisode {
    const eventType = this.determineEpisodeType([event]);
    const title = event.title;
    const description = event.description || '';
    const summary = `${event.title} documented`;

    const now = new Date().toISOString();

    return {
      id: `episode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      title,
      description,
      startDate: event.date || null,
      endDate: event.date || null,
      status: 'uncertain',
      type: eventType,
      eventIds: [event.id],
      patternIds: [],
      sourceRecordIds: [event.sourceRecordId],
      summary,
      themes: [],
      transitions: [],
      metadata: {
        eventCount: 1,
        undated: !event.date,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Determine episode type based on events
   */
  private determineEpisodeType(events: MedicalEvent[]): EpisodeType {
    const eventTypes = new Set(events.map(e => e.eventType));

    if (eventTypes.size === 1) {
      const type = eventTypes.values().next().value;
      switch (type) {
        case 'symptom':
          return 'symptom_episode';
        case 'laboratory':
        case 'procedure':
          return 'investigation_episode';
        case 'medication':
          return 'treatment_episode';
        case 'hospital_visit':
          return 'hospitalization_episode';
        case 'diagnosis':
          return 'diagnosis_episode';
        default:
          return 'mixed_episode';
      }
    }

    return 'mixed_episode';
  }

  /**
   * Determine episode status based on events
   */
  private determineEpisodeStatus(events: MedicalEvent[]): EpisodeStatus {
    const hasResolution = this.hasExplicitResolution(events);
    if (hasResolution) {
      return 'resolved_in_records';
    }

    const latestEvent = events[events.length - 1];
    if (latestEvent.date) {
      const daysSinceLatest = (new Date().getTime() - new Date(latestEvent.date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLatest > 365) {
        return 'historical';
      }
    }

    return 'active_in_records';
  }

  /**
   * Generate episode title (human-readable)
   */
  private generateEpisodeTitle(events: MedicalEvent[], type: EpisodeType): string {
    const primaryConcept = this.getPrimaryConcept(events);
    const primaryEventType = this.getPrimaryEventType(events);
    
    // If we have a primary concept and it's not generic, use it
    if (primaryConcept && primaryConcept !== 'health' && primaryConcept !== 'unknown') {
      const formattedConcept = primaryConcept.charAt(0).toUpperCase() + primaryConcept.slice(1).toLowerCase();
      
      switch (type) {
        case 'symptom_episode':
          return `${formattedConcept} episode`;
        case 'investigation_episode':
          return `${formattedConcept} investigation`;
        case 'treatment_episode':
          return `${formattedConcept} treatment`;
        case 'hospitalization_episode':
          return 'Hospitalization episode';
        case 'diagnosis_episode':
          return `${formattedConcept} diagnosis`;
        case 'mixed_episode':
          return `${formattedConcept} health episode`;
        default:
          return `${formattedConcept} episode`;
      }
    }
    
    // Fall back to primary event type
    if (primaryEventType) {
      const formattedType = primaryEventType.charAt(0).toUpperCase() + primaryEventType.slice(1).toLowerCase();
      return `${formattedType} episode`;
    }
    
    // Last resort based on type
    switch (type) {
      case 'hospitalization_episode':
        return 'Hospitalization episode';
      case 'symptom_episode':
        return 'Symptom episode';
      case 'investigation_episode':
        return 'Investigation episode';
      case 'treatment_episode':
        return 'Treatment episode';
      case 'diagnosis_episode':
        return 'Diagnosis episode';
      default:
        return 'Health episode';
    }
  }

  /**
   * Get primary concept from events
   */
  private getPrimaryConcept(events: MedicalEvent[]): string {
    const conceptCounts = new Map<string, number>();
    events.forEach(event => {
      const concept = this.getCanonicalConcept(event);
      conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
    });

    let maxCount = 0;
    let primaryConcept = 'health';
    conceptCounts.forEach((count, concept) => {
      if (count > maxCount) {
        maxCount = count;
        primaryConcept = concept;
      }
    });

    return primaryConcept;
  }

  /**
   * Get primary event type from events
   */
  private getPrimaryEventType(events: MedicalEvent[]): string | null {
    if (events.length === 0) return null;
    
    const typeCounts = new Map<string, number>();
    events.forEach(e => {
      if (e.eventType) {
        typeCounts.set(e.eventType, (typeCounts.get(e.eventType) || 0) + 1);
      }
    });
    
    let maxCount = 0;
    let primaryType: string | null = null;
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        primaryType = type;
      }
    });
    
    return primaryType;
  }

  /**
   * Generate episode description
   */
  private generateEpisodeDescription(events: MedicalEvent[]): string {
    const eventTypes = [...new Set(events.map(e => e.eventType))];
    const dateRange = this.getDateRange(events);
    
    return `${events.length} event${events.length !== 1 ? 's' : ''} (${eventTypes.join(', ')})${dateRange ? ` from ${dateRange}` : ''}`;
  }

  /**
   * Generate episode summary
   */
  private generateEpisodeSummary(events: MedicalEvent[]): string {
    const primaryConcept = this.getPrimaryConcept(events);
    const eventCount = events.length;
    return `${primaryConcept} documented across ${eventCount} events`;
  }

  /**
   * Get date range string
   */
  private getDateRange(events: MedicalEvent[]): string | null {
    const datedEvents = events.filter(e => e.date);
    if (datedEvents.length === 0) {
      return null;
    }

    const dates = datedEvents.map(e => new Date(e.date!)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0].toLocaleDateString();
    const lastDate = dates[dates.length - 1].toLocaleDateString();

    if (firstDate === lastDate) {
      return firstDate;
    }

    return `${firstDate} to ${lastDate}`;
  }

  /**
   * Detect recurring concepts across episodes
   */
  detectRecurringConcepts(
    episodes: HealthEpisode[],
    events: MedicalEvent[],
    patterns: Pattern[]
  ): LongitudinalTheme[] {
    const themes: LongitudinalTheme[] = [];
    const conceptOccurrences = new Map<string, { episodeIds: string[]; eventIds: string[]; firstDate: string; lastDate: string }>();

    // Group episodes by canonical concept
    episodes.forEach(episode => {
      const primaryConcept = this.getPrimaryConcept(
        events.filter(e => episode.eventIds.includes(e.id))
      );

      if (!conceptOccurrences.has(primaryConcept)) {
        conceptOccurrences.set(primaryConcept, {
          episodeIds: [],
          eventIds: [],
          firstDate: episode.startDate || '',
          lastDate: episode.endDate || '',
        });
      }

      const occurrence = conceptOccurrences.get(primaryConcept)!;
      occurrence.episodeIds.push(episode.id);
      occurrence.eventIds.push(...episode.eventIds);

      if (episode.startDate && occurrence.firstDate > episode.startDate) {
        occurrence.firstDate = episode.startDate;
      }
      if (episode.endDate && occurrence.lastDate < episode.endDate) {
        occurrence.lastDate = episode.endDate;
      }
    });

    // Create themes for concepts that appear in multiple episodes
    conceptOccurrences.forEach((occurrence, concept) => {
      if (occurrence.episodeIds.length >= 2) {
        const now = new Date().toISOString();
        const theme: LongitudinalTheme = {
          id: `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patientId: episodes[0]?.patientId || '',
          name: `Recurring ${concept}`,
          description: `${concept} appears across ${occurrence.episodeIds.length} episodes`,
          canonicalConcept: concept,
          episodeIds: occurrence.episodeIds,
          eventIds: occurrence.eventIds,
          firstObserved: occurrence.firstDate || null,
          lastObserved: occurrence.lastDate || null,
          status: 'recurring',
          patternIds: patterns
            .filter(p => p.evidence.some(e => occurrence.eventIds.includes(e.eventId)))
            .map(p => p.id),
          metadata: {
            episodeCount: occurrence.episodeIds.length,
            eventCount: occurrence.eventIds.length,
          },
          createdAt: now,
          updatedAt: now,
        };
        themes.push(theme);
      }
    });

    return themes;
  }

  /**
   * Detect recurrence after resolution
   */
  detectRecurrenceAfterResolution(
    episodes: HealthEpisode[],
    events: MedicalEvent[]
  ): { episodeId: string; recurrenceEpisodeId: string; gapDays: number }[] {
    const recurrences: { episodeId: string; recurrenceEpisodeId: string; gapDays: number }[] = [];

    const resolvedEpisodes = episodes.filter(e => e.status === 'resolved_in_records');
    const activeEpisodes = episodes.filter(e => e.status === 'active_in_records');

    resolvedEpisodes.forEach(resolved => {
      const resolvedConcept = this.getPrimaryConcept(
        events.filter(e => resolved.eventIds.includes(e.id))
      );

      activeEpisodes.forEach(active => {
        const activeConcept = this.getPrimaryConcept(
          events.filter(e => active.eventIds.includes(e.id))
        );

        if (resolvedConcept === activeConcept && resolved.endDate && active.startDate) {
          const gapDays = this.calculateGapDays(resolved.endDate, active.startDate);
          if (gapDays > 30) {
            recurrences.push({
              episodeId: resolved.id,
              recurrenceEpisodeId: active.id,
              gapDays,
            });
          }
        }
      });
    });

    return recurrences;
  }
}
