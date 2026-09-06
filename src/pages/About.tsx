import { Link } from 'react-router-dom';

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-display text-text-primary mb-6">About BACKBONE</h1>
        <p className="text-body-large text-text-secondary leading-relaxed">
          BACKBONE exists to solve a fundamental problem in healthcare: medical history is fragmented across years of reports, symptoms, tests, and visits, making it nearly impossible to see the complete picture.
        </p>
      </div>

      {/* The Problem */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">The Problem</h2>
        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <p className="text-body-large text-text-secondary leading-relaxed mb-6">
            Patients accumulate medical records over decades—lab reports, prescriptions, diagnoses, consultation notes, imaging reports, hospital visits. Each document captures a moment in time, but together they tell a story that's nearly impossible to reconstruct.
          </p>
          <p className="text-body-large text-text-secondary leading-relaxed">
            The critical insights—the patterns, the relationships, the longitudinal themes—are hidden across hundreds of pages. No human can synthesize this information at scale. No existing tool is designed to reconstruct the narrative.
          </p>
        </div>
      </section>

      {/* The Solution */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">The Solution</h2>
        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <p className="text-body-large text-text-secondary leading-relaxed mb-6">
            BACKBONE uses AI to reconstruct the health journey from fragmented medical records. It extracts events, organizes them chronologically, detects patterns, and surfaces evidence-backed insights.
          </p>
          <p className="text-body-large text-text-secondary leading-relaxed">
            The result is a coherent narrative—a story that reveals what happened, when it happened, how events relate, and what might require attention.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Philosophy</h2>
        <div className="space-y-6">
          <div className="bg-surface rounded-lg border border-border-light p-6 shadow-sm">
            <h3 className="text-h3 text-text-primary mb-3">Evidence First</h3>
            <p className="text-body text-text-secondary leading-relaxed">
              Every AI finding must be grounded in specific evidence from source documents. No hallucinations, no speculation—only insights that can be traced back to original records.
            </p>
          </div>
          <div className="bg-surface rounded-lg border border-border-light p-6 shadow-sm">
            <h3 className="text-h3 text-text-primary mb-3">Privacy First</h3>
            <p className="text-body text-text-secondary leading-relaxed">
              Patient information should remain private. BACKBONE processes everything locally on your machine using Ollama. No cloud data transfer, no third-party access.
            </p>
          </div>
          <div className="bg-surface rounded-lg border border-border-light p-6 shadow-sm">
            <h3 className="text-h3 text-text-primary mb-3">Human in the Loop</h3>
            <p className="text-body text-text-secondary leading-relaxed">
              AI is a tool for investigation, not a replacement for clinical judgment. BACKBONE surfaces insights for human review, not autonomous decision-making.
            </p>
          </div>
          <div className="bg-surface rounded-lg border border-border-light p-6 shadow-sm">
            <h3 className="text-h3 text-text-primary mb-3">Narrative Over Data</h3>
            <p className="text-body text-text-secondary leading-relaxed">
              Health is a story, not a dataset. BACKBONE is designed to reveal the narrative—the journey, the episodes, the themes—not just present isolated data points.
            </p>
          </div>
        </div>
      </section>

      {/* Why BACKBONE Exists */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Why BACKBONE Exists</h2>
        <p className="text-body-large text-text-secondary leading-relaxed">
          Medical records contain the story of a patient's health, but that story is locked away in fragmented documents. BACKBONE exists to unlock that story—to help patients, caregivers, and clinicians see the complete picture, understand patterns over time, and identify what might need attention.
        </p>
      </section>

      {/* CTA */}
      <div className="pt-16 border-t border-border-light">
        <div className="max-w-2xl">
          <h2 className="text-h2 text-text-primary mb-4">Experience BACKBONE</h2>
          <p className="text-body-large text-text-secondary mb-8">
            Upload your medical records and see your health journey reconstructed.
          </p>
          <Link to="/workspace" className="btn btn-primary">
            Open Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
