import type { MedicalEvent } from '../types';

export interface LongitudinalLink {
  sourceEventId: string;
  targetEventId: string;
  linkType: 'symptom_to_investigation' | 'investigation_to_diagnosis' | 'diagnosis_to_medication' | 
            'medication_to_followup' | 'procedure_to_outcome' | 'lab_trend' | 'referral_to_encounter' | 
            'planned_investigation_to_result' | 'same_condition_progression' | 'treatment_response';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  temporalDistance?: string;
}

export class LongitudinalLinkingService {
  private static instance: LongitudinalLinkingService;

  // Medical concept mappings for linking
  private readonly CONCEPT_MAPPINGS = {
    // Diabetes-related
    'hba1c': ['diabetes', 'glucose', 'glycemic', 'sugar'],
    'glucose': ['diabetes', 'hba1c', 'glycemic', 'sugar'],
    'fasting plasma glucose': ['diabetes', 'prediabetes', 'glucose'],
    
    // Kidney-related
    'creatinine': ['kidney', 'renal', 'nephropathy', 'egfr'],
    'egfr': ['kidney', 'renal', 'creatinine', 'nephropathy'],
    'blood urea': ['kidney', 'renal', 'urea'],
    'albumin': ['kidney', 'renal', 'proteinuria'],
    
    // Lipid-related
    'cholesterol': ['lipid', 'dyslipidemia', 'cardiovascular'],
    'ldl': ['lipid', 'cholesterol', 'dyslipidemia'],
    'hdl': ['lipid', 'cholesterol'],
    'triglycerides': ['lipid', 'cholesterol'],
    
    // Vitamin-related
    'vitamin b12': ['b12', 'cobalamin', 'anemia', 'neuropathy'],
    'vitamin d': ['d3', 'bone', 'calcium'],
    
    // Thyroid-related
    'tsh': ['thyroid', 'hypothyroidism', 'hyperthyroidism'],
    
    // Common procedures
    'appendicectomy': ['appendix', 'appendicitis', 'surgery'],
    'colonoscopy': ['colon', 'colorectal', 'screening'],
    'ecg': ['heart', 'cardiac', 'ekg'],
    'echo': ['heart', 'cardiac', 'echocardiogram'],
  };

  // Symptom-to-investigation mappings
  private readonly SYMPTOM_INVESTIGATION_MAP = {
    'fatigue': ['cbc', 'b12', 'thyroid', 'glucose', 'hba1c', 'iron'],
    'numbness': ['b12', 'glucose', 'thyroid', 'nerve'],
    'tingling': ['b12', 'glucose', 'thyroid', 'nerve'],
    'polyuria': ['glucose', 'hba1c', 'kidney'],
    'polydipsia': ['glucose', 'hba1c'],
    'weight loss': ['glucose', 'hba1c', 'thyroid'],
    'chest pain': ['ecg', 'troponin', 'cholesterol'],
    'shortness of breath': ['ecg', 'echo', 'cbc'],
  };

  // Diagnosis-to-medication mappings
  private readonly DIAGNOSIS_MEDICATION_MAP = {
    'type 2 diabetes': ['metformin', 'insulin', 'glipizide', 'sitagliptin'],
    'hypertension': ['lisinopril', 'amlodipine', 'hydrochlorothiazide'],
    'dyslipidemia': ['atorvastatin', 'simvastatin', 'rosuvastatin'],
    'hypothyroidism': ['levothyroxine', 'thyroxine'],
    'anemia': ['iron', 'b12', 'folate'],
  };

  private constructor() {}

  static getInstance(): LongitudinalLinkingService {
    if (!LongitudinalLinkingService.instance) {
      LongitudinalLinkingService.instance = new LongitudinalLinkingService();
    }
    return LongitudinalLinkingService.instance;
  }

  /**
   * Link events longitudinally based on medical concepts and temporal relationships
   */
  linkEvents(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    
    // Sort events by date
    const sortedEvents = events
      .filter(e => e.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    // 1. Link symptoms to investigations
    links.push(...this.linkSymptomsToInvestigations(sortedEvents));
    
    // 2. Link investigations to diagnoses
    links.push(...this.linkInvestigationsToDiagnoses(sortedEvents));
    
    // 3. Link diagnoses to medications
    links.push(...this.linkDiagnosesToMedications(sortedEvents));
    
    // 4. Link medications to follow-ups
    links.push(...this.linkMedicationsToFollowUps(sortedEvents));
    
    // 5. Link procedures to outcomes
    links.push(...this.linkProceduresToOutcomes(sortedEvents));
    
    // 6. Link lab trends (same test over time)
    links.push(...this.linkLabTrends(sortedEvents));
    
    // 7. Link referrals to encounters
    links.push(...this.linkReferralsToEncounters(sortedEvents));
    
    // 8. Link planned investigations to results
    links.push(...this.linkPlannedInvestigationsToResults(sortedEvents));
    
    // 9. Link same condition progression
    links.push(...this.linkSameConditionProgression(sortedEvents));
    
    // 10. Link treatment responses
    links.push(...this.linkTreatmentResponses(sortedEvents));

    return links;
  }

  /**
   * Link symptoms to subsequent investigations
   */
  private linkSymptomsToInvestigations(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    const symptoms = events.filter(e => e.eventType === 'symptom');
    const labs = events.filter(e => e.eventType === 'laboratory');

    for (const symptom of symptoms) {
      if (!symptom.date) continue;
      
      const symptomDate = new Date(symptom.date);
      const symptomConcepts = this.extractConcepts(symptom.title);
      
      // Look for labs within 90 days after symptom
      for (const lab of labs) {
        if (!lab.date) continue;
        
        const labDate = new Date(lab.date);
        const daysDiff = (labDate.getTime() - symptomDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0 && daysDiff <= 90) {
          const labConcepts = this.extractConcepts(lab.title);
          
          // Check if lab is related to symptom
          const isRelated = this.areConceptsRelated(symptomConcepts, labConcepts) ||
                          this.isSymptomInvestigationPair(symptom.title, lab.title);
          
          if (isRelated) {
            links.push({
              sourceEventId: symptom.id,
              targetEventId: lab.id,
              linkType: 'symptom_to_investigation',
              confidence: 'medium',
              reason: `Symptom "${symptom.title}" followed by related lab "${lab.title}" after ${Math.round(daysDiff)} days`,
              temporalDistance: `${Math.round(daysDiff)} days`,
            });
          }
        }
      }
    }

    return links;
  }

  /**
   * Link investigations to subsequent diagnoses
   */
  private linkInvestigationsToDiagnoses(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    const labs = events.filter(e => e.eventType === 'laboratory');
    const diagnoses = events.filter(e => e.eventType === 'diagnosis');

    for (const lab of labs) {
      if (!lab.date) continue;
      
      const labDate = new Date(lab.date);
      const labConcepts = this.extractConcepts(lab.title);
      
      // Look for diagnoses within 180 days after lab
      for (const diagnosis of diagnoses) {
        if (!diagnosis.date) continue;
        
        const diagnosisDate = new Date(diagnosis.date);
        const daysDiff = (diagnosisDate.getTime() - labDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0 && daysDiff <= 180) {
          const diagnosisConcepts = this.extractConcepts(diagnosis.title);
          
          // Check if diagnosis is related to lab
          const isRelated = this.areConceptsRelated(labConcepts, diagnosisConcepts);
          
          if (isRelated) {
            links.push({
              sourceEventId: lab.id,
              targetEventId: diagnosis.id,
              linkType: 'investigation_to_diagnosis',
              confidence: 'medium',
              reason: `Lab "${lab.title}" followed by related diagnosis "${diagnosis.title}" after ${Math.round(daysDiff)} days`,
              temporalDistance: `${Math.round(daysDiff)} days`,
            });
          }
        }
      }
    }

    return links;
  }

  /**
   * Link diagnoses to subsequent medications
   */
  private linkDiagnosesToMedications(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    const diagnoses = events.filter(e => e.eventType === 'diagnosis');
    const medications = events.filter(e => e.eventType === 'medication');

    for (const diagnosis of diagnoses) {
      if (!diagnosis.date) continue;
      
      const diagnosisDate = new Date(diagnosis.date);
      const diagnosisConcepts = this.extractConcepts(diagnosis.title);
      
      // Look for medications within 90 days after diagnosis
      for (const medication of medications) {
        if (!medication.date) continue;
        
        const medDate = new Date(medication.date);
        const daysDiff = (medDate.getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0 && daysDiff <= 90) {
          const medConcepts = this.extractConcepts(medication.title);
          
          // Check if medication is related to diagnosis
          const isRelated = this.isDiagnosisMedicationPair(diagnosis.title, medication.title) ||
                          this.areConceptsRelated(diagnosisConcepts, medConcepts);
          
          if (isRelated) {
            links.push({
              sourceEventId: diagnosis.id,
              targetEventId: medication.id,
              linkType: 'diagnosis_to_medication',
              confidence: 'high',
              reason: `Diagnosis "${diagnosis.title}" followed by related medication "${medication.title}" after ${Math.round(daysDiff)} days`,
              temporalDistance: `${Math.round(daysDiff)} days`,
            });
          }
        }
      }
    }

    return links;
  }

  /**
   * Link medications to follow-ups
   */
  private linkMedicationsToFollowUps(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    const medications = events.filter(e => e.eventType === 'medication');
    const consultations = events.filter(e => e.eventType === 'consultation');
    const labs = events.filter(e => e.eventType === 'laboratory');

    for (const medication of medications) {
      if (!medication.date) continue;
      
      const medDate = new Date(medication.date);
      
      // Look for follow-up consultations or labs within 180 days
      const followUps = [...consultations, ...labs];
      
      for (const followUp of followUps) {
        if (!followUp.date) continue;
        
        const followUpDate = new Date(followUp.date);
        const daysDiff = (followUpDate.getTime() - medDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0 && daysDiff <= 180) {
          links.push({
            sourceEventId: medication.id,
            targetEventId: followUp.id,
            linkType: 'medication_to_followup',
            confidence: 'low',
            reason: `Medication "${medication.title}" followed by ${followUp.eventType} after ${Math.round(daysDiff)} days`,
            temporalDistance: `${Math.round(daysDiff)} days`,
          });
        }
      }
    }

    return links;
  }

  /**
   * Link procedures to outcomes
   */
  private linkProceduresToOutcomes(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    const procedures = events.filter(e => e.eventType === 'procedure');
    const consultations = events.filter(e => e.eventType === 'consultation');

    for (const procedure of procedures) {
      if (!procedure.date) continue;
      
      const procDate = new Date(procedure.date);
      
      // Look for consultations mentioning outcome within 90 days
      for (const consultation of consultations) {
        if (!consultation.date) continue;
        
        const consultDate = new Date(consultation.date);
        const daysDiff = (consultDate.getTime() - procDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0 && daysDiff <= 90) {
          const consultDesc = (consultation.description || '').toLowerCase();
          
          // Check if consultation mentions procedure or outcome
          const mentionsProcedure = consultDesc.includes(procedure.title.toLowerCase()) ||
                                  consultDesc.includes('postoperative') ||
                                  consultDesc.includes('recovery') ||
                                  consultDesc.includes('outcome');
          
          if (mentionsProcedure) {
            links.push({
              sourceEventId: procedure.id,
              targetEventId: consultation.id,
              linkType: 'procedure_to_outcome',
              confidence: 'high',
              reason: `Procedure "${procedure.title}" followed by consultation mentioning outcome after ${Math.round(daysDiff)} days`,
              temporalDistance: `${Math.round(daysDiff)} days`,
            });
          }
        }
      }
    }

    return links;
  }

  /**
   * Link lab trends (same test over time)
   */
  private linkLabTrends(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    const labs = events.filter(e => e.eventType === 'laboratory');

    // Group labs by normalized test name
    const groupedLabs = new Map<string, MedicalEvent[]>();
    
    for (const lab of labs) {
      const normalizedName = this.normalizeTestName(lab.title);
      if (!groupedLabs.has(normalizedName)) {
        groupedLabs.set(normalizedName, []);
      }
      groupedLabs.get(normalizedName)!.push(lab);
    }

    // Create links between consecutive measurements of the same test
    for (const [testName, labGroup] of groupedLabs.entries()) {
      if (labGroup.length < 2) continue;
      
      const sortedLabs = labGroup
        .filter(l => l.date)
        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

      for (let i = 0; i < sortedLabs.length - 1; i++) {
        const current = sortedLabs[i];
        const next = sortedLabs[i + 1];
        
        if (!current.date || !next.date) continue;
        
        const currentDate = new Date(current.date);
        const nextDate = new Date(next.date);
        const daysDiff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        
        links.push({
          sourceEventId: current.id,
          targetEventId: next.id,
          linkType: 'lab_trend',
          confidence: 'high',
          reason: `Sequential measurement of ${testName} after ${Math.round(daysDiff)} days`,
          temporalDistance: `${Math.round(daysDiff)} days`,
        });
      }
    }

    return links;
  }

  /**
   * Link referrals to subsequent encounters
   */
  private linkReferralsToEncounters(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    const referrals = events.filter(e => e.title.toLowerCase().includes('referral') || e.eventType === 'consultation');
    const consultations = events.filter(e => e.eventType === 'consultation');

    for (const referral of referrals) {
      if (!referral.date) continue;
      
      const referralDate = new Date(referral.date);
      const referralConcepts = this.extractConcepts(referral.title);
      
      // Look for consultations within 180 days after referral
      for (const consultation of consultations) {
        if (!consultation.date || consultation.id === referral.id) continue;
        
        const consultDate = new Date(consultation.date);
        const daysDiff = (consultDate.getTime() - referralDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0 && daysDiff <= 180) {
          const consultConcepts = this.extractConcepts(consultation.title);
          
          // Check if consultation is related to referral
          const isRelated = this.areConceptsRelated(referralConcepts, consultConcepts);
          
          if (isRelated) {
            links.push({
              sourceEventId: referral.id,
              targetEventId: consultation.id,
              linkType: 'referral_to_encounter',
              confidence: 'medium',
              reason: `Referral "${referral.title}" followed by related consultation after ${Math.round(daysDiff)} days`,
              temporalDistance: `${Math.round(daysDiff)} days`,
            });
          }
        }
      }
    }

    return links;
  }

  /**
   * Link planned investigations to actual results
   */
  private linkPlannedInvestigationsToResults(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    
    // Look for events with "planned" or "repeat" in description
    const plannedEvents = events.filter(e => {
      const desc = (e.description || '').toLowerCase();
      const title = e.title.toLowerCase();
      return desc.includes('planned') || desc.includes('repeat') || title.includes('repeat');
    });

    const labs = events.filter(e => e.eventType === 'laboratory');

    for (const planned of plannedEvents) {
      if (!planned.date) continue;
      
      const plannedDate = new Date(planned.date);
      const plannedConcepts = this.extractConcepts(planned.title);
      
      // Look for actual lab results within 180 days
      for (const lab of labs) {
        if (!lab.date) continue;
        
        const labDate = new Date(lab.date);
        const daysDiff = (labDate.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0 && daysDiff <= 180) {
          const labConcepts = this.extractConcepts(lab.title);
          
          // Check if lab matches planned investigation
          const isRelated = this.areConceptsRelated(plannedConcepts, labConcepts);
          
          if (isRelated) {
            links.push({
              sourceEventId: planned.id,
              targetEventId: lab.id,
              linkType: 'planned_investigation_to_result',
              confidence: 'high',
              reason: `Planned investigation "${planned.title}" followed by actual lab result after ${Math.round(daysDiff)} days`,
              temporalDistance: `${Math.round(daysDiff)} days`,
            });
          }
        }
      }
    }

    return links;
  }

  /**
   * Link same condition progression across time
   */
  private linkSameConditionProgression(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    
    // Group events by normalized condition name
    const groupedEvents = new Map<string, MedicalEvent[]>();
    
    for (const event of events) {
      const concepts = this.extractConcepts(event.title);
      for (const concept of concepts) {
        if (!groupedEvents.has(concept)) {
          groupedEvents.set(concept, []);
        }
        groupedEvents.get(concept)!.push(event);
      }
    }

    // Create links between events of the same condition
    for (const [condition, eventGroup] of groupedEvents.entries()) {
      if (eventGroup.length < 2) continue;
      
      const sortedEvents = eventGroup
        .filter(e => e.date)
        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const current = sortedEvents[i];
        const next = sortedEvents[i + 1];
        
        if (!current.date || !next.date) continue;
        
        const currentDate = new Date(current.date);
        const nextDate = new Date(next.date);
        const daysDiff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Only link if different event types or significant time gap
        if (current.eventType !== next.eventType || daysDiff > 30) {
          links.push({
            sourceEventId: current.id,
            targetEventId: next.id,
            linkType: 'same_condition_progression',
            confidence: 'medium',
            reason: `Progression of ${condition} from ${current.eventType} to ${next.eventType} after ${Math.round(daysDiff)} days`,
            temporalDistance: `${Math.round(daysDiff)} days`,
          });
        }
      }
    }

    return links;
  }

  /**
   * Link treatment responses
   */
  private linkTreatmentResponses(events: MedicalEvent[]): LongitudinalLink[] {
    const links: LongitudinalLink[] = [];
    const medications = events.filter(e => e.eventType === 'medication');
    const symptoms = events.filter(e => e.eventType === 'symptom');
    const labs = events.filter(e => e.eventType === 'laboratory');

    for (const medication of medications) {
      if (!medication.date) continue;
      
      const medDate = new Date(medication.date);
      const medConcepts = this.extractConcepts(medication.title);
      
      // Look for symptom improvement or lab improvement after medication
      const followUps = [...symptoms, ...labs];
      
      for (const followUp of followUps) {
        if (!followUp.date) continue;
        
        const followUpDate = new Date(followUp.date);
        const daysDiff = (followUpDate.getTime() - medDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0 && daysDiff <= 180) {
          const followUpConcepts = this.extractConcepts(followUp.title);
          
          // Check if related
          const isRelated = this.areConceptsRelated(medConcepts, followUpConcepts);
          
          if (isRelated) {
            links.push({
              sourceEventId: medication.id,
              targetEventId: followUp.id,
              linkType: 'treatment_response',
              confidence: 'low',
              reason: `Medication "${medication.title}" followed by related ${followUp.eventType} after ${Math.round(daysDiff)} days`,
              temporalDistance: `${Math.round(daysDiff)} days`,
            });
          }
        }
      }
    }

    return links;
  }

  /**
   * Extract medical concepts from text
   */
  private extractConcepts(text: string): string[] {
    const concepts: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const [concept, relatedTerms] of Object.entries(this.CONCEPT_MAPPINGS)) {
      if (lowerText.includes(concept) || relatedTerms.some(term => lowerText.includes(term))) {
        concepts.push(concept);
      }
    }
    
    return concepts;
  }

  /**
   * Check if two sets of concepts are related
   */
  private areConceptsRelated(concepts1: string[], concepts2: string[]): boolean {
    for (const c1 of concepts1) {
      for (const c2 of concepts2) {
        if (c1 === c2) return true;
        
        // Check if concepts are in the same mapping group
        const relatedToC1 = this.CONCEPT_MAPPINGS[c1 as keyof typeof this.CONCEPT_MAPPINGS] || [];
        if (relatedToC1.includes(c2)) return true;
        
        const relatedToC2 = this.CONCEPT_MAPPINGS[c2 as keyof typeof this.CONCEPT_MAPPINGS] || [];
        if (relatedToC2.includes(c1)) return true;
      }
    }
    return false;
  }

  /**
   * Check if symptom-investigation pair is valid
   */
  private isSymptomInvestigationPair(symptom: string, investigation: string): boolean {
    const symptomLower = symptom.toLowerCase();
    const invLower = investigation.toLowerCase();
    
    for (const [symptomKey, investigations] of Object.entries(this.SYMPTOM_INVESTIGATION_MAP)) {
      if (symptomLower.includes(symptomKey)) {
        return investigations.some(inv => invLower.includes(inv));
      }
    }
    return false;
  }

  /**
   * Check if diagnosis-medication pair is valid
   */
  private isDiagnosisMedicationPair(diagnosis: string, medication: string): boolean {
    const diagnosisLower = diagnosis.toLowerCase();
    const medLower = medication.toLowerCase();
    
    for (const [diagnosisKey, medications] of Object.entries(this.DIAGNOSIS_MEDICATION_MAP)) {
      if (diagnosisLower.includes(diagnosisKey)) {
        return medications.some(med => medLower.includes(med));
      }
    }
    return false;
  }

  /**
   * Normalize test name for grouping
   */
  private normalizeTestName(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/level|test|result|count/g, '');
  }
}

export const longitudinalLinkingService = LongitudinalLinkingService.getInstance();
