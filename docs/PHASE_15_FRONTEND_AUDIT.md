# Phase 15: Frontend Audit Report

## Current Frontend Structure

### Routes
- `/` - Landing page
- `/overview` - Overview page (currently shows full Timeline component)
- `/journey` - Journey page (currently shows mock timeline events)
- `/records` - Records page (upload and view records)
- `/signals` - Signals page (currently shows mock signals)
- `/settings` - Settings page

### Components

#### Navigation (`src/components/Navigation.tsx`)
- Shows 5 items: Overview, Journey, Records, Signals, Settings
- Settings competes with primary patient workflow
- Simple, clean design

#### PatientHeader (`src/components/PatientHeader.tsx`)
- Shows patient name, age, years of history
- Has "Reset Records" and "Reset All" buttons
- Generic design, not a proper patient summary

#### Timeline (`src/components/Timeline.tsx`)
- **738 lines** - Very large, monolithic component
- Contains ALL sections: summary, patterns, clinical signals, candidate reviews, care gaps, filters, timeline years, events, undated events
- Has multiple modals for event, pattern, signal, candidate detail
- Shows raw event list by default (not episodes)
- Contains data quality issues: "Unknown date" displayed
- Multiple action buttons competing for attention

#### SignalSection (`src/components/SignalSection.tsx`)
- Simple signal display with severity colors
- Uses different color scheme than Timeline

#### CareGaps (`src/components/CareGaps.tsx`)
- 311 lines - Complex component
- Has filter dropdown, dismissal modal, detail view
- Shows "Unknown" for missing dates
- Many care gap types with different colors

#### RecordList (`src/components/RecordList.tsx`)
- Simple record list with status badges
- Clean design

#### RecordDetail (`src/components/RecordDetail.tsx`)
- Modal with extracted text and structured extraction
- Shows "Not extracted yet" for missing data
- Good structure

#### Modal (`src/components/Modal.tsx`)
- Generic modal component
- Simple, clean

#### Button (`src/components/Button.tsx`)
- Has variants: primary, secondary, ghost
- Has sizes: sm, md, lg
- Good component

#### PageHeader (`src/components/PageHeader.tsx`)
- Simple page header with title, subtitle, actions
- Good component

#### AppShell (`src/components/AppShell.tsx`)
- Wraps navigation and outlet
- Simple

### Design System (Tailwind)

**Colors:**
- background: #FAFAF9 (warm gray)
- surface: #FFFFFF (white)
- border: #E5E5E5 (light gray)
- text-primary: #1C1917 (dark gray)
- text-secondary: #57534E (medium gray)
- text-tertiary: #A8A29E (light gray)
- accent: #78716C (warm gray)

**Typography:**
- Font: Inter, system-ui, sans-serif

**Assessment:**
- Very neutral, warm gray palette
- Good base for redesign
- Accent color is too subtle

### Ollama Implementation (`src/services/ollamaService.ts`)

**Configuration:**
- Model: llama3.2 (configurable via VITE_OLLAMA_MODEL)
- Base URL: http://localhost:11434 (configurable via VITE_OLLAMA_BASE_URL)
- Timeout: 120 seconds (2 minutes)
- Temperature: 0.3 (low for deterministic output)
- Top-p: 0.9

**Features:**
- `isAvailable()` - Check if Ollama is running
- `isModelAvailable()` - Check if configured model is available
- `generate()` - Generate text response
- `generateJson()` - Generate and parse JSON response
- `generateWithFallback()` - Generate with fallback data
- `generateJsonWithFallback()` - Generate JSON with fallback

**Fallback Reasons:**
- unavailable - Ollama service not running
- timeout - Request timed out
- malformed_json - JSON parsing failed
- model_not_available - Model not installed
- other - Other errors

**Assessment:**
- Good fallback mechanisms already in place
- Structured output support
- Reasonable timeout
- No caching implemented
- No performance metrics

## Data Quality Issues Found

### In Timeline Component
- Line 97: `if (!dateStr) return 'Unknown date';`
- Line 508: Uses `timeSpanYears` without null check
- Line 143: Uses `metadata.timeSpanYears` without null check

### In CareGaps Component
- Line 92: `if (!dateString) return 'Unknown';`
- Line 151: Uses dates without validation

### In RecordDetail Component
- Line 47: Shows "Not extracted yet" for missing record dates
- Line 84: Shows "No text extracted yet" for missing text

## Information Architecture Issues

### Overview Page
- Shows complete Timeline component (all sections)
- Too much information at once
- No clear hierarchy
- Multiple action buttons competing
- Not a true "overview" - it's the full timeline

### Journey Page
- Currently shows mock data only
- Not integrated with Phase 14 longitudinal journey
- Not the centerpiece it should be

### Signals Page
- Currently shows mock data only
- Not integrated with actual analysis results
- Should be renamed to "Insights"

### Navigation
- Settings competes with primary workflow
- 5 items is too many for primary navigation
- No clear mental model

### Patient Header
- Generic "Patient" label
- Shows fake demographic info (age)
- Not a proper patient summary
- Reset buttons are technical, not user-facing

## Component Reusability Issues

### Modals
- Each section has its own modal in Timeline
- No reusable contextual detail panel
- Inconsistent patterns

### Data Formatting
- No centralized formatting layer
- Each component formats dates its own way
- No handling of NaN, None, Unknown, Invalid Date

## Missing Components

### Contextual Detail Panel
- No reusable right-side panel for details
- Currently uses modals for everything
- Should be consistent across events, episodes, patterns, signals

### Episode Display
- Timeline shows raw events, not Phase 14 episodes
- No episode expansion UI
- No transition visualization

### Loading States
- Generic "Loading records..." text
- No meaningful progress messages
- No step-by-step analysis progress

### Empty States
- Basic empty states exist
- Could be more informative
- No clear call-to-action

### Error States
- Basic error handling exists
- Could be more human-readable
- May expose technical details

## Responsive Design

- Not explicitly implemented
- No mobile-specific layouts
- Timeline may not work well on small screens

## Accessibility

- Basic ARIA support likely missing
- Focus states not explicitly handled
- Color used to communicate event types (Timeline lines 83-94)
- May not meet WCAG standards

## Backend API Contracts

### Services Used
- TimelineService
- AnalysisService
- CandidateAnalysisService
- EvidenceGraphService
- CareGapService
- OllamaService
- LongitudinalStoryService (Phase 14, not yet integrated)

### Storage
- useRecordStorage hook for localStorage
- Patient data isolation exists

## Summary

**Strengths:**
- Clean component structure
- Good base design system
- Ollama service has fallback mechanisms
- Phase 14 backend is complete and ready

**Weaknesses:**
- Timeline component is monolithic (738 lines)
- Overview page shows too much information
- No episode-based timeline (Phase 14 not integrated)
- Data quality issues (NaN, Unknown, Invalid Date visible)
- No reusable contextual detail panel
- Navigation has too many items
- Patient header is generic
- No unified AI analysis workflow
- No caching for AI results
- No performance metrics

**Priority Actions:**
1. Create data formatting utility to fix NaN/Unknown/Invalid Date issues
2. Redesign navigation to 4 items (Overview, Journey, Records, Insights)
3. Redesign patient header to be a proper summary
4. Redesign Overview to be a true overview (not full timeline)
5. Redesign Journey to use Phase 14 episodes as default unit
6. Create reusable contextual detail panel
7. Implement unified AI analysis workflow
8. Integrate Phase 14 longitudinal journey into Journey page
9. Add caching for AI results
10. Implement responsive design
