import { Link } from 'react-router-dom';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Upload Medical Records',
      description: 'Upload PDF medical documents including lab reports, prescriptions, diagnoses, consultation notes, imaging reports, and hospital visits.',
      details: [
        'Drag and drop or browse files',
        'Supports PDF, PNG, JPG formats',
        'Automatic document type detection',
        'Secure local processing'
      ]
    },
    {
      number: '02',
      title: 'Extract Medical Information',
      description: 'BACKBONE uses OCR and extraction to identify symptoms, diagnoses, lab results, medications, procedures, and other clinical events from each document.',
      details: [
        'OCR for scanned documents',
        'Structured data extraction',
        'Entity recognition',
        'Context preservation'
      ]
    },
    {
      number: '03',
      title: 'Reconstruct Health Journey',
      description: 'Events are chronologically organized into a longitudinal timeline, revealing the patient\'s health story across time.',
      details: [
        'Temporal event ordering',
        'Episode grouping',
        'Longitudinal themes',
        'Open thread identification'
      ]
    },
    {
      number: '04',
      title: 'Detect Relationships and Patterns',
      description: 'AI analyzes the journey to detect patterns, relationships between events, and longitudinal themes that span multiple episodes.',
      details: [
        'Pattern detection algorithms',
        'Semantic relationship mapping',
        'Cross-temporal analysis',
        'Evidence graph construction'
      ]
    },
    {
      number: '05',
      title: 'Surface Evidence-Backed Insights',
      description: 'BACKBONE generates clinical signals, candidate conditions, and care gaps—each grounded in specific evidence from source documents.',
      details: [
        'Evidence-backed findings',
        'Candidate condition analysis',
        'Care gap detection',
        'Human-readable explanations'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <h1 className="text-display text-text-primary mb-6">How BACKBONE Works</h1>
        <p className="text-body-large text-text-secondary leading-relaxed">
          BACKBONE transforms fragmented medical records into a coherent, evidence-backed health narrative through a five-step process.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-24">
        {steps.map((step, index) => (
          <div key={step.number} className="flex gap-12">
            <div className="flex-shrink-0">
              <div className="text-h2 text-accent-primary font-light">{step.number}</div>
            </div>
            <div className="flex-1">
              <h2 className="text-h2 text-text-primary mb-4">{step.title}</h2>
              <p className="text-body-large text-text-secondary mb-8 leading-relaxed">
                {step.description}
              </p>
              <ul className="space-y-3">
                {step.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3 text-body text-text-secondary">
                    <span className="text-accent-primary mt-1">→</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-24 pt-16 border-t border-border-light">
        <div className="max-w-2xl">
          <h2 className="text-h2 text-text-primary mb-4">Ready to explore your health journey?</h2>
          <p className="text-body-large text-text-secondary mb-8">
            Upload your medical records and let BACKBONE reconstruct the story hidden inside.
          </p>
          <Link to="/workspace" className="btn btn-primary">
            Open Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
