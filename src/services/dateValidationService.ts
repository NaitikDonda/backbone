export interface DateValidationResult {
  isValid: boolean;
  datePrecision: 'exact' | 'approximate' | 'year_only' | 'unknown';
  normalizedDate: string | null;
  issues: string[];
}

export class DateValidationService {
  private static instance: DateValidationService;

  // Patterns for approximate date expressions
  private readonly APPROXIMATE_PATTERNS = [
    /approximately\s+(\d{4})/i,
    /approx\s+(\d{4})/i,
    /around\s+(\d{4})/i,
    /about\s+(\d{4})/i,
    /circa\s+(\d{4})/i,
    /c\.\s*(\d{4})/i,
    /since\s+(approximately\s+)?(\d{4})/i,
    /from\s+(approximately\s+)?(\d{4})/i,
    /starting\s+(approximately\s+)?(\d{4})/i,
    /before\s+(\d{4})/i,
    /prior\s+to\s+(\d{4})/i,
  ];

  // Patterns for year-only dates
  private readonly YEAR_ONLY_PATTERNS = [
    /^(\d{4})$/,
    /in\s+(\d{4})/i,
    /year\s+(\d{4})/i,
  ];

  private constructor() {}

  static getInstance(): DateValidationService {
    if (!DateValidationService.instance) {
      DateValidationService.instance = new DateValidationService();
    }
    return DateValidationService.instance;
  }

  /**
   * Validate and normalize a date string
   */
  validateDate(dateString: string | null, sourceText?: string): DateValidationResult {
    if (!dateString || dateString.trim() === '') {
      return {
        isValid: true,
        datePrecision: 'unknown',
        normalizedDate: null,
        issues: [],
      };
    }

    const issues: string[] = [];
    let datePrecision: 'exact' | 'approximate' | 'year_only' | 'unknown' = 'exact';
    let normalizedDate: string | null = dateString;

    // Check for approximate date patterns
    for (const pattern of this.APPROXIMATE_PATTERNS) {
      const match = dateString.match(pattern);
      if (match) {
        datePrecision = 'approximate';
        const year = match[1] || match[2];
        normalizedDate = `approximately ${year}`;
        issues.push(`Date is approximate: "${dateString}"`);
        break;
      }
    }

    // Check for year-only patterns
    if (datePrecision === 'exact') {
      for (const pattern of this.YEAR_ONLY_PATTERNS) {
        const match = dateString.match(pattern);
        if (match) {
          datePrecision = 'year_only';
          const year = match[1];
          normalizedDate = year;
          issues.push(`Date is year-only: "${dateString}"`);
          break;
        }
      }
    }

    // Check if date was artificially converted to exact format
    if (datePrecision === 'exact' && sourceText) {
      const sourceLower = sourceText.toLowerCase();
      if (sourceLower.includes('approximately') || 
          sourceLower.includes('approx') || 
          sourceLower.includes('around') ||
          sourceLower.includes('since')) {
        datePrecision = 'approximate';
        const yearMatch = dateString.match(/(\d{4})/);
        if (yearMatch) {
          normalizedDate = `approximately ${yearMatch[1]}`;
          issues.push(`Date artificially converted to exact format. Source indicates approximate date.`);
        }
      }
    }

    // Validate that the date is not "January 1" when only year was provided
    if (dateString.includes('January 1') && sourceText) {
      const sourceLower = sourceText.toLowerCase();
      if (!sourceLower.includes('january') && !sourceLower.includes('1st')) {
        datePrecision = 'year_only';
        const yearMatch = dateString.match(/(\d{4})/);
        if (yearMatch) {
          normalizedDate = yearMatch[1];
          issues.push(`Date artificially set to January 1. Only year was provided in source.`);
        }
      }
    }

    // Check for invalid dates
    if (datePrecision === 'exact') {
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) {
        datePrecision = 'unknown';
        normalizedDate = dateString;
        issues.push(`Invalid date format: "${dateString}"`);
      }
    }

    return {
      isValid: issues.length === 0,
      datePrecision,
      normalizedDate,
      issues,
    };
  }

  /**
   * Validate duration - only allow if explicitly provided in source
   */
  validateDuration(durationString: string | null, sourceText?: string): { isValid: boolean; normalizedDuration: string | null; issues: string[] } {
    if (!durationString || durationString.trim() === '') {
      return {
        isValid: true,
        normalizedDuration: null,
        issues: [],
      };
    }

    const issues: string[] = [];
    let normalizedDuration = durationString;

    // Check if duration was calculated rather than explicitly stated
    if (sourceText) {
      const sourceLower = sourceText.toLowerCase();

      // If source doesn't mention duration but we have one, it might be calculated
      if (!sourceLower.includes('duration') && 
          !sourceLower.includes('for') && 
          !sourceLower.includes('since') &&
          !sourceLower.includes('lasting') &&
          !sourceLower.includes('continued')) {
        issues.push(`Duration may be calculated rather than explicitly stated in source`);
      }
    }

    // Check for suspiciously long durations (e.g., 23 years from "since 2013")
    const durationMatch = durationString.match(/(\d+)\s*years?/i);
    if (durationMatch) {
      const years = parseInt(durationMatch[1]);
      if (years > 50) {
        issues.push(`Suspicious duration: ${years} years. May be calculated from approximate date.`);
      }
    }

    return {
      isValid: issues.length === 0,
      normalizedDuration,
      issues,
    };
  }

  /**
   * Format date for display based on precision
   */
  formatDateForDisplay(date: string | null, precision: 'exact' | 'approximate' | 'year_only' | 'unknown'): string {
    if (!date) {
      return 'Date not documented';
    }

    switch (precision) {
      case 'approximate':
        return date; // Already formatted as "approximately YYYY"
      case 'year_only':
        return date; // Already just the year
      case 'unknown':
        return date;
      case 'exact':
      default:
        return date;
    }
  }

  /**
   * Check if two dates can be compared (same precision level)
   */
  canCompareDates(date1: string | null, precision1: 'exact' | 'approximate' | 'year_only' | 'unknown',
                   date2: string | null, precision2: 'exact' | 'approximate' | 'year_only' | 'unknown'): boolean {
    if (!date1 || !date2) {
      return false;
    }

    // Can only compare if both have at least year precision
    if (precision1 === 'unknown' || precision2 === 'unknown') {
      return false;
    }

    return true;
  }
}

export const dateValidationService = DateValidationService.getInstance();
