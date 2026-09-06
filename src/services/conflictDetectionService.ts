/**
 * Conflict Detection Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Identifies conflicting records where the same field has different values.
 * Does not automatically resolve conflicts - flags them for user review.
 */

import type {
  MedicalEvent,
  HealthEpisode
} from '../types';

export interface Conflict {
  eventId1: string;
  eventId2: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  field: string;
  value1: string;
  value2: string;
}

export class ConflictDetectionService {
  private static instance: ConflictDetectionService;

  private constructor() {}

  static getInstance(): ConflictDetectionService {
    if (!ConflictDetectionService.instance) {
      ConflictDetectionService.instance = new ConflictDetectionService();
    }
    return ConflictDetectionService.instance;
  }

  /**
   * Detect conflicts in events
   */
  detectConflicts(events: MedicalEvent[]): Conflict[] {
    const conflicts: Conflict[] = [];

    // Group events by title (canonical concept)
    const eventsByTitle = new Map<string, MedicalEvent[]>();
    events.forEach(event => {
      const title = event.title.toLowerCase().trim();
      if (!eventsByTitle.has(title)) {
        eventsByTitle.set(title, []);
      }
      eventsByTitle.get(title)!.push(event);
    });

    // Check for conflicts within each group
    eventsByTitle.forEach((eventsForTitle, _title) => {
      if (eventsForTitle.length < 2) return;

      // Check for conflicting descriptions
      const descriptionConflicts = this.detectDescriptionConflicts(eventsForTitle);
      conflicts.push(...descriptionConflicts);

      // Check for conflicting dates (same event type, similar title, different dates)
      const dateConflicts = this.detectDateConflicts(eventsForTitle);
      conflicts.push(...dateConflicts);

      // Check for conflicting status
      const statusConflicts = this.detectStatusConflicts(eventsForTitle);
      conflicts.push(...statusConflicts);
    });

    return conflicts;
  }

  /**
   * Detect conflicting descriptions
   */
  private detectDescriptionConflicts(events: MedicalEvent[]): Conflict[] {
    const conflicts: Conflict[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        if (!event1.description || !event2.description) continue;

        const desc1 = event1.description.toLowerCase();
        const desc2 = event2.description.toLowerCase();

        // Check for negation conflicts
        const isNegated1 = this.isNegated(desc1);
        const isNegated2 = this.isNegated(desc2);

        if (isNegated1 !== isNegated2) {
          conflicts.push({
            eventId1: event1.id,
            eventId2: event2.id,
            description: `Conflicting negation: "${event1.description}" vs "${event2.description}"`,
            severity: 'high',
            field: 'description',
            value1: event1.description,
            value2: event2.description,
          });
        }

        // Check for resolution conflicts
        const isResolved1 = this.isResolved(desc1);
        const isResolved2 = this.isResolved(desc2);

        if (isResolved1 !== isResolved2) {
          conflicts.push({
            eventId1: event1.id,
            eventId2: event2.id,
            description: `Conflicting resolution status: "${event1.description}" vs "${event2.description}"`,
            severity: 'medium',
            field: 'description',
            value1: event1.description,
            value2: event2.description,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect conflicting dates
   */
  private detectDateConflicts(events: MedicalEvent[]): Conflict[] {
    const conflicts: Conflict[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        if (!event1.date || !event2.date) continue;

        // Check if dates are very different (more than 1 year)
        const date1 = new Date(event1.date);
        const date2 = new Date(event2.date);
        const diffDays = Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 365) {
          conflicts.push({
            eventId1: event1.id,
            eventId2: event2.id,
            description: `Significant date difference: ${event1.date} vs ${event2.date}`,
            severity: 'low',
            field: 'date',
            value1: event1.date,
            value2: event2.date,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect conflicting status
   */
  private detectStatusConflicts(events: MedicalEvent[]): Conflict[] {
    const conflicts: Conflict[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        if (!event1.status || !event2.status) continue;

        if (event1.status !== event2.status) {
          // Check if one is resolved and the other is active
          if (
            (event1.status === 'resolved' && event2.status === 'active') ||
            (event1.status === 'active' && event2.status === 'resolved')
          ) {
            conflicts.push({
              eventId1: event1.id,
              eventId2: event2.id,
              description: `Conflicting status: ${event1.status} vs ${event2.status}`,
              severity: 'high',
              field: 'status',
              value1: event1.status,
              value2: event2.status,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if text contains negation
   */
  private isNegated(text: string): boolean {
    const negationPatterns = ['denies', 'no', 'negative for', 'without', 'none', 'not'];
    return negationPatterns.some(pattern => text.includes(pattern));
  }

  /**
   * Check if text indicates resolution
   */
  private isResolved(text: string): boolean {
    const resolutionPatterns = ['resolved', 'cleared', 'improved', 'no longer', 'gone'];
    return resolutionPatterns.some(pattern => text.includes(pattern));
  }

  /**
   * Detect conflicts within episodes
   */
  detectEpisodeConflicts(episodes: HealthEpisode[], events: MedicalEvent[]): Conflict[] {
    const conflicts: Conflict[] = [];

    episodes.forEach(episode => {
      const episodeEvents = events.filter(e => episode.eventIds.includes(e.id));
      const episodeConflicts = this.detectConflicts(episodeEvents);
      conflicts.push(...episodeConflicts);
    });

    return conflicts;
  }
}
