import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Large Editorial */}
      <section className="min-h-screen flex items-center px-6 pt-24 pb-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Editorial Typography */}
            <div className="space-y-8 animate-fade-in">
              <div className="text-tiny text-text-tertiary uppercase tracking-widest">BACKBONE</div>
              <h1 className="text-display-lg text-text-primary leading-tight tracking-tight">
                Your medical history has a story.<br />
                <span className="text-accent-primary">BACKBONE</span> helps reconstruct it.
              </h1>
              <p className="text-body-xl text-text-secondary leading-relaxed max-w-xl">
                Years of fragmented records—lab reports, consultations, prescriptions, hospital visits—scattered across providers and systems. BACKBONE uses AI to connect the fragments into a coherent health narrative.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link to="/workspace" className="btn btn-primary text-lg px-8 py-4">
                  Explore BACKBONE
                </Link>
                <Link to="/how-it-works" className="btn btn-secondary text-lg px-8 py-4">
                  How it works
                </Link>
              </div>
            </div>

            {/* Right: Fragmented-to-Connected Visual */}
            <div className="relative h-[600px] animate-fade-in animate-delay-200">
              {/* Background grid texture */}
              <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
              
              {/* Fragmented Records (scattered) */}
              <div className="absolute top-8 left-8 bg-surface border border-border p-4 shadow-lg rounded-lg w-48 animate-fade-in animate-delay-300">
                <div className="text-tiny text-text-tertiary mb-2">2021</div>
                <div className="text-body text-text-primary font-medium">Lab Report</div>
                <div className="text-small text-text-secondary mt-1">Complete blood count</div>
              </div>
              
              <div className="absolute top-24 right-12 bg-surface border border-border p-4 shadow-lg rounded-lg w-48 animate-fade-in animate-delay-400">
                <div className="text-tiny text-text-tertiary mb-2">2022</div>
                <div className="text-body text-text-primary font-medium">Consultation</div>
                <div className="text-small text-text-secondary mt-1">Persistent fatigue</div>
              </div>
              
              <div className="absolute bottom-32 left-16 bg-surface border border-border p-4 shadow-lg rounded-lg w-48 animate-fade-in animate-delay-500">
                <div className="text-tiny text-text-tertiary mb-2">2023</div>
                <div className="text-body text-text-primary font-medium">Prescription</div>
                <div className="text-small text-text-secondary mt-1">B12 supplementation</div>
              </div>
              
              <div className="absolute bottom-16 right-8 bg-surface border border-border p-4 shadow-lg rounded-lg w-48 animate-fade-in animate-delay-600">
                <div className="text-tiny text-text-tertiary mb-2">2024</div>
                <div className="text-body text-text-primary font-medium">Hospital Visit</div>
                <div className="text-small text-text-secondary mt-1">Neurology referral</div>
              </div>

              {/* Connecting Lines (visualizing transformation) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="120" y1="80" x2="280" y2="160" stroke="#0D4F4F" strokeWidth="2" strokeDasharray="4" opacity="0.4" className="animate-draw-line" />
                <line x1="120" y1="80" x2="160" y2="320" stroke="#0D4F4F" strokeWidth="2" strokeDasharray="4" opacity="0.4" className="animate-draw-line animate-delay-200" />
                <line x1="280" y1="160" x2="400" y2="400" stroke="#0D4F4F" strokeWidth="2" strokeDasharray="4" opacity="0.4" className="animate-draw-line animate-delay-400" />
                <line x1="160" y1="320" x2="400" y2="400" stroke="#0D4F4F" strokeWidth="2" strokeDasharray="4" opacity="0.4" className="animate-draw-line animate-delay-600" />
              </svg>

              {/* Timeline Nodes (showing connection) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative animate-pulse-slow">
                  <div className="w-4 h-4 bg-accent-primary rounded-full" />
                  <div className="absolute -top-1 -left-1 w-6 h-6 bg-accent-light rounded-full opacity-50" />
                </div>
              </div>

              {/* Insight Marker */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-accent-primary text-white px-4 py-2 rounded-lg shadow-lg">
                <div className="text-tiny font-medium">Pattern Detected</div>
                <div className="text-small opacity-90">Recurring fatigue + numbness</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - Asymmetric Scattered Records */}
      <section className="py-32 px-6 bg-background-alt">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left: Asymmetric scattered records */}
            <div className="relative h-[500px]">
              <div className="absolute top-0 left-0 bg-surface border border-border p-6 shadow-lg rounded-lg w-56">
                <div className="text-h3 text-accent-primary mb-2">2021</div>
                <div className="text-body text-text-primary font-medium">Lab Report</div>
                <div className="text-small text-text-secondary mt-2">Complete blood count</div>
              </div>
              
              <div className="absolute top-12 right-8 bg-surface border border-border p-6 shadow-lg rounded-lg w-56">
                <div className="text-h3 text-accent-primary mb-2">2022</div>
                <div className="text-body text-text-primary font-medium">Consultation</div>
                <div className="text-small text-text-secondary mt-2">Persistent fatigue</div>
              </div>
              
              <div className="absolute top-48 left-16 bg-surface border border-border p-6 shadow-lg rounded-lg w-56">
                <div className="text-h3 text-accent-primary mb-2">2023</div>
                <div className="text-body text-text-primary font-medium">Prescription</div>
                <div className="text-small text-text-secondary mt-2">B12 supplementation</div>
              </div>
              
              <div className="absolute bottom-0 right-0 bg-surface border border-border p-6 shadow-lg rounded-lg w-56">
                <div className="text-h3 text-accent-primary mb-2">2024</div>
                <div className="text-body text-text-primary font-medium">Hospital Visit</div>
                <div className="text-small text-text-secondary mt-2">Neurology referral</div>
              </div>

              {/* Disconnection indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="text-6xl text-text-muted opacity-30">×</div>
              </div>
            </div>

            {/* Right: Editorial text */}
            <div className="space-y-8 pt-12">
              <div className="text-tiny text-text-tertiary uppercase tracking-widest">The Problem</div>
              <h2 className="text-display text-text-primary leading-tight tracking-tight">
                Years of records.<br />
                One fragmented story.
              </h2>
              <p className="text-body-xl text-text-secondary leading-relaxed">
                Medical history is scattered across years of reports, symptoms, tests, and visits. Each document captures a moment in time, but together they tell a story that's nearly impossible to reconstruct.
              </p>
              <p className="text-body-large text-text-tertiary leading-relaxed">
                Providers change. Systems fragment. Critical insights get lost across hundreds of pages. No tool exists to connect the dots—until now.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Section - Visual Storytelling */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-4">The BACKBONE Transformation</div>
            <h2 className="text-display text-text-primary leading-tight tracking-tight mb-6">
              From fragments to insight
            </h2>
            <p className="text-body-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              BACKBONE transforms scattered medical records into a coherent, evidence-backed health narrative through five stages.
            </p>
          </div>

          {/* Horizontal transformation stages */}
          <div className="space-y-16">
            {/* Stage 01 */}
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0 w-24">
                <div className="text-h2 text-accent-primary font-light">01</div>
              </div>
              <div className="flex-1 bg-surface border border-border p-8 rounded-lg shadow-sm">
                <h3 className="text-h2 text-text-primary mb-3">Records</h3>
                <p className="text-body-large text-text-secondary">Scattered documents uploaded and organized</p>
              </div>
            </div>

            {/* Stage 02 */}
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0 w-24">
                <div className="text-h2 text-accent-primary font-light">02</div>
              </div>
              <div className="flex-1 bg-surface border border-border p-8 rounded-lg shadow-sm">
                <h3 className="text-h2 text-text-primary mb-3">Events</h3>
                <p className="text-body-large text-text-secondary">Important clinical information extracted from each document</p>
              </div>
            </div>

            {/* Stage 03 */}
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0 w-24">
                <div className="text-h2 text-accent-primary font-light">03</div>
              </div>
              <div className="flex-1 bg-surface border border-border p-8 rounded-lg shadow-sm">
                <h3 className="text-h2 text-text-primary mb-3">Connections</h3>
                <p className="text-body-large text-text-secondary">Related symptoms, tests, and visits connected across time</p>
              </div>
            </div>

            {/* Stage 04 */}
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0 w-24">
                <div className="text-h2 text-accent-primary font-light">04</div>
              </div>
              <div className="flex-1 bg-surface border border-border p-8 rounded-lg shadow-sm">
                <h3 className="text-h2 text-text-primary mb-3">Journey</h3>
                <p className="text-body-large text-text-secondary">A chronological health story reconstructed from the evidence</p>
              </div>
            </div>

            {/* Stage 05 */}
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0 w-24">
                <div className="text-h2 text-accent-primary font-light">05</div>
              </div>
              <div className="flex-1 bg-accent-light border border-accent-secondary p-8 rounded-lg shadow-sm">
                <h3 className="text-h2 text-accent-primary mb-3">Insights</h3>
                <p className="text-body-large text-text-secondary">Evidence-backed patterns surfaced for clinical review</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Health Journey - Signature Section */}
      <section className="py-32 px-6 bg-background-alt">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-4">Signature Feature</div>
            <h2 className="text-display text-text-primary leading-tight tracking-tight mb-6">
              The Health Journey
            </h2>
            <p className="text-body-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              BACKBONE reconstructs your medical history into a chronological timeline, connecting related events and surfacing patterns over time.
            </p>
          </div>

          {/* Realistic timeline example */}
          <div className="bg-surface border border-border rounded-lg p-12 shadow-lg">
            <div className="space-y-12">
              {/* 2021 */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <div className="text-h3 text-accent-primary">2021</div>
                </div>
                <div className="flex-1 pl-6 border-l-2 border-border">
                  <div className="bg-background-alt p-6 rounded-lg mb-4">
                    <div className="text-body text-text-primary font-medium mb-2">Persistent fatigue</div>
                    <div className="text-small text-text-secondary">Patient reports ongoing tiredness affecting daily activities</div>
                  </div>
                </div>
              </div>

              {/* 2022 */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <div className="text-h3 text-accent-primary">2022</div>
                </div>
                <div className="flex-1 pl-6 border-l-2 border-border">
                  <div className="bg-background-alt p-6 rounded-lg mb-4">
                    <div className="text-body text-text-primary font-medium mb-2">Blood investigation</div>
                    <div className="text-small text-text-secondary">Complete blood count ordered to investigate fatigue</div>
                  </div>
                </div>
              </div>

              {/* 2023 - Multiple related events */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <div className="text-h3 text-accent-primary">2023</div>
                </div>
                <div className="flex-1 pl-6 border-l-2 border-accent-primary">
                  <div className="bg-accent-light p-6 rounded-lg mb-4">
                    <div className="text-body text-text-primary font-medium mb-2">Fatigue + numbness</div>
                    <div className="text-small text-text-secondary mb-3">Symptoms progressing with new neurological symptoms</div>
                    <div className="text-tiny text-accent-primary uppercase tracking-wider">Related to 2021 fatigue</div>
                  </div>
                  <div className="bg-background-alt p-6 rounded-lg mb-4">
                    <div className="text-body text-text-primary font-medium mb-2">B12 level repeated</div>
                    <div className="text-small text-text-secondary">Follow-up test shows persistent deficiency</div>
                  </div>
                </div>
              </div>

              {/* 2024 */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <div className="text-h3 text-accent-primary">2024</div>
                </div>
                <div className="flex-1 pl-6 border-l-2 border-border">
                  <div className="bg-background-alt p-6 rounded-lg mb-4">
                    <div className="text-body text-text-primary font-medium mb-2">Neurology referral considered</div>
                    <div className="text-small text-text-secondary">Specialist evaluation recommended for ongoing symptoms</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pattern insight */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-accent-primary rounded-full" />
                <div className="text-body-large text-text-secondary">
                  <span className="text-text-primary font-medium">Pattern identified:</span> Recurring fatigue and numbness over 3-year period, with progressive symptoms and specialist referral.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence/Insights - Investigation Style */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-4">AI Investigation</div>
            <h2 className="text-display text-text-primary leading-tight tracking-tight mb-6">
              Evidence-backed insights
            </h2>
            <p className="text-body-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              BACKBONE surfaces patterns with full traceability to source documents, distinguishing between documented facts, detected patterns, and AI interpretation.
            </p>
          </div>

          {/* Investigation composition */}
          <div className="bg-surface border border-border rounded-lg p-12 shadow-lg">
            <div className="space-y-8">
              {/* Observed Pattern */}
              <div className="border-l-4 border-accent-primary pl-8">
                <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-2">Observed Pattern</div>
                <div className="text-h2 text-text-primary mb-4">Recurring fatigue and numbness</div>
                <p className="text-body-large text-text-secondary">Pattern detected across 3-year period with progressive symptoms</p>
              </div>

              {/* Related Events */}
              <div className="pl-8">
                <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-4">Related Events</div>
                <div className="flex items-center gap-4">
                  <div className="bg-background-alt px-4 py-2 rounded-lg">
                    <span className="text-body text-text-primary">2022</span>
                  </div>
                  <div className="text-text-tertiary">→</div>
                  <div className="bg-background-alt px-4 py-2 rounded-lg">
                    <span className="text-body text-text-primary">2023</span>
                  </div>
                  <div className="text-text-tertiary">→</div>
                  <div className="bg-background-alt px-4 py-2 rounded-lg">
                    <span className="text-body text-text-primary">2023</span>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div className="pl-8">
                <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-4">Evidence</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-background-alt px-4 py-3 rounded-lg">
                    <div className="w-2 h-2 bg-accent-primary rounded-full" />
                    <span className="text-body text-text-primary">Consultation note</span>
                    <span className="text-small text-text-tertiary">Page 3</span>
                  </div>
                  <div className="flex items-center gap-4 bg-background-alt px-4 py-3 rounded-lg">
                    <div className="w-2 h-2 bg-accent-primary rounded-full" />
                    <span className="text-body text-text-primary">Lab report</span>
                    <span className="text-small text-text-tertiary">Page 7</span>
                  </div>
                  <div className="flex items-center gap-4 bg-background-alt px-4 py-3 rounded-lg">
                    <div className="w-2 h-2 bg-accent-primary rounded-full" />
                    <span className="text-body text-text-primary">Source document</span>
                    <span className="text-small text-text-tertiary">Page 12</span>
                  </div>
                </div>
              </div>

              {/* AI Interpretation */}
              <div className="pl-8 pt-8 border-t border-border">
                <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-2">AI Interpretation</div>
                <div className="bg-accent-light border border-accent-secondary p-6 rounded-lg">
                  <p className="text-body-large text-text-secondary leading-relaxed">
                    "Potential pattern identified for clinical review. Recurring symptoms over extended period with progressive neurological involvement may warrant specialist evaluation."
                  </p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-8 text-small text-text-tertiary">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-primary rounded-full" />
                  <span>Documented Fact</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pattern-primary rounded-full" />
                  <span>Detected Pattern</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-evidence-primary rounded-full" />
                  <span>AI Interpretation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence Traceability */}
      <section className="py-32 px-6 bg-background-alt">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-4">Evidence Traceability</div>
            <h2 className="text-display text-text-primary leading-tight tracking-tight mb-6">
              Every finding has a trail
            </h2>
            <p className="text-body-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              BACKBONE ensures complete traceability from AI findings back to source documents and specific pages.
            </p>
          </div>

          {/* Visual trail */}
          <div className="bg-surface border border-border rounded-lg p-12 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* AI Finding */}
              <div className="flex-1 text-center">
                <div className="bg-accent-light border border-accent-secondary p-6 rounded-lg">
                  <div className="text-tiny text-accent-primary uppercase tracking-widest mb-2">AI Finding</div>
                  <div className="text-body text-text-primary">Recurring fatigue pattern</div>
                </div>
              </div>

              <div className="text-2xl text-text-tertiary">↓</div>

              {/* Medical Event */}
              <div className="flex-1 text-center">
                <div className="bg-background-alt p-6 rounded-lg">
                  <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-2">Medical Event</div>
                  <div className="text-body text-text-primary">2023 Consultation</div>
                </div>
              </div>

              <div className="text-2xl text-text-tertiary">↓</div>

              {/* Source Document */}
              <div className="flex-1 text-center">
                <div className="bg-background-alt p-6 rounded-lg">
                  <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-2">Source Document</div>
                  <div className="text-body text-text-primary">Consultation Note.pdf</div>
                </div>
              </div>

              <div className="text-2xl text-text-tertiary">↓</div>

              {/* Page */}
              <div className="flex-1 text-center">
                <div className="bg-background-alt p-6 rounded-lg">
                  <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-2">Page</div>
                  <div className="text-body text-text-primary">Page 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Large Alternating Sections */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-4">Features</div>
            <h2 className="text-display text-text-primary leading-tight tracking-tight mb-6">
              Powerful capabilities
            </h2>
            <p className="text-body-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              BACKBONE provides a comprehensive toolkit for investigating health history.
            </p>
          </div>

          <div className="space-y-24">
            {/* Health Journey */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-h2 text-text-primary mb-4">Longitudinal Health Journey</h3>
                <p className="text-body-xl text-text-secondary leading-relaxed">
                  A chronological timeline of all medical events, connecting symptoms, diagnoses, tests, and treatments across years of history.
                </p>
              </div>
              <div className="bg-surface border border-border p-8 rounded-lg shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-symptom rounded-full" />
                    <span className="text-body text-text-primary">Symptoms</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-diagnosis rounded-full" />
                    <span className="text-body text-text-primary">Diagnoses</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-laboratory rounded-full" />
                    <span className="text-body text-text-primary">Laboratory</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-medication rounded-full" />
                    <span className="text-body text-text-primary">Medications</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pattern Detection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 bg-surface border border-border p-8 rounded-lg shadow-sm">
                <div className="text-h3 text-pattern-primary mb-4">Pattern Detection</div>
                <p className="text-body text-text-secondary">AI identifies recurring symptoms, temporal relationships, and longitudinal trends across the health journey.</p>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-h2 text-text-primary mb-4">Pattern Detection</h3>
                <p className="text-body-xl text-text-secondary leading-relaxed">
                  AI-powered analysis detects relationships between events, surfaces recurring patterns, and identifies trends that span years of medical history.
                </p>
              </div>
            </div>

            {/* Semantic Relationships */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-h2 text-text-primary mb-4">Semantic Relationships</h3>
                <p className="text-body-xl text-text-secondary leading-relaxed">
                  An evidence graph connects related events, showing how symptoms, tests, and treatments relate to each other across time.
                </p>
              </div>
              <div className="bg-surface border border-border p-8 rounded-lg shadow-sm">
                <div className="text-h3 text-evidence-primary mb-4">Evidence Graph</div>
                <p className="text-body text-text-secondary">Visual connections between medical events based on semantic similarity and temporal proximity.</p>
              </div>
            </div>

            {/* Unresolved Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 bg-surface border border-border p-8 rounded-lg shadow-sm">
                <div className="text-h3 text-warning mb-4">Open Threads</div>
                <p className="text-body text-text-secondary">Identifies symptoms without diagnosis, abnormal results without follow-up, and treatments without clear resolution.</p>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-h2 text-text-primary mb-4">Unresolved Issues</h3>
                <p className="text-body-xl text-text-secondary leading-relaxed">
                  BACKBONE surfaces open threads—symptoms without diagnosis, abnormal results without follow-up, treatments without clear resolution.
                </p>
              </div>
            </div>

            {/* Care Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-h2 text-text-primary mb-4">Care Gaps</h3>
                <p className="text-body-xl text-text-secondary leading-relaxed">
                  Detects gaps in care based on clinical guidelines, identifying recommended screenings, follow-ups, or interventions that may be missing.
                </p>
              </div>
              <div className="bg-surface border border-border p-8 rounded-lg shadow-sm">
                <div className="text-h3 text-error mb-4">Gap Detection</div>
                <p className="text-body text-text-secondary">Identifies missing preventive care, delayed follow-ups, and guideline-based recommendations.</p>
              </div>
            </div>

            {/* Evidence Traceability */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 bg-surface border border-border p-8 rounded-lg shadow-sm">
                <div className="text-h3 text-accent-primary mb-4">Source Tracing</div>
                <p className="text-body text-text-secondary">Every finding links directly to the source document and specific page where the evidence was found.</p>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-h2 text-text-primary mb-4">Evidence Traceability</h3>
                <p className="text-body-xl text-text-secondary leading-relaxed">
                  Every AI finding is grounded in evidence, with complete traceability back to source documents and specific pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About - Editorial Typography */}
      <section className="py-32 px-6 bg-background-alt">
        <div className="max-w-4xl mx-auto">
          <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-8">About BACKBONE</div>
          <h2 className="text-display-lg text-text-primary leading-tight tracking-tight mb-12">
            Healthcare has a memory problem.
          </h2>
          <p className="text-body-xl text-text-secondary leading-relaxed mb-12">
            Medical history is scattered across providers, systems, and time. Each document captures a moment, but the complete story—the narrative that connects symptoms to diagnoses, treatments to outcomes—remains hidden in the fragments.
          </p>
          <p className="text-body-xl text-text-secondary leading-relaxed mb-16">
            BACKBONE exists to reconstruct that story. We believe health is a narrative, not a dataset—and that AI should help reconstruct that narrative, not replace human judgment.
          </p>

          <div className="space-y-12">
            <div className="border-l-4 border-accent-primary pl-8">
              <h3 className="text-h2 text-text-primary mb-4">Evidence First</h3>
              <p className="text-body-large text-text-secondary leading-relaxed">
                Every finding is grounded in source documents. No hallucinations, no speculation—only evidence-backed insights traceable to their origin.
              </p>
            </div>

            <div className="border-l-4 border-accent-primary pl-8">
              <h3 className="text-h2 text-text-primary mb-4">Privacy First</h3>
              <p className="text-body-large text-text-secondary leading-relaxed">
                Processing happens locally on your machine. Your medical records never leave your computer. No cloud transfer, no third-party access.
              </p>
            </div>

            <div className="border-l-4 border-accent-primary pl-8">
              <h3 className="text-h2 text-text-primary mb-4">Human in the Loop</h3>
              <p className="text-body-large text-text-secondary leading-relaxed">
                AI is for investigation, not diagnosis. BACKBONE surfaces patterns for clinical review, leaving final judgment to healthcare professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy - Distinctive Visual */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-tiny text-text-tertiary uppercase tracking-widest mb-4">Privacy & Trust</div>
            <h2 className="text-display text-text-primary leading-tight tracking-tight mb-6">
              Your records stay yours
            </h2>
            <p className="text-body-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              BACKBONE processes everything locally. Your medical records never leave your computer.
            </p>
          </div>

          {/* Local processing visual */}
          <div className="bg-surface border border-border rounded-lg p-12 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Your Records */}
              <div className="flex-1 text-center">
                <div className="bg-background-alt p-8 rounded-lg">
                  <div className="text-4xl mb-4">📄</div>
                  <div className="text-h3 text-text-primary mb-2">Your Records</div>
                  <div className="text-body text-text-secondary">Medical documents</div>
                </div>
              </div>

              <div className="text-2xl text-text-tertiary">→</div>

              {/* BACKBONE */}
              <div className="flex-1 text-center">
                <div className="bg-accent-light border border-accent-secondary p-8 rounded-lg">
                  <div className="text-4xl mb-4">◈</div>
                  <div className="text-h3 text-accent-primary mb-2">BACKBONE</div>
                  <div className="text-body text-text-secondary">Local processing</div>
                </div>
              </div>

              <div className="text-2xl text-text-tertiary">→</div>

              {/* Insights */}
              <div className="flex-1 text-center">
                <div className="bg-background-alt p-8 rounded-lg">
                  <div className="text-4xl mb-4">💡</div>
                  <div className="text-h3 text-text-primary mb-2">Insights</div>
                  <div className="text-body text-text-secondary">Evidence-backed findings</div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border text-center">
              <p className="text-body-large text-text-secondary leading-relaxed">
                No cloud transfer. Evidence-backed analysis. Complete data ownership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-background-alt">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-display text-text-primary leading-tight tracking-tight mb-8">
            Ready to explore your health journey?
          </h2>
          <p className="text-body-xl text-text-secondary mb-12 leading-relaxed">
            Upload your medical records and let BACKBONE reconstruct the story hidden inside.
          </p>
          <Link to="/workspace" className="btn btn-primary text-lg px-8 py-4">
            Open Workspace
          </Link>
        </div>
      </section>
    </div>
  );
}
