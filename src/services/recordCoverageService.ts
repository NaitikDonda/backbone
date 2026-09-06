/**
 * Record Coverage Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Analyzes record coverage and identifies missing periods in the available history.
 */

import type {
  MedicalEvent,
  RecordCoverage
} from '../types';

export class RecordCoverageService {
  private static instance: RecordCoverageService;

  private constructor() {}

  static getInstance(): RecordCoverageService {
    if (!RecordCoverageService.instance) {
      RecordCoverageService.instance = new RecordCoverageService();
    }
    return RecordCoverageService.instance;
  }

  /**
   * Analyze record coverage
   */
  analyzeRecordCoverage(
    patientId: string,
    events: MedicalEvent[]
  ): RecordCoverage {
    const datedEvents = events.filter(e => e.date);

    if (datedEvents.length === 0) {
      return {
        patientId,
        earliestDate: null,
        latestDate: null,
        totalYears: 0,
        missingPeriods: [],
        totalRecords: events.length,
        recordsByYear: {},
        completeness: 'sparse',
      };
    }

    // Sort events by date
    const sortedEvents = datedEvents.sort(
      (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
    );

    const earliestDate = sortedEvents[0].date!;
    const latestDate = sortedEvents[sortedEvents.length - 1].date!;

    // Calculate total years
    const earliestDateObj = new Date(earliestDate);
    const latestDateObj = new Date(latestDate);
    const totalYears = Math.max(1, (latestDateObj.getTime() - earliestDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365));

    // Count records by year
    const recordsByYear: Record<string, number> = {};
    sortedEvents.forEach(event => {
      const year = new Date(event.date!).getFullYear().toString();
      recordsByYear[year] = (recordsByYear[year] || 0) + 1;
    });

    // Detect missing periods (gaps > 180 days)
    const missingPeriods = this.detectMissingPeriods(sortedEvents);

    // Determine completeness
    const completeness = this.determineCompleteness(
      totalYears,
      recordsByYear,
      missingPeriods
    );

    return {
      patientId,
      earliestDate,
      latestDate,
      totalYears: Math.round(totalYears),
      missingPeriods,
      totalRecords: events.length,
      recordsByYear,
      completeness,
    };
  }

  /**
   * Detect missing periods (gaps > 180 days)
   */
  private detectMissingPeriods(events: MedicalEvent[]): Array<{
    startDate: string;
    endDate: string;
    durationDays: number;
  }> {
    const missingPeriods: Array<{
      startDate: string;
      endDate: string;
      durationDays: number;
    }> = [];

    const gapThresholdDays = 180;

    for (let i = 1; i < events.length; i++) {
      const prevEvent = events[i - 1];
      const currEvent = events[i];

      if (!prevEvent.date || !currEvent.date) continue;

      const prevDate = new Date(prevEvent.date);
      const currDate = new Date(currEvent.date);
      const gapDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (gapDays > gapThresholdDays) {
        missingPeriods.push({
          startDate: prevEvent.date,
          endDate: currEvent.date,
          durationDays: Math.round(gapDays),
        });
      }
    }

    return missingPeriods;
  }

  /**
   * Determine completeness based on years, records, and gaps
   */
  private determineCompleteness(
    totalYears: number,
    recordsByYear: Record<string, number>,
    missingPeriods: Array<{ durationDays: number }>
  ): 'complete' | 'mostly_complete' | 'fragmented' | 'sparse' {
    const yearsWithRecords = Object.keys(recordsByYear).length;
    const yearsRepresented = Math.round(totalYears);

    // If less than 1 year of data
    if (totalYears < 1) {
      return 'sparse';
    }

    // Calculate coverage percentage
    const coveragePercent = yearsWithRecords / yearsRepresented;

    // Calculate total gap days as percentage of total period
    const totalGapDays = missingPeriods.reduce((sum, period) => sum + period.durationDays, 0);
    const totalDays = totalYears * 365;
    const gapPercent = totalGapDays / totalDays;

    // Determine completeness
    if (coveragePercent >= 0.8 && gapPercent < 0.2) {
      return 'complete';
    } else if (coveragePercent >= 0.6 && gapPercent < 0.4) {
      return 'mostly_complete';
    } else if (coveragePercent >= 0.3) {
      return 'fragmented';
    } else {
      return 'sparse';
    }
  }
}
