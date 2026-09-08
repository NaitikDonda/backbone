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

    // Increase text limit for better extraction completeness
    const MAX_TEXT_LENGTH = 20000; // Increased from 8000 to capture more information
    let textToProcess = text;
    if (text.length > MAX_TEXT_LENGTH) {
      console.log(`[ExtractionService] Text too long (${text.length} chars), truncating to ${MAX_TEXT_LENGTH}`);
      textToProcess = text.substring(0, MAX_TEXT_LENGTH) + '\n\n[Text truncated due to length]';
    }

    try {
      const prompt = this.buildExtractionPrompt(textToProcess, recordId, pages);
      const response = await this.callOllama(prompt);
      
      const extraction = this.parseAndValidateExtraction(response, recordId, pages);
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
    return `Extract medical information from this text as JSON.

IMPORTANT: Return ONLY arrays for multi-value fields (symptoms, diagnoses, lab results, medications, procedures, findings, allergies, referrals, follow-ups, investigation plans, outcomes, medical history). Do NOT return comma-separated strings.

Required JSON structure:
{
  "patient_info": {"name": "...", "age": ..., "sex": "...", "date": "..."},
  "encounter_info": {"date": "...", "type": "...", "facility": "...", "department": "...", "physician": "..."},
  "symptoms": [{"name": "...", "date": "...", "duration": "...", "severity": "...", "certainty": "present", "status": "..."}],
  "diagnoses": [{"name": "...", "date": "...", "status": "...", "certainty": "..."}],
  "lab_results": [{"testName": "...", "value": "...", "unit": "...", "referenceRange": "...", "isAbnormal": ..., "date": "..."}],
  "medications": [{"name": "...", "dosage": "...", "frequency": "...", "route": "...", "startDate": "...", "endDate": "..."}],
  "procedures": [{"name": "...", "date": "...", "result": "...", "finding": "..."}],
  "findings": ["..."],
  "allergies": [{"name": "...", "severity": "...", "reaction": "...", "status": "..."}],
  "referrals": [{"specialty": "...", "reason": "...", "date": "...", "status": "..."}],
  "follow_ups": [{"type": "...", "reason": "...", "date": "...", "status": "..."}],
  "investigation_plans": [{"testName": "...", "reason": "...", "plannedDate": "...", "status": "..."}],
  "outcomes": [{"description": "...", "category": "...", "date": "..."}],
  "medical_history": [{"condition": "...", "type": "...", "date": "...", "status": "..."}]
}

Extract these categories if present:
- Patient info (name, age, sex, date)
- Encounter info (date, type, facility, department, physician)
- Symptoms (name, date, duration, severity, certainty, status) - MUST be array of objects
- Diagnoses (name, date, status, certainty) - Look for ASSESSMENT section - MUST be array of objects
- Lab results (test name, value, unit, reference range, abnormal flag) - Only EXTRACTED results, not planned tests - MUST be array of objects
- Medications (name, dosage, frequency, route, start date, end date) - If "None" or "No medications", return empty array - MUST be array of objects
- Procedures (name, date, result, finding) - Look for PLAN section for planned procedures/referrals - MUST be array of objects
- Findings (text, category) - Look for PHYSICAL EXAM, NEUROLOGICAL EXAM sections - MUST be array of strings
- Allergies (name, severity, reaction, status) - Look for ALLERGIES section - MUST be array of objects
- Referrals (specialty, reason, date, status) - Look for REFERRALS section - MUST be array of objects
- Follow-ups (type, reason, date, status) - Look for FOLLOW-UP section - MUST be array of objects
- Investigation plans (test name, reason, planned date, status) - Look for PLAN section - MUST be array of objects
- Documented outcomes (procedure outcomes, treatment responses, resolution status) - MUST be array of objects
- Relevant medical history (conditions, surgeries, hospitalizations) - Look for HISTORY section - MUST be array of objects

CRITICAL RULES:
- ONLY extract information EXPLICITLY stated in the text
- Do NOT infer diagnoses from lab results
- Handle negation correctly: "denies X" = X is absent/denied, "None" = empty array
- Handle uncertainty correctly: "possible X" = X is suspected, "rule out X" = X is ruled_out
- Preserve status information: "ongoing", "resolved", "chronic", "completed", "unresolved", etc.
- ASSESSMENT section contains diagnoses/assessments with status (e.g., "Fatigue - ongoing")
- PLAN section contains planned actions, not actual results (e.g., "Repeat Vitamin B12 level" is a plan, not a result)
- Distinguish between planned tests and actual lab results
- If medications list says "None" or "No medications", return empty medications array
- For dates: if exact date not provided, use approximate format (e.g., "2013", "approximately 2013") - do NOT invent exact day/month
- For lab values: ensure test name matches its value and unit - do not swap values between tests
- For durations: only calculate if source explicitly provides it - do not invent durations
- ALL multi-value fields MUST be arrays, NOT comma-separated strings

Return ONLY the JSON object. No markdown, no explanations.

TEXT:
${text}`;
  }

  private async callOllama(prompt: string): Promise<string> {
    console.log('[ExtractionService] Calling Ollama with prompt length:', prompt.length);
    
    const systemPrompt = `You are a medical information extraction system. 
You MUST respond ONLY with valid JSON. 
Do NOT include any conversational text, explanations, or markdown formatting.
Your entire response must be a single JSON object.
If you cannot extract information, return an empty JSON object with the requested structure.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          system: systemPrompt,
          prompt,
          stream: false,
          format: 'json', // Force JSON output
          options: {
            temperature: 0.1, // Low temperature for more deterministic output
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ExtractionService] Ollama response length:', data.response?.length || 0);
      console.log('[ExtractionService] Ollama response preview:', data.response?.substring(0, 500));
      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama request timed out after 60 seconds');
      }
      throw error;
    }
  }

  private parseAndValidateExtraction(
    response: string,
    recordId: string,
    _pages?: Array<{ pageNumber: number; text: string }>
  ): StructuredExtraction {
    try {
      console.log('[ExtractionService] Parsing response, length:', response.length);
      
      // Try to extract JSON from response (may be wrapped in markdown)
      let jsonText = response;
      
      // Remove markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*({[\s\S]*})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
        console.log('[ExtractionService] Extracted JSON from markdown code block');
      }
      
      // Try to find JSON object in the response
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch && !jsonMatch) {
        jsonText = objectMatch[0];
        console.log('[ExtractionService] Extracted JSON from response using object match');
      }
      
      console.log('[ExtractionService] JSON text length after extraction:', jsonText.length);
      console.log('[ExtractionService] JSON text preview:', jsonText.substring(0, 200));
      
      const parsed = JSON.parse(jsonText);
      console.log('[ExtractionService] JSON parsed successfully, keys:', Object.keys(parsed));
      
      // Normalize parsed data - ensure arrays are always arrays, not strings
      const normalized = this.normalizeParsedData(parsed);
      
      // Map model's key naming to our schema
      const extraction: StructuredExtraction = {
        patient: this.mapPatientInfo(normalized.patient_info || normalized.patient || normalized['Patient Info'] || normalized.patientInfo || {}),
        encounter: this.mapEncounterInfo(normalized.encounter_info || normalized.encounter || normalized['Encounter Info'] || normalized.encounterInfo || {}),
        symptoms: this.mapSymptoms(normalized.symptoms || normalized.Symptoms || []),
        diagnoses: this.mapDiagnoses(normalized.diagnoses || normalized.Diagnoses || []),
        labResults: this.mapLabResults(normalized.lab_results || normalized.labResults || normalized['Lab Results'] || normalized.lab_results || []),
        medications: this.mapMedications(normalized.medications || normalized.Medications || []),
        procedures: this.mapProcedures(normalized.procedures || normalized.Procedures || []),
        findings: normalized.findings || [],
        allergies: this.mapAllergies(normalized.allergies || normalized.Allergies || []),
        referrals: this.mapReferrals(normalized.referrals || normalized.Referrals || []),
        followUps: this.mapFollowUps(normalized.follow_ups || normalized.followUps || normalized['Follow-ups'] || []),
        investigationPlans: this.mapInvestigationPlans(normalized.investigation_plans || normalized.investigationplans || normalized['Investigation Plans'] || []),
        outcomes: this.mapOutcomes(normalized.outcomes || normalized.Outcomes || []),
        medicalHistory: this.mapMedicalHistory(normalized.medical_history || normalized.medicalHistory || normalized['Medical History'] || []),
        sourceRecordId: recordId,
        extractedAt: new Date().toISOString(),
      };

      // Validate lab results for test/value/unit mismatches
      if (extraction.labResults.length > 0) {
        const validations = labValidationService.validateLabResults(extraction.labResults);
        const hasIssues = validations.some(v => !v.isValid);
        if (hasIssues) {
          console.log('[ExtractionService] Lab validation issues detected:', validations.filter(v => !v.isValid).map(v => v.issues));
          // Apply corrections where possible
          extraction.labResults = validations.map((v, i) => v.correctedResult || extraction.labResults[i]);
        }
      }

      return extraction;
    } catch (error) {
      console.error('[ExtractionService] Parse error:', error);
      console.error('[ExtractionService] Full response (first 1000 chars):', response.substring(0, 1000));
      throw {
        message: 'Failed to parse extraction response as JSON',
        code: 'INVALID_JSON',
      } as ExtractionError;
    }
  }

  /**
   * Normalize parsed data to ensure arrays are always arrays, not strings
   * Handles cases where AI returns comma-separated strings instead of arrays
   */
  private normalizeParsedData(parsed: any): any {
    const arrayFields = [
      'symptoms', 'diagnoses', 'lab_results', 'labResults', 'Lab Results',
      'medications', 'procedures', 'findings', 'allergies', 'referrals',
      'follow_ups', 'followUps', 'Follow-ups', 'investigation_plans',
      'investigationPlans', 'Investigation Plans', 'outcomes', 'medical_history',
      'medicalHistory', 'Medical History'
    ];

    const normalized = { ...parsed };

    for (const field of arrayFields) {
      if (normalized[field] && typeof normalized[field] === 'string') {
        // Convert comma-separated string to array
        const value = normalized[field];
        if (value.trim() === '' || value === 'None' || value === 'none') {
          normalized[field] = [];
        } else {
          // Split by comma and trim
          normalized[field] = value.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        }
        console.log(`[ExtractionService] Normalized ${field} from string to array:`, normalized[field]);
      }
    }

    return normalized;
  }

  private mapPatientInfo(patientInfo: any): ExtractedPatientInfo {
    return {
      name: patientInfo.name || patientInfo.Name || null,
      dateOfBirth: patientInfo.dateOfBirth || patientInfo.date_of_birth || patientInfo.date || patientInfo.Date || null,
      age: patientInfo.age || patientInfo.Age || null,
      sex: patientInfo.sex || patientInfo.Sex || null,
      patientId: patientInfo.patientId || patientInfo.patient_id || null,
    };
  }

  private mapEncounterInfo(info: any): any {
    return {
      date: info.date || info.Date || null,
      type: info.type || info.Type || null,
      facility: info.facility || info.Facility || null,
      department: info.department || info.Department || null,
      reason: info.reason || null,
    };
  }

  private mapSymptoms(symptoms: any[]): any[] {
    return symptoms.map(s => {
      const dateValidation = dateValidationService.validateDate(s.date || s.Date || null, s.sourceText || s.name || s.Name || '');
      const durationValidation = dateValidationService.validateDuration(s.duration || s.Duration || null, s.sourceText || s.name || s.Name || '');
      
      return {
        name: s.name || s.Name || '',
        date: dateValidation.normalizedDate,
        duration: durationValidation.normalizedDuration,
        severity: s.severity || s.Severity || null,
        certainty: s.certainty || s.Certainty || 'present',
        status: s.status || s.Status || null,
        datePrecision: dateValidation.datePrecision,
        sourceText: s.sourceText || s.name || s.Name || '',
      };
    });
  }

  private mapDiagnoses(diagnoses: any[]): any[] {
    return diagnoses.map(d => {
      const dateValidation = dateValidationService.validateDate(d.date || d.Date || null, d.sourceText || d.name || d.Name || '');
      
      return {
        name: d.name || d.Name || '',
        date: dateValidation.normalizedDate,
        status: d.status || d.Status || 'active',
        certainty: d.certainty || d.Certainty || 'confirmed',
        datePrecision: dateValidation.datePrecision,
        sourceText: d.sourceText || d.name || d.Name || '',
      };
    });
  }

  private mapLabResults(labs: any[]): any[] {
    return labs.map(l => {
      const dateValidation = dateValidationService.validateDate(l.date || l.Date || null, l.sourceText || `${l.testName || l.name || l.Name}: ${l.value || l.Value} ${l.unit || l.Unit || ''}` || '');
      
      return {
        testName: l.testName || l.test_name || l.name || l.Name || '',
        value: l.value || l.Value || '',
        unit: l.unit || l.Unit || null,
        referenceRange: l.referenceRange || l.reference_range || null,
        isAbnormal: l.isAbnormal || l.is_abnormal || null,
        date: dateValidation.normalizedDate,
        datePrecision: dateValidation.datePrecision,
        sourceText: l.sourceText || `${l.testName || l.name || l.Name}: ${l.value || l.Value} ${l.unit || l.Unit || ''}` || '',
      };
    });
  }

  private mapMedications(meds: any[]): any[] {
    return meds.map(m => ({
      name: m.name || m.Name || '',
      dosage: m.dosage || m.Dosage || null,
      frequency: m.frequency || m.Frequency || null,
      route: m.route || m.Route || null,
      startDate: m.startDate || m.start_date || null,
      endDate: m.endDate || m.end_date || null,
      duration: m.duration || m.Duration || null,
      sourceText: m.sourceText || `${m.name || m.Name} ${m.dosage || m.Dosage || ''}` || '',
    }));
  }

  private mapProcedures(procedures: any[]): any[] {
    return procedures.map(p => {
      const dateValidation = dateValidationService.validateDate(p.date || p.Date || null, p.sourceText || p.name || p.Name || '');
      
      return {
        name: p.name || p.Name || '',
        date: dateValidation.normalizedDate,
        result: p.result || p.Result || null,
        finding: p.finding || p.Finding || null,
        status: p.status || p.Status || null,
        datePrecision: dateValidation.datePrecision,
        sourceText: p.sourceText || p.name || p.Name || '',
      };
    });
  }

  private mapAllergies(allergies: any[]): any[] {
    return allergies.map(a => ({
      name: a.name || a.Name || '',
      severity: a.severity || a.Severity || null,
      reaction: a.reaction || a.Reaction || null,
      status: a.status || a.Status || 'active',
      sourceText: a.sourceText || a.name || a.Name || '',
    }));
  }

  private mapReferrals(referrals: any[]): any[] {
    return referrals.map(r => ({
      specialty: r.specialty || r.Specialty || '',
      reason: r.reason || r.Reason || null,
      date: r.date || r.Date || null,
      status: r.status || r.Status || 'unknown',
      sourceText: r.sourceText || `${r.specialty || r.Specialty} referral` || '',
    }));
  }

  private mapFollowUps(followUps: any[]): any[] {
    return followUps.map(f => ({
      type: f.type || f.Type || '',
      reason: f.reason || f.Reason || null,
      date: f.date || f.Date || null,
      status: f.status || f.Status || 'unknown',
      sourceText: f.sourceText || f.type || f.Type || '',
    }));
  }

  private mapInvestigationPlans(plans: any[]): any[] {
    return plans.map(p => ({
      testName: p.testName || p.test_name || p.name || p.Name || '',
      reason: p.reason || p.Reason || null,
      plannedDate: p.plannedDate || p.planned_date || p.date || p.Date || null,
      status: p.status || p.Status || 'planned',
      sourceText: p.sourceText || `${p.testName || p.name || p.Name} investigation` || '',
    }));
  }

  private mapOutcomes(outcomes: any[]): any[] {
    return outcomes.map(o => ({
      description: o.description || o.Description || '',
      category: o.category || o.Category || 'other',
      date: o.date || o.Date || null,
      sourceText: o.sourceText || o.description || o.Description || '',
    }));
  }

  private mapMedicalHistory(history: any[]): any[] {
    return history.map(h => ({
      condition: h.condition || h.Condition || '',
      type: h.type || h.Type || 'condition',
      date: h.date || h.Date || null,
      status: h.status || h.Status || null,
      sourceText: h.sourceText || h.condition || h.Condition || '',
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
