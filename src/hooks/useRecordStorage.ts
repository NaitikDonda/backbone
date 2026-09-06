import { useState, useEffect } from 'react';
import type { MedicalRecord } from '../types';

const STORAGE_KEY = 'backbone_records';

export function useRecordStorage(patientId: string) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [patientId]);

  const loadRecords = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allRecords = JSON.parse(stored) as MedicalRecord[];
        const patientRecords = allRecords.filter(r => r.patientId === patientId);
        setRecords(patientRecords);
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecords = (newRecords: MedicalRecord[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allRecords = stored ? JSON.parse(stored) as MedicalRecord[] : [];
      
      const otherPatientRecords = allRecords.filter(r => r.patientId !== patientId);
      const updatedRecords = [...otherPatientRecords, ...newRecords];
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
      setRecords([...otherPatientRecords, ...newRecords]);
    } catch (error) {
      console.error('Failed to save records:', error);
      throw new Error('Failed to save records to storage');
    }
  };

  const addRecord = (record: MedicalRecord) => {
    const newRecords = [...records, record];
    saveRecords(newRecords);
  };

  const updateRecord = (id: string, updates: Partial<MedicalRecord>) => {
    const newRecords = records.map(r => 
      r.id === id ? { ...r, ...updates } : r
    );
    saveRecords(newRecords);
  };

  const deleteRecord = (id: string) => {
    const newRecords = records.filter(r => r.id !== id);
    saveRecords(newRecords);
  };

  const deleteAllRecords = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allRecords = JSON.parse(stored) as MedicalRecord[];
        const otherPatientRecords = allRecords.filter(r => r.patientId !== patientId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(otherPatientRecords));
      }
      setRecords([]);
    } catch (error) {
      console.error('Failed to delete all records:', error);
      throw new Error('Failed to delete all records');
    }
  };

  const resetAllStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecords([]);
    } catch (error) {
      console.error('Failed to reset storage:', error);
      throw new Error('Failed to reset storage');
    }
  };

  return {
    records,
    isLoading,
    addRecord,
    updateRecord,
    deleteRecord,
    deleteAllRecords,
    resetAllStorage,
    refresh: loadRecords,
  };
}
