import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-display text-text-primary mb-6">Privacy & Trust</h1>
        <p className="text-body-large text-text-secondary leading-relaxed">
          BACKBONE is designed with privacy and trust as foundational principles. Patient information should remain private, and AI findings must be evidence-backed.
        </p>
      </div>

      {/* Local Processing */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Local Processing</h2>
        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <p className="text-body-large text-text-secondary leading-relaxed mb-6">
            All AI processing in BACKBONE happens locally on your machine using Ollama. Your medical records never leave your computer. No data is sent to cloud servers. No third-party services access your information.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">No Cloud Transfer</h3>
                <p className="text-body text-text-secondary">Medical records are processed entirely on your local machine.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">No Third-Party Access</h3>
                <p className="text-body text-text-secondary">No external services or APIs receive your data.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Offline Capability</h3>
                <p className="text-body text-text-secondary">BACKBONE works without an internet connection after initial setup.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Data Ownership</h3>
                <p className="text-body text-text-secondary">You retain complete control over your medical records.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence-First AI */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Evidence-First AI</h2>
        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <p className="text-body-large text-text-secondary leading-relaxed mb-6">
            BACKBONE uses an evidence-first approach to AI. Every finding is grounded in specific evidence from source documents, making insights auditable and verifiable.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Evidence Referencing</h3>
                <p className="text-body text-text-secondary">Every AI finding includes evidence IDs linking to specific events.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Source Document Linking</h3>
                <p className="text-body text-text-secondary">Evidence can be traced back to original documents and pages.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Validation Checks</h3>
                <p className="text-body text-text-secondary">Evidence IDs are validated against extracted events before use.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Human-Readable Explanations</h3>
                <p className="text-body text-text-secondary">AI findings include clear descriptions of what was detected and why it matters.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Human in the Loop */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Human in the Loop</h2>
        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <p className="text-body-large text-text-secondary leading-relaxed mb-6">
            BACKBONE is designed as an investigative tool, not an autonomous decision-maker. AI findings are surfaced for human review and clinical judgment.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Investigative Focus</h3>
                <p className="text-body text-text-secondary">BACKBONE surfaces patterns and insights for investigation, not diagnosis.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Clinical Review Ready</h3>
                <p className="text-body text-text-secondary">Findings are presented with evidence for clinical review.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">No Autonomous Decisions</h3>
                <p className="text-body text-text-secondary">BACKBONE does not make medical decisions or recommendations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Storage */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Data Storage</h2>
        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <p className="text-body-large text-text-secondary leading-relaxed mb-6">
            BACKBONE stores data locally in your browser's localStorage. No data is transmitted to external servers.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Browser Local Storage</h3>
                <p className="text-body text-text-secondary">Records and analysis results are stored in localStorage.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Scoped by Patient</h3>
                <p className="text-body text-text-secondary">Data is organized by patient ID for separation and clarity.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent-primary text-xl">✓</span>
              <div>
                <h3 className="text-h4 text-text-primary mb-1">Clear Data Option</h3>
                <p className="text-body text-text-secondary">You can clear all data at any time through the Settings page.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="pt-16 border-t border-border-light">
        <div className="max-w-2xl">
          <h2 className="text-h2 text-text-primary mb-4">Trust BACKBONE</h2>
          <p className="text-body-large text-text-secondary mb-8">
            Experience privacy-first, evidence-backed AI analysis of your medical records.
          </p>
          <Link to="/workspace" className="btn btn-primary">
            Open Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
