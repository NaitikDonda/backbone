import { useState, useEffect } from 'react';
import { mockPatient } from '../data/mockData';
import { useRecordStorage } from '../hooks/useRecordStorage';
import { MedicalEventService } from '../services/medicalEventService';
import type { MedicalEvent } from '../types';
import { formatDate } from '../utils/dataFormatting';

export function Journey() {
  const { records } = useRecordStorage(mockPatient.id);
  const medicalEventService = MedicalEventService.getInstance();
  
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    const allEvents = records.flatMap(record =>
      medicalEventService.createEventsFromRecord(record)
    );
    const deduplicatedEvents = medicalEventService.deduplicateEvents(allEvents);
    const { dated } = medicalEventService.separateByDate(deduplicatedEvents);
    const sortedEvents = medicalEventService.sortEventsChronologically(dated);
    setEvents(sortedEvents);

    // Debug logging to verify data consistency
    console.log('[Journey] Records loaded:', records.length);
    console.log('[Journey] Events created:', allEvents.length);
    console.log('[Journey] Events after deduplication:', deduplicatedEvents.length);
    console.log('[Journey] Dated events:', dated.length);
    console.log('[Journey] Event types:', sortedEvents.map(e => e.eventType));
  }, [records]);

  const hasEvents = events.length > 0;

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      symptom: 'bg-symptom',
      diagnosis: 'bg-diagnosis',
      laboratory: 'bg-laboratory',
      medication: 'bg-medication',
      procedure: 'bg-procedure',
      consultation: 'bg-consultation',
      hospital_visit: 'bg-hospital',
    };
    return colors[eventType] || 'bg-text-tertiary';
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      symptom: 'Symptom',
      diagnosis: 'Diagnosis',
      laboratory: 'Laboratory',
      medication: 'Medication',
      procedure: 'Procedure',
      consultation: 'Consultation',
      hospital_visit: 'Hospital Visit',
    };
    return labels[eventType] || eventType;
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-display text-text-primary mb-4">Health Journey</h1>
        <p className="text-h2 text-text-secondary font-light mb-8">
          A chronological timeline of documented health events
        </p>
        {hasEvents && (
          <div className="flex items-center gap-8 text-small text-text-tertiary">
            <span>{events.length} events</span>
            <span>•</span>
            <span>
              {events.length > 0 && events[0].date && events[events.length - 1].date
                ? `${formatDate(events[0].date)} – ${formatDate(events[events.length - 1].date)}`
                : 'Time span not documented'}
            </span>
          </div>
        )}
      </div>

      {!hasEvents && (
        <div className="text-center py-24">
          <div className="text-6xl mb-6 text-text-muted">◇</div>
          <h2 className="text-h2 text-text-primary mb-4">No Journey Yet</h2>
          <p className="text-body-large text-text-secondary mb-8 max-w-xl mx-auto">
            Upload medical documents to begin reconstructing the health journey timeline.
          </p>
        </div>
      )}

      {hasEvents && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border-light" />

          {/* Timeline events */}
          <div className="space-y-12 pl-20">
            {events.map((event) => (
              <div key={event.id} className="relative">
                {/* Timeline dot */}
                <div className={`absolute left-[-44px] w-4 h-4 rounded-full border-4 border-surface ${getEventTypeColor(event.eventType)}`} />

                {/* Event card */}
                <div
                  className={`bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden transition-all duration-base ${
                    expandedEventId === event.id ? 'shadow-md' : 'hover:shadow-md'
                  }`}
                >
                  {/* Event header - always visible */}
                  <div
                    className="p-8 cursor-pointer"
                    onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="badge badge-primary">
                            {getEventTypeLabel(event.eventType)}
                          </span>
                          {event.date && (
                            <span className="text-body text-text-tertiary">
                              {formatDate(event.date)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-h3 text-text-primary mb-3">{event.title}</h3>
                        {event.description && (
                          <p className="text-body-large text-text-secondary leading-relaxed line-clamp-3">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <svg
                        className={`w-6 h-6 text-text-tertiary transition-transform duration-base ml-6 flex-shrink-0 ${
                          expandedEventId === event.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedEventId === event.id && (
                    <div className="border-t border-border-light p-8 bg-background">
                      <div className="space-y-6">
                        {/* Source information */}
                        <div>
                          <p className="text-tiny text-text-tertiary mb-2 uppercase tracking-wider">Source</p>
                          <p className="text-body text-text-secondary">
                            {event.sourceDocumentName || 'Unknown document'}
                          </p>
                          {event.metadata?.pageNumber && (
                            <p className="text-small text-text-tertiary mt-1">
                              Page {event.metadata.pageNumber}
                            </p>
                          )}
                        </div>

                        {/* Full description */}
                        {event.description && (
                          <div>
                            <p className="text-tiny text-text-tertiary mb-2 uppercase tracking-wider">Details</p>
                            <p className="text-body-large text-text-secondary leading-relaxed">{event.description}</p>
                          </div>
                        )}

                        {/* Additional metadata */}
                        {Object.keys(event.metadata || {}).length > 0 && (
                          <div>
                            <p className="text-tiny text-text-tertiary mb-2 uppercase tracking-wider">Additional Information</p>
                            <div className="space-y-2">
                              {Object.entries(event.metadata || {}).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-3">
                                  <span className="text-small text-text-tertiary w-32">{key}:</span>
                                  <span className="text-body text-text-secondary">
                                    {String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
