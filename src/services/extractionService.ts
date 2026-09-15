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
    return `You are extracting structured medical data from a medical record. Return ONLY valid JSON matching exactly this structure:

{
  "patient": {"name": "", "age": null, "sex": "", "dateOfBirth": ""},
  "encounter": {"date": "", "type": "", "facility": "", "department": "", "reason": ""},
  "symptoms": [
    {"name": "", "date": null, "duration": null, "severity": null, "certainty": "present", "status": null, "sourceText": ""}
  ],
  "diagnoses": [
    {"name": "", "date": null, "status": "active", "certainty": "confirmed", "sourceText": ""}
  ],
  "labResults": [
    {"testName": "", "value": "", "unit": null, "referenceRange": null, "isAbnormal": null, "date": null, "sourceText": ""}
  ],
  "medications": [
    {"name": "", "dosage": null, "frequency": null, "route": null, "startDate": null, "endDate": null, "sourceText": ""}
  ],
  "procedures": [
    {"name": "", "date": null, "result": null, "finding": null, "sourceText": ""}
  ],
  "findings": [],
  "allergies": [
    {"name": "", "severity": null, "reaction": null, "status": "active", "sourceText": ""}
  ],
  "referrals": [
    {"specialty": "", "reason": null, "date": null, "status": "unknown", "sourceText": ""}
  ],
  "followUps": [
    {"type": "", "reason": null, "date": null, "status": "unknown", "sourceText": ""}
  ],
  "investigationPlans": [],
  "outcomes": [],
  "medicalHistory": [
    {"condition": "", "type": "condition", "date": null, "status": null, "sourceText": ""}
  ]
}

CRITICAL RULES:
1. patient.name: The patient's full name only. Do NOT include doctor names, hospital names, or report titles.
2. patient.age: A number (years). Extract from patterns like "42 years", "Age: 35", "42Y", "42/M". If only DOB given, calculate age.
3. patient.sex: "male", "female", or "other" only.
4. patient.dateOfBirth: In YYYY-MM-DD format if available.
5. encounter.date: The date of this visit/report in YYYY-MM-DD format.
6. diagnoses: STRICT - ONLY named medical conditions/diseases (e.g. "Hypertension", "Type 2 Diabetes", "Pneumonia", "Migraine", "Asthma", "Hypothyroidism", "Hyperthyroidism", "Hypothyroidism"). 
   REJECT if:
   - Physical exam observations ("no pallor", "clear lungs", "normal chest")
   - Lab test names ("HbA1c", "CBC", "Complete Blood Count")
   - Doctor names, addresses, phone numbers, emails
   - Administrative text ("Emp. ID", "Reg. No.", "NABL", "ISO")
   - Sentences longer than 3 words that are not a specific disease name
   - Section headers ("COMPLETE BLOOD COUNT", "LIPID PROFILE")
   - Plan/recommendation text ("review with reports", "lifestyle modification")
   - Any text containing @ symbol, www., or phone number patterns
   - Action verbs at START (advised, suggested, recommended, instructed, prescribed)
   - Sentences with STANDALONE verbs (is, was, are, were, has, have, had) - but NOT substrings within medical terms
   - ANY text longer than 60 characters
   - ANY text containing periods, commas, or sentence punctuation
   - ALLOW common medical conditions: hypothyroidism, hyperthyroidism, hypertension, diabetes, type 2 diabetes, type 1 diabetes, asthma, copd, bronchitis, pneumonia, migraine, depression, anxiety, gerd, arthritis, rheumatoid arthritis, osteoarthritis, osteoporosis, anemia, obesity, cancer, heart failure, coronary artery disease, kidney disease, liver disease, thyroid disorder, thyroiditis, goiter, hashimoto, graves
7. symptoms: Patient-reported complaints only ("chest pain", "fever", "headache", "nausea"). Maximum 5 words per symptom.
8. labResults: One entry per test-value pair. testName is the test name, value is the numeric result.
9. medications: Drug name with dose/frequency. Exclude specimen types and lab reagents.
10. dates: Always YYYY-MM-DD. Use null if uncertain.
11. If a field has no data, use an empty array [] or null.
12. DO NOT extract entire paragraphs or long sentences as individual diagnoses. Break them into specific medical entities.
13. Each diagnosis must be a SINGLE medical condition name only, no descriptions, no sentences.

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
          model: 'llama3.2',
          system: systemPrompt,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.0,
            num_ctx: 8192, // Increased to handle real-world records
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

    // Extract age and DOB with enhanced patterns (e.g. 42 Y / 42M / 42 Years / DOB: YYYY-MM-DD / DOB: DD/MM/YYYY)
    const ageMatch = textToParse.match(/(?:Age|Age\/Gender|Age\s*:\s*|Age\s*-\s*|Age\s*\/\s*Sex\s*:\s*)\s*(\d{1,3})/i) ||
      textToParse.match(/(\d{1,3})\s*(?:Yrs?|Years?|Y\/O|Y)\b/i);
    if (ageMatch) {
      extraction.patient.age = parseInt(ageMatch[1], 10);
    }

    const dobMatch = textToParse.match(/(?:DOB|Date of Birth|D\.O\.B\.?)\s*[:\-]?\s*([0-9]{2,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i);
    if (dobMatch) {
      extraction.patient.dateOfBirth = dobMatch[1].trim();
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

    // Extract diagnoses - handle multiple formats including real medical records
    // Pattern 1: "Diagnosis:" or "Diagnoses:" section
    const diagnosisSection = textToParse.match(/(?:Final\s+)?(?:History|Diagnosis|Diagnoses|Assessment|Impression)\s*[:\-]\s*([^\n]{3,})/i);
    if (diagnosisSection) {
      // White list of common medical conditions that should always be allowed
      const allowedMedicalConditions = [
        'hypothyroidism', 'hyperthyroidism', 'hypertension', 'diabetes', 'asthma',
        'copd', 'bronchitis', 'pneumonia', 'migraine', 'depression', 'anxiety',
        'gerd', 'arthritis', 'osteoporosis', 'anemia', 'obesity', 'cancer',
        'heart failure', 'coronary artery disease', 'kidney disease', 'liver disease',
        'thyroid disorder', 'thyroiditis', 'goiter', 'hashimoto', 'graves',
        'type 2 diabetes', 'type 1 diabetes', 'rheumatoid arthritis', 'osteoarthritis'
      ];

      const diagnoses = diagnosisSection[1].split(/[,;]/).map(d => d.trim()).filter(d => {
        const dLower = d.toLowerCase();
        const isAllowedCondition = allowedMedicalConditions.some(condition =>
          dLower.includes(condition)
        );

        // Skip validation for known medical conditions
        if (isAllowedCondition) {
          return true;
        }

        // Strict validation for fallback parser diagnoses
        const isTooLong = d.length > 60;
        const hasSentencePunctuation = /[.!?]/.test(d);
        const hasActionVerbs = /^(advised|suggested|recommended|instructed|prescribed|given)/i.test(d.trim());
        const hasStandaloneVerbs = /(^|\s)(is|was|are|were|has|have|had)(\s|$)/i.test(d);
        const startsWithLowercase = /^[a-z]/.test(d.trim());

        return d.length > 2 && !isTooLong && !hasSentencePunctuation && !hasActionVerbs && !hasStandaloneVerbs && !startsWithLowercase;
      });
      extraction.diagnoses = diagnoses.map(d => ({
        name: d,
        date: null,
        status: 'active',
        certainty: 'confirmed' as const,
        datePrecision: 'unknown' as const,
        sourceText: d,
      }));
    }

    // Pattern 2: Common medical condition keywords (general, not hardcoded to one patient)
    const conditionPatterns = [
      /\b(Type\s+[12]\s+Diabetes(?:\s+Mellitus)?)\b/gi,
      /\b(Hypertension)\b/gi,
      /\b(Dyslipidemia|Hyperlipidemia|Hypercholesterolemia)\b/gi,
      /\b(Diabetic\s+Nephropathy)\b/gi,
      /\b(Diabetic\s+Retinopathy)\b/gi,
      /\b(Hypothyroidism|Hyperthyroidism)\b/gi,
      /\b(Asthma|COPD|Bronchitis)\b/gi,
      /\b(Coronary\s+Artery\s+Disease|CAD|Angina)\b/gi,
      /\b(Heart\s+Failure|Cardiac\s+Failure)\b/gi,
      /\b(Chronic\s+Kidney\s+Disease|CKD)\b/gi,
      /\b(Anemia)\b/gi,
      /\b(Obesity)\b/gi,
      /\b(Osteoporosis|Osteopenia)\b/gi,
      /\b(Arthritis|Rheumatoid\s+Arthritis|Osteoarthritis)\b/gi,
      /\b(Depression|Anxiety\s+Disorder)\b/gi,
      /\b(Migraine)\b/gi,
      /\b(GERD|Gastro-?esophageal\s+Reflux)\b/gi,
      /\b(Acute\s+Appendicitis)\b/gi,
      /\b(Urticaria)\b/gi,
    ];
    for (const pattern of conditionPatterns) {
      let match;
      while ((match = pattern.exec(textToParse)) !== null) {
        const conditionName = match[1].trim();
        if (!extraction.diagnoses.some(d => d.name.toLowerCase() === conditionName.toLowerCase())) {
          extraction.diagnoses.push({
            name: conditionName,
            date: null,
            status: 'active',
            certainty: 'confirmed' as const,
            datePrecision: 'unknown' as const,
            sourceText: conditionName,
          });
        }
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

    console.log(`[ExtractionService] Processing patient name: "${rawName}"`);

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

      // Loosen validation - allow names that look reasonable
      // Real names are typically 2-4 words, 3-50 characters
      const wordCount = rawName.trim().split(/\s+/).length;
      const looksLikeName = wordCount >= 2 && wordCount <= 4 && rawName.length >= 3 && rawName.length <= 50;

      if (!hasInvalidKeyword && !isTooLong && !hasDocumentStructure && looksLikeName) {
        validatedName = rawName.trim();
        console.log(`[ExtractionService] Validated patient name: "${validatedName}"`);
      } else {
        console.log(`[ExtractionService] Rejected patient name. hasInvalidKeyword: ${hasInvalidKeyword}, isTooLong: ${isTooLong}, hasDocumentStructure: ${hasDocumentStructure}, looksLikeName: ${looksLikeName}`);
      }
    }

    let age: number | null = null;
    if (patientInfo.age !== undefined && patientInfo.age !== null) {
      console.log(`[ExtractionService] Processing age: ${patientInfo.age}`);
      if (typeof patientInfo.age === 'number') {
        age = patientInfo.age;
        console.log(`[ExtractionService] Age as number: ${age}`);
      } else if (typeof patientInfo.age === 'string') {
        const parsedAge = parseInt(patientInfo.age.replace(/\D/g, ''), 10);
        if (!isNaN(parsedAge) && parsedAge > 0 && parsedAge < 150) {
          age = parsedAge;
          console.log(`[ExtractionService] Age parsed from string: ${age}`);
        } else {
          console.log(`[ExtractionService] Failed to parse age from string: "${patientInfo.age}"`);
        }
      }
    }

    return {
      name: validatedName,
      dateOfBirth: patientInfo.dateOfBirth || patientInfo.date_of_birth || null,
      age,
      sex: patientInfo.sex || null,
      patientId: patientInfo.patientId || patientInfo.patient_id || null,
    };
  }

  private mapEncounterInfo(info: any): any {
    const parsedDate = this.parseDateString(info.date || null);

    console.log(`[ExtractionService] Mapping encounter: date: ${info.date}, parsed: ${parsedDate}, type: ${info.type}`);

    return {
      date: parsedDate,
      type: info.type || null,
      facility: info.facility || null,
      department: info.department || null,
      reason: info.reason || null,
    };
  }

  /**
   * Parse various date formats into ISO string
   */
  private parseDateString(dateStr: string | null): string | null {
    if (!dateStr) return null;

    try {
      console.log(`[ExtractionService] Parsing date: "${dateStr}"`);

      // Try direct Date parsing first
      let date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        console.log(`[ExtractionService] Direct parse succeeded: ${date.toISOString()}`);
        return date.toISOString();
      }

      // Clean common date string noise (e.g. DD-MMM-YYYY or DD/MM/YYYY)
      const cleanStr = dateStr.replace(/^[^\d]+/, '').trim();
      date = new Date(cleanStr);
      if (!isNaN(date.getTime())) {
        console.log(`[ExtractionService] Cleaned parse succeeded: ${date.toISOString()}`);
        return date.toISOString();
      }

      // Handle DD-MMM-YYYY format (e.g., "22-Feb-2016")
      const ddmmyyyyMatch = cleanStr.match(/^(\d{1,2})[-\/\.]([A-Za-z]{3})[-\/\.](\d{4})$/);
      if (ddmmyyyyMatch) {
        const day = ddmmyyyyMatch[1];
        const monthStr = ddmmyyyyMatch[2];
        const year = ddmmyyyyMatch[3];

        const months: Record<string, string> = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
          'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };

        const month = months[monthStr.toLowerCase()];
        if (month) {
          const formatted = `${year}-${month}-${day.padStart(2, '0')}`;
          date = new Date(formatted);
          if (!isNaN(date.getTime())) {
            console.log(`[ExtractionService] DD-MMM-YYYY parse succeeded: ${date.toISOString()}`);
            return date.toISOString();
          }
        }
      }

      // Handle DD-MM-YYYY or DD/MM/YYYY explicitly
      const parts = cleanStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        // If first part is 1-2 digits and 3rd part is 4 digits (DD-MM-YYYY)
        if (parts[0].length <= 2 && parts[2].length === 4) {
          const formatted = `${parts[2]}-${parts[1]}-${parts[0].padStart(2, '0')}`;
          date = new Date(formatted);
          if (!isNaN(date.getTime())) {
            console.log(`[ExtractionService] DD-MM-YYYY parse succeeded: ${date.toISOString()}`);
            return date.toISOString();
          }
        }
        // If first part is 4 digits (YYYY-MM-DD)
        else if (parts[0].length === 4) {
          const formatted = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          date = new Date(formatted);
          if (!isNaN(date.getTime())) {
            console.log(`[ExtractionService] YYYY-MM-DD parse succeeded: ${date.toISOString()}`);
            return date.toISOString();
          }
        }
      }

      console.log(`[ExtractionService] All date parsing attempts failed for: "${dateStr}"`);
      return null;
    } catch (error) {
      console.log(`[ExtractionService] Date parsing error for "${dateStr}":`, error);
      return null;
    }
  }

  private mapSymptoms(symptoms: any[]): any[] {
    return symptoms.map(s => {
      const parsedDate = this.parseDateString(s.date || null);
      const durationValidation = dateValidationService.validateDuration(s.duration || null, s.sourceText || s.name || '');

      console.log(`[ExtractionService] Mapping symptom: ${s.name}, date: ${s.date}, parsed: ${parsedDate}`);

      return {
        name: s.name || '',
        date: parsedDate,
        duration: durationValidation.normalizedDuration,
        severity: s.severity || null,
        certainty: s.certainty || 'present',
        status: s.status || null,
        datePrecision: parsedDate ? 'exact' : 'unknown',
        sourceText: s.sourceText || s.name || '',
      };
    });
  }

  private mapDiagnoses(diagnoses: any[]): any[] {
    return diagnoses.map(d => {
      const parsedDate = this.parseDateString(d.date || null);

      console.log(`[ExtractionService] Mapping diagnosis: ${d.name}, date: ${d.date}, parsed: ${parsedDate}`);

      return {
        name: d.name || '',
        date: parsedDate,
        status: d.status || 'active',
        certainty: d.certainty || 'confirmed',
        datePrecision: parsedDate ? 'exact' : 'unknown',
        sourceText: d.sourceText || d.name || '',
      };
    });
  }

  private mapLabResults(labs: any[]): any[] {
    return labs.map(l => {
      const parsedDate = this.parseDateString(l.date || null);

      return {
        testName: l.testName || l.name || '',
        value: l.value || '',
        unit: l.unit || null,
        referenceRange: l.referenceRange || null,
        isAbnormal: l.isAbnormal || null,
        date: parsedDate,
        datePrecision: parsedDate ? 'exact' : 'unknown',
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
      const parsedDate = this.parseDateString(p.date || null);

      return {
        name: p.name || '',
        date: parsedDate,
        result: p.result || null,
        finding: p.finding || null,
        status: p.status || null,
        datePrecision: parsedDate ? 'exact' : 'unknown',
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
    return referrals.map(r => {
      const parsedDate = this.parseDateString(r.date || null);
      return {
        specialty: r.specialty || '',
        reason: r.reason || null,
        date: parsedDate,
        status: r.status || 'unknown',
        sourceText: r.sourceText || `${r.specialty} referral` || '',
      };
    });
  }

  private mapFollowUps(followUps: any[]): any[] {
    return followUps.map(f => {
      const parsedDate = this.parseDateString(f.date || null);
      return {
        type: f.type || '',
        reason: f.reason || null,
        date: parsedDate,
        status: f.status || 'unknown',
        sourceText: f.sourceText || f.type || '',
      };
    });
  }

  private mapInvestigationPlans(plans: any[]): any[] {
    return plans.map(p => {
      const parsedDate = this.parseDateString(p.plannedDate || p.date || null);
      return {
        testName: p.testName || p.name || '',
        reason: p.reason || null,
        plannedDate: parsedDate,
        status: p.status || 'planned',
        sourceText: p.sourceText || `${p.testName || p.name} investigation` || '',
      };
    });
  }

  private mapOutcomes(outcomes: any[]): any[] {
    return outcomes.map(o => {
      const parsedDate = this.parseDateString(o.date || null);
      return {
        description: o.description || '',
        category: o.category || 'other',
        date: parsedDate,
        sourceText: o.sourceText || o.description || '',
      };
    });
  }

  private mapMedicalHistory(history: any[]): any[] {
    return history.map(h => {
      const parsedDate = this.parseDateString(h.date || null);
      return {
        condition: h.condition || '',
        type: h.type || 'condition',
        date: parsedDate,
        status: h.status || null,
        sourceText: h.sourceText || h.condition || '',
      };
    });
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
