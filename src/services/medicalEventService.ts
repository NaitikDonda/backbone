import type { MedicalRecord, MedicalEvent, StructuredExtraction } from '../types';

export class MedicalEventService {
  private static instance: MedicalEventService;

  private constructor() {}

  static getInstance(): MedicalEventService {
    if (!MedicalEventService.instance) {
      MedicalEventService.instance = new MedicalEventService();
    }
    return MedicalEventService.instance;
  }

  /**
   * Convert structured extraction from a medical record into medical events
   */
  createEventsFromRecord(record: MedicalRecord): MedicalEvent[] {
    const events: MedicalEvent[] = [];
    const extraction = record.structuredExtraction;

    if (!extraction) {
      console.log(`[MedicalEventService] No extraction found for record ${record.id}`);
      return events;
    }

    console.log(`[MedicalEventService] Creating events from record ${record.id} (${record.filename})`);
    console.log(`[MedicalEventService] Extraction contains:`, {
      symptoms: extraction.symptoms.length,
      diagnoses: extraction.diagnoses.length,
      labResults: extraction.labResults.length,
      medications: extraction.medications.length,
      procedures: extraction.procedures.length,
      findings: extraction.findings.length,
      allergies: extraction.allergies.length,
      referrals: extraction.referrals.length,
      followUps: extraction.followUps.length,
      investigationPlans: extraction.investigationPlans.length,
      outcomes: extraction.outcomes.length,
      medicalHistory: extraction.medicalHistory.length,
      patient: extraction.patient,
      encounter: extraction.encounter,
    });

    // Process findings array - these are unstructured text strings that could be large
    // We'll skip large findings to prevent them from becoming events
    if (extraction.findings && extraction.findings.length > 0) {
      console.log(`[MedicalEventService] Processing ${extraction.findings.length} findings`);
      extraction.findings.forEach((finding, index) => {
        if (finding && finding.length > 50) {
          console.log(`[MedicalEventService] Skipping large finding ${index}: ${finding.substring(0, 30)}...`);
        } else if (finding && finding.trim().length > 0) {
          console.log(`[MedicalEventService] Finding ${index}: ${finding}`);
        }
      });
    }

    // Get the most reliable date for this record
    const encounterDate = this.extractDate(record, extraction);

    // Get page information from metadata if available
    const pageNumbers = this.extractPageNumbers(record);

    // Create events for symptoms
    extraction.symptoms.forEach((symptom) => {
      if (symptom.certainty !== 'absent' && symptom.certainty !== 'denied') {
        // Validate symptom name to prevent large text blocks
        if (symptom.name && symptom.name.length > 50) {
          console.log(`[MedicalEventService] Skipping symptom with name too long: ${symptom.name.substring(0, 30)}...`);
          return;
        }
        
        const eventDate = symptom.date || encounterDate;
        
        console.log(`[MedicalEventService] Creating symptom event: ${symptom.name}, symptom.date: ${symptom.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
        
        events.push({
          id: `${record.id}-symptom-${this.normalizeName(symptom.name)}`,
          patientId: record.patientId,
          eventType: 'symptom',
          title: symptom.name,
          description: symptom.duration ? `Duration: ${symptom.duration}` : null,
          date: eventDate,
          endDate: null,
          status: symptom.status || symptom.certainty,
          severity: symptom.severity,
          sourceRecordId: record.id,
          sourceDocumentName: record.filename,
          sourceText: symptom.sourceText,
          metadata: {
            encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
            pageNumber: pageNumbers[0] || undefined, // Default to first page
          },
        });
      }
    });

    // Create events for diagnoses
    extraction.diagnoses.forEach((diagnosis) => {
      if (diagnosis.certainty !== 'ruled_out') {
        // White list of common medical conditions that should always be allowed
        const allowedMedicalConditions = [
          'hypothyroidism', 'hyperthyroidism', 'hypertension', 'diabetes', 'asthma',
          'copd', 'bronchitis', 'pneumonia', 'migraine', 'depression', 'anxiety',
          'gerd', 'arthritis', 'osteoporosis', 'anemia', 'obesity', 'cancer',
          'heart failure', 'coronary artery disease', 'kidney disease', 'liver disease',
          'thyroid disorder', 'thyroiditis', 'goiter', 'hashimoto', 'graves',
          'type 2 diabetes', 'type 1 diabetes', 'rheumatoid arthritis', 'osteoarthritis'
        ];

        const diagnosisLower = diagnosis.name.toLowerCase();
        const isAllowedCondition = allowedMedicalConditions.some(condition =>
          diagnosisLower.includes(condition)
        );

        // Skip validation for known medical conditions
        if (isAllowedCondition) {
          const eventDate = diagnosis.date || encounterDate;
          
          console.log(`[MedicalEventService] Creating diagnosis event (allowed condition): ${diagnosis.name}, diagnosis.date: ${diagnosis.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
          
          events.push({
            id: `${record.id}-diagnosis-${this.normalizeName(diagnosis.name)}`,
            patientId: record.patientId,
            eventType: 'diagnosis',
            title: diagnosis.name,
            description: diagnosis.status ? `Status: ${diagnosis.status}` : null,
            date: eventDate,
            endDate: null,
            status: diagnosis.status,
            severity: null,
            sourceRecordId: record.id,
            sourceDocumentName: record.filename,
            sourceText: diagnosis.sourceText,
            metadata: {
              encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
              pageNumber: pageNumbers[0] || undefined,
            },
          });
          return;
        }

        // Validate diagnosis name - reject clearly non-medical administrative content
        // NOTE: Keep this list TIGHT. Do NOT block real medical terms like 'pain', 'fever', 'nausea', 'MD', 'cough'.
        const invalidKeywords = [
          // Administrative / hospital metadata
          'Emp. ID', 'Reg. No.', 'e-signed', 'SYNTHETIC DATA', 'SYNTHIC DATA',
          'NABL', 'ISO', 'Accession No', 'Collected', 'Reported',
          'please contact the laboratory', 'Electronically Verified', 'Authorized signatory',
          // Lab report structure
          'Specimen', 'Venous blood', 'EDTA', 'Fluoride', 'Random Urine', 'Fasting Status',
          'Clinical Notes', 'Lab Location', 'Test Name', 'Reference Range',
          'Consultant Pathologist', 'Lab Technician', 'Sample Processing',
          'CLINICAL IMPRESSION', 'REMARKS', 'Test Result',
          // Section headers that get misclassified as diagnoses
          'COMPLETE BLOOD COUNT', 'BLOOD GLUCOSE', 'LIPID PROFILE', 'KIDNEY FUNCTION TEST',
          'LIVER FUNCTION TEST', 'THYROID PROFILE', 'VITAMINS', 'URINE ROUTINE',
          'URINE MICROALBUMIN', 'INFLAMMATORY MARKER',
          // Obvious administrative strings
          'medicalrecords@', 'www.', 'Ph:', 'Email:',
          // Dietary/lifestyle advice sentences (not conditions)
          'reduce refined carbohydrates', 'brisk walking', 'lifestyle modification',
          // Plan text
          'review with reports',
          // Physical exam findings
          'no pallor', 'clear lungs', 'normal chest', 'normal examination',
          // General descriptive text
          'patient is', 'patient was', 'the patient',
          // Common report text that gets misclassified
          'advised', 'suggested', 'recommended', 'instructed',
          'follow up', 'review', 'come back',
        ];

        const hasInvalidKeyword = invalidKeywords.some(keyword =>
          diagnosisLower.includes(keyword.toLowerCase())
        );

        // Also reject if it looks like an address or phone number
        const looksLikeAddress = /^\d+.*\d{5,6}$/.test(diagnosis.name.trim());
        const looksLikePhone = /Ph:|Phone|Mobile|Contact/.test(diagnosis.name);
        const looksLikeEmail = /@|Email/.test(diagnosis.name);

        // Reject if diagnosis name is too long (likely a paragraph) - reduced from 100 to 60 chars
        const isTooLong = diagnosis.name.length > 60;

        // Reject if it contains multiple sentences (paragraph)
        const sentenceCount = (diagnosis.name.match(/[.!?]/g) || []).length;
        const hasMultipleSentences = sentenceCount > 0; // Changed from >1 to >0 to reject any sentence

        // Reject if it looks like a lab test name
        const looksLikeLabTest = /^(test|panel|profile|count|level|ratio|index)/i.test(diagnosis.name.trim());

        // Reject if it contains common verbs indicating actions/instructions rather than conditions
        const hasActionVerbs = /^(advised|suggested|recommended|instructed|prescribed|given)/i.test(diagnosis.name.trim());

        // Reject if it looks like a sentence (starts with lowercase or has sentence structure)
        // Only match standalone verbs, not substrings within medical terms
        const looksLikeSentence = /^[a-z]/.test(diagnosis.name.trim()) || 
                                  /(^|\s)(is|was|are|were|has|have|had)(\s|$)/i.test(diagnosis.name);

        if (hasInvalidKeyword || looksLikeAddress || looksLikePhone || looksLikeEmail || isTooLong || hasMultipleSentences || looksLikeLabTest || hasActionVerbs || looksLikeSentence) {
          console.log(`[MedicalEventService] Skipping invalid diagnosis: ${diagnosis.name.substring(0, 60)}${diagnosis.name.length > 60 ? '...' : ''}`);
          return;
        }

        const eventDate = diagnosis.date || encounterDate;
        
        console.log(`[MedicalEventService] Creating diagnosis event: ${diagnosis.name}, diagnosis.date: ${diagnosis.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
        
        events.push({
          id: `${record.id}-diagnosis-${this.normalizeName(diagnosis.name)}`,
          patientId: record.patientId,
          eventType: 'diagnosis',
          title: diagnosis.name,
          description: diagnosis.status ? `Status: ${diagnosis.status}` : null,
          date: eventDate,
          endDate: null,
          status: diagnosis.status,
          severity: null,
          sourceRecordId: record.id,
          sourceDocumentName: record.filename,
          sourceText: diagnosis.sourceText,
          metadata: {
            encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
            pageNumber: pageNumbers[0] || undefined,
          },
        });
      }
    });

    // Create events for lab results
    extraction.labResults.forEach((lab) => {
      // Validate lab test name to prevent large text blocks
      if (lab.testName && lab.testName.length > 100) {
        console.log(`[MedicalEventService] Skipping lab with testName too long: ${lab.testName.substring(0, 50)}...`);
        return;
      }
      
      const eventDate = lab.date || encounterDate;
      const description = `${lab.value}${lab.unit ? ` ${lab.unit}` : ''}${lab.referenceRange ? ` (Ref: ${lab.referenceRange})` : ''}`;
      
      console.log(`[MedicalEventService] Creating lab event: ${lab.testName}, lab.date: ${lab.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
      
      events.push({
        id: `${record.id}-lab-${this.normalizeName(lab.testName)}`,
        patientId: record.patientId,
        eventType: 'laboratory',
        title: lab.testName,
        description,
        date: eventDate,
        endDate: null,
        status: lab.isAbnormal ? 'abnormal' : 'normal',
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: lab.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create events for medications
    extraction.medications.forEach((medication) => {
      // Validate medication name to prevent large text blocks
      if (medication.name && medication.name.length > 100) {
        console.log(`[MedicalEventService] Skipping medication with name too long: ${medication.name.substring(0, 50)}...`);
        return;
      }
      
      const eventDate = medication.startDate || encounterDate;
      const description = [
        medication.dosage,
        medication.frequency,
        medication.route,
      ].filter(Boolean).join(' | ');
      
      console.log(`[MedicalEventService] Creating medication event: ${medication.name}, medication.startDate: ${medication.startDate}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
      
      events.push({
        id: `${record.id}-medication-${this.normalizeName(medication.name)}`,
        patientId: record.patientId,
        eventType: 'medication',
        title: medication.name,
        description: description || null,
        date: eventDate,
        endDate: medication.endDate || null,
        status: null,
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: medication.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create events for procedures
    extraction.procedures.forEach((procedure) => {
      // Validate procedure name to prevent large text blocks
      if (procedure.name && procedure.name.length > 100) {
        console.log(`[MedicalEventService] Skipping procedure with name too long: ${procedure.name.substring(0, 50)}...`);
        return;
      }
      
      const eventDate = procedure.date || encounterDate;
      const description = [procedure.result, procedure.finding].filter(Boolean).join(' | ');
      
      console.log(`[MedicalEventService] Creating procedure event: ${procedure.name}, procedure.date: ${procedure.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
      
      events.push({
        id: `${record.id}-procedure-${this.normalizeName(procedure.name)}`,
        patientId: record.patientId,
        eventType: 'procedure',
        title: procedure.name,
        description: description || null,
        date: eventDate,
        endDate: null,
        status: procedure.result,
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: procedure.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create events for allergies
    extraction.allergies.forEach((allergy) => {
      // Validate allergy name to prevent large text blocks
      if (allergy.name && allergy.name.length > 50) {
        console.log(`[MedicalEventService] Skipping allergy with name too long: ${allergy.name.substring(0, 30)}...`);
        return;
      }
      
      console.log(`[MedicalEventService] Creating allergy event: ${allergy.name}, encounterDate: ${encounterDate}`);
      
      events.push({
        id: `${record.id}-allergy-${this.normalizeName(allergy.name)}`,
        patientId: record.patientId,
        eventType: 'diagnosis', // Treat allergies as a type of diagnosis for now
        title: `Allergy: ${allergy.name}`,
        description: allergy.reaction ? `Reaction: ${allergy.reaction}` : null,
        date: encounterDate,
        endDate: null,
        status: allergy.status,
        severity: allergy.severity,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: allergy.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create events for referrals
    extraction.referrals.forEach((referral) => {
      // Validate referral specialty to prevent large text blocks
      if (referral.specialty && referral.specialty.length > 100) {
        console.log(`[MedicalEventService] Skipping referral with specialty too long: ${referral.specialty.substring(0, 50)}...`);
        return;
      }
      
      const eventDate = referral.date || encounterDate;
      
      console.log(`[MedicalEventService] Creating referral event: ${referral.specialty}, referral.date: ${referral.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
      
      events.push({
        id: `${record.id}-referral-${this.normalizeName(referral.specialty)}`,
        patientId: record.patientId,
        eventType: 'procedure', // Treat referrals as procedures for now
        title: `Referral: ${referral.specialty}`,
        description: referral.reason || null,
        date: eventDate,
        endDate: null,
        status: referral.status,
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: referral.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create events for follow-ups
    extraction.followUps.forEach((followUp) => {
      // Validate follow-up type to prevent large text blocks
      if (followUp.type && followUp.type.length > 100) {
        console.log(`[MedicalEventService] Skipping follow-up with type too long: ${followUp.type.substring(0, 50)}...`);
        return;
      }
      
      const eventDate = followUp.date || encounterDate;
      
      console.log(`[MedicalEventService] Creating follow-up event: ${followUp.type}, followUp.date: ${followUp.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
      
      events.push({
        id: `${record.id}-followup-${this.normalizeName(followUp.type)}`,
        patientId: record.patientId,
        eventType: 'procedure', // Treat follow-ups as procedures for now
        title: `Follow-up: ${followUp.type}`,
        description: followUp.reason || null,
        date: eventDate,
        endDate: null,
        status: followUp.status,
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: followUp.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create events for investigation plans
    extraction.investigationPlans.forEach((plan) => {
      const eventDate = plan.plannedDate || encounterDate;
      
      console.log(`[MedicalEventService] Creating investigation plan event: ${plan.testName}, plan.plannedDate: ${plan.plannedDate}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
      
      events.push({
        id: `${record.id}-investigation-${this.normalizeName(plan.testName)}`,
        patientId: record.patientId,
        eventType: 'procedure', // Treat investigation plans as procedures for now
        title: `Planned: ${plan.testName}`,
        description: plan.reason || null,
        date: eventDate,
        endDate: null,
        status: plan.status,
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: plan.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create events for outcomes
    extraction.outcomes.forEach((outcome) => {
      // Validate outcome description to prevent large text blocks
      if (outcome.description && outcome.description.length > 100) {
        console.log(`[MedicalEventService] Skipping outcome with description too long: ${outcome.description.substring(0, 50)}...`);
        return;
      }
      
      const eventDate = outcome.date || encounterDate;
      
      console.log(`[MedicalEventService] Creating outcome event: ${outcome.category}, outcome.date: ${outcome.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
      
      events.push({
        id: `${record.id}-outcome-${this.normalizeName(outcome.description.substring(0, 20))}`,
        patientId: record.patientId,
        eventType: 'diagnosis', // Treat outcomes as diagnoses for now
        title: `Outcome: ${outcome.category}`,
        description: outcome.description,
        date: eventDate,
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: outcome.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create events for medical history
    extraction.medicalHistory.forEach((history) => {
      // Validate history condition to prevent large text blocks
      if (history.condition && history.condition.length > 100) {
        console.log(`[MedicalEventService] Skipping medical history with condition too long: ${history.condition.substring(0, 50)}...`);
        return;
      }
      
      const eventDate = history.date || encounterDate;
      
      console.log(`[MedicalEventService] Creating medical history event: ${history.condition}, history.date: ${history.date}, encounterDate: ${encounterDate}, final eventDate: ${eventDate}`);
      
      events.push({
        id: `${record.id}-history-${this.normalizeName(history.condition.substring(0, 20))}`,
        patientId: record.patientId,
        eventType: 'diagnosis', // Treat medical history as diagnoses for now
        title: `History: ${history.condition}`,
        description: history.type ? `Type: ${history.type}` : null,
        date: eventDate,
        endDate: null,
        status: history.status,
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: history.sourceText,
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    });

    // Create an event for the encounter itself
    if (extraction.encounter.type || extraction.encounter.facility) {
      console.log(`[MedicalEventService] Creating encounter event: type: ${extraction.encounter.type}, facility: ${extraction.encounter.facility}, encounterDate: ${encounterDate}`);
      
      events.push({
        id: `${record.id}-encounter`,
        patientId: record.patientId,
        eventType: extraction.encounter.type?.toLowerCase().includes('hospital') ? 'hospital_visit' : 'consultation',
        title: extraction.encounter.type || extraction.encounter.facility || 'Medical Encounter',
        description: extraction.encounter.reason || null,
        date: encounterDate,
        endDate: null,
        status: null,
        severity: null,
        sourceRecordId: record.id,
        sourceDocumentName: record.filename,
        sourceText: extraction.encounter.reason || '',
        metadata: {
          encounterId: encounterDate ? `encounter-${encounterDate}` : undefined,
          pageNumber: pageNumbers[0] || undefined,
        },
      });
    }

    console.log(`[MedicalEventService] Created ${events.length} events from record ${record.id}`);
    console.log(`[MedicalEventService] Event details:`, events.map(e => ({ id: e.id, type: e.eventType, title: e.title, date: e.date })));
    return events;
  }

  /**
   * Extract page numbers from record metadata
   */
  private extractPageNumbers(record: MedicalRecord): number[] {
    const pages = record.metadata?.pages as Array<{ pageNumber: number; text: string }> | undefined;
    if (pages && Array.isArray(pages) && pages.length > 0) {
      return pages.map(p => p.pageNumber);
    }
    return [1]; // Default to page 1 if no page info available
  }

  /**
   * Extract the most reliable date from a record and extraction
   */
  private extractDate(record: MedicalRecord, extraction: StructuredExtraction): string | null {
    // Priority: encounter date > record date
    // DO NOT use upload date as fallback - this would incorrectly assign today's date to historical events
    
    console.log(`[MedicalEventService] Extracting date for record ${record.id}`);
    console.log(`[MedicalEventService] Encounter date: ${extraction.encounter.date}`);
    console.log(`[MedicalEventService] Record date: ${record.recordDate}`);
    
    if (extraction.encounter.date) {
      const parsed = this.parseDate(extraction.encounter.date);
      console.log(`[MedicalEventService] Using encounter date: ${parsed}`);
      return parsed;
    }
    if (record.recordDate) {
      console.log(`[MedicalEventService] Using record date: ${record.recordDate}`);
      return record.recordDate;
    }
    // Return null if no date is available - individual entities will use their own dates
    console.log(`[MedicalEventService] No date found, returning null`);
    return null;
  }

  /**
   * Parse various date formats into ISO string
   */
  private parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    try {
      console.log(`[MedicalEventService] Parsing date: "${dateStr}"`);
      
      // Try direct Date parsing first
      let date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        console.log(`[MedicalEventService] Direct parse succeeded: ${date.toISOString()}`);
        return date.toISOString();
      }

      // Clean common date string noise (e.g. DD-MMM-YYYY or DD/MM/YYYY)
      const cleanStr = dateStr.replace(/^[^\d]+/, '').trim();
      date = new Date(cleanStr);
      if (!isNaN(date.getTime())) {
        console.log(`[MedicalEventService] Cleaned parse succeeded: ${date.toISOString()}`);
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
            console.log(`[MedicalEventService] DD-MMM-YYYY parse succeeded: ${date.toISOString()}`);
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
            console.log(`[MedicalEventService] DD-MM-YYYY parse succeeded: ${date.toISOString()}`);
            return date.toISOString();
          }
        }
        // If first part is 4 digits (YYYY-MM-DD)
        else if (parts[0].length === 4) {
          const formatted = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          date = new Date(formatted);
          if (!isNaN(date.getTime())) {
            console.log(`[MedicalEventService] YYYY-MM-DD parse succeeded: ${date.toISOString()}`);
            return date.toISOString();
          }
        }
      }

      console.log(`[MedicalEventService] All date parsing attempts failed for: "${dateStr}"`);
      return null;
    } catch (error) {
      console.log(`[MedicalEventService] Date parsing error for "${dateStr}":`, error);
      return null;
    }
  }

  /**
   * Normalize a name for use in IDs
   */
  private normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Deduplicate events across multiple records
   */
  deduplicateEvents(events: MedicalEvent[]): MedicalEvent[] {
    console.log('[MedicalEventService] Deduplicating', events.length, 'events');
    const eventMap = new Map<string, MedicalEvent>();

    events.forEach((event) => {
      const key = this.getEventKey(event);
      const existing = eventMap.get(key);

      if (existing) {
        // Mark this as a duplicate
        event.metadata.isDuplicate = true;
        event.metadata.duplicateOf = existing.id;
        existing.metadata.relatedEventIds = [
          ...(existing.metadata.relatedEventIds || []),
          event.id,
        ];
      } else {
        eventMap.set(key, event);
      }
    });

    const deduplicated = Array.from(eventMap.values());
    console.log('[MedicalEventService] After deduplication:', deduplicated.length, 'events');
    return deduplicated;
  }

  /**
   * Get a unique key for deduplication
   */
  private getEventKey(event: MedicalEvent): string {
    const parts = [
      event.patientId,
      event.sourceRecordId,
      event.eventType,
      event.title,
      event.date,
    ];
    const key = parts.filter(Boolean).join('|');
    console.log('[MedicalEventService] Event key:', key, 'for event:', event.title);
    return key;
  }

  /**
   * Group events by encounter
   */
  groupEventsByEncounter(events: MedicalEvent[]): Map<string, MedicalEvent[]> {
    const groups = new Map<string, MedicalEvent[]>();

    events.forEach((event) => {
      const encounterId = event.metadata.encounterId || 'undated';
      if (!groups.has(encounterId)) {
        groups.set(encounterId, []);
      }
      groups.get(encounterId)!.push(event);
    });

    return groups;
  }

  /**
   * Separate events into dated and undated
   */
  separateByDate(events: MedicalEvent[]): { dated: MedicalEvent[]; undated: MedicalEvent[] } {
    const dated: MedicalEvent[] = [];
    const undated: MedicalEvent[] = [];

    events.forEach((event) => {
      if (event.date) {
        dated.push(event);
      } else {
        undated.push(event);
      }
    });

    return { dated, undated };
  }

  /**
   * Sort events chronologically
   */
  sortEventsChronologically(events: MedicalEvent[]): MedicalEvent[] {
    return events.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }
}
