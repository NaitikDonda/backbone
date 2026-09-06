// Simple test script for extraction service
import fs from 'fs';

const labReportText = fs.readFileSync('./test-documents/lab-report.txt', 'utf8');
const prescriptionText = fs.readFileSync('./test-documents/prescription.txt', 'utf8');
const consultationText = fs.readFileSync('./test-documents/consultation-note.txt', 'utf8');
const dischargeText = fs.readFileSync('./test-documents/discharge-summary.txt', 'utf8');
const sampleTestText = fs.readFileSync('./test-documents/sample_test.txt', 'utf8');

async function testExtraction(text, documentName) {
  console.log(`\n=== Testing ${documentName} ===`);
  console.log('Text length:', text.length);
  
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: `Extract medical information from this text as JSON.

Extract these categories if present:
- Patient info (name, age, sex, date)
- Encounter info (date, type, facility, department, physician)
- Symptoms (name, date, duration, severity, certainty, status)
- Diagnoses (name, date, status, certainty) - Look for ASSESSMENT section
- Lab results (test name, value, unit, reference range) - Only EXTRACTED results, not planned tests
- Medications (name, dosage, frequency, route) - If "None" or "No medications", return empty array
- Procedures (name, date, result) - Look for PLAN section for planned procedures/referrals
- Findings (text, category) - Look for PHYSICAL EXAM, NEUROLOGICAL EXAM sections

CRITICAL RULES:
- ONLY extract information EXPLICITLY stated in the text
- Do NOT infer diagnoses from lab results
- Handle negation correctly: "denies X" = X is absent/denied, "None" = empty array
- Handle uncertainty correctly: "possible X" = X is suspected, "rule out X" = X is ruled_out
- Preserve status information: "ongoing", "resolved", "chronic", etc.
- ASSESSMENT section contains diagnoses/assessments with status (e.g., "Fatigue - ongoing")
- PLAN section contains planned actions, not actual results (e.g., "Repeat Vitamin B12 level" is a plan, not a result)
- Distinguish between planned tests and actual lab results
- If medications list says "None" or "No medications", return empty medications array

Return ONLY the JSON object. No markdown, no explanations.

TEXT:
${text}`,
        stream: false,
      }),
    });
    
    const data = await response.json();
    console.log('Response received');
    console.log('Response length:', data.response?.length || 0);
    
    try {
      // Try to extract JSON from response (may be wrapped in markdown)
      let jsonText = data.response;
      
      // Remove markdown code blocks if present
      const jsonMatch = data.response.match(/```(?:json)?\s*({[\s\S]*})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      
      // Try to find JSON object in the response
      const objectMatch = data.response.match(/\{[\s\S]*\}/);
      if (objectMatch && !jsonMatch) {
        jsonText = objectMatch[0];
      }
      
      const parsed = JSON.parse(jsonText);
      console.log('JSON parsed successfully');
      console.log('Keys:', Object.keys(parsed));
      
      if (parsed.symptoms) console.log('Symptoms found:', parsed.symptoms.length);
      if (parsed.labResults) console.log('Lab results found:', parsed.labResults.length);
      if (parsed.medications) console.log('Medications found:', parsed.medications.length);
      if (parsed.diagnoses) console.log('Diagnoses found:', parsed.diagnoses.length);
      
      // Show full extraction for sample test
      if (documentName.includes('Sample Test')) {
        console.log('\n=== FULL EXTRACTION FOR SAMPLE TEST ===');
        console.log(JSON.stringify(parsed, null, 2));
      } else {
        console.log('\nExtracted data sample:');
        console.log(JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
      console.log('Raw response (full):', data.response);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('Starting extraction tests...');
  console.log('Make sure Ollama is running with: ollama serve');
  
  // Only test sample test for debugging
  await testExtraction(sampleTestText, 'Sample Test (Real-world consultation)');
  
  console.log('\n=== All tests complete ===');
}

runTests();
