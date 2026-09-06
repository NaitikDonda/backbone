/**
 * Longitudinal Story Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Orchestrates all journey reconstruction services to create a complete HealthJourney.
 * This is the main service that brings together episodes, transitions, themes, open threads,
 * current state, record coverage, and conflicts.
 */

import type {
  MedicalEvent,
  Pattern,
  CareGap,
  HealthJourney,
  HealthEpisode,
  LongitudinalTheme,
  OpenThread,
  RecordCoverage,
  CurrentState
} from '../types';

import { EpisodeGroupingService } from './episodeGroupingService';
import { TransitionDetectionService } from './transitionDetectionService';
import { OpenThreadDetectionService } from './openThreadDetectionService';
import { CurrentStateService } from './currentStateService';
import { RecordCoverageService } from './recordCoverageService';
import { ConflictDetectionService } from './conflictDetectionService';

export class LongitudinalStoryService {
  private static instance: LongitudinalStoryService;
  private episodeGroupingService: EpisodeGroupingService;
  private transitionDetectionService: TransitionDetectionService;
  private openThreadDetectionService: OpenThreadDetectionService;
  private currentStateService: CurrentStateService;
  private recordCoverageService: RecordCoverageService;
  private conflictDetectionService: ConflictDetectionService;

  private constructor() {
    this.episodeGroupingService = EpisodeGroupingService.getInstance();
    this.transitionDetectionService = TransitionDetectionService.getInstance();
    this.openThreadDetectionService = OpenThreadDetectionService.getInstance();
    this.currentStateService = CurrentStateService.getInstance();
    this.recordCoverageService = RecordCoverageService.getInstance();
    this.conflictDetectionService = ConflictDetectionService.getInstance();
  }

  static getInstance(): LongitudinalStoryService {
    if (!LongitudinalStoryService.instance) {
      LongitudinalStoryService.instance = new LongitudinalStoryService();
    }
    return LongitudinalStoryService.instance;
  }

  /**
   * Generate complete health journey
   */
  generateHealthJourney(
    patientId: string,
    analysisId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    careGaps: CareGap[],
    semanticAnalysis?: any
  ): HealthJourney {
    const now = new Date().toISOString();

    // Step 1: Group events into episodes
    const episodes = this.episodeGroupingService.groupEventsIntoEpisodes(
      patientId,
      events,
      patterns,
      semanticAnalysis
    );

    // Step 2: Detect transitions between episodes
    const transitions = this.transitionDetectionService.detectTransitions(
      patientId,
      episodes,
      events
    );

    // Add initial transitions for first episode
    if (episodes.length > 0) {
      const initialTransitions = this.transitionDetectionService.detectInitialTransitions(
        patientId,
        episodes[0],
        events
      );
      transitions.push(...initialTransitions);
    }

    // Step 3: Detect longitudinal themes
    const themes = this.episodeGroupingService.detectRecurringConcepts(
      episodes,
      events,
      patterns
    );

    // Step 4: Detect open threads
    const openThreads = this.openThreadDetectionService.detectOpenThreads(
      patientId,
      episodes,
      events,
      patterns,
      careGaps
    );

    // Step 5: Generate current state
    const currentState = this.currentStateService.generateCurrentState(
      patientId,
      events,
      episodes
    );

    // Step 6: Analyze record coverage
    const recordCoverage = this.recordCoverageService.analyzeRecordCoverage(
      patientId,
      events
    );

    // Step 7: Detect conflicts
    const conflictObjects = this.conflictDetectionService.detectConflicts(events);
    const conflicts = conflictObjects.map(c => ({
      eventId1: c.eventId1,
      eventId2: c.eventId2,
      description: c.description,
    }));

    // Step 8: Generate overview
    const overview = this.generateOverview(
      episodes,
      themes,
      openThreads,
      recordCoverage,
      currentState
    );

    // Step 9: Calculate date range
    const startDate = recordCoverage.earliestDate;
    const endDate = recordCoverage.latestDate;
    const totalYears = recordCoverage.totalYears;

    // Step 10: Link episodes to themes and transitions
    episodes.forEach(episode => {
      // Link to themes
      episode.themes = themes
        .filter(t => t.episodeIds.includes(episode.id))
        .map(t => t.id);

      // Link to transitions
      episode.transitions = transitions
        .filter(t => t.fromEpisodeId === episode.id || t.toEpisodeId === episode.id)
        .map(t => t.id);
    });

    const journey: HealthJourney = {
      id: `journey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      analysisId,
      overview,
      startDate,
      endDate,
      totalYears,
      episodes,
      transitions,
      themes,
      openThreads,
      recordCoverage,
      currentState,
      conflicts,
      metadata: {
        totalEvents: events.length,
        totalPatterns: patterns.length,
        totalCareGaps: careGaps.length,
        generatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };

    return journey;
  }

  /**
   * Generate journey overview
   */
  private generateOverview(
    episodes: HealthEpisode[],
    themes: LongitudinalTheme[],
    openThreads: OpenThread[],
    recordCoverage: RecordCoverage,
    _currentState: CurrentState
  ): string {
    const parts: string[] = [];

    // Time range
    if (recordCoverage.earliestDate && recordCoverage.latestDate) {
      const startYear = new Date(recordCoverage.earliestDate).getFullYear();
      const endYear = new Date(recordCoverage.latestDate).getFullYear();
      parts.push(`Health journey spanning ${startYear} to ${endYear}`);
    }

    // Episodes
    parts.push(`${episodes.length} health episodes documented`);

    // Themes
    if (themes.length > 0) {
      parts.push(`${themes.length} recurring themes identified`);
    }

    // Open threads
    if (openThreads.length > 0) {
      parts.push(`${openThreads.length} unresolved threads`);
    }

    // Record coverage
    parts.push(`record coverage: ${recordCoverage.completeness}`);

    return parts.join('. ') + '.';
  }

  /**
   * Regenerate health journey (for when underlying data changes)
   */
  regenerateHealthJourney(
    patientId: string,
    analysisId: string,
    events: MedicalEvent[],
    patterns: Pattern[],
    careGaps: CareGap[],
    semanticAnalysis?: any
  ): HealthJourney {
    return this.generateHealthJourney(
      patientId,
      analysisId,
      events,
      patterns,
      careGaps,
      semanticAnalysis
    );
  }

  /**
   * Get journey summary statistics
   */
  getJourneySummary(journey: HealthJourney): {
    totalEpisodes: number;
    totalTransitions: number;
    totalThemes: number;
    totalOpenThreads: number;
    totalConflicts: number;
    recordCompleteness: string;
    yearsCovered: number;
  } {
    return {
      totalEpisodes: journey.episodes.length,
      totalTransitions: journey.transitions.length,
      totalThemes: journey.themes.length,
      totalOpenThreads: journey.openThreads.length,
      totalConflicts: journey.conflicts.length,
      recordCompleteness: journey.recordCoverage.completeness,
      yearsCovered: journey.totalYears,
    };
  }

  /**
   * Get episodes by type
   */
  getEpisodesByType(journey: HealthJourney, type: string): HealthEpisode[] {
    return journey.episodes.filter(e => e.type === type);
  }

  /**
   * Get episodes by status
   */
  getEpisodesByStatus(journey: HealthJourney, status: string): HealthEpisode[] {
    return journey.episodes.filter(e => e.status === status);
  }

  /**
   * Get active episodes
   */
  getActiveEpisodes(journey: HealthJourney): HealthEpisode[] {
    return this.getEpisodesByStatus(journey, 'active_in_records');
  }

  /**
   * Get resolved episodes
   */
  getResolvedEpisodes(journey: HealthJourney): HealthEpisode[] {
    return this.getEpisodesByStatus(journey, 'resolved_in_records');
  }

  /**
   * Get high-severity open threads
   */
  getHighSeverityThreads(journey: HealthJourney): OpenThread[] {
    return journey.openThreads.filter(t => t.severity === 'high');
  }

  /**
   * Get themes by canonical concept
   */
  getThemesByConcept(journey: HealthJourney, concept: string): LongitudinalTheme[] {
    return journey.themes.filter(t => t.canonicalConcept === concept);
  }
}
