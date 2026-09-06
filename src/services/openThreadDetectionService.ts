/**
 * Open Thread Detection Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Detects unresolved issues in the available history:
 * - Recurring symptoms without documented resolution
 * - Abnormal findings with no later result found
 * - Investigations without documented outcome
 * - Repeated issues across several episodes
 */

import type {
  MedicalEvent,
  HealthEpisode,
  Pattern,
  OpenThread,
  CareGap
} from '../types';

export class OpenThreadDetectionService {
  private static instance: OpenThreadDetectionService;

  private constructor() {}

  static getInstance(): OpenThreadDetectionService {
    if (!OpenThreadDetectionService.instance) {
      OpenThreadDetectionService.instance = new OpenThreadDetectionService();
    }
    return OpenThreadDetectionService.instance;
  }

  /**
   * Detect open threads from episodes, events, patterns, and care gaps
   */
  detectOpenThreads(
    patientId: string,
    episodes: HealthEpisode[],
    events: MedicalEvent[],
    patterns: Pattern[],
    careGaps: CareGap[]
  ): OpenThread[] {
    const threads: OpenThread[] = [];

    // Detect recurring symptoms without resolution
    const recurringSymptomThreads = this.detectRecurringSymptoms(
      patientId,
      episodes,
      events,
      patterns
    );
    threads.push(...recurringSymptomThreads);

    // Detect abnormal findings without follow-up
    const abnormalFindingThreads = this.detectAbnormalFindings(
      patientId,
      episodes,
      events,
      patterns
    );
    threads.push(...abnormalFindingThreads);

    // Detect investigations without outcome
    const investigationThreads = this.detectInvestigationsWithoutOutcome(
      patientId,
      episodes,
      events,
      patterns
    );
    threads.push(...investigationThreads);

    // Detect repeated issues
    const repeatedIssueThreads = this.detectRepeatedIssues(
      patientId,
      episodes,
      events,
      patterns
    );
    threads.push(...repeatedIssueThreads);

    // Link to care gaps
    threads.forEach(thread => {
      thread.relatedCareGapIds = careGaps
        .filter(cg => cg.evidence.some(e => thread.eventIds.includes(e.eventId)))
        .map(cg => cg.id);
      thread.relatedPatternIds = patterns
        .filter(p => p.evidence.some(e => thread.eventIds.includes(e.eventId)))
        .map(p => p.id);
    });

    return threads;
  }

  /**
   * Detect recurring symptoms without documented resolution
   */
  private detectRecurringSymptoms(
    patientId: string,
    episodes: HealthEpisode[],
    events: MedicalEvent[],
    _patterns: Pattern[]
  ): OpenThread[] {
    const threads: OpenThread[] = [];

    // Find active episodes with symptoms
    const activeSymptomEpisodes = episodes.filter(
      e => e.status === 'active_in_records' && e.type === 'symptom_episode'
    );

    activeSymptomEpisodes.forEach(episode => {
      const symptom = this.getPrimaryConcept(episode, events);

      // Check if symptom has been present for a long time without resolution
      if (episode.startDate) {
        const daysSinceStart = (new Date().getTime() - new Date(episode.startDate).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceStart > 180) {
          const now = new Date().toISOString();
          const thread: OpenThread = {
            id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patientId,
            title: `Recurring ${symptom}`,
            description: `${symptom} has been documented for ${Math.round(daysSinceStart / 30)} months without documented resolution`,
            category: 'recurring_symptom',
            episodeIds: [episode.id],
            eventIds: episode.eventIds,
            firstObserved: episode.startDate,
            lastObserved: episode.endDate || episode.startDate,
            severity: daysSinceStart > 365 ? 'high' : 'medium',
            relatedCareGapIds: [],
            relatedPatternIds: [],
            metadata: {
              daysSinceStart: Math.round(daysSinceStart),
            },
            createdAt: now,
            updatedAt: now,
          };
          threads.push(thread);
        }
      }
    });

    return threads;
  }

  /**
   * Detect abnormal findings without follow-up
   */
  private detectAbnormalFindings(
    patientId: string,
    episodes: HealthEpisode[],
    events: MedicalEvent[],
    _patterns: Pattern[]
  ): OpenThread[] {
    const threads: OpenThread[] = [];

    // Find abnormal lab findings
    const abnormalLabEvents = events.filter(
      e => e.eventType === 'laboratory' && 
           (e.description?.toLowerCase().includes('abnormal') || 
            e.description?.toLowerCase().includes('low') ||
            e.description?.toLowerCase().includes('high'))
    );

    abnormalLabEvents.forEach(event => {
      // Check if there's a follow-up result within 90 days
      const hasFollowUp = events.some(e => {
        if (!e.date || !event.date) return false;
        const gapDays = Math.abs((new Date(e.date).getTime() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24));
        return gapDays > 0 && gapDays <= 90 && e.title === event.title;
      });

      if (!hasFollowUp && event.date) {
        const daysSinceFinding = (new Date().getTime() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceFinding > 90) {
          const now = new Date().toISOString();
          const thread: OpenThread = {
            id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patientId,
            title: `Abnormal ${event.title}`,
            description: `Abnormal ${event.title} documented with no follow-up result found`,
            category: 'abnormal_finding',
            episodeIds: episodes.filter(e => e.eventIds.includes(event.id)).map(e => e.id),
            eventIds: [event.id],
            firstObserved: event.date,
            lastObserved: event.date,
            severity: daysSinceFinding > 180 ? 'high' : 'medium',
            relatedCareGapIds: [],
            relatedPatternIds: [],
            metadata: {
              daysSinceFinding: Math.round(daysSinceFinding),
            },
            createdAt: now,
            updatedAt: now,
          };
          threads.push(thread);
        }
      }
    });

    return threads;
  }

  /**
   * Detect investigations without documented outcome
   */
  private detectInvestigationsWithoutOutcome(
    patientId: string,
    episodes: HealthEpisode[],
    events: MedicalEvent[],
    _patterns: Pattern[]
  ): OpenThread[] {
    const threads: OpenThread[] = [];

    // Find investigation episodes
    const investigationEpisodes = episodes.filter(e => e.type === 'investigation_episode');

    investigationEpisodes.forEach(episode => {
      const episodeEvents = events.filter(e => episode.eventIds.includes(e.id));
      
      // Check if there's a documented outcome
      const hasOutcome = episodeEvents.some(e => 
        e.description?.toLowerCase().includes('result') ||
        e.description?.toLowerCase().includes('outcome') ||
        e.description?.toLowerCase().includes('conclusion') ||
        e.description?.toLowerCase().includes('findings')
      );

      if (!hasOutcome && episode.startDate) {
        const daysSinceInvestigation = (new Date().getTime() - new Date(episode.startDate).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceInvestigation > 60) {
          const now = new Date().toISOString();
          const thread: OpenThread = {
            id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patientId,
            title: `Investigation without documented outcome`,
            description: `Investigation for ${episode.title} with no documented outcome found`,
            category: 'investigation_without_outcome',
            episodeIds: [episode.id],
            eventIds: episode.eventIds,
            firstObserved: episode.startDate,
            lastObserved: episode.endDate || episode.startDate,
            severity: daysSinceInvestigation > 120 ? 'high' : 'medium',
            relatedCareGapIds: [],
            relatedPatternIds: [],
            metadata: {
              daysSinceInvestigation: Math.round(daysSinceInvestigation),
            },
            createdAt: now,
            updatedAt: now,
          };
          threads.push(thread);
        }
      }
    });

    return threads;
  }

  /**
   * Detect repeated issues across episodes
   */
  private detectRepeatedIssues(
    patientId: string,
    episodes: HealthEpisode[],
    events: MedicalEvent[],
    _patterns: Pattern[]
  ): OpenThread[] {
    const threads: OpenThread[] = [];
    const conceptEpisodes = new Map<string, HealthEpisode[]>();

    // Group episodes by concept
    episodes.forEach(episode => {
      const concept = this.getPrimaryConcept(episode, events);
      if (!conceptEpisodes.has(concept)) {
        conceptEpisodes.set(concept, []);
      }
      conceptEpisodes.get(concept)!.push(episode);
    });

    // Find concepts that appear in 3+ episodes
    conceptEpisodes.forEach((episodesForConcept, concept) => {
      if (episodesForConcept.length >= 3) {
        const allEventIds = episodesForConcept.flatMap(e => e.eventIds);
        const allEpisodeIds = episodesForConcept.map(e => e.id);
        
        const dates = episodesForConcept
          .filter(e => e.startDate)
          .map(e => new Date(e.startDate!))
          .sort((a, b) => a.getTime() - b.getTime());

        const now = new Date().toISOString();
        const thread: OpenThread = {
          id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patientId,
          title: `Repeated ${concept}`,
          description: `${concept} has been documented across ${episodesForConcept.length} separate episodes`,
          category: 'repeated_issue',
          episodeIds: allEpisodeIds,
          eventIds: allEventIds,
          firstObserved: dates.length > 0 ? dates[0].toISOString() : null,
          lastObserved: dates.length > 0 ? dates[dates.length - 1].toISOString() : null,
          severity: episodesForConcept.length >= 5 ? 'high' : 'medium',
          relatedCareGapIds: [],
          relatedPatternIds: [],
          metadata: {
            episodeCount: episodesForConcept.length,
          },
          createdAt: now,
          updatedAt: now,
        };
        threads.push(thread);
      }
    });

    return threads;
  }

  /**
   * Get primary concept from episode
   */
  private getPrimaryConcept(episode: HealthEpisode, events: MedicalEvent[]): string {
    const episodeEvents = events.filter(e => episode.eventIds.includes(e.id));
    const conceptCounts = new Map<string, number>();

    episodeEvents.forEach(event => {
      const concept = event.title.toLowerCase().trim();
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
}
