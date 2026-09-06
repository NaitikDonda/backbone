# Evidence Graph Test Cases

## Test Case 1: Candidate Supported by Multiple Patterns
**Expected:** Clear evidence chain with multiple supporting patterns.

**Patient History:**
- 2019: Fatigue documented in consultation
- 2020: Numbness documented in consultation
- 2021: Low Vitamin B12 in lab report
- 2022: Neurological consultation with fatigue and numbness
- 2023: Repeat low Vitamin B12 in lab report
- 2024: Fatigue and numbness persist in consultation

**Expected Graph:**
- Candidate: Vitamin B12 Deficiency Neuropathy
  - Pattern: Recurring fatigue
    - Event: Fatigue (2019)
    - Event: Fatigue (2022)
    - Event: Fatigue (2024)
  - Pattern: Recurring numbness
    - Event: Numbness (2020)
    - Event: Numbness (2022)
    - Event: Numbness (2024)
  - Pattern: Low Vitamin B12
    - Event: Low B12 (2021)
    - Event: Low B12 (2023)

---

## Test Case 2: Candidate Supported by One Weak Pattern
**Expected:** Weak evidence, insufficient match.

**Patient History:**
- 2023: Single mention of fatigue in consultation

**Expected Graph:**
- Candidate: Chronic Fatigue Pattern (weak match)
  - Pattern: Single fatigue mention
    - Event: Fatigue (2023)

---

## Test Case 3: Candidate with Contradicting Evidence
**Expected:** Both supporting and contradicting paths displayed.

**Patient History:**
- 2019: Fatigue documented
- 2020: Low Vitamin B12 documented
- 2021: Normal Vitamin B12 documented (contradiction)
- 2022: Numbness documented
- 2023: Low Vitamin B12 documented

**Expected Graph:**
- Candidate: Vitamin B12 Deficiency Neuropathy
  - Supporting evidence: Fatigue, Numbness, Low B12 (2019, 2020, 2022, 2023)
  - Contradicting evidence: Normal B12 (2021)

---

## Test Case 4: Pattern Spanning Multiple Years
**Expected:** Timeline highlights all relevant events across years.

**Patient History:**
- 2019: Fatigue
- 2021: Fatigue
- 2023: Fatigue
- 2024: Fatigue

**Expected Graph:**
- Pattern: Chronic Fatigue Pattern
  - Event: Fatigue (2019)
  - Event: Fatigue (2021)
  - Event: Fatigue (2023)
  - Event: Fatigue (2024)
- Temporal reasoning: "Evidence spans 5+ years, indicating a longitudinal pattern."

---

## Test Case 5: Multiple Documents Containing Same Evidence
**Expected:** No false inflation of independent evidence.

**Patient History:**
- Single hospital discharge summary (2023) that mentions:
  - Fatigue (mentioned 3 times in same document)
  - Low Vitamin B12 (mentioned 2 times in same document)

**Expected Graph:**
- Pattern: Fatigue + Low B12
  - Event: Fatigue (2023) - counted once
  - Event: Low B12 (2023) - counted once
- Source record: Hospital discharge summary (1 source, not 5 independent observations)

---

## Test Case 6: Candidate with Missing Information
**Expected:** Missing-evidence section displayed.

**Patient History:**
- 2020: Fatigue documented
- 2021: Numbness documented
- 2022: Low Vitamin B12 documented

**Expected Graph:**
- Candidate: Vitamin B12 Deficiency Neuropathy
  - Supporting evidence: Fatigue, Numbness, Low B12
  - Missing information: 
    - "Neurological examination"
    - "Confirmatory evaluation"
    - "Specialist assessment"

---

## Test Case 7: No Candidate Match
**Expected:** No artificial graph forced.

**Patient History:**
- 2023: Single mention of headache in consultation

**Expected Graph:**
- No candidate conditions identified
- Graph may show only the headache event with no candidate connections

---

## Test Case 8: Temporal Relationship - Same Episode
**Expected:** Temporal reasoning indicates same-day occurrence.

**Patient History:**
- 2023-05-15: Fatigue and Low Vitamin B12 documented in same consultation

**Expected Graph:**
- Pattern: Fatigue + Low B12
  - Event: Fatigue (2023-05-15)
  - Event: Low B12 (2023-05-15)
- Temporal reasoning: "Evidence appears within a short time frame (days to weeks)."

---

## Test Case 9: Temporal Relationship - Years Apart
**Expected:** Temporal reasoning indicates long time span.

**Patient History:**
- 2019: Fatigue documented
- 2024: Low Vitamin B12 documented

**Expected Graph:**
- Pattern: Fatigue + Low B12
  - Event: Fatigue (2019)
  - Event: Low B12 (2024)
- Temporal reasoning: "Evidence spans 5+ years, indicating a longitudinal pattern."

---

## Test Case 10: Evidence Independence
**Expected:** Independent encounters counted correctly.

**Patient History:**
- Consultation 2019-01-15: Fatigue
- Lab Report 2020-03-20: Low Vitamin B12
- Consultation 2022-07-10: Numbness
- Lab Report 2023-11-25: Low Vitamin B12

**Expected Graph:**
- Pattern: Fatigue + Numbness + Low B12
  - Event: Fatigue (2019) - source: Consultation
  - Event: Low B12 (2020) - source: Lab Report
  - Event: Numbness (2022) - source: Consultation
  - Event: Low B12 (2023) - source: Lab Report
- Source count: 4 independent source records
- Unique encounters: 4
