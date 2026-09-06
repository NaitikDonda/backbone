import type { Signal } from '../types';

interface SignalSectionProps {
  signals: Signal[];
}

export function SignalSection({ signals }: SignalSectionProps) {
  const getSeverityColor = (severity: Signal['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-border bg-surface';
    }
  };

  return (
    <div className="space-y-6">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className={`border-l-4 rounded-r-lg p-6 ${getSeverityColor(signal.severity)}`}
        >
          <div className="mb-3">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              {signal.type}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">{signal.title}</h3>
          <p className="text-text-secondary mb-4">{signal.description}</p>
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <span>Observed across:</span>
            {signal.observedYears.map((year, index) => (
              <span key={year}>
                {year}
                {index < signal.observedYears.length - 1 && ' → '}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
