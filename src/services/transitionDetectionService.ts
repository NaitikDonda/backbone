/**
 * Transition Detection Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Detects meaningful transitions between health episodes:
 * - New symptoms
 * - Recurrence
 * - Investigation
 * - Treatment
 * - Persistence
 * - Resolution
 * - Reappearance
 * - Escalation in documentation
 * - Fragmentation
 */

import type {
  MedicalEvent,
  HealthEpisode,
  EpisodeTransition,
  TransitionType
} from '../types';

export class TransitionDetectionService {
  private static instance: TransitionDetectionService;

  private constructor() {}

  static getInstance(): TransitionDetectionService {
    if (!TransitionDetectionService.instance) {
      TransitionDetectionService.instance = new TransitionDetectionService();
    }
    return TransitionDetectionService.instance;
  }

  /**
   * Detect transitions between episodes
   */
  detectTransitions(
    patientId: string,
    episodes: HealthEpisode[],
    events: MedicalEvent[]
  ): EpisodeTransition[] {
    if (episodes.length < 2) {
      return [];
    }

    const transitions: EpisodeTransition[] = [];
    const sortedEpisodes = episodes
      .filter(e => e.startDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

    for (let i = 0; i < sortedEpisodes.length - 1; i++) {
      const fromEpisode = sortedEpisodes[i];
      const toEpisode = sortedEpisodes[i + 1];

      const transition = this.detectTransitionBetweenEpisodes(
        patientId,
        fromEpisode,
        toEpisode,
        events
      );

      if (transition) {
        transitions.push(transition);
      }
    }

    return transitions;
  }

  /**
   * Detect transition between two episodes
   */
  private detectTransitionBetweenEpisodes(
    patientId: string,
    fromEpisode: HealthEpisode,
    toEpisode: HealthEpisode,
    events: MedicalEvent[]
  ): EpisodeTransition | null {
    const fromConcept = this.getPrimaryConcept(fromEpisode, events);
    const toConcept = this.getPrimaryConcept(toEpisode, events);
    const gapDays = fromEpisode.endDate && toEpisode.startDate
      ? this.calculateGapDays(fromEpisode.endDate, toEpisode.startDate)
      : 0;

    // Check for resolution
    if (fromEpisode.status === 'resolved_in_records') {
      if (fromConcept === toConcept) {
        return this.createTransition(
          patientId,
          fromEpisode.id,
          toEpisode.id,
          'reappearance',
          toEpisode.startDate,
          `${fromConcept} reappeared after resolution`,
          toEpisode.eventIds
        );
      }
    }

    // Check for new symptom
    if (fromConcept !== toConcept) {
      const isNewSymptom = this.isNewSymptom(fromEpisode, toEpisode, events);
      if (isNewSymptom) {
        return this.createTransition(
          patientId,
          fromEpisode.id,
          toEpisode.id,
          'new_symptom',
          toEpisode.startDate,
          `New symptom: ${toConcept}`,
          toEpisode.eventIds
        );
      }
    }

    // Check for investigation
    if (toEpisode.type === 'investigation_episode') {
      return this.createTransition(
        patientId,
        fromEpisode.id,
        toEpisode.id,
        'investigation',
        toEpisode.startDate,
        `Investigation: ${toConcept}`,
        toEpisode.eventIds
      );
    }

    // Check for treatment
    if (toEpisode.type === 'treatment_episode') {
      return this.createTransition(
        patientId,
        fromEpisode.id,
        toEpisode.id,
        'treatment',
        toEpisode.startDate,
        `Treatment: ${toConcept}`,
        toEpisode.eventIds
      );
    }

    // Check for persistence
    if (fromConcept === toConcept && gapDays < 180) {
      return this.createTransition(
        patientId,
        fromEpisode.id,
        toEpisode.id,
        'persistence',
        toEpisode.startDate,
        `${fromConcept} persisted`,
        toEpisode.eventIds
      );
    }

    // Check for escalation in documentation
    if (this.isEscalation(fromEpisode, toEpisode, events)) {
      return this.createTransition(
        patientId,
        fromEpisode.id,
        toEpisode.id,
        'escalation_in_documentation',
        toEpisode.startDate,
        `Documentation became more extensive`,
        toEpisode.eventIds
      );
    }

    // Check for fragmentation
    if (gapDays > 365) {
      return this.createTransition(
        patientId,
        fromEpisode.id,
        toEpisode.id,
        'fragmentation',
        toEpisode.startDate,
        `Significant gap in records (${Math.round(gapDays)} days)`,
        toEpisode.eventIds
      );
    }

    // Default to recurrence if same concept
    if (fromConcept === toConcept) {
      return this.createTransition(
        patientId,
        fromEpisode.id,
        toEpisode.id,
        'recurrence',
        toEpisode.startDate,
        `${fromConcept} recurred`,
        toEpisode.eventIds
      );
    }

    return null;
  }

  /**
   * Check if transition represents a new symptom
   */
  private isNewSymptom(
    fromEpisode: HealthEpisode,
    toEpisode: HealthEpisode,
    events: MedicalEvent[]
  ): boolean {
    const fromConcepts = this.getEpisodeConcepts(fromEpisode, events);
    const toConcepts = this.getEpisodeConcepts(toEpisode, events);

    // Check if toEpisode has concepts not in fromEpisode
    const newConcepts = toConcepts.filter(c => !fromConcepts.includes(c));
    return newConcepts.length > 0;
  }

  /**
   * Check if transition represents escalation in documentation
   */
  private isEscalation(
    fromEpisode: HealthEpisode,
    toEpisode: HealthEpisode,
    events: MedicalEvent[]
  ): boolean {
    // Escalation if toEpisode has significantly more events or more diverse event types
    const fromEventCount = fromEpisode.eventIds.length;
    const toEventCount = toEpisode.eventIds.length;

    if (toEventCount > fromEventCount * 2) {
      return true;
    }

    const fromTypes = new Set(
      events
        .filter(e => fromEpisode.eventIds.includes(e.id))
        .map(e => e.eventType)
    );
    const toTypes = new Set(
      events
        .filter(e => toEpisode.eventIds.includes(e.id))
        .map(e => e.eventType)
    );

    return toTypes.size > fromTypes.size;
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

  /**
   * Get all concepts from episode
   */
  private getEpisodeConcepts(episode: HealthEpisode, events: MedicalEvent[]): string[] {
    const episodeEvents = events.filter(e => episode.eventIds.includes(e.id));
    return [...new Set(episodeEvents.map(e => e.title.toLowerCase().trim()))];
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
   * Create transition object
   */
  private createTransition(
    patientId: string,
    fromEpisodeId: string,
    toEpisodeId: string,
    type: TransitionType,
    date: string | null,
    description: string,
    evidenceEventIds: string[]
  ): EpisodeTransition {
    const now = new Date().toISOString();

    return {
      id: `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      fromEpisodeId,
      toEpisodeId,
      type,
      date,
      description,
      evidenceEventIds,
      metadata: {},
      createdAt: now,
    };
  }

  /**
   * Detect transitions from a single episode (for first episode)
   */
  detectInitialTransitions(
    patientId: string,
    episode: HealthEpisode,
    _events: MedicalEvent[]
  ): EpisodeTransition[] {
    const transitions: EpisodeTransition[] = [];
    const now = new Date().toISOString();

    // Create initial transition with no fromEpisode
    const initialTransition: EpisodeTransition = {
      id: `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      fromEpisodeId: null,
      toEpisodeId: episode.id,
      type: 'new_symptom',
      date: episode.startDate,
      description: `Initial episode: ${episode.title}`,
      evidenceEventIds: episode.eventIds,
      metadata: {},
      createdAt: now,
    };

    transitions.push(initialTransition);
    return transitions;
  }
}
