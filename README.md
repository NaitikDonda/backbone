# BACKBONE

BACKBONE is an AI-powered longitudinal health intelligence platform that connects fragmented medical records into one continuous patient journey.

## Phase 1-4: Frontend Foundation + Record Ingestion + Local OCR Pipeline + Structured Medical Extraction

Phase 1 established the visual system and component architecture. Phase 2 implemented functional medical record upload and storage. Phase 3 added local OCR text extraction. Phase 4 added structured medical information extraction using local LLM.

### Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Tesseract.js** - Local OCR engine
- **PDF.js** - PDF text extraction
- **Ollama** - Local LLM for medical information extraction

### Design Philosophy

The interface communicates **clarity + intelligence + continuity + trust** through:

- Generous whitespace
- Strong typography (Inter/system fonts)
- Subtle borders
- Restrained neutral color palette (off-white, charcoal, muted grays)
- Elegant spacing
- Smooth interactions
- Minimal visual noise
- Strong hierarchy

### Color Palette

- Background: `#FAFAF9` (warm off-white)
- Surface: `#FFFFFF` (white)
- Border: `#E5E5E5` (light gray)
- Text Primary: `#1C1917` (near-black)
- Text Secondary: `#57534E` (charcoal)
- Text Tertiary: `#A8A29E` (muted gray)
- Accent: `#78716C` (warm gray)

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppShell.tsx    # Main layout wrapper
│   ├── Navigation.tsx  # Top navigation bar
│   ├── Button.tsx      # Button component with variants
│   ├── Modal.tsx       # Modal/dialog component
│   ├── PageHeader.tsx  # Page title and subtitle
│   ├── PatientHeader.tsx # Patient information display
│   ├── Timeline.tsx    # Interactive timeline component
│   ├── RecordList.tsx  # Medical records list
│   ├── SignalSection.tsx # AI findings display
│   ├── FileUpload.tsx  # File upload component with validation
│   ├── FilePreview.tsx # File preview with status display
│   ├── UploadModal.tsx # Upload flow modal
│   └── RecordDetail.tsx # Record detail panel
├── pages/              # Route components
│   ├── Landing.tsx     # Welcome/landing page
│   ├── Overview.tsx    # Patient overview with timeline
│   ├── Journey.tsx     # Dedicated timeline view
│   ├── Records.tsx     # Medical records page with upload
│   ├── Signals.tsx     # AI signals page
│   └── Settings.tsx    # Settings page
├── types/              # TypeScript interfaces
│   └── index.ts        # All data models
├── data/               # Mock data
│   └── mockData.ts     # Sample patient data
├── hooks/              # Custom React hooks
│   └── useRecordStorage.ts # Local storage for records
├── services/           # Business logic services
│   ├── ocrService.ts   # OCR and text extraction service
│   └── extractionService.ts # Medical information extraction service
├── utils/              # Utility functions
│   └── fileValidation.ts # File type/size validation
├── App.tsx             # Main app with routing
├── main.tsx            # Entry point
└── index.css           # Tailwind directives
```

### Data Models

TypeScript interfaces defined in `src/types/index.ts`:

- **Patient** - Patient basic information
- **MedicalRecord** - Enhanced with upload fields (filename, fileType, fileSize, processingStatus, etc.) and structuredExtraction
- **DocumentType** - Supported document categories (Lab Report, Prescription, Diagnosis, etc.)
- **ProcessingStatus** - Upload states (ready, uploading, uploaded, processing, extracting, extracted, failed)
- **FileType** - Supported file types (PDF, PNG, JPG, JPEG)
- **TimelineEvent** - Events on the health journey timeline
- **Symptom** - Patient symptoms
- **LabResult** - Laboratory test results
- **Diagnosis** - Medical diagnoses
- **Medication** - Prescribed medications
- **Signal** - AI-detected patterns and findings
- **StructuredExtraction** - Structured medical information extracted from documents
- **ExtractedPatientInfo** - Patient information extracted from documents
- **ExtractedEncounter** - Encounter information extracted from documents
- **ExtractedSymptom** - Symptom with certainty and source text
- **ExtractedDiagnosis** - Diagnosis with certainty and source text
- **ExtractedLabResult** - Lab result with values and source text
- **ExtractedMedication** - Medication with dosage and source text
- **ExtractedProcedure** - Procedure with details and source text

### Running the Application

```bash
# Install dependencies
npm install

# Start Ollama (required for Phase 4)
ollama serve

# Pull the required model (required for Phase 4)
ollama pull llama3.2

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server runs on `http://localhost:5173/`

**Note:** Phase 4 requires Ollama to be running locally with the llama3.2 model for medical information extraction.

### Current Features (Phase 1-4)

**Phase 1 (Frontend Foundation):**

1. **Landing Page** - Distinctive welcome screen with brand messaging and CTAs
2. **Patient Overview** - Patient workspace with longitudinal timeline
3. **Timeline Component** - Interactive horizontal timeline showing medical events across years
4. **Records Page** - Clean list view of medical documents with status indicators
5. **Signals Page** - Visual foundation for AI-generated findings with severity indicators
6. **Navigation** - Minimal top navigation with active states
7. **Modal System** - Reusable modal for event details

**Phase 2 (Record Ingestion):**

1. **File Upload Component** - Elegant file selection with drag-and-drop support
2. **File Validation** - Type validation (PDF, PNG, JPG, JPEG) and size limits (10MB max)
3. **File Preview** - Shows filename, type, size, and status before upload
4. **Document Type Selection** - Manual selection of document categories
5. **Upload States** - Ready, Uploading, Uploaded, Processing, Failed with visual indicators
6. **Error Handling** - Clear user-friendly error messages for invalid files
7. **Local Storage** - Persistent storage using localStorage for uploaded records
8. **Record Detail Panel** - Modal showing file information and placeholder for OCR results
9. **Patient Association** - Records linked to patient ID for multi-patient support
10. **Empty State** - Graceful handling when no records exist

**Phase 3 (Local OCR Pipeline):**

1. **OCR Service** - Local text extraction using Tesseract.js and PDF.js
2. **PDF Text Extraction** - Detects and extracts selectable text from PDFs directly
3. **Scanned PDF OCR** - Falls back to OCR for image-based PDFs
4. **Image OCR** - Processes PNG, JPG, JPEG images with Tesseract.js
5. **Text Cleaning** - Conservative text normalization preserving medical information
6. **Processing Status Integration** - Records move through uploading → processing → uploaded states
7. **Extracted Text Display** - Shows OCR results in record detail panel with confidence scores
8. **Error Handling** - User-friendly messages for OCR failures without technical details
9. **Privacy-First** - All processing local, no external API calls, no sensitive logging
10. **OCR Metadata** - Stores confidence scores and processing source (PDF text vs OCR)

**Phase 4 (Structured Medical Extraction):**

1. **Extraction Service** - Medical information extraction using local LLM (Ollama)
2. **Model Selection** - Uses llama3.2 for reliable JSON output and medical terminology handling
3. **JSON Schema** - Comprehensive schema for patient info, encounters, symptoms, diagnoses, lab results, medications, procedures
4. **Source Faithfulness** - Only extracts information explicitly present in source text
5. **Negation Handling** - Correctly handles "denies X" as absent/denied
6. **Uncertainty Handling** - Correctly handles "possible X" as suspected, "rule out X" as ruled_out
7. **Source Traceability** - Each extracted item includes sourceText for traceability
8. **Processing Flow** - Records move through uploading → processing → extracting → extracted states
9. **Frontend Display** - Shows structured extraction in record detail panel (symptoms, labs, medications, diagnoses)
10. **Error Handling** - User-friendly messages for extraction failures
11. **Privacy-First** - All processing local via Ollama, no external API calls

**Mock Data:**

- Patient: Aarav Mehta (42 years old, 12 years of history)
- Timeline: 7 events from 2018-2024 (consultations, symptoms, lab results)
- Initial Records: 4 sample medical documents with different statuses
- Signals: 2 mock findings (recurring fatigue, low hemoglobin)

### What's Currently Functional

**Fully Functional (Phase 2):**

- File upload with real file handling
- File type validation (PDF, PNG, JPG, JPEG)
- File size validation (10MB limit)
- Document type selection
- Upload progress simulation
- Local storage persistence (records survive page refresh)
- Record detail viewing
- Error handling for invalid files

**Fully Functional (Phase 3):**

- Local OCR text extraction using Tesseract.js
- PDF text extraction (selectable text)
- Scanned PDF OCR (image-based PDFs)
- Image OCR (PNG, JPG, JPEG)
- Text cleaning and normalization
- Processing status integration (uploading → processing → uploaded)
- Extracted text display in record detail panel
- OCR confidence scoring
- Privacy-first processing (no external APIs)

**Fully Functional (Phase 4):**

- Local LLM integration with Ollama
- Structured medical information extraction
- JSON schema for extracted data
- Negation and uncertainty handling
- Source traceability with sourceText
- Processing status integration (uploaded → extracting → extracted)
- Structured extraction display in record detail panel
- Privacy-first processing (local Ollama, no external APIs)

**Still Mocked:**

- Patient information (single mock patient)
- Timeline events (static data)
- AI signals/findings (static data)
- LLM analysis for pattern detection (not implemented yet)

### Storage Implementation

**Current Storage:** LocalStorage

- Records are stored in browser's localStorage
- Key: `backbone_records`
- Records are associated with patient IDs for multi-patient support
- Data persists across browser sessions
- Extracted text stored with records (note: localStorage has size limits)
- Easily replaceable with backend API in Phase 4

**Storage Structure:**
```json
{
  "backbone_records": [
    {
      "id": "uuid",
      "patientId": "1",
      "filename": "Lab_Report.pdf",
      "documentType": "Lab Report",
      "fileType": "PDF",
      "fileSize": 2400000,
      "uploadedAt": "2024-03-12T10:00:00Z",
      "recordDate": null,
      "processingStatus": "extracted",
      "source": "upload",
      "extractedText": "Patient: Aarav Mehta\nHemoglobin: 9.2 g/dL...",
      "structuredExtraction": {
        "patient": {
          "name": "Aarav Mehta",
          "dateOfBirth": null,
          "age": 42,
          "sex": "Male",
          "patientId": null
        },
        "encounter": {
          "date": "2024-03-12",
          "type": "Lab Report",
          "facility": null,
          "department": "Hematology",
          "reason": null
        },
        "symptoms": [],
        "diagnoses": [],
        "labResults": [
          {
            "testName": "Hemoglobin",
            "value": "9.2",
            "unit": "g/dL",
            "referenceRange": "12-16 g/dL",
            "isAbnormal": true,
            "date": "2024-03-12",
            "sourceText": "Hemoglobin: 9.2 g/dL (Reference: 12-16 g/dL) - Low"
          }
        ],
        "medications": [],
        "procedures": [],
        "findings": [],
        "sourceRecordId": "uuid",
        "extractedAt": "2024-03-12T10:05:00Z"
      },
      "metadata": {
        "ocrConfidence": 0.95,
        "ocrSource": "pdf-text",
        "processingTime": 1500
      }
    }
  ]
}
```

### OCR Engine Selection

**Selected Engine:** Tesseract.js

**Why Tesseract.js:**
- **Browser-native**: Runs entirely in the browser, no backend required
- **Local processing**: No external API calls, complete privacy
- **PDF.js integration**: Can extract selectable text from PDFs directly
- **Mature library**: Well-maintained, good documentation
- **Multi-language support**: Can handle medical documents in various languages
- **Reasonable accuracy**: Good performance on printed medical documents

**Alternatives Evaluated:**
- **PaddleOCR**: Excellent accuracy but requires Python backend
- **EasyOCR**: Good accuracy but requires Python backend
- **Tesseract (Node)**: Would require backend infrastructure

**Decision:** Tesseract.js was chosen because it runs entirely in the browser, maintaining the local-first architecture without requiring backend infrastructure for Phase 3.

### LLM Model Selection (Phase 4)

**Selected Model:** llama3.2 (via Ollama)

**Why llama3.2:**
- **Local execution**: Runs entirely on local machine via Ollama, no external API calls
- **JSON output reliability**: Better structured output compared to gemma4:12b
- **Medical terminology**: Good understanding of medical terms and concepts
- **Reasonable size**: 2GB model size, manageable for local execution
- **Privacy-first**: All processing local, no data leaves the machine
- **Active development**: Well-maintained by Meta

**Alternatives Evaluated:**
- **gemma4:12b**: Initially tested but had inconsistent JSON output and parsing issues
- **llama3.2**: Selected for better JSON reliability and medical terminology handling

**Decision:** llama3.2 was chosen because it provides more reliable JSON output for structured extraction while maintaining local-first architecture.

### PDF Handling Strategy

**Text PDFs:**
- PDF.js extracts selectable text directly
- Fast processing (no OCR needed)
- High accuracy (perfect text extraction)
- Confidence score: 1.0 (perfect)

**Scanned/Image PDFs:**
- PDF.js detects no selectable text
- Falls back to Tesseract.js OCR
- Slower processing (OCR required)
- Good accuracy on printed text
- Confidence score varies based on document quality

**Images (PNG, JPG, JPEG):**
- Direct Tesseract.js OCR processing
- Good accuracy on clear printed text
- Confidence score varies based on image quality

### Phase 5 Implementation Plan

The following features are NOT implemented in Phase 4 and should be added in Phase 5:

1. **Backend API** - Replace localStorage with proper backend
2. **File Storage** - Cloud storage for uploaded files
3. **AI Signal Generation** - Real pattern detection and risk signals using extracted data
4. **Authentication** - User login and patient selection
5. **Advanced Filtering** - Search and filter records by type, date, etc.
6. **Export Functionality** - Generate reports or export patient data
7. **Settings Page** - User preferences and configuration
8. **Timeline Integration** - Populate timeline with extracted medical events
9. **Record Date Extraction** - Auto-extract dates from documents via structured extraction

### Component Architecture

The application follows a clean component-based architecture:

- **Layout Components** (AppShell, Navigation) handle structure
- **Display Components** (PageHeader, PatientHeader) show information
- **Interactive Components** (Timeline, Modal, Button) handle user interaction
- **List Components** (RecordList, SignalSection) display collections
- **Upload Components** (FileUpload, FilePreview, UploadModal) handle file operations
- **Detail Components** (RecordDetail) show detailed information
- **Page Components** (Landing, Overview, etc.) compose the above
- **Hooks** (useRecordStorage) manage state and persistence
- **Services** (ocrService, extractionService) handle business logic (OCR, text extraction, medical information extraction)
- **Utils** (fileValidation) provide validation logic

All components are designed to be reusable and easily extensible for Phase 5 features.

### Design Decisions

- **No traditional medical dashboard** - Avoided cliché healthcare UI patterns
- **Premium tech aesthetic** - Inspired by Linear, Notion, Arc, Apple
- **Minimal navigation** - Only 5 main navigation items
- **Timeline as core identity** - The health journey is the primary visual element
- **Restrained color usage** - Neutral base with single accent
- **Typography-focused** - Clean sans-serif fonts with strong hierarchy
- **Generous whitespace** - Calm, trustworthy feel
- **Subtle interactions** - Smooth transitions without over-animation
- **Functional upload flow** - Real file handling, not fake success states
- **User-friendly errors** - Clear error messages without technical jargon
- **Storage-ready architecture** - localStorage easily replaceable with backend API
- **Local-first OCR** - All text extraction happens in-browser, no external APIs
- **Privacy-first** - No sensitive data leaves the user's machine
- **Conservative text cleaning** - OCR preserves medical information without interpretation
- **Local-first extraction** - All medical information extraction happens locally via Ollama
- **Source faithfulness** - Extraction only uses information explicitly present in source text
- **Negation and uncertainty handling** - Correctly handles denied, suspected, and ruled-out conditions
