/**
 * Temporal Window Configuration for Care Gap Detection
 * 
 * These are configurable time windows used to detect potential follow-up gaps.
 * These are heuristics for information analysis, not medical requirements.
 */

export interface TemporalWindowConfig {
  immediateFollowUpDays: number;      // Immediate follow-up window
  shortTermFollowUpDays: number;      // Short-term follow-up window
  longTermFollowUpDays: number;       // Long-term follow-up window
  chronicMonitoringDays: number;       // Chronic condition monitoring window
  investigationFollowUpDays: number;   // Investigation follow-up window
  treatmentEffectivenessDays: number; // Treatment effectiveness window
}

export const DEFAULT_TEMPORAL_WINDOWS: TemporalWindowConfig = {
  immediateFollowUpDays: 30,       // 30 days
  shortTermFollowUpDays: 90,      // 90 days (3 months)
  longTermFollowUpDays: 180,     // 180 days (6 months)
  chronicMonitoringDays: 365,     // 365 days (1 year)
  investigationFollowUpDays: 60,  // 60 days
  treatmentEffectivenessDays: 90, // 90 days
};

/**
 * Get temporal window configuration
 */
export function getTemporalWindows(): TemporalWindowConfig {
  return DEFAULT_TEMPORAL_WINDOWS;
}

/**
 * Check if a date is within a temporal window
 */
export function isWithinWindow(
  startDate: string,
  endDate: string,
  windowDays: number
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= windowDays;
}

/**
 * Calculate time span in years between two dates
 */
export function calculateTimeSpanYears(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays / 365.25;
}

/**
 * Get temporal window label for display
 */
export function getTemporalWindowLabel(windowDays: number): string {
  if (windowDays <= 30) return 'immediate (30 days)';
  if (windowDays <= 90) return 'short-term (90 days)';
  if (windowDays <= 180) return 'long-term (180 days)';
  return 'chronic (365+ days)';
}
