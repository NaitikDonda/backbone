/**
 * Journey Story Validation Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Validates AI-generated journey stories using the existing validation layer from Phase 13.
 * Ensures that narrative claims are supported by the structured journey data.
 */

import type {
  JourneyStory,
  HealthJourney,
  MedicalEvent
} from '../types';

import { EvidenceValidationService } from './evidenceValidationService';

export class JourneyStoryValidationService {
  private static instance: JourneyStoryValidationService;
  private evidenceValidationService: EvidenceValidationService;

  private constructor() {
    this.evidenceValidationService = EvidenceValidationService.getInstance();
  }

  static getInstance(): JourneyStoryValidationService {
    if (!JourneyStoryValidationService.instance) {
      JourneyStoryValidationService.instance = new JourneyStoryValidationService();
    }
    return JourneyStoryValidationService.instance;
  }

  /**
   * Validate journey story against structured journey data
   */
  validateJourneyStory(
    story: JourneyStory,
    journey: HealthJourney,
    events: MedicalEvent[]
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate chapter event IDs
    const eventValidation = this.validateChapterEventIds(story, journey);
    errors.push(...eventValidation.errors);
    warnings.push(...eventValidation.warnings);

    // Validate chapter episode IDs
    const episodeValidation = this.validateChapterEpisodeIds(story, journey);
    errors.push(...episodeValidation.errors);
    warnings.push(...episodeValidation.warnings);

    // Validate chapter dates
    const dateValidation = this.validateChapterDates(story, journey);
    errors.push(...dateValidation.errors);
    warnings.push(...dateValidation.warnings);

    // Validate theme dates
    const themeValidation = this.validateThemeDates(story, journey);
    errors.push(...themeValidation.errors);
    warnings.push(...themeValidation.warnings);

    // Validate narrative claims using evidence validation
    const narrativeValidation = this.validateNarrativeClaims(story, journey, events);
    errors.push(...narrativeValidation.errors);
    warnings.push(...narrativeValidation.warnings);

    // Check for hallucination patterns
    const hallucinationValidation = this.checkForHallucinations(story, journey);
    errors.push(...hallucinationValidation.errors);
    warnings.push(...hallucinationValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate chapter event IDs
   */
  private validateChapterEventIds(
    story: JourneyStory,
    journey: HealthJourney
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validEventIds = new Set(journey.episodes.flatMap(e => e.eventIds));

    story.chapters.forEach((chapter, index) => {
      chapter.eventIds.forEach(eventId => {
        if (!validEventIds.has(eventId)) {
          errors.push(`Chapter ${index + 1}: Invalid event ID "${eventId}"`);
        }
      });
    });

    return { errors, warnings };
  }

  /**
   * Validate chapter episode IDs
   */
  private validateChapterEpisodeIds(
    story: JourneyStory,
    journey: HealthJourney
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validEpisodeIds = new Set(journey.episodes.map(e => e.id));

    story.chapters.forEach((chapter, index) => {
      chapter.episodeIds.forEach(episodeId => {
        if (!validEpisodeIds.has(episodeId)) {
          errors.push(`Chapter ${index + 1}: Invalid episode ID "${episodeId}"`);
        }
      });
    });

    return { errors, warnings };
  }

  /**
   * Validate chapter dates
   */
  private validateChapterDates(
    story: JourneyStory,
    journey: HealthJourney
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    story.chapters.forEach((chapter, index) => {
      const chapterStartDate = new Date(chapter.startDate);
      const chapterEndDate = new Date(chapter.endDate);

      // Check if dates are valid
      if (isNaN(chapterStartDate.getTime()) || isNaN(chapterEndDate.getTime())) {
        errors.push(`Chapter ${index + 1}: Invalid date format`);
        return;
      }

      // Check if end date is after start date
      if (chapterEndDate < chapterStartDate) {
        errors.push(`Chapter ${index + 1}: End date before start date`);
      }

      // Check if chapter dates are within journey date range
      if (journey.startDate && journey.endDate) {
        const journeyStart = new Date(journey.startDate);
        const journeyEnd = new Date(journey.endDate);

        if (chapterStartDate < journeyStart || chapterEndDate > journeyEnd) {
          warnings.push(`Chapter ${index + 1}: Dates outside journey date range`);
        }
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate theme dates
   */
  private validateThemeDates(
    story: JourneyStory,
    journey: HealthJourney
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    story.majorThemes.forEach((theme, index) => {
      const firstObserved = new Date(theme.firstObserved);
      const lastObserved = new Date(theme.lastObserved);

      // Check if dates are valid
      if (isNaN(firstObserved.getTime()) || isNaN(lastObserved.getTime())) {
        errors.push(`Theme ${index + 1}: Invalid date format`);
        return;
      }

      // Check if last observed is after first observed
      if (lastObserved < firstObserved) {
        errors.push(`Theme ${index + 1}: Last observed before first observed`);
      }

      // Check against journey date range
      if (journey.startDate && journey.endDate) {
        const journeyStart = new Date(journey.startDate);
        const journeyEnd = new Date(journey.endDate);

        if (firstObserved < journeyStart || lastObserved > journeyEnd) {
          warnings.push(`Theme ${index + 1}: Dates outside journey date range`);
        }
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate narrative claims using evidence validation
   */
  private validateNarrativeClaims(
    story: JourneyStory,
    _journey: HealthJourney,
    events: MedicalEvent[]
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract narrative statements from chapter summaries
    story.chapters.forEach((chapter, index) => {
      const summary = chapter.summary;

      // Check for causal language
      const causalValidation = this.evidenceValidationService.validateCausality(summary);
      if (!causalValidation.isValid) {
        warnings.push(`Chapter ${index + 1}: Contains unsupported causal language: "${causalValidation.error?.message}"`);
      }

      // Check for probability claims
      const probabilityValidation = this.evidenceValidationService.validateProbabilityClaim(summary);
      if (!probabilityValidation.isValid) {
        warnings.push(`Chapter ${index + 1}: Contains unsupported probability claim: "${probabilityValidation.error?.message}"`);
      }

      // Check for negation preservation
      const negationValidation = this.validateNegationPreservation(summary, chapter.eventIds, events);
      if (!negationValidation.isValid) {
        errors.push(`Chapter ${index + 1}: May have flipped negation: "${negationValidation.error?.message}"`);
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate negation preservation in narrative
   */
  private validateNegationPreservation(
    summary: string,
    eventIds: string[],
    events: MedicalEvent[]
  ): { isValid: boolean; error?: { message: string } } {
    // Check if summary contains positive claims about negated events
    const relevantEvents = events.filter(e => eventIds.includes(e.id));
    const negatedEvents = relevantEvents.filter(e => {
      const text = (e.sourceText || e.description || '').toLowerCase();
      const negationPatterns = ['denies', 'no', 'negative for', 'without', 'none'];
      return negationPatterns.some(pattern => text.includes(pattern));
    });

    const summaryLower = summary.toLowerCase();
    negatedEvents.forEach(event => {
      const concept = event.title.toLowerCase();
      // Check if summary claims the concept exists when it was negated
      if (summaryLower.includes(concept) && !summaryLower.includes('denies') && !summaryLower.includes('no')) {
        return {
          isValid: false,
          error: { message: `Summary may claim "${concept}" exists when records show negation` },
        };
      }
    });

    return { isValid: true };
  }

  /**
   * Check for hallucination patterns in story
   */
  private checkForHallucinations(
    story: JourneyStory,
    journey: HealthJourney
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for diagnosis claims not in journey
    const diagnosisPatterns = ['diagnosed with', 'diagnosis of', 'has', 'suffers from'];
    story.chapters.forEach((chapter, index) => {
      diagnosisPatterns.forEach(pattern => {
        if (chapter.summary.toLowerCase().includes(pattern)) {
          // Check if there's a corresponding diagnosis episode
          const hasDiagnosisEpisode = journey.episodes.some(
            e => e.type === 'diagnosis_episode' && chapter.episodeIds.includes(e.id)
          );
          if (!hasDiagnosisEpisode) {
            warnings.push(`Chapter ${index + 1}: May contain unsupported diagnosis claim`);
          }
        }
      });
    });

    // Check for treatment success claims
    const treatmentPatterns = ['successfully treated', 'cured', 'resolved'];
    story.chapters.forEach((chapter, index) => {
      treatmentPatterns.forEach(pattern => {
        if (chapter.summary.toLowerCase().includes(pattern)) {
          // Check if there's explicit resolution evidence
          const hasResolution = journey.episodes.some(
            e => e.status === 'resolved_in_records' && chapter.episodeIds.includes(e.id)
          );
          if (!hasResolution) {
            warnings.push(`Chapter ${index + 1}: May contain unsupported treatment success claim`);
          }
        }
      });
    });

    // Check for disease progression claims
    const progressionPatterns = ['worsened', 'progressed', 'deteriorated', 'advanced'];
    story.chapters.forEach((chapter, index) => {
      progressionPatterns.forEach(pattern => {
        if (chapter.summary.toLowerCase().includes(pattern)) {
          warnings.push(`Chapter ${index + 1}: Contains disease progression language - ensure explicit documentation`);
        }
      });
    });

    return { errors, warnings };
  }
}
