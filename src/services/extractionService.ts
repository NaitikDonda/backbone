import type { StructuredExtraction, ExtractedPatientInfo } from '../types';
import { labValidationService } from './labValidationService';
import { dateValidationService } from './dateValidationService';

export interface ExtractionError {
  message: string;
  code: 'NO_TEXT' | 'OLLAMA_ERROR' | 'INVALID_JSON' | 'MODEL_ERROR';
}

export class ExtractionService {
  private static instance: ExtractionService;
  private ollamaBaseUrl: string;

  private constructor() {
    this.ollamaBaseUrl = 'http://localhost:11434';
  }

  static getInstance(): ExtractionService {
    if (!ExtractionService.instance) {
      ExtractionService.instance = new ExtractionService();
    }
    return ExtractionService.instance;
  }

  async extractMedicalInformation(
    text: string,
    recordId: string,
    pages?: Array<{ pageNumber: number; text: string }>
  ): Promise<StructuredExtraction> {
    if (!text || text.trim().length === 0) {
      throw {
        message: 'No text available for extraction',
        code: 'NO_TEXT',
      } as ExtractionError;
    }

    console.log(`[ExtractionService] Starting extraction for record ${recordId}`);
    console.log(`[ExtractionService] Input text length: ${text.length} chars`);
    console.log(`[ExtractionService] Number of pages: ${pages?.length || 0}`);

    // Store original text for fallback parsing
    const originalText = text;

    // Increase text limit for better extraction completeness
    const MAX_TEXT_LENGTH = 50000;
    let textToProcess = text;
    if (text.length > MAX_TEXT_LENGTH) {
      console.log(`[ExtractionService] Text too long (${text.length} chars), truncating to ${MAX_TEXT_LENGTH}`);
      textToProcess = text.substring(0, MAX_TEXT_LENGTH) + '\n\n[Text truncated due to length]';
    }

    try {
      const prompt = this.buildExtractionPrompt(textToProcess, recordId, pages);
      const response = await this.callOllama(prompt);

      const extraction = this.parseAndValidateExtraction(response, recordId, pages, originalText);

      // Log extraction quality metrics
      console.log(`[ExtractionService] Extraction complete for record ${recordId}`);
      console.log(`[ExtractionService] Extracted entities:`);
      console.log(`  - Patient info: ${extraction.patient.name ? extraction.patient.name : 'N/A'}`);
      console.log(`  - Symptoms: ${extraction.symptoms.length}`);
      console.log(`  - Diagnoses: ${extraction.diagnoses.length}`);
      console.log(`  - Lab results: ${extraction.labResults.length}`);
      console.log(`  - Medications: ${extraction.medications.length}`);
      console.log(`  - Procedures: ${extraction.procedures.length}`);
      console.log(`  - Findings: ${extraction.findings.length}`);
      console.log(`  - Allergies: ${extraction.allergies.length}`);
      console.log(`  - Referrals: ${extraction.referrals.length}`);
      console.log(`  - Follow-ups: ${extraction.followUps.length}`);
      console.log(`  - Investigation plans: ${extraction.investigationPlans.length}`);
      console.log(`  - Outcomes: ${extraction.outcomes.length}`);
      console.log(`  - Medical history: ${extraction.medicalHistory.length}`);

      return extraction;
    } catch (error) {
      if (this.isExtractionError(error)) {
        throw error;
      }
      throw {
        message: 'Medical information extraction failed',
        code: 'OLLAMA_ERROR',
      } as ExtractionError;
    }
  }

  private buildExtractionPrompt(text: string, _recordId: string, _pages?: Array<{ pageNumber: number; text: string }>): string {
    return `Extract medical information from this medical record text and return ONLY this JSON:

{
  "patient": {"name": "", "age": null, "sex": "", "dateOfBirth": ""},
  "encounter": {"date": "", "type": "", "facility": "", "department": "", "reason": ""},
  "symptoms": [],
  "diagnoses": [],
  "labResults": [],
  "medications": [],
  "procedures": [],
  "findings": [],
  "allergies": [],
  "referrals": [],
  "followUps": [],
  "investigationPlans": [],
  "outcomes": [],
  "medicalHistory": []
}

CRITICAL RULES:
1. EXCLUDE from ALL fields: addresses, phone numbers, email addresses, clinic names, doctor names, signatures, disclaimers, footers, page numbers, "SYNTHETIC DATA" warnings, lab report headers, accession numbers, specimen types, collection dates (unless it's the encounter date), "Reg. No.", "Emp. ID", "e-signed", "NABL", "ISO", "Metropolis Healthcare", "AROGYA PATH", "Sunrise Corporate Tower", "Andheri West", "Mumbai", "Maharashtra", "India", "Ph:", "Email:", "Page 1", "Page 2", "Page 3"

2. DIAGNOSES must ONLY be medical conditions or diseases. Examples of VALID diagnoses: "Type 2 Diabetes Mellitus", "Hypertension", "Dyslipidemia", "Diabetic Nephropathy", "Subclinical Hypothyroidism". Examples of INVALID: "Sunrise Corporate Tower", "Andheri West", "Mumbai 400058", "MD (Pathology)", "DMLT Lab Technician", "please contact the laboratory"

3. DATES: Extract dates in YYYY-MM-DD format. Look for "Collection Date", "Report Date", "Date of Birth", or dates associated with diagnoses/medications. If no clear date is found, use null. Do NOT extract random numbers as dates.

4. SYMPTOMS: Only extract patient-reported symptoms like "fever", "headache", "chest pain". Exclude lab test names, vitals, or procedure names.

5. MEDICATIONS: Only extract actual drug names with dosages. Exclude "Specimen", "Venous blood", "EDTA/Plain/Fluoride", "Random Urine", "Fasting Status"

6. LAB RESULTS: Only extract test-result pairs. Exclude the entire lab report header, footer, and metadata.

Extract:
- Patient: name, age, sex, date of birth
- Encounter: date, type, facility, department, reason
- Symptoms: name, date, duration, severity, certainty, status
- Diagnoses: name, date, status, certainty (ONLY medical conditions)
- Lab results: test name, value, unit, reference range, abnormal flag, date
- Medications: name, dosage, frequency, route, start date, end date
- Procedures: name, date, result, finding
- Findings: text descriptions
- Allergies: name, severity, reaction, status
- Referrals: specialty, reason, date, status
- Follow-ups: type, reason, date, status
- Investigation plans: test name, reason, planned date, status
- Outcomes: description, category, date
- Medical history: condition, type, date, status

Return ONLY the JSON above with extracted data. No other text.

MEDICAL RECORD TEXT:
${text}`;
  }

  private async callOllama(prompt: string): Promise<string> {
    console.log('[ExtractionService] Calling Ollama with prompt length:', prompt.length);

    const systemPrompt = `You are a JSON data extractor. Your ONLY job is to extract structured data and return it as JSON.
You MUST return the exact JSON structure specified in the prompt.
Do NOT summarize, do NOT reformat, do NOT add explanations.
Return ONLY the JSON object with the fields: patient, encounter, symptoms, diagnoses, labResults, medications, procedures, findings, allergies, referrals, followUps, investigationPlans, outcomes, medicalHistory.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-6-astra',
          system: systemPrompt,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.0,
            num_ctx: 4096,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ExtractionService] Ollama API error:', response.status, errorText);
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[ExtractionService] Ollama response length:', data.response?.length || 0);
      console.log('[ExtractionService] Ollama response preview:', data.response?.substring(0, 500));
      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama request timed out after 120 seconds');
      }
      console.error('[ExtractionService] Ollama call error:', error);
      throw error;
    }
  }

  private parseAndValidateExtraction(
    response: string,
    recordId: string,
    _pages?: Array<{ pageNumber: number; text: string }>,
    originalText?: string
  ): StructuredExtraction {
    try {
      console.log('[ExtractionService] Parsing response, length:', response.length);
      console.log('[ExtractionService] Full response:', response);

      // Try to extract JSON from response
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[ExtractionService] No JSON object found in response');
        throw new Error('No JSON object found in response');
      }

      let jsonText = jsonMatch[0];
      console.log('[ExtractionService] JSON text length after extraction:', jsonText.length);
      console.log('[ExtractionService] JSON text:', jsonText);

      // Try to parse the JSON
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
        console.log('[ExtractionService] Parsed JSON keys:', Object.keys(parsed));

        // Check if Ollama returned the wrong structure (e.g., summary format)
        if (!parsed.patient && !parsed.symptoms && !parsed.diagnoses && !parsed.medications) {
          console.warn('[ExtractionService] Ollama returned wrong JSON structure, using fallback parser');
          return this.parseFromText(response, recordId, originalText);
        }
      } catch (parseError) {
        console.error('[ExtractionService] JSON parse error:', parseError);
        // Try to repair common JSON issues
        jsonText = this.repairJson(jsonText);
        console.log('[ExtractionService] Attempting to parse repaired JSON');
        parsed = JSON.parse(jsonText);
        console.log('[ExtractionService] Repaired JSON parsed successfully');

        // Check structure after repair
        if (!parsed.patient && !parsed.symptoms && !parsed.diagnoses && !parsed.medications) {
          console.warn('[ExtractionService] Repaired JSON has wrong structure, using fallback parser');
          return this.parseFromText(response, recordId, originalText);
        }
      }

      // Normalize the parsed data
      const normalized = this.normalizeParsedData(parsed);

      // Map to our schema
      const extraction: StructuredExtraction = {
        patient: this.mapPatientInfo(normalized.patient || normalized.patient_info || {}),
        encounter: this.mapEncounterInfo(normalized.encounter || normalized.encounter_info || {}),
        symptoms: this.mapSymptoms(normalized.symptoms || []),
        diagnoses: this.mapDiagnoses(normalized.diagnoses || []),
        labResults: this.mapLabResults(normalized.labResults || normalized.lab_results || []),
        medications: this.mapMedications(normalized.medications || []),
        procedures: this.mapProcedures(normalized.procedures || []),
        findings: normalized.findings || [],
        allergies: this.mapAllergies(normalized.allergies || []),
        referrals: this.mapReferrals(normalized.referrals || []),
        followUps: this.mapFollowUps(normalized.followUps || []),
        investigationPlans: this.mapInvestigationPlans(normalized.investigationPlans || []),
        outcomes: this.mapOutcomes(normalized.outcomes || []),
        medicalHistory: this.mapMedicalHistory(normalized.medicalHistory || []),
        sourceRecordId: recordId,
        extractedAt: new Date().toISOString(),
      };

      // Validate lab results
      if (extraction.labResults.length > 0) {
        const validations = labValidationService.validateLabResults(extraction.labResults);
        const hasIssues = validations.some(v => !v.isValid);
        if (hasIssues) {
          console.log('[ExtractionService] Lab validation issues detected:', validations.filter(v => !v.isValid).map(v => v.issues));
          extraction.labResults = validations.map((v, i) => v.correctedResult || extraction.labResults[i]);
        }
      }

      return extraction;
    } catch (error) {
      console.error('[ExtractionService] Parse error:', error);
      console.error('[ExtractionService] Full response:', response);
      // Fallback to text-based parsing
      console.warn('[ExtractionService] Using fallback text parser');
      return this.parseFromText(response, recordId, originalText);
    }
  }

  /**
   * Fallback parser to extract entities from text-based response
   * Used when Ollama returns wrong JSON structure
   */
  private parseFromText(text: string, recordId: string, originalText?: string): StructuredExtraction {
    console.log('[ExtractionService] Using fallback text parser');

    // Use original OCR text if available, otherwise use the response text
    const textToParse = originalText || text;

    const extraction: StructuredExtraction = {
      patient: { name: null, age: null, sex: null, dateOfBirth: null, patientId: null },
      encounter: { date: null, type: null, facility: null, department: null, reason: null },
      symptoms: [],
      diagnoses: [],
      labResults: [],
      medications: [],
      procedures: [],
      findings: [],
      allergies: [],
      referrals: [],
      followUps: [],
      investigationPlans: [],
      outcomes: [],
      medicalHistory: [],
      sourceRecordId: recordId,
      extractedAt: new Date().toISOString(),
    };

    // Extract patient name - be more specific to avoid capturing too much text
    const nameMatch = textToParse.match(/Patient Name:\s*([A-Za-z\s]+?)(?:\n|$)/i);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      // Only use if it looks like a name (2-3 words, reasonable length)
      if (name.split(' ').length >= 2 && name.split(' ').length <= 4 && name.length < 50) {
        extraction.patient.name = name;
      }
    }

    // Extract age
    const ageMatch = textToParse.match(/Age:\s*(\d+)/i);
    if (ageMatch) {
      extraction.patient.age = parseInt(ageMatch[1]);
    }

    // Extract symptoms
    const symptomMatch = textToParse.match(/Chief Complaint:\s*([^\n]+)/i);
    if (symptomMatch) {
      const symptoms = symptomMatch[1].split(',').map(s => s.trim()).filter(s => s);
      extraction.symptoms = symptoms.map(s => ({
        name: s,
        date: null,
        duration: null,
        severity: null,
        certainty: 'present' as const,
        status: null,
        sourceText: s,
      }));
    }

    // Extract diagnoses - handle multiple formats
    const diagnosisSection = textToParse.match(/(?:History|Diagnosis|Diagnoses):\s*([^\n]+)/i);
    if (diagnosisSection) {
      const diagnoses = diagnosisSection[1].split(',').map(d => d.trim()).filter(d => d);
      extraction.diagnoses = diagnoses.map(d => ({
        name: d,
        date: null,
        status: 'active',
        certainty: 'confirmed' as const,
        datePrecision: 'unknown' as const,
        sourceText: d,
      }));
    }

    // Also extract diagnoses from table format (Diagnosis column)
    const diagnosisTableMatches = textToParse.matchAll(/Type 2 Diabetes Mellitus|Diabetic Nephropathy|Hypertension|Dyslipidemia|Obesity|Gastro-esophageal/gi);
    for (const match of diagnosisTableMatches) {
      const diagnosisName = match[0].trim();
      if (!extraction.diagnoses.some(d => d.name === diagnosisName)) {
        extraction.diagnoses.push({
          name: diagnosisName,
          date: null,
          status: 'active',
          certainty: 'confirmed' as const,
          datePrecision: 'unknown' as const,
          sourceText: diagnosisName,
        });
      }
    }

    // Extract medications
    const medicationMatches = textToParse.matchAll(/\*\s*([^*]+)\s*(\d+\s*(?:mg|mcg|g|ml|units)?)\s*(BD|OD|TID|QID|PRN|daily|weekly)/gi);
    for (const match of medicationMatches) {
      extraction.medications.push({
        name: match[1].trim(),
        dosage: match[2].trim(),
        frequency: match[3].trim(),
        route: null,
        startDate: null,
        endDate: null,
        duration: null,
        sourceText: match[0].trim(),
      });
    }

    // Extract lab results from table format
    const labTableMatches = textToParse.matchAll(/<td>([^<]+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td>/gi);
    for (const match of labTableMatches) {
      const testName = match[1].trim();
      const value = match[2].trim();
      const unit = match[3].trim();

      // Skip if not a valid lab test
      if (testName && value && !testName.includes('CLINICAL IMPRESSION')) {
        extraction.labResults.push({
          testName,
          value,
          unit,
          referenceRange: null,
          isAbnormal: null,
          date: null,
          datePrecision: 'unknown' as const,
          sourceText: `${testName}: ${value} ${unit}`,
        });
      }
    }

    // Also extract lab results from text format
    const labMatches = textToParse.matchAll(/(\w+):\s*([\d.]+\s*(?:%|mg\/dL|mmol\/L|U\/L|ng\/mL|mg\/g|mL\/min))/gi);
    for (const match of labMatches) {
      const [_, testName, valueWithUnit] = match;
      const valueMatch = valueWithUnit.match(/([\d.]+)\s*(.+)/);
      if (valueMatch) {
        extraction.labResults.push({
          testName: testName.trim(),
          value: valueMatch[1],
          unit: valueMatch[2],
          referenceRange: null,
          isAbnormal: null,
          date: null,
          datePrecision: 'unknown' as const,
          sourceText: match[0].trim(),
        });
      }
    }

    // Extract allergies
    const allergyMatch = textToParse.match(/Allergy:\s*([^\n]+)/i);
    if (allergyMatch) {
      extraction.allergies.push({
        name: allergyMatch[1].trim(),
        severity: null,
        reaction: null,
        status: 'active',
        sourceText: allergyMatch[1].trim(),
      });
    }

    // Extract allergies from table format
    const allergyTableMatches = textToParse.matchAll(/Sulfonamide|Penicillin|Aspirin/gi);
    for (const match of allergyTableMatches) {
      const allergyName = match[0].trim();
      if (!extraction.allergies.some(a => a.name === allergyName)) {
        extraction.allergies.push({
          name: allergyName,
          severity: null,
          reaction: null,
          status: 'active',
          sourceText: allergyName,
        });
      }
    }

    console.log('[ExtractionService] Fallback parser extracted:', {
      patient: extraction.patient.name,
      symptoms: extraction.symptoms.length,
      diagnoses: extraction.diagnoses.length,
      medications: extraction.medications.length,
      labResults: extraction.labResults.length,
      allergies: extraction.allergies.length,
    });

    return extraction;
  }

  private repairJson(jsonText: string): string {
    console.log('[ExtractionService] Attempting JSON repair');

    // Remove trailing commas
    let repaired = jsonText.replace(/,\s*([}\]])/g, '$1');

    // Fix unterminated strings
    const stringMatches = repaired.match(/"([^"\\]*(\\.[^"\\]*)*)/g);
    if (stringMatches) {
      stringMatches.forEach(match => {
        if (!match.endsWith('"')) {
          repaired = repaired.replace(match, match + '"');
        }
      });
    }

    // Close unclosed braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }

    // Close unclosed brackets
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }

    console.log('[ExtractionService] Repaired JSON length:', repaired.length);
    return repaired;
  }

  private normalizeParsedData(parsed: any): any {
    const arrayFields = [
      'symptoms', 'diagnoses', 'lab_results', 'labResults',
      'medications', 'procedures', 'findings', 'allergies', 'referrals',
      'followUps', 'investigationPlans', 'outcomes', 'medicalHistory'
    ];

    const normalized = { ...parsed };

    for (const field of arrayFields) {
      if (normalized[field] && typeof normalized[field] === 'string') {
        const value = normalized[field];
        if (value.trim() === '' || value === 'None' || value === 'none') {
          normalized[field] = [];
        } else {
          normalized[field] = value.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        }
        console.log(`[ExtractionService] Normalized ${field} from string to array:`, normalized[field]);
      }
    }

    return normalized;
  }

  private mapPatientInfo(patientInfo: any): ExtractedPatientInfo {
    const rawName = patientInfo.name || null;
    
    // Validate patient name - reject if it contains document metadata
    const invalidKeywords = [
      'Date of Birth', 'Gender', 'Patient ID', 'Location', 'Report Period',
      'INDEX OF REPORTS', 'Collection Date', 'Reason for Visit', 'Total Reports',
      'Included', 'Clinical Impression', 'History of Present Illness'
    ];
    
    let validatedName: string | null = null;
    if (rawName && typeof rawName === 'string') {
      const nameLower = rawName.toLowerCase();
      const hasInvalidKeyword = invalidKeywords.some(keyword => 
        nameLower.includes(keyword.toLowerCase())
      );
      
      // Also reject if name is too long (likely not a real name)
      const isTooLong = rawName.length > 100;
      
      // Also reject if it contains multiple colons or newlines (document structure)
      const hasDocumentStructure = rawName.includes(':') && rawName.split(':').length > 2;
      
      if (!hasInvalidKeyword && !isTooLong && !hasDocumentStructure) {
        validatedName = rawName.trim();
      }
    }
    
    return {
      name: validatedName,
      dateOfBirth: patientInfo.dateOfBirth || patientInfo.date_of_birth || null,
      age: patientInfo.age || null,
      sex: patientInfo.sex || null,
      patientId: patientInfo.patientId || patientInfo.patient_id || null,
    };
  }

  private mapEncounterInfo(info: any): any {
    return {
      date: info.date || null,
      type: info.type || null,
      facility: info.facility || null,
      department: info.department || null,
      reason: info.reason || null,
    };
  }

  private mapSymptoms(symptoms: any[]): any[] {
    return symptoms.map(s => {
      const dateValidation = dateValidationService.validateDate(s.date || null, s.sourceText || s.name || '');
      const durationValidation = dateValidationService.validateDuration(s.duration || null, s.sourceText || s.name || '');

      return {
        name: s.name || '',
        date: dateValidation.normalizedDate,
        duration: durationValidation.normalizedDuration,
        severity: s.severity || null,
        certainty: s.certainty || 'present',
        status: s.status || null,
        datePrecision: dateValidation.datePrecision,
        sourceText: s.sourceText || s.name || '',
      };
    });
  }

  private mapDiagnoses(diagnoses: any[]): any[] {
    return diagnoses.map(d => {
      const dateValidation = dateValidationService.validateDate(d.date || null, d.sourceText || d.name || '');

      return {
        name: d.name || '',
        date: dateValidation.normalizedDate,
        status: d.status || 'active',
        certainty: d.certainty || 'confirmed',
        datePrecision: dateValidation.datePrecision,
        sourceText: d.sourceText || d.name || '',
      };
    });
  }

  private mapLabResults(labs: any[]): any[] {
    return labs.map(l => {
      const dateValidation = dateValidationService.validateDate(l.date || null, l.sourceText || `${l.testName || l.name}: ${l.value || ''} ${l.unit || ''}` || '');

      return {
        testName: l.testName || l.name || '',
        value: l.value || '',
        unit: l.unit || null,
        referenceRange: l.referenceRange || null,
        isAbnormal: l.isAbnormal || null,
        date: dateValidation.normalizedDate,
        datePrecision: dateValidation.datePrecision,
        sourceText: l.sourceText || `${l.testName || l.name}: ${l.value || ''} ${l.unit || ''}` || '',
      };
    });
  }

  private mapMedications(meds: any[]): any[] {
    return meds.map(m => ({
      name: m.name || '',
      dosage: m.dosage || null,
      frequency: m.frequency || null,
      route: m.route || null,
      startDate: m.startDate || null,
      endDate: m.endDate || null,
      duration: m.duration || null,
      sourceText: m.sourceText || `${m.name} ${m.dosage || ''}` || '',
    }));
  }

  private mapProcedures(procedures: any[]): any[] {
    return procedures.map(p => {
      const dateValidation = dateValidationService.validateDate(p.date || null, p.sourceText || p.name || '');

      return {
        name: p.name || '',
        date: dateValidation.normalizedDate,
        result: p.result || null,
        finding: p.finding || null,
        status: p.status || null,
        datePrecision: dateValidation.datePrecision,
        sourceText: p.sourceText || p.name || '',
      };
    });
  }

  private mapAllergies(allergies: any[]): any[] {
    return allergies.map(a => ({
      name: a.name || '',
      severity: a.severity || null,
      reaction: a.reaction || null,
      status: a.status || 'active',
      sourceText: a.sourceText || a.name || '',
    }));
  }

  private mapReferrals(referrals: any[]): any[] {
    return referrals.map(r => ({
      specialty: r.specialty || '',
      reason: r.reason || null,
      date: r.date || null,
      status: r.status || 'unknown',
      sourceText: r.sourceText || `${r.specialty} referral` || '',
    }));
  }

  private mapFollowUps(followUps: any[]): any[] {
    return followUps.map(f => ({
      type: f.type || '',
      reason: f.reason || null,
      date: f.date || null,
      status: f.status || 'unknown',
      sourceText: f.sourceText || f.type || '',
    }));
  }

  private mapInvestigationPlans(plans: any[]): any[] {
    return plans.map(p => ({
      testName: p.testName || p.name || '',
      reason: p.reason || null,
      plannedDate: p.plannedDate || p.date || null,
      status: p.status || 'planned',
      sourceText: p.sourceText || `${p.testName || p.name} investigation` || '',
    }));
  }

  private mapOutcomes(outcomes: any[]): any[] {
    return outcomes.map(o => ({
      description: o.description || '',
      category: o.category || 'other',
      date: o.date || null,
      sourceText: o.sourceText || o.description || '',
    }));
  }

  private mapMedicalHistory(history: any[]): any[] {
    return history.map(h => ({
      condition: h.condition || '',
      type: h.type || 'condition',
      date: h.date || null,
      status: h.status || null,
      sourceText: h.sourceText || h.condition || '',
    }));
  }

  private isExtractionError(error: unknown): error is ExtractionError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'code' in error
    );
  }
}

export const extractionService = ExtractionService.getInstance();
