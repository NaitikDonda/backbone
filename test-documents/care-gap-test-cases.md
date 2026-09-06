# Care Gap Test Cases

## Test Case 1: Repeated Symptom
**Expected:** Recurring issue detected.

**Patient History:**
- 2021-03-15: Fatigue documented in consultation
- 2022-07-20: Fatigue documented in consultation
- 2024-01-10: Fatigue documented in consultation

**Expected Output:**
- Gap Type: recurring_issue
- Title: Recurring Issue: Fatigue
- Description: Fatigue appears across 3 encounters over 2.8 years.
- Confidence: clearly_documented
- Occurrence Count: 3
- Time Span: ~2.8 years

---

## Test Case 2: Repeated Abnormal Lab
**Expected:** Persistent abnormal finding detected.

**Patient History:**
- 2021-05-10: Hemoglobin 9.4 g/dL (low)
- 2022-08-15: Hemoglobin 9.2 g/dL (low)
- 2024-02-20: Hemoglobin 9.3 g/dL (low)

**Expected Output:**
- Gap Type: persistent_abnormal_finding
- Title: Persistent Finding: Hemoglobin
- Description: Repeated Hemoglobin measurements were documented across multiple years.
- Confidence: potential
- Occurrence Count: 3
- Time Span: ~2.8 years

---

## Test Case 3: Explicit Follow-up Requirement
**Expected:** Documented follow-up gap detected.

**Patient History:**
- 2023-03-15: Lab report states "Repeat test after 3 months"
- No subsequent lab result found in available records

**Expected Output:**
- Gap Type: unresolved_status
- Title: Potential Unresolved Follow-up
- Description: Follow-up was recommended/documented, but a corresponding event was not identified in the available records after 2023-03-15.
- Confidence: clearly_documented
- Is Explicit Follow-up: true

---

## Test Case 4: Follow-up Exists
**Expected:** No follow-up gap flagged.

**Patient History:**
- 2023-03-15: Abnormal lab result
- 2023-06-20: Follow-up lab result

**Expected Output:**
- No follow-up gap should be flagged.
- The follow-up event is within the short-term window (90 days).

---

## Test Case 5: Continued Symptom After Treatment
**Expected:** Treatment followed by continued issue detected.

**Patient History:**
- 2022-05-10: Medication for fatigue prescribed
- 2022-08-15: Fatigue still documented

**Expected Output:**
- Gap Type: treatment_followed_by_continued_issue
- Title: Continued Issue After Treatment: Fatigue
- Description: Fatigue remained documented after treatment was recorded on 2022-05-10.
- Confidence: potential

---

## Test Case 6: Fragmented Care
**Expected:** Fragmented care signal detected.

**Patient History:**
- Hospital A (2021): Fatigue documented
- Lab (2022): Abnormal result
- Hospital B (2023): Different diagnosis
- Specialist (2024): Fatigue documented

**Expected Output:**
- Gap Type: fragmented_care
- Title: Fragmented Care: Fatigue
- Description: Related information appears across 4 healthcare encounters and source records.
- Confidence: potential
- Unique Encounters: 4

---

## Test Case 7: Long Gap Between Records
**Expected:** No artificial care gap flagged.

**Patient History:**
- 2019: Last record
- 2024: Next record (5-year gap)

**Expected Output:**
- No care gap should be flagged for the missing period.
- The system should note "Limited information available for this period" but not label it as a care gap.

---

## Test Case 8: Normal Continuous Records
**Expected:** No artificial care gaps.

**Patient History:**
- 2021-2024: Normal continuous records with no recurring issues or missing follow-ups.

**Expected Output:**
- No care gaps should be flagged.
- The system should remain conservative.

---

## Test Case 9: Repeated Visits for Same Issue
**Expected:** Repeated visits detected.

**Patient History:**
- 2021-03-15: Headache consultation
- 2022-05-20: Headache consultation
- 2023-07-10: Headache consultation
- 2024-09-15: Headache consultation

**Expected Output:**
- Gap Type: repeated_visits_same_issue
- Title: Repeated Clinical Attention: Headache
- Description: Similar symptoms were documented across 4 encounters.
- Confidence: clearly_documented
- Occurrence Count: 4

---

## Test Case 10: Investigation Without Clear Outcome
**Expected:** Unresolved investigation detected.

**Patient History:**
- 2023-05-10: MRI performed with "Abnormal finding" documented
- No subsequent related evaluation found in available records

**Expected Output:**
- Gap Type: investigation_without_clear_outcome
- Title: Potential Unresolved Investigation: MRI
- Description: BACKBONE did not identify a subsequent related evaluation in the available records after 2023-05-10.
- Confidence: potential

---

## Test Case 11: Diagnosis Without Supporting Detail
**Expected:** Diagnosis without supporting detail detected.

**Patient History:**
- 2021: Diagnosis "Condition A" documented
- 2022: Diagnosis "Condition A" documented
- 2023: Diagnosis "Condition A" documented
- No supporting lab results or procedures found

**Expected Output:**
- Gap Type: diagnosis_without_supporting_detail
- Title: Diagnosis with Limited Supporting Information: Condition A
- Description: Documented diagnosis with limited supporting information in the available records.
- Confidence: potential

---

## Test Case 12: Abnormal Lab with Follow-up
**Expected:** No follow-up gap flagged.

**Patient History:**
- 2023-03-15: Abnormal lab result
- 2023-04-20: Follow-up consultation
- 2023-05-15: Repeat lab result

**Expected Output:**
- No follow-up gap should be flagged.
- Follow-up events are within the short-term window.

---

## Test Case 13: Multiple Documents Same Result
**Expected:** No false inflation of independent evidence.

**Patient History:**
- Single hospital discharge summary (2023) that mentions:
  - Fatigue (mentioned 3 times in same document)
  - Low Vitamin B12 (mentioned 2 times in same document)

**Expected Output:**
- The system should count this as 1 source record, not 5 independent observations.
- If fatigue appears only in this one document, no recurring issue should be flagged (needs multiple source records).

---

## Test Case 14: Outside Care Window
**Expected:** Conservative handling.

**Patient History:**
- 2023-03-15: Abnormal lab result
- 2023-12-20: Follow-up lab result (outside 90-day window but within 6 months)

**Expected Output:**
- The system should use the long-term window (180 days) for this case.
- If within 180 days, no follow-up gap should be flagged.
- If outside 180 days, a potential follow-up gap may be flagged with appropriate temporal window label.

---

## Test Case 15: Historical Diagnosis
**Expected:** No gap flagged for historical/resolved conditions.

**Patient History:**
- 2015: Diagnosis "Condition A" (historical, resolved)
- 2021-2024: No ongoing issues related to Condition A

**Expected Output:**
- No care gap should be flagged for the historical diagnosis.
- The system should distinguish between active and historical conditions.

---

## Test Case 16: Medication Discontinued
**Expected:** No false positive for continued issue.

**Patient History:**
- 2022: Medication prescribed
- 2023: Medication discontinued
- 2024: Symptom resolved

**Expected Output:**
- No "treatment followed by continued issue" gap should be flagged.
- The system should account for medication discontinuation.

---

## Test Case 17: No Date on Event
**Expected:** Graceful handling.

**Patient History:**
- Event with no date documented
- Recurring symptom pattern

**Expected Output:**
- Events without dates should be excluded from time-based calculations.
- The system should still flag recurring issues if there are enough dated events.

---

## Test Case 18: Explicit Resolution
**Expected:** No gap flagged if resolution is documented.

**Patient History:**
- 2021-2023: Fatigue documented
- 2024: "Fatigue resolved" documented

**Expected Output:**
- No recurring issue gap should be flagged for the resolved condition.
- The system should recognize documented resolution.

---

## Test Case 19: Specialist Assessment
**Expected:** No gap if specialist evaluation is documented.

**Patient History:**
- 2023: Abnormal finding
- 2023: Specialist consultation documented
- 2024: Follow-up documented

**Expected Output:**
- No follow-up gap should be flagged.
- Specialist consultation counts as appropriate follow-up.

---

## Test Case 20: Duplicate Records
**Expected:** No false inflation.

**Patient History:**
- Same lab result uploaded twice
- Duplicate events marked in metadata

**Expected Output:**
- The system should respect the `isDuplicate` flag in event metadata.
- Duplicate events should not count toward occurrence count.

---

## Critical False-Positive Testing

### Scenario A: Follow-up Outside Analyzed Window
- Abnormal lab in 2023
- Follow-up in 2024 (outside configured window)
- **Expected:** System should use appropriate temporal window or note limitation

### Scenario B: Patient Changed Providers
- Records from Provider A (2020-2022)
- Records from Provider B (2023-2024)
- **Expected:** Fragmented care may be flagged, but not as a care gap

### Scenario C: Records Missing
- Large gap in records (e.g., 2020-2023 missing)
- **Expected:** System should note limited information, not flag as care gap

### Scenario D: Investigation Explicitly Resolved
- MRI performed with finding
- "Finding resolved" documented
- **Expected:** No unresolved investigation gap

### Scenario E: Medication Changed
- Medication A prescribed
- Medication B prescribed (change, not failure)
- **Expected:** No "treatment failed" implication

---

## Testing Commands

```bash
# Run TypeScript compilation
npx tsc --noEmit

# Start dev server
npm run dev

# Navigate to http://localhost:5174
# Upload test documents
# Run candidate analysis
# Verify care gaps are displayed
# Click on care gaps to view details
# Test timeline highlighting
# Test dismissal workflow
# Test filter functionality
```

---

## Verification Checklist

- [ ] Recurring issue detection works
- [ ] Persistent findings detection works
- [ ] Follow-up gap detection works
- [ ] Explicit follow-up requirements detected
- [ ] Continued symptoms after treatment detected
- [ ] Investigation outcomes detected
- [ ] Fragmented care detected
- [ ] Missing records handled gracefully
- [ ] Date windows respected
- [ ] Duplicate records handled correctly
- [ ] False-positive prevention works
- [ ] Evidence validation passes
- [ ] Source traceability works
- [ ] Evidence graph integration works
- [ ] Timeline highlighting works
- [ ] Dismissal workflow works
- [ ] Analysis versioning works
- [ ] TypeScript compilation passes
- [ ] Previous phases still work
