/**
 * Current State Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Generates a factual "latest documented state" based on the most recent records.
 * Does not assume current symptoms unless explicitly documented in the latest records.
 */

import type {
  MedicalEvent,
  HealthEpisode,
  CurrentState
} from '../types';

export class CurrentStateService {
  private static instance: CurrentStateService;

  private constructor() {}

  static getInstance(): CurrentStateService {
    if (!CurrentStateService.instance) {
      CurrentStateService.instance = new CurrentStateService();
    }
    return CurrentStateService.instance;
  }

  /**
   * Generate current documented state
   */
  generateCurrentState(
    patientId: string,
    events: MedicalEvent[],
    _episodes: HealthEpisode[]
  ): CurrentState {
    const now = new Date().toISOString();
    const asOfDate = now;

    // Get most recent events
    const datedEvents = events.filter(e => e.date).sort(
      (a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()
    );

    const lastRecordDate = datedEvents.length > 0 ? datedEvents[0].date : null;

    // Get active symptoms from recent events (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentEvents = datedEvents.filter(e => {
      if (!e.date) return false;
      return new Date(e.date) >= sixMonthsAgo;
    });

    // Extract active symptoms (not negated)
    const activeSymptoms = this.extractActiveSymptoms(recentEvents);

    // Extract active diagnoses
    const activeDiagnoses = this.extractActiveDiagnoses(recentEvents);

    // Extract active medications
    const activeMedications = this.extractActiveMedications(recentEvents);

    // Extract recent investigations
    const recentInvestigations = this.extractRecentInvestigations(recentEvents);

    // Generate summary
    const summary = this.generateSummary(
      lastRecordDate,
      activeSymptoms,
      activeDiagnoses,
      activeMedications,
      recentInvestigations
    );

    return {
      patientId,
      asOfDate,
      summary,
      activeSymptoms,
      activeDiagnoses,
      activeMedications,
      recentInvestigations,
      lastRecordDate,
      metadata: {
        totalRecentEvents: recentEvents.length,
        totalEvents: events.length,
      },
    };
  }

  /**
   * Extract active symptoms from recent events
   */
  private extractActiveSymptoms(events: MedicalEvent[]): string[] {
    const symptoms = new Set<string>();

    events.forEach(event => {
      if (event.eventType === 'symptom') {
        const text = (event.sourceText || event.description || '').toLowerCase();
        
        // Check for negation
        const negationPatterns = ['denies', 'no', 'negative for', 'without', 'none'];
        const isNegated = negationPatterns.some(pattern => text.includes(pattern));

        if (!isNegated) {
          symptoms.add(event.title);
        }
      }
    });

    return Array.from(symptoms);
  }

  /**
   * Extract active diagnoses from recent events
   */
  private extractActiveDiagnoses(events: MedicalEvent[]): string[] {
    const diagnoses = new Set<string>();

    events.forEach(event => {
      if (event.eventType === 'diagnosis') {
        const text = (event.sourceText || event.description || '').toLowerCase();
        
        // Check for historical qualifiers
        const historicalPatterns = ['history of', 'past history', 'previous'];
        const isHistorical = historicalPatterns.some(pattern => text.includes(pattern));

        // Check for resolution
        const resolutionPatterns = ['resolved', 'cleared', 'no longer'];
        const isResolved = resolutionPatterns.some(pattern => text.includes(pattern));

        if (!isHistorical && !isResolved) {
          diagnoses.add(event.title);
        }
      }
    });

    return Array.from(diagnoses);
  }

  /**
   * Extract active medications from recent events
   */
  private extractActiveMedications(events: MedicalEvent[]): string[] {
    const medications = new Set<string>();

    events.forEach(event => {
      if (event.eventType === 'medication') {
        const text = (event.sourceText || event.description || '').toLowerCase();
        
        // Check for discontinuation
        const discontinuationPatterns = ['discontinued', 'stopped', 'ceased', 'no longer taking'];
        const isDiscontinued = discontinuationPatterns.some(pattern => text.includes(pattern));

        if (!isDiscontinued) {
          medications.add(event.title);
        }
      }
    });

    return Array.from(medications);
  }

  /**
   * Extract recent investigations from recent events
   */
  private extractRecentInvestigations(events: MedicalEvent[]): string[] {
    const investigations = new Set<string>();

    events.forEach(event => {
      if (event.eventType === 'laboratory' || event.eventType === 'procedure') {
        investigations.add(event.title);
      }
    });

    return Array.from(investigations);
  }

  /**
   * Generate summary of current state
   */
  private generateSummary(
    lastRecordDate: string | null,
    activeSymptoms: string[],
    activeDiagnoses: string[],
    activeMedications: string[],
    recentInvestigations: string[]
  ): string {
    const parts: string[] = [];

    if (lastRecordDate) {
      const date = new Date(lastRecordDate).toLocaleDateString();
      parts.push(`Most recent available records are from ${date}`);
    }

    if (activeSymptoms.length > 0) {
      parts.push(`documented symptoms include ${activeSymptoms.slice(0, 3).join(', ')}${activeSymptoms.length > 3 ? ' and others' : ''}`);
    }

    if (activeDiagnoses.length > 0) {
      parts.push(`documented diagnoses include ${activeDiagnoses.slice(0, 2).join(', ')}${activeDiagnoses.length > 2 ? ' and others' : ''}`);
    }

    if (activeMedications.length > 0) {
      parts.push(`documented medications include ${activeMedications.slice(0, 2).join(', ')}${activeMedications.length > 2 ? ' and others' : ''}`);
    }

    if (recentInvestigations.length > 0) {
      parts.push(`recent investigations include ${recentInvestigations.slice(0, 2).join(', ')}${recentInvestigations.length > 2 ? ' and others' : ''}`);
    }

    if (parts.length === 0) {
      return 'No recent documented information available.';
    }

    return parts.join('. ') + '.';
  }
}
