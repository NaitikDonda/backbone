// Test the actual extraction service with synthetic documents
import { extractionService } from './src/services/extractionService.js';
import fs from 'fs';

const labReportText = fs.readFileSync('./test-documents/lab-report.txt', 'utf8');
const prescriptionText = fs.readFileSync('./test-documents/prescription.txt', 'utf8');
const consultationText = fs.readFileSync('./test-documents/consultation-note.txt', 'utf8');
const dischargeText = fs.readFileSync('./test-documents/discharge-summary.txt', 'utf8');

async function testExtractionService(text, documentName, recordId) {
  console.log(`\n=== Testing ${documentName} ===`);
  console.log('Text length:', text.length);
  
  try {
    const extraction = await extractionService.extractMedicalInformation(text, recordId);
    console.log('Extraction successful!');
    console.log('Patient:', extraction.patient);
    console.log('Encounter:', extraction.encounter);
    console.log('Symptoms found:', extraction.symptoms.length);
    extraction.symptoms.forEach(s => console.log(`  - ${s.name} (${s.certainty})`));
    console.log('Diagnoses found:', extraction.diagnoses.length);
    extraction.diagnoses.forEach(d => console.log(`  - ${d.name} (${d.certainty})`));
    console.log('Lab results found:', extraction.labResults.length);
    extraction.labResults.forEach(l => console.log(`  - ${l.testName}: ${l.value} ${l.unit}`));
    console.log('Medications found:', extraction.medications.length);
    extraction.medications.forEach(m => console.log(`  - ${m.name} ${m.dosage}`));
    console.log('Procedures found:', extraction.procedures.length);
    extraction.procedures.forEach(p => console.log(`  - ${p.name}`));
    
    // Test negation handling
    const deniedSymptoms = extraction.symptoms.filter(s => s.certainty === 'denied' || s.certainty === 'absent');
    if (deniedSymptoms.length > 0) {
      console.log('Denied symptoms (negation test):', deniedSymptoms.map(s => s.name));
    }
    
    // Test uncertainty handling
    const suspectedDiagnoses = extraction.diagnoses.filter(d => d.certainty === 'suspected' || d.certainty === 'possible');
    if (suspectedDiagnoses.length > 0) {
      console.log('Suspected diagnoses (uncertainty test):', suspectedDiagnoses.map(d => d.name));
    }
    
    return extraction;
  } catch (error) {
    console.error('Extraction failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('Starting extraction service tests...');
  console.log('Make sure Ollama is running with: ollama serve\n');
  
  await testExtractionService(labReportText, 'Lab Report', 'test-record-1');
  await testExtractionService(prescriptionText, 'Prescription', 'test-record-2');
  await testExtractionService(consultationText, 'Consultation Note', 'test-record-3');
  await testExtractionService(dischargeText, 'Discharge Summary', 'test-record-4');
  
  console.log('\n=== All tests complete ===');
}

runTests();
