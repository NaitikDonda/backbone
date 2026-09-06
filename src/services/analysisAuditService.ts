import type { AnalysisAudit } from '../types';

export class AnalysisAuditService {
  private static instance: AnalysisAuditService;
  private audits: Map<string, AnalysisAudit>;
  private auditHistory: AnalysisAudit[];

  private constructor() {
    this.audits = new Map();
    this.auditHistory = [];
  }

  static getInstance(): AnalysisAuditService {
    if (!AnalysisAuditService.instance) {
      AnalysisAuditService.instance = new AnalysisAuditService();
    }
    return AnalysisAuditService.instance;
  }

  /**
   * Record an analysis audit entry
   */
  recordAudit(audit: AnalysisAudit): void {
    this.audits.set(audit.id, audit);
    this.auditHistory.push(audit);
  }

  /**
   * Get audit by ID
   */
  getAuditById(id: string): AnalysisAudit | undefined {
    return this.audits.get(id);
  }

  /**
   * Get audits for a patient
   */
  getAuditsForPatient(patientId: string): AnalysisAudit[] {
    return this.auditHistory.filter(a => a.patientId === patientId);
  }

  /**
   * Get latest audit for a patient
   */
  getLatestAudit(patientId: string): AnalysisAudit | undefined {
    const patientAudits = this.getAuditsForPatient(patientId);
    if (patientAudits.length === 0) return undefined;
    
    return patientAudits.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }

  /**
   * Get audit history for a patient
   */
  getAuditHistory(patientId: string): AnalysisAudit[] {
    return this.getAuditsForPatient(patientId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Clear audits for a patient
   */
  clearAuditsForPatient(patientId: string): void {
    const toRemove = this.auditHistory.filter(a => a.patientId === patientId);
    for (const audit of toRemove) {
      this.audits.delete(audit.id);
    }
    this.auditHistory = this.auditHistory.filter(a => a.patientId !== patientId);
  }

  /**
   * Generate audit ID
   */
  generateAuditId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
