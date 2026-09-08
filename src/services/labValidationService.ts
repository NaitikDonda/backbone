import type { ExtractedLabResult } from '../types';

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  correctedResult?: ExtractedLabResult;
}

export class LabValidationService {
  private static instance: LabValidationService;

  // Common lab test names and their expected units
  private readonly LAB_TEST_UNITS: Record<string, string[]> = {
    'hemoglobin': ['g/dL', 'g/L'],
    'fasting plasma glucose': ['mg/dL', 'mmol/L'],
    'glucose': ['mg/dL', 'mmol/L'],
    'hba1c': ['%', 'mmol/mol'],
    'creatinine': ['mg/dL', 'μmol/L'],
    'egfr': ['mL/min/1.73m²'],
    'blood urea': ['mg/dL', 'mmol/L'],
    'total cholesterol': ['mg/dL', 'mmol/L'],
    'ldl': ['mg/dL', 'mmol/L'],
    'hdl': ['mg/dL', 'mmol/L'],
    'triglycerides': ['mg/dL', 'mmol/L'],
    'vitamin b12': ['pg/mL', 'pmol/L'],
    'tsh': ['mIU/L', 'μIU/mL'],
    'platelets': ['×10³/μL', '×10⁹/L'],
    'white blood cell': ['×10³/μL', '×10⁹/L'],
    'red blood cell': ['×10⁶/μL', '×10¹²/L'],
  };

  // Common value ranges for validation
  private readonly LAB_VALUE_RANGES: Record<string, { min: number; max: number }> = {
    'hemoglobin': { min: 8, max: 18 },
    'fasting plasma glucose': { min: 50, max: 400 },
    'glucose': { min: 50, max: 400 },
    'hba1c': { min: 3, max: 15 },
    'creatinine': { min: 0.3, max: 10 },
    'egfr': { min: 5, max: 150 },
    'total cholesterol': { min: 100, max: 400 },
    'ldl': { min: 20, max: 250 },
    'hdl': { min: 20, max: 100 },
    'triglycerides': { min: 30, max: 1000 },
  };

  private constructor() {}

  static getInstance(): LabValidationService {
    if (!LabValidationService.instance) {
      LabValidationService.instance = new LabValidationService();
    }
    return LabValidationService.instance;
  }

  /**
   * Validate a single lab result
   */
  validateLabResult(result: ExtractedLabResult): ValidationResult {
    const issues: string[] = [];

    // Check if test name is empty
    if (!result.testName || result.testName.trim() === '') {
      issues.push('Test name is empty');
      return { isValid: false, issues };
    }

    // Check if value is empty
    if (!result.value || result.value.trim() === '') {
      issues.push('Value is empty');
      return { isValid: false, issues };
    }

    // Normalize test name for matching
    const normalizedTestName = this.normalizeTestName(result.testName);

    // Validate unit compatibility
    if (result.unit) {
      const expectedUnits = this.getExpectedUnits(normalizedTestName);
      if (expectedUnits.length > 0 && !expectedUnits.includes(result.unit)) {
        issues.push(`Unit "${result.unit}" may not be compatible with test "${result.testName}". Expected: ${expectedUnits.join(', ')}`);
      }
    }

    // Validate value range
    const numericValue = this.extractNumericValue(result.value);
    if (numericValue !== null) {
      const expectedRange = this.getValueRange(normalizedTestName);
      if (expectedRange && (numericValue < expectedRange.min || numericValue > expectedRange.max)) {
        issues.push(`Value ${numericValue} is outside expected range for "${result.testName}" (${expectedRange.min}-${expectedRange.max}). This may indicate a test/value mismatch.`);
      }
    }

    // Check for common mismatches
    const mismatch = this.detectCommonMismatch(normalizedTestName, result.value, result.unit);
    if (mismatch) {
      issues.push(mismatch);
    }

    return {
      isValid: issues.length === 0,
      issues,
      correctedResult: issues.length === 0 ? result : this.markForReview(result, issues),
    };
  }

  /**
   * Validate multiple lab results and detect cross-test value swaps
   */
  validateLabResults(results: ExtractedLabResult[]): ValidationResult[] {
    const validations = results.map(r => this.validateLabResult(r));

    // Detect possible value swaps between adjacent tests
    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i];
      const next = results[i + 1];

      const swapDetected = this.detectValueSwap(current, next);
      if (swapDetected) {
        validations[i].issues.push(swapDetected);
        validations[i].isValid = false;
        validations[i + 1].issues.push(swapDetected);
        validations[i + 1].isValid = false;
      }
    }

    return validations;
  }

  /**
   * Normalize test name for matching (lowercase, remove spaces, special chars)
   */
  private normalizeTestName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Get expected units for a test
   */
  private getExpectedUnits(normalizedName: string): string[] {
    for (const [test, units] of Object.entries(this.LAB_TEST_UNITS)) {
      if (normalizedName.includes(this.normalizeTestName(test))) {
        return units;
      }
    }
    return [];
  }

  /**
   * Get expected value range for a test
   */
  private getValueRange(normalizedName: string): { min: number; max: number } | null {
    for (const [test, range] of Object.entries(this.LAB_VALUE_RANGES)) {
      if (normalizedName.includes(this.normalizeTestName(test))) {
        return range;
      }
    }
    return null;
  }

  /**
   * Extract numeric value from string
   */
  private extractNumericValue(value: string): number | null {
    const match = value.match(/[\d.]+/);
    if (match) {
      const num = parseFloat(match[0]);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Detect common test/value mismatches
   */
  private detectCommonMismatch(testName: string, value: string, unit: string | null): string | null {
    const normalizedTest = testName;
    const numericValue = this.extractNumericValue(value);

    // Hemoglobin should not be in mg/dL (that's glucose territory)
    if (normalizedTest.includes('hemoglobin') && unit === 'mg/dL') {
      return `Hemoglobin value ${value} with unit mg/dL is likely incorrect. Hemoglobin is typically measured in g/dL. This may be a glucose value assigned to hemoglobin.`;
    }

    // Glucose should not be in g/dL (that's hemoglobin territory)
    if ((normalizedTest.includes('glucose') || normalizedTest.includes('fasting')) && unit === 'g/dL') {
      return `Glucose value ${value} with unit g/dL is likely incorrect. Glucose is typically measured in mg/dL or mmol/L. This may be a hemoglobin value assigned to glucose.`;
    }

    // HbA1c should be a percentage or mmol/mol, not a large number like 98
    if (normalizedTest.includes('hba1c') || normalizedTest.includes('a1c')) {
      if (numericValue !== null && numericValue > 20) {
        return `HbA1c value ${value} is outside typical range (3-15%). This may be a glucose value assigned to HbA1c.`;
      }
    }

    return null;
  }

  /**
   * Detect possible value swaps between adjacent tests
   */
  private detectValueSwap(current: ExtractedLabResult, next: ExtractedLabResult): string | null {
    const currentValue = this.extractNumericValue(current.value);
    const nextValue = this.extractNumericValue(next.value);

    if (currentValue === null || nextValue === null) {
      return null;
    }

    const currentTest = this.normalizeTestName(current.testName);
    const nextTest = this.normalizeTestName(next.testName);

    // Check if current value looks like it belongs to next test
    const currentRange = this.getValueRange(currentTest);
    const nextRange = this.getValueRange(nextTest);

    if (currentRange && nextRange) {
      const currentInNextRange = currentValue >= nextRange.min && currentValue <= nextRange.max;
      const nextInCurrentRange = nextValue >= currentRange.min && nextValue <= currentRange.max;

      if (currentInNextRange && nextInCurrentRange) {
        return `Possible value swap detected: "${current.testName}" (${currentValue}) and "${next.testName}" (${nextValue}). Values may be exchanged.`;
      }
    }

    return null;
  }

  /**
   * Mark result for review with validation issues
   */
  private markForReview(result: ExtractedLabResult, issues: string[]): ExtractedLabResult {
    return {
      ...result,
      validated: false,
      sourceText: `${result.sourceText} [VALIDATION ISSUES: ${issues.join('; ')}]`,
    };
  }
}

export const labValidationService = LabValidationService.getInstance();
