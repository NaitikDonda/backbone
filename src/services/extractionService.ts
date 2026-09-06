import type { StructuredExtraction } from '../types';

export interface ExtractionError {
  message: string;
  code: 'NO_TEXT' | 'OLLAMA_ERROR' | 'INVALID_JSON' | 'MODEL_ERROR';
}

export class ExtractionService {
  private static instance: ExtractionService;
  private ollamaBaseUrl: string;
  private model: string;

  private constructor() {
    this.ollamaBaseUrl = 'http://localhost:11434';
    this.model = 'llama3.2';
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

    // Truncate text if too large for reliable Ollama JSON generation
    const MAX_TEXT_LENGTH = 8000; // Reduced for faster processing
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

Extract these categories if present:
- Patient info (name, age, sex, date)
- Encounter info (date, type, facility, department, physician)
- Symptoms (name, date, duration, severity, certainty, status)
- Diagnoses (name, date, status, certainty) - Look for ASSESSMENT section
- Lab results (test name, value, unit, reference range) - Only EXTRACTED results, not planned tests
- Medications (name, dosage, frequency, route) - If "None" or "No medications", return empty array
- Procedures (name, date, result) - Look for PLAN section for planned procedures/referrals
- Findings (text, category) - Look for PHYSICAL EXAM, NEUROLOGICAL EXAM sections

CRITICAL RULES:
- ONLY extract information EXPLICITLY stated in the text
- Do NOT infer diagnoses from lab results
- Handle negation correctly: "denies X" = X is absent/denied, "None" = empty array
- Handle uncertainty correctly: "possible X" = X is suspected, "rule out X" = X is ruled_out
- Preserve status information: "ongoing", "resolved", "chronic", etc.
- ASSESSMENT section contains diagnoses/assessments with status (e.g., "Fatigue - ongoing")
- PLAN section contains planned actions, not actual results (e.g., "Repeat Vitamin B12 level" is a plan, not a result)
- Distinguish between planned tests and actual lab results
- If medications list says "None" or "No medications", return empty medications array

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
      
      // Map model's key naming to our schema
      const extraction: StructuredExtraction = {
        patient: this.mapPatientInfo(parsed.patient_info || parsed.patient || parsed['Patient Info'] || parsed.patientInfo || {}),
        encounter: this.mapEncounterInfo(parsed.encounter_info || parsed.encounter || parsed['Encounter Info'] || parsed.encounterInfo || {}),
        symptoms: this.mapSymptoms(parsed.symptoms || parsed.Symptoms || []),
        diagnoses: this.mapDiagnoses(parsed.diagnoses || parsed.Diagnoses || []),
        labResults: this.mapLabResults(parsed.lab_results || parsed.labResults || parsed['Lab Results'] || parsed.lab_results || []),
        medications: this.mapMedications(parsed.medications || parsed.Medications || []),
        procedures: this.mapProcedures(parsed.procedures || parsed.Procedures || []),
        findings: parsed.findings || [],
        sourceRecordId: recordId,
        extractedAt: new Date().toISOString(),
      };

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

  private mapPatientInfo(info: any): any {
    return {
      name: info.name || info.patient_name || info.Name || null,
      dateOfBirth: info.dateOfBirth || info.date_of_birth || info.date || info.Date || null,
      age: info.age || info.Age || null,
      sex: info.sex || info.Sex || null,
      patientId: info.patientId || info.patient_id || null,
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
    return symptoms.map(s => ({
      name: s.name || s.Name || '',
      date: s.date || s.Date || null,
      duration: s.duration || s.Duration || null,
      severity: s.severity || s.Severity || null,
      certainty: s.certainty || s.Certainty || 'present',
      sourceText: s.sourceText || s.name || s.Name || '',
    }));
  }

  private mapDiagnoses(diagnoses: any[]): any[] {
    return diagnoses.map(d => ({
      name: d.name || d.Name || '',
      date: d.date || d.Date || null,
      status: d.status || d.Status || 'active',
      certainty: d.certainty || d.Certainty || 'confirmed',
      sourceText: d.sourceText || d.name || d.Name || '',
    }));
  }

  private mapLabResults(labs: any[]): any[] {
    return labs.map(l => ({
      testName: l.testName || l.test_name || l.name || l.Name || '',
      value: l.value || l.Value || '',
      unit: l.unit || l.Unit || null,
      referenceRange: l.referenceRange || l.reference_range || null,
      isAbnormal: l.isAbnormal || l.is_abnormal || null,
      date: l.date || l.Date || null,
      sourceText: l.sourceText || `${l.testName || l.name || l.Name}: ${l.value || l.Value} ${l.unit || l.Unit || ''}` || '',
    }));
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
    return procedures.map(p => ({
      name: p.name || p.Name || '',
      date: p.date || p.Date || null,
      result: p.result || p.Result || null,
      finding: p.finding || p.Finding || null,
      sourceText: p.sourceText || p.name || p.Name || '',
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
