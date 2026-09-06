/**
 * Data Formatting Utilities - Phase 15
 * 
 * Centralized formatting layer to ensure clean, user-friendly display of data.
 * Prevents display of NaN, None, Unknown, Invalid Date, and other raw backend values.
 */

/**
 * Format a date string for display
 * - Handles null/undefined
 * - Handles invalid dates
 * - Shows appropriate precision based on available data
 */
export function formatDate(dateString: string | null | undefined): string {
  if (dateString === null || dateString === undefined || dateString === '') {
    return 'Date not documented';
  }

  // Check for obvious invalid values
  if (dateString === 'NaN' || dateString === 'None' || dateString === 'Unknown' || dateString === 'Invalid Date') {
    return 'Date not documented';
  }

  try {
    const date = new Date(dateString);
    
    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return 'Date not documented';
    }

    // Format with appropriate precision
    // If day is 1 and month is January, might be year-only
    const month = date.getMonth();
    const day = date.getDate();

    // Check if this might be a year-only date (Jan 1)
    if (month === 0 && day === 1) {
      // Could be year-only, but we'll still show full date
      // The backend should handle year-only dates appropriately
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'Date not documented';
  }
}

/**
 * Format a date range for display
 */
export function formatDateRange(startDate: string | null, endDate: string | null): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start === 'Date not documented' && end === 'Date not documented') {
    return 'Dates not documented';
  }

  if (start === 'Date not documented') {
    return `— ${end}`;
  }

  if (end === 'Date not documented') {
    return `${start} —`;
  }

  return `${start} — ${end}`;
}

/**
 * Format a year for display
 */
export function formatYear(dateString: string | null | undefined): string {
  if (dateString === null || dateString === undefined || dateString === '') {
    return 'Year not documented';
  }

  if (dateString === 'NaN' || dateString === 'None' || dateString === 'Unknown') {
    return 'Year not documented';
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Year not documented';
    }
    return date.getFullYear().toString();
  } catch (error) {
    return 'Year not documented';
  }
}

/**
 * Format a number for display
 * - Handles NaN, null, undefined
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Not documented';
  }

  if (isNaN(value)) {
    return 'Not documented';
  }

  return value.toString();
}

/**
 * Format a duration in years for display
 */
export function formatYears(years: number | null | undefined): string {
  if (years === null || years === undefined || isNaN(years)) {
    return 'Not documented';
  }

  if (years === 1) {
    return '1 year';
  }

  return `${Math.round(years * 10) / 10} years`;
}

/**
 * Format a text value, replacing null/undefined/empty with fallback
 */
export function formatText(value: string | null | undefined, fallback: string = 'Not documented'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (value === 'NaN' || value === 'None' || value === 'Unknown') {
    return fallback;
  }

  return value;
}

/**
 * Format a count with proper pluralization
 */
export function formatCount(count: number | null | undefined, singular: string, plural: string): string {
  if (count === null || count === undefined || isNaN(count)) {
    return `0 ${plural}`;
  }

  if (count === 1) {
    return `1 ${singular}`;
  }

  return `${count} ${plural}`;
}

/**
 * Format a status for display
 */
export function formatStatus(status: string | null | undefined): string {
  if (status === null || status === undefined || status === '') {
    return 'Status not documented';
  }

  if (status === 'NaN' || status === 'None' || status === 'Unknown') {
    return 'Status not documented';
  }

  // Convert snake_case to Title Case
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a severity for display
 */
export function formatSeverity(severity: string | null | undefined): string {
  if (severity === null || severity === undefined || severity === '') {
    return 'Severity not documented';
  }

  if (severity === 'NaN' || severity === 'None' || severity === 'Unknown') {
    return 'Severity not documented';
  }

  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
}

/**
 * Format an event type for display
 */
export function formatEventType(eventType: string | null | undefined): string {
  if (eventType === null || eventType === undefined || eventType === '') {
    return 'Medical event';
  }

  if (eventType === 'NaN' || eventType === 'None' || eventType === 'Unknown') {
    return 'Medical event';
  }

  // Convert snake_case to Title Case
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a confidence level for display
 */
export function formatConfidence(confidence: string | null | undefined): string {
  if (confidence === null || confidence === undefined || confidence === '') {
    return 'Confidence not documented';
  }

  if (confidence === 'NaN' || confidence === 'None' || confidence === 'Unknown') {
    return 'Confidence not documented';
  }

  // Convert snake_case to Title Case
  return confidence
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a match level for display
 */
export function formatMatchLevel(matchLevel: string | null | undefined): string {
  if (matchLevel === null || matchLevel === undefined || matchLevel === '') {
    return 'Match level not documented';
  }

  if (matchLevel === 'NaN' || matchLevel === 'None' || matchLevel === 'Unknown') {
    return 'Match level not documented';
  }

  return matchLevel.charAt(0).toUpperCase() + matchLevel.slice(1).toLowerCase();
}

/**
 * Format a time span for display
 */
export function formatTimeSpan(timeSpanYears: number | null | undefined): string {
  if (timeSpanYears === null || timeSpanYears === undefined || isNaN(timeSpanYears)) {
    return 'Time span not documented';
  }

  if (timeSpanYears < 1) {
    return `${Math.round(timeSpanYears * 12)} months`;
  }

  return formatYears(timeSpanYears);
}

/**
 * Format a file size for display
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return 'Size not documented';
  }

  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Clean a string of any problematic values
 */
export function cleanString(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (value === 'NaN' || value === 'None' || value === 'Unknown' || value === 'Invalid Date') {
    return '';
  }

  return value;
}

/**
 * Check if a value is effectively empty for display purposes
 */
export function isEmptyForDisplay(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  if (value === 'NaN' || value === 'None' || value === 'Unknown' || value === 'Invalid Date') {
    return true;
  }

  return value.trim() === '';
}

/**
 * Format a percentage for display
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Not documented';
  }

  return `${Math.round(value * 100)}%`;
}
