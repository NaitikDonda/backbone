import type { MedicalRecord, MedicalEvent } from '../types';

export class LongitudinalService {
  private static instance: LongitudinalService;

  private constructor() {}

  static getInstance(): LongitudinalService {
    if (!LongitudinalService.instance) {
      LongitudinalService.instance = new LongitudinalService();
    }
    return LongitudinalService.instance;
  }

  /**
   * Generate a factual summary of the patient's history
   */
  generateSummary(records: MedicalRecord[], events: MedicalEvent[]): string {
    const metrics = this.calculateMetrics(records, events);
    
    if (metrics.numberOfRecords === 0) {
      return 'No medical records have been uploaded yet.';
    }

    const yearRange = this.getYearRange(metrics.historyStartYear, metrics.historyEndYear);
    const parts: string[] = [];

    parts.push(`Patient has records spanning ${yearRange}.`);

    if (metrics.numberOfSymptoms > 0) {
      parts.push(`${metrics.numberOfSymptoms} documented symptom${metrics.numberOfSymptoms !== 1 ? 's' : ''}`);
    }
    if (metrics.numberOfLaboratoryObservations > 0) {
      parts.push(`${metrics.numberOfLaboratoryObservations} laboratory finding${metrics.numberOfLaboratoryObservations !== 1 ? 's' : ''}`);
    }
    if (metrics.numberOfMedications > 0) {
      parts.push(`${metrics.numberOfMedications} medication${metrics.numberOfMedications !== 1 ? 's' : ''}`);
    }
    if (metrics.numberOfEncounters > 0) {
      parts.push(`${metrics.numberOfEncounters} clinical encounter${metrics.numberOfEncounters !== 1 ? 's' : ''}`);
    }

    if (parts.length > 1) {
      return `${parts[0]} The history contains ${parts.slice(1).join(', ')}.`;
    }

    return parts[0];
  }

  /**
   * Calculate health journey metrics
   */
  calculateMetrics(records: MedicalRecord[], events: MedicalEvent[]): HealthJourneyMetrics {
    const datedEvents = events.filter(e => e.date !== null);
    
    const years = datedEvents
      .map(e => new Date(e.date!).getFullYear())
      .filter(y => !isNaN(y));

    const historyStartYear = years.length > 0 ? Math.min(...years) : null;
    const historyEndYear = years.length > 0 ? Math.max(...years) : null;

    const encounters = new Set(
      events
        .filter(e => e.metadata.encounterId)
        .map(e => e.metadata.encounterId)
    );

    return {
      historyStartYear,
      historyEndYear,
      numberOfRecords: records.length,
      numberOfMedicalEvents: events.length,
      numberOfEncounters: encounters.size,
      numberOfSymptoms: events.filter(e => e.eventType === 'symptom').length,
      numberOfDiagnoses: events.filter(e => e.eventType === 'diagnosis').length,
      numberOfLaboratoryObservations: events.filter(e => e.eventType === 'laboratory').length,
      numberOfMedications: events.filter(e => e.eventType === 'medication').length,
      numberOfProcedures: events.filter(e => e.eventType === 'procedure').length,
    };
  }

  /**
   * Get a formatted year range string
   */
  private getYearRange(start: number | null, end: number | null): string {
    if (!start && !end) return 'unknown period';
    if (!start) return `up to ${end}`;
    if (!end) return `from ${start}`;
    if (start === end) return `${start}`;
    return `${start}–${end}`;
  }
}

export interface HealthJourneyMetrics {
  historyStartYear: number | null;
  historyEndYear: number | null;
  numberOfRecords: number;
  numberOfMedicalEvents: number;
  numberOfEncounters: number;
  numberOfSymptoms: number;
  numberOfDiagnoses: number;
  numberOfLaboratoryObservations: number;
  numberOfMedications: number;
  numberOfProcedures: number;
}
