import type { Patient } from '../types';
import { formatDate, formatCount } from '../utils/dataFormatting';

interface PatientHeaderProps {
  patient: Patient;
  recordCount?: number;
  lastEventDate?: string | null;
  onResetRecords?: () => void;
  onResetAllStorage?: () => void;
}

export function PatientHeader({ 
  patient, 
  recordCount = 0,
  lastEventDate = null,
  onResetRecords, 
  onResetAllStorage 
}: PatientHeaderProps) {
  // Calculate date range from patient's years of history
  // This is a simplified calculation - in production, this would come from actual record dates
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - (patient.yearsOfHistory || 0);
  const dateRange = patient.yearsOfHistory > 0 
    ? `${startYear} — ${currentYear}`
    : 'Not documented';

  return (
    <div className="card p-card mb-section">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-tiny text-text-muted uppercase tracking-wider mb-1">
            Patient
          </div>
          <h2 className="text-page-title text-text-primary mb-4">
            {patient.name || 'Anonymous Patient'}
          </h2>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-tiny text-text-muted uppercase tracking-wider mb-1">
                Medical history
              </div>
              <div className="text-body text-text-primary">
                {dateRange}
              </div>
            </div>
            
            <div>
              <div className="text-tiny text-text-muted uppercase tracking-wider mb-1">
                Records
              </div>
              <div className="text-body text-text-primary">
                {formatCount(recordCount, 'record', 'records')}
              </div>
            </div>
            
            <div>
              <div className="text-tiny text-text-muted uppercase tracking-wider mb-1">
                Last documented event
              </div>
              <div className="text-body text-text-primary">
                {lastEventDate ? formatDate(lastEventDate) : 'Not documented'}
              </div>
            </div>
          </div>
        </div>

        {/* Technical controls - kept minimal and secondary */}
        <div className="flex items-center gap-2 ml-4">
          {onResetRecords && (
            <button
              onClick={onResetRecords}
              className="text-tiny text-text-muted hover:text-text-secondary transition-colors"
            >
              Reset records
            </button>
          )}
          {onResetAllStorage && (
            <>
              <span className="text-text-tertiary">•</span>
              <button
                onClick={onResetAllStorage}
                className="text-tiny text-text-muted hover:text-error transition-colors"
              >
                Reset all
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
