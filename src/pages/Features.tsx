import { Link } from 'react-router-dom';

export function Features() {
  const features = [
    {
      title: 'Longitudinal Health Journey',
      description: 'Reconstructs a chronological timeline of health events from fragmented medical records, revealing the patient\'s story across time.',
      details: [
        'Temporal event ordering',
        'Episode grouping',
        'Longitudinal themes',
        'Open thread identification'
      ]
    },
    {
      title: 'Pattern Detection',
      description: 'AI analyzes the health journey to detect patterns, relationships between events, and recurring themes that span multiple episodes.',
      details: [
        'Symptom patterns',
        'Laboratory trends',
        'Medication sequences',
        'Temporal relationships'
      ]
    },
    {
      title: 'Semantic Relationships',
      description: 'Maps relationships between events, patterns, and conditions to understand how different aspects of health connect over time.',
      details: [
        'Evidence graph construction',
        'Cross-temporal analysis',
        'Semantic concept mapping',
        'Relationship strength scoring'
      ]
    },
    {
      title: 'Unresolved Issues',
      description: 'Identifies open threads and unresolved issues that may require attention or follow-up, helping ensure comprehensive care.',
      details: [
        'Open thread detection',
        'Severity assessment',
        'Temporal tracking',
        'Evidence linking'
      ]
    },
    {
      title: 'Care Gaps',
      description: 'Detects gaps in care by analyzing what has been documented against what might be expected based on detected conditions and patterns.',
      details: [
        'Gap identification',
        'Confidence scoring',
        'Recommended actions',
        'Evidence backing'
      ]
    },
    {
      title: 'Evidence Traceability',
      description: 'Every AI finding is grounded in specific evidence from source documents, with clear traceability back to original records.',
      details: [
        'Evidence ID referencing',
        'Source document linking',
        'Page-level attribution',
        'Validation checks'
      ]
    },
    {
      title: 'Local AI Processing',
      description: 'All AI processing happens locally on your machine using Ollama, ensuring patient information never leaves your control.',
      details: [
        'Local Ollama integration',
        'No cloud data transfer',
        'Privacy-first design',
        'Offline capability'
      ]
    },
    {
      title: 'Evidence-First AI',
      description: 'AI findings are generated with explicit evidence references, making every insight auditable and verifiable against source documents.',
      details: [
        'Evidence-backed signals',
        'Candidate condition analysis',
        'Human-readable explanations',
        'Clinical review ready'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <h1 className="text-display text-text-primary mb-6">Features</h1>
        <p className="text-body-large text-text-secondary leading-relaxed">
          BACKBONE provides a comprehensive set of capabilities for reconstructing health narratives and surfacing evidence-backed insights.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-surface rounded-lg border border-border-light p-8 shadow-sm hover:shadow-md transition-shadow duration-base">
            <h2 className="text-h3 text-text-primary mb-4">{feature.title}</h2>
            <p className="text-body text-text-secondary mb-6 leading-relaxed">
              {feature.description}
            </p>
            <ul className="space-y-2">
              {feature.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-small text-text-tertiary">
                  <span className="text-accent-primary">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-24 pt-16 border-t border-border-light">
        <div className="max-w-2xl">
          <h2 className="text-h2 text-text-primary mb-4">Explore BACKBONE</h2>
          <p className="text-body-large text-text-secondary mb-8">
            See these features in action by uploading your medical records to the workspace.
          </p>
          <Link to="/workspace" className="btn btn-primary">
            Open Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
