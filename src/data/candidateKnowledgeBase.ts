import type { CandidateCondition } from '../types';

/**
 * DEVELOPMENT KNOWLEDGE BASE
 * 
 * This is a synthetic development dataset for testing the candidate matching architecture.
 * It is NOT a comprehensive rare-disease database.
 * 
 * Each condition is marked with version: "development-0.1"
 * 
 * IMPORTANT: This knowledge base is for development/testing purposes only.
 * It should be replaced with a properly sourced medical knowledge resource in production.
 */

export const KNOWLEDGE_VERSION = 'development-0.1';

export const DEVELOPMENT_CANDIDATE_CONDITIONS: CandidateCondition[] = [
  {
    id: 'dev-condition-001',
    name: 'Vitamin B12 Deficiency Neuropathy',
    category: 'neurological',
    description: 'A condition characterized by neurological symptoms associated with low Vitamin B12 levels.',
    associatedSymptoms: [
      'fatigue',
      'numbness',
      'tingling',
      'weakness',
      'balance problems',
    ],
    associatedLabs: [
      {
        testName: 'Vitamin B12',
        expectedPattern: 'low',
      },
      {
        testName: 'hemoglobin',
        expectedPattern: 'low',
      },
      {
        testName: 'MCV',
        expectedPattern: 'high',
      },
    ],
    associatedPatterns: [
      'persistent neurological symptoms',
      'symmetric sensory changes',
      'progressive neurological symptoms',
    ],
    requiredEvidence: [
      'low Vitamin B12 level',
      'neurological symptoms',
    ],
    contradictingFeatures: [
      'normal Vitamin B12 level',
      'acute onset of symptoms',
      'focal neurological deficit',
    ],
    source: 'Synthetic development condition for testing',
    version: KNOWLEDGE_VERSION,
  },
  {
    id: 'dev-condition-002',
    name: 'Chronic Fatigue Pattern',
    category: 'general',
    description: 'A pattern of persistent fatigue without clear alternative explanation.',
    associatedSymptoms: [
      'fatigue',
      'exhaustion',
      'tiredness',
      'lack of energy',
    ],
    associatedLabs: [
      {
        testName: 'CBC',
        expectedPattern: 'normal',
      },
      {
        testName: 'thyroid function',
        expectedPattern: 'normal',
      },
    ],
    associatedPatterns: [
      'persistent fatigue over months',
      'fatigue affecting daily activities',
      'no improvement with rest',
    ],
    requiredEvidence: [
      'fatigue documented multiple times',
      'duration over 6 months',
    ],
    contradictingFeatures: [
      'acute fatigue',
      'clear alternative explanation',
      'resolving fatigue',
    ],
    source: 'Synthetic development condition for testing',
    version: KNOWLEDGE_VERSION,
  },
  {
    id: 'dev-condition-003',
    name: 'Recurrent Headache Pattern',
    category: 'neurological',
    description: 'A pattern of recurrent headaches without clear secondary cause.',
    associatedSymptoms: [
      'headache',
      'head pain',
      'cephhalgia',
      'migraine',
    ],
    associatedLabs: [
      {
        testName: 'CBC',
        expectedPattern: 'normal',
      },
      {
        testName: 'inflammatory markers',
        expectedPattern: 'normal',
      },
    ],
    associatedPatterns: [
      'recurrent headaches',
      'headaches over months',
      'similar headache characteristics',
    ],
    requiredEvidence: [
      'headache documented multiple times',
      'recurrence over time',
    ],
    contradictingFeatures: [
      'single headache episode',
      'clear secondary cause identified',
      'traumatic head injury',
    ],
    source: 'Synthetic development condition for testing',
    version: KNOWLEDGE_VERSION,
  },
  {
    id: 'dev-condition-004',
    name: 'Anemia Pattern',
    category: 'hematological',
    description: 'A pattern of low hemoglobin with associated symptoms.',
    associatedSymptoms: [
      'fatigue',
      'weakness',
      'pale skin',
      'shortness of breath',
      'dizziness',
    ],
    associatedLabs: [
      {
        testName: 'hemoglobin',
        expectedPattern: 'low',
      },
      {
        testName: 'hematocrit',
        expectedPattern: 'low',
      },
    ],
    associatedPatterns: [
      'persistent low hemoglobin',
      'anemia over time',
    ],
    requiredEvidence: [
      'low hemoglobin',
      'low hematocrit',
    ],
    contradictingFeatures: [
      'normal hemoglobin',
      'normal hematocrit',
    ],
    source: 'Synthetic development condition for testing',
    version: KNOWLEDGE_VERSION,
  },
];

export class CandidateKnowledgeBase {
  private static instance: CandidateKnowledgeBase;
  private conditions: CandidateCondition[];
  private version: string;

  private constructor() {
    this.conditions = DEVELOPMENT_CANDIDATE_CONDITIONS;
    this.version = KNOWLEDGE_VERSION;
  }

  static getInstance(): CandidateKnowledgeBase {
    if (!CandidateKnowledgeBase.instance) {
      CandidateKnowledgeBase.instance = new CandidateKnowledgeBase();
    }
    return CandidateKnowledgeBase.instance;
  }

  /**
   * Get all candidate conditions
   */
  getAllConditions(): CandidateCondition[] {
    return [...this.conditions];
  }

  /**
   * Get condition by ID
   */
  getConditionById(id: string): CandidateCondition | undefined {
    return this.conditions.find(c => c.id === id);
  }

  /**
   * Get conditions by category
   */
  getConditionsByCategory(category: string): CandidateCondition[] {
    return this.conditions.filter(c => c.category === category);
  }

  /**
   * Get knowledge base version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Search conditions by symptom
   */
  searchBySymptom(symptom: string): CandidateCondition[] {
    const normalizedSymptom = symptom.toLowerCase().trim();
    return this.conditions.filter(c =>
      c.associatedSymptoms.some(s => s.toLowerCase().includes(normalizedSymptom))
    );
  }

  /**
   * Search conditions by lab test
   */
  searchByLabTest(testName: string): CandidateCondition[] {
    const normalizedTest = testName.toLowerCase().trim();
    return this.conditions.filter(c =>
      c.associatedLabs.some(l => l.testName.toLowerCase().includes(normalizedTest))
    );
  }
}
