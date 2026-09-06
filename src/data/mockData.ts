import type { Patient, MedicalRecord, TimelineEvent, Signal } from '../types';

export const mockPatient: Patient = {
  id: '1',
  name: 'Patient',
  age: 0,
  yearsOfHistory: 0,
};

export const mockTimelineEvents: TimelineEvent[] = [];

export const mockRecords: MedicalRecord[] = [];

export const mockSignals: Signal[] = [
  {
    id: '1',
    type: 'SIGNAL DETECTED',
    title: 'Recurring fatigue',
    description: 'Fatigue reported across multiple consultations over three-year period',
    observedYears: [2021, 2022, 2024],
    severity: 'medium',
  },
  {
    id: '2',
    type: 'PERSISTENT FINDING',
    title: 'Low hemoglobin',
    description: 'Hemoglobin levels consistently below normal range in recent tests',
    observedYears: [2022, 2023, 2024],
    severity: 'high',
  },
];
