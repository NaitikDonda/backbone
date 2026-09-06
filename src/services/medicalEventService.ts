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
      return events;
    }

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
    // Priority: encounter date > record date > upload date
    if (extraction.encounter.date) {
      return this.parseDate(extraction.encounter.date);
    }
    if (record.recordDate) {
      return record.recordDate;
    }
    return record.uploadedAt;
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

    return Array.from(eventMap.values());
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
    return parts.filter(Boolean).join('|');
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
