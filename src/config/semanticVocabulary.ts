/**
 * Development Semantic Vocabulary for Phase 12
 * 
 * This is a curated development vocabulary for semantic normalization.
 * It is NOT a comprehensive medical dictionary - it's a starting point
 * that can be extended as needed.
 * 
 * Version: development-0.1
 */

import type { CanonicalConcept, ConceptType } from '../types';

/**
 * Development vocabulary for semantic normalization
 * 
 * Each entry maps a canonical concept to its synonyms and variants.
 * This is intentionally conservative - we only map terms that are
 * clearly equivalent in clinical documentation.
 */
export const DEVELOPMENT_VOCABULARY: CanonicalConcept[] = [
  // Symptoms - Fatigue-related
  {
    id: 'concept-fatigue',
    canonicalName: 'fatigue',
    conceptType: 'symptom',
    synonyms: ['tiredness', 'feeling tired', 'low energy', 'exhaustion', 'lack of energy', 'tired', 'weary'],
    variants: ['fatigued', 'tiredness', 'exhausted'],
    version: 'development-0.1',
  },
  
  // Symptoms - Pain-related
  {
    id: 'concept-headache',
    canonicalName: 'headache',
    conceptType: 'symptom',
    synonyms: ['cephalgia', 'head pain', 'pain in head'],
    variants: ['headaches'],
    version: 'development-0.1',
  },
  
  // Symptoms - Nausea-related
  {
    id: 'concept-nausea',
    canonicalName: 'nausea',
    conceptType: 'symptom',
    synonyms: ['feeling sick', 'queasy', 'upset stomach'],
    variants: ['nauseous'],
    version: 'development-0.1',
  },
  
  // Symptoms - Dizziness-related
  {
    id: 'concept-dizziness',
    canonicalName: 'dizziness',
    conceptType: 'symptom',
    synonyms: ['lightheadedness', 'vertigo', 'feeling faint', 'unsteady'],
    variants: ['dizzy'],
    version: 'development-0.1',
  },
  
  // Symptoms - Shortness of breath
  {
    id: 'concept-dyspnea',
    canonicalName: 'shortness of breath',
    conceptType: 'symptom',
    synonyms: ['dyspnea', 'breathlessness', 'difficulty breathing', 'labored breathing'],
    variants: ['short of breath'],
    version: 'development-0.1',
  },
  
  // Symptoms - Weakness-related
  {
    id: 'concept-weakness',
    canonicalName: 'weakness',
    conceptType: 'symptom',
    synonyms: ['muscle weakness', 'generalized weakness', 'feeling weak'],
    variants: ['weak'],
    version: 'development-0.1',
  },
  
  // Laboratory - Vitamin B12
  {
    id: 'concept-vitamin-b12',
    canonicalName: 'Vitamin B12',
    conceptType: 'laboratory',
    synonyms: ['B12', 'Cobalamin', 'Cyanocobalamin'],
    variants: ['vitamin b12', 'cobalamin', 'b-12'],
    version: 'development-0.1',
  },
  
  // Laboratory - Hemoglobin
  {
    id: 'concept-hemoglobin',
    canonicalName: 'Hemoglobin',
    conceptType: 'laboratory',
    synonyms: ['Hb', 'Hgb'],
    variants: ['hemoglobin'],
    version: 'development-0.1',
  },
  
  // Laboratory - Hematocrit
  {
    id: 'concept-hematocrit',
    canonicalName: 'Hematocrit',
    conceptType: 'laboratory',
    synonyms: ['Hct'],
    variants: ['hematocrit'],
    version: 'development-0.1',
  },
  
  // Laboratory - Complete Blood Count
  {
    id: 'concept-cbc',
    canonicalName: 'Complete Blood Count',
    conceptType: 'laboratory',
    synonyms: ['CBC', 'Complete Blood Count', 'Full Blood Count', 'FBC'],
    variants: ['cbc'],
    version: 'development-0.1',
  },
  
  // Laboratory - Thyroid Stimulating Hormone
  {
    id: 'concept-tsh',
    canonicalName: 'Thyroid Stimulating Hormone',
    conceptType: 'laboratory',
    synonyms: ['TSH', 'Thyrotropin'],
    variants: ['tsh'],
    version: 'development-0.1',
  },
  
  // Laboratory - Blood Glucose
  {
    id: 'concept-glucose',
    canonicalName: 'Blood Glucose',
    conceptType: 'laboratory',
    synonyms: ['Glucose', 'Blood Sugar', 'Fasting Glucose', 'Random Glucose'],
    variants: ['blood glucose', 'blood sugar'],
    version: 'development-0.1',
  },
  
  // Laboratory - Creatinine
  {
    id: 'concept-creatinine',
    canonicalName: 'Creatinine',
    conceptType: 'laboratory',
    synonyms: ['Serum Creatinine', 'Cr'],
    variants: ['creatinine'],
    version: 'development-0.1',
  },
  
  // Laboratory - ALT
  {
    id: 'concept-alt',
    canonicalName: 'Alanine Aminotransferase',
    conceptType: 'laboratory',
    synonyms: ['ALT', 'Alanine Transaminase', 'SGPT', 'Serum Glutamic Pyruvic Transaminase'],
    variants: ['alt'],
    version: 'development-0.1',
  },
  
  // Laboratory - AST
  {
    id: 'concept-ast',
    canonicalName: 'Aspartate Aminotransferase',
    conceptType: 'laboratory',
    synonyms: ['AST', 'Aspartate Transaminase', 'SGOT', 'Serum Glutamic Oxaloacetic Transaminase'],
    variants: ['ast'],
    version: 'development-0.1',
  },
];

/**
 * Deterministic normalization rules for common variations
 * These are simple string transformations that handle obvious variations
 */
export const DETERMINISTIC_NORMALIZATION_RULES: Record<string, string> = {
  // Common abbreviations to full terms
  'vit b12': 'vitamin b12',
  'b12': 'vitamin b12',
  'hb': 'hemoglobin',
  'hgb': 'hemoglobin',
  'hct': 'hematocrit',
  'cbc': 'complete blood count',
  'tsh': 'thyroid stimulating hormone',
  'cr': 'creatinine',
  'alt': 'alanine aminotransferase',
  'ast': 'aspartate aminotransferase',
  
  // Common plural/singular variations
  'headaches': 'headache',
  'nauseas': 'nausea',
  'dizzinesses': 'dizziness',
  'weaknesses': 'weakness',
  
  // Common hyphenation variations
  'shortness-of-breath': 'shortness of breath',
  'low-energy': 'low energy',
  'vitamin-b12': 'vitamin b12',
  
  // Remove common prefixes
  'feeling ': '',
  'feeling of ': '',
  'complains of ': '',
  'reports ': '',
  'patient reports ': '',
  'patient complains of ': '',
};

/**
 * Negation patterns - these indicate the concept is NOT present
 */
export const NEGATION_PATTERNS = [
  'no ',
  'denies ',
  'denied ',
  'negative for ',
  'without ',
  'absence of ',
  'none of ',
  'no evidence of ',
  'no history of ',
  'no symptoms of ',
  'rule out ',
  'ruled out ',
  'not ',
  'never ',
];

/**
 * Temporal qualifier patterns
 */
export const TEMPORAL_QUALIFIER_PATTERNS: Record<string, string> = {
  'history of': 'historical',
  'previous ': 'historical',
  'past ': 'historical',
  'resolved ': 'resolved',
  'resolution of': 'resolved',
  'resolved': 'resolved',
  'recurrent ': 'recurrent',
  'recurrence': 'recurrent',
  'recurrent': 'recurrent',
  'intermittent ': 'intermittent',
  'intermittent': 'intermittent',
  'chronic ': 'chronic',
  'chronic': 'chronic',
  'acute ': 'acute',
  'acute': 'acute',
  'currently ': 'current',
  'current ': 'current',
  'ongoing ': 'current',
  'ongoing': 'current',
};

/**
 * Resolution patterns - these indicate a condition has resolved
 */
export const RESOLUTION_PATTERNS = [
  'resolved',
  'resolution',
  'recovered',
  'recovery',
  'improved',
  'discontinued', // for medications
  'stopped', // for medications
];

/**
 * Get canonical concept for a given term
 */
export function getCanonicalConcept(term: string, conceptType: ConceptType): CanonicalConcept | null {
  const normalizedTerm = normalizeTerm(term);
  
  for (const concept of DEVELOPMENT_VOCABULARY) {
    if (concept.conceptType !== conceptType) continue;
    
    // Check exact match with canonical name
    if (normalizedTerm === normalizeTerm(concept.canonicalName)) {
      return concept;
    }
    
    // Check synonyms
    for (const synonym of concept.synonyms) {
      if (normalizedTerm === normalizeTerm(synonym)) {
        return concept;
      }
    }
    
    // Check variants
    for (const variant of concept.variants) {
      if (normalizedTerm === normalizeTerm(variant)) {
        return concept;
      }
    }
  }
  
  return null;
}

/**
 * Normalize a term using deterministic rules
 */
export function normalizeTerm(term: string): string {
  let normalized = term.toLowerCase().trim();
  
  // Apply deterministic normalization rules
  for (const [pattern, replacement] of Object.entries(DETERMINISTIC_NORMALIZATION_RULES)) {
    if (normalized.includes(pattern)) {
      normalized = normalized.replace(pattern, replacement);
    }
  }
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Check if a text contains negation
 */
export function containsNegation(text: string): boolean {
  const lowerText = text.toLowerCase();
  return NEGATION_PATTERNS.some(pattern => lowerText.includes(pattern));
}

/**
 * Extract temporal qualifier from text
 */
export function extractTemporalQualifier(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  for (const [pattern, qualifier] of Object.entries(TEMPORAL_QUALIFIER_PATTERNS)) {
    if (lowerText.includes(pattern)) {
      return qualifier;
    }
  }
  
  return null;
}

/**
 * Check if text indicates resolution
 */
export function indicatesResolution(text: string): boolean {
  const lowerText = text.toLowerCase();
  return RESOLUTION_PATTERNS.some(pattern => lowerText.includes(pattern));
}
