export interface DataQualityIssue {
  field: string;
  value: any;
  issue: string;
  severity: 'error' | 'warning';
  suggestedFix: string;
}

export class DataQualityService {
  private static instance: DataQualityService;

  private constructor() {}

  static getInstance(): DataQualityService {
    if (!DataQualityService.instance) {
      DataQualityService.instance = new DataQualityService();
    }
    return DataQualityService.instance;
  }

  /**
   * Clean and validate data values
   * Replaces NaN, None, undefined, null, Invalid Date with appropriate placeholders
   */
  cleanValue(value: any, fieldName: string): { cleanedValue: any; issues: DataQualityIssue[] } {
    const issues: DataQualityIssue[] = [];
    let cleanedValue = value;

    // Handle NaN
    if (typeof value === 'number' && isNaN(value)) {
      issues.push({
        field: fieldName,
        value: value,
        issue: 'NaN value detected',
        severity: 'error',
        suggestedFix: 'Use "Value not documented"',
      });
      cleanedValue = 'Value not documented';
    }

    // Handle None (string)
    if (value === 'None' || value === 'none') {
      issues.push({
        field: fieldName,
        value: value,
        issue: 'None string detected',
        severity: 'warning',
        suggestedFix: 'Use null or "Not documented"',
      });
      cleanedValue = null;
    }

    // Handle undefined
    if (value === undefined) {
      issues.push({
        field: fieldName,
        value: value,
        issue: 'Undefined value detected',
        severity: 'warning',
        suggestedFix: 'Use null or "Not documented"',
      });
      cleanedValue = null;
    }

    // Handle null - keep as null but document
    if (value === null) {
      // Null is acceptable, no issue
    }

    // Handle Invalid Date
    if (value instanceof Date && isNaN(value.getTime())) {
      issues.push({
        field: fieldName,
        value: value.toString(),
        issue: 'Invalid Date detected',
        severity: 'error',
        suggestedFix: 'Use "Date not documented"',
      });
      cleanedValue = 'Date not documented';
    }

    // Handle string "Invalid Date"
    if (typeof value === 'string' && value === 'Invalid Date') {
      issues.push({
        field: fieldName,
        value: value,
        issue: 'Invalid Date string detected',
        severity: 'error',
        suggestedFix: 'Use "Date not documented"',
      });
      cleanedValue = 'Date not documented';
    }

    // Handle empty strings that should be null
    if (typeof value === 'string' && value.trim() === '') {
      issues.push({
        field: fieldName,
        value: value,
        issue: 'Empty string detected',
        severity: 'warning',
        suggestedFix: 'Use null or "Not documented"',
      });
      cleanedValue = null;
    }

    return { cleanedValue, issues };
  }

  /**
   * Clean an entire object recursively
   */
  cleanObject(obj: any, prefix: string = ''): { cleanedObject: any; allIssues: DataQualityIssue[] } {
    const allIssues: DataQualityIssue[] = [];
    const cleanedObject: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fieldName = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (value === null || value === undefined) {
          cleanedObject[key] = null;
          continue;
        }

        if (typeof value === 'object' && !(value instanceof Date)) {
          // Recursively clean nested objects
          const { cleanedObject: nestedCleaned, allIssues: nestedIssues } = this.cleanObject(value, fieldName);
          cleanedObject[key] = nestedCleaned;
          allIssues.push(...nestedIssues);
        } else {
          // Clean primitive values
          const { cleanedValue, issues } = this.cleanValue(value, fieldName);
          cleanedObject[key] = cleanedValue;
          allIssues.push(...issues);
        }
      }
    }

    return { cleanedObject, allIssues };
  }

  /**
   * Validate a medical event for data quality issues
   */
  validateMedicalEvent(event: any): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];

    // Check title
    if (!event.title || event.title === 'NaN' || event.title === 'None') {
      issues.push({
        field: 'title',
        value: event.title,
        issue: 'Invalid title value',
        severity: 'error',
        suggestedFix: 'Provide a valid title',
      });
    }

    // Check date
    if (event.date) {
      if (event.date === 'Invalid Date' || event.date === 'NaN') {
        issues.push({
          field: 'date',
          value: event.date,
          issue: 'Invalid date value',
          severity: 'error',
          suggestedFix: 'Use "Date not documented"',
        });
      } else {
        const parsedDate = new Date(event.date);
        if (isNaN(parsedDate.getTime())) {
          issues.push({
            field: 'date',
            value: event.date,
            issue: 'Invalid date format',
            severity: 'error',
            suggestedFix: 'Use ISO date format or "Date not documented"',
          });
        }
      }
    }

    // Check description
    if (event.description === 'NaN' || event.description === 'None') {
      issues.push({
        field: 'description',
        value: event.description,
        issue: 'Invalid description value',
        severity: 'warning',
        suggestedFix: 'Use null or provide valid description',
      });
    }

    // Check status
    if (event.status === 'NaN' || event.status === 'None') {
      issues.push({
        field: 'status',
        value: event.status,
        issue: 'Invalid status value',
        severity: 'warning',
        suggestedFix: 'Use null or provide valid status',
      });
    }

    return issues;
  }

  /**
   * Get a human-readable placeholder for missing data
   */
  getPlaceholderForField(fieldName: string): string {
    const fieldLower = fieldName.toLowerCase();

    if (fieldLower.includes('date')) {
      return 'Date not documented';
    }
    if (fieldLower.includes('value') || fieldLower.includes('result')) {
      return 'Value not documented';
    }
    if (fieldLower.includes('name')) {
      return 'Name not documented';
    }
    if (fieldLower.includes('age')) {
      return 'Age not documented';
    }
    if (fieldLower.includes('outcome') || fieldLower.includes('result')) {
      return 'Outcome not found in available records';
    }

    return 'Not documented';
  }
}

export const dataQualityService = DataQualityService.getInstance();
