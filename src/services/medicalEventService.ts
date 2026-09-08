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

    // Get the most reliable date for this record
    const encounterDate = this.extractDate(record, extraction);

    // Get page information from metadata if available
    const pageNumbers = this.extractPageNumbers(record);

    // Create events for symptoms
    extraction.symptoms.forEach((symptom) => {
      if (symptom.certainty !== 'absent' && symptom.certainty !== 'denied') {
        const eventDate = symptom.date || encounterDate;
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
        // Validate diagnosis name - reject non-medical text
        const invalidKeywords = [
          'Sunrise Corporate Tower', 'Andheri West', 'Mumbai', 'Maharashtra', 'India',
          'MD (Pathology)', 'MD (Diabetology)', 'DMLT Lab Technician', 'Emp. ID',
          'Reg. No.', 'e-signed', 'SYNTHIC DATA', 'NABL', 'ISO',
          'Metropolis Healthcare', 'AROGYA PATH', 'Ph:', 'Email:', 'Page',
          'please contact the laboratory', 'Electronically Verified', 'Authorized',
          'Specimen', 'Venous blood', 'EDTA', 'Plain', 'Fluoride', 'Random Urine',
          'Fasting Status', 'Clinical Notes', 'Lab Location', 'Bandra',
          'COMPLETE BLOOD COUNT', 'BLOOD GLUCOSE', 'LIPID PROFILE', 'KIDNEY FUNCTION TEST',
          'LIVER FUNCTION TEST', 'THYROID PROFILE', 'VITAMINS', 'URINE ROUTINE',
          'URINE MICROALBUMIN', 'INFLAMMATORY MARKER', 'CLINICAL IMPRESSION',
          'REMARKS', 'Test Name', 'Result', 'Unit', 'Reference Range', 'Flag',
          'Accession No', 'Collected', 'Reported', 'Consultant Pathologist',
          'Lab Technician', 'Sample Processing',
          // Physical exam findings
          'cyanosis', 'clubbing', 'pallor', 'icterus', 'lymphadenopathy', 'pedal edema',
          'tenderness', 'organomegaly', 'wheals', 'angioedema', 'stridor', 'air entry',
          'murmurs', 'pulses', 'well-built', 'moderately obese male', 'cardiovascular examination unremarkable',
          // Symptoms (these should be in symptoms field, not diagnoses)
          'breathlessness', 'facial swelling', 'throat tightness', 'sore throat', 'body ache',
          'cough', 'fever', 'nausea', 'vomiting', 'pain', 'itching', 'rash',
          // Lab test names
          'fasting glucose', 'LFT', 'KFT', 'TSH', 'lipid profile', 'urine microalbumin',
          'CBC', 'HbA1c', 'ECG', 'echocardiography', 'TMT',
          // Medications (should be in medications field)
          'Pantoprazole', 'Metformin', 'Atorvastatin', 'Telmisartan', 'Glimepiride', 'Aspirin',
          // Dietary/lifestyle advice
          'reduce refined carbohydrates', 'brisk walking', 'dietary counselling', 'lifestyle modification',
          // Clinical notes and measurements
          'up from 27.4 in 2016', 'preferring an intensive lifestyle-modification trial first',
          'just below the diagnostic cutoff', 'BMI', 'weight', 'blood pressure',
          // Doctor credentials
          'MBBS', 'MD', 'Consultant Pathologist',
          // Plan/treatment text
          'Tab.', 'review with reports', 'Dr.',
        ];

        const diagnosisLower = diagnosis.name.toLowerCase();
        const hasInvalidKeyword = invalidKeywords.some(keyword =>
          diagnosisLower.includes(keyword.toLowerCase())
        );

        // Also reject if it looks like an address or phone number
        const looksLikeAddress = /^\d+.*\d{5,6}$/.test(diagnosis.name.trim());
        const looksLikePhone = /Ph:|Phone|Mobile|Contact/.test(diagnosis.name);
        const looksLikeEmail = /@|Email/.test(diagnosis.name);

        if (hasInvalidKeyword || looksLikeAddress || looksLikePhone || looksLikeEmail) {
          console.log(`[MedicalEventService] Skipping invalid diagnosis: ${diagnosis.name}`);
          return;
        }

        const eventDate = diagnosis.date || encounterDate;
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
      const eventDate = lab.date || encounterDate;
      const description = `${lab.value}${lab.unit ? ` ${lab.unit}` : ''}${lab.referenceRange ? ` (Ref: ${lab.referenceRange})` : ''}`;
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
      const eventDate = medication.startDate || encounterDate;
      const description = [
        medication.dosage,
        medication.frequency,
        medication.route,
      ].filter(Boolean).join(' | ');
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
      const eventDate = procedure.date || encounterDate;
      const description = [procedure.result, procedure.finding].filter(Boolean).join(' | ');
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
      events.push({
        id: `${record.id}-referral-${this.normalizeName(referral.specialty)}`,
        patientId: record.patientId,
        eventType: 'procedure', // Treat referrals as procedures for now
        title: `Referral: ${referral.specialty}`,
        description: referral.reason || null,
        date: referral.date || encounterDate,
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
      events.push({
        id: `${record.id}-followup-${this.normalizeName(followUp.type)}`,
        patientId: record.patientId,
        eventType: 'procedure', // Treat follow-ups as procedures for now
        title: `Follow-up: ${followUp.type}`,
        description: followUp.reason || null,
        date: followUp.date || encounterDate,
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
      events.push({
        id: `${record.id}-investigation-${this.normalizeName(plan.testName)}`,
        patientId: record.patientId,
        eventType: 'procedure', // Treat investigation plans as procedures for now
        title: `Planned: ${plan.testName}`,
        description: plan.reason || null,
        date: plan.plannedDate || encounterDate,
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
      events.push({
        id: `${record.id}-outcome-${this.normalizeName(outcome.description.substring(0, 20))}`,
        patientId: record.patientId,
        eventType: 'diagnosis', // Treat outcomes as diagnoses for now
        title: `Outcome: ${outcome.category}`,
        description: outcome.description,
        date: outcome.date || encounterDate,
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
      events.push({
        id: `${record.id}-history-${this.normalizeName(history.condition.substring(0, 20))}`,
        patientId: record.patientId,
        eventType: 'diagnosis', // Treat medical history as diagnoses for now
        title: `History: ${history.condition}`,
        description: history.type ? `Type: ${history.type}` : null,
        date: history.date || encounterDate,
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
    if (extraction.encounter.date) {
      return this.parseDate(extraction.encounter.date);
    }
    if (record.recordDate) {
      return record.recordDate;
    }
    // Return null if no date is available - individual entities will use their own dates
    return null;
  }

  /**
   * Parse various date formats into ISO string
   */
  private parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
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
