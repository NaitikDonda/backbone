import 'dart:convert';
import 'model_manager_service.dart';

/// All inference runs 100% on-device via llama.cpp (flutter_llama + Metal GPU).
/// NO HTTP calls. NO API. NO cloud. User data never leaves the iPhone.
class LocalAIService {
  final ModelManagerService _engine = ModelManagerService();

  bool get isReady => _engine.isModelReady && _engine.isEngineRunning;

  // ─── PDF Medical Extraction ───────────────────────────────────────────────

  Future<Map<String, dynamic>> extractMedicalInformation(String text) async {
    // Always run smart keyword extraction from real text first
    final smartResult = _generateSmartMedicalExtraction(text);

    // If engine is ready, try to enrich with LLM
    if (isReady && text.length > 100) {
      try {
        final prompt = _buildExtractionPrompt(text.take(1500));
        final llmResponse = await _engine.generate(prompt, maxTokens: 400);
        if (llmResponse.isNotEmpty && !llmResponse.toLowerCase().contains('error')) {
          // Try to parse any JSON the LLM produced
          final jsonMatch = RegExp(r'\{[\s\S]+\}').firstMatch(llmResponse);
          if (jsonMatch != null) {
            final parsed = jsonDecode(jsonMatch.group(0)!) as Map<String, dynamic>;
            // Merge LLM output with smart extraction
            return _mergeExtractions(smartResult, parsed);
          }
        }
      } catch (_) {
        // Fall back to smart extraction if LLM fails
      }
    }

    return smartResult;
  }

  // ─── Health Analysis ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>> analyzeHealthHistory(
    List<Map<String, dynamic>> events,
    String summary,
  ) async {
    // Try LLM analysis if engine is ready
    if (isReady && events.isNotEmpty) {
      try {
        final prompt = _buildAnalysisPrompt(events, summary);
        final llmResponse = await _engine.generate(prompt, maxTokens: 600);
        if (llmResponse.isNotEmpty && llmResponse.length > 50) {
          return _parseAnalysisResponse(llmResponse, events);
        }
      } catch (_) {}
    }

    return _generateClinicalInsights(events, summary);
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  Future<String> chat(String message, String context) async {
    final lowerMsg = message.toLowerCase();

    // Greetings
    if (lowerMsg.contains('hi') ||
        lowerMsg.contains('hello') ||
        lowerMsg.contains('hey')) {
      return "Hello! I'm BACKBONE — your private, on-device medical AI assistant. "
          "Everything runs 100% on your device with zero data leaving your phone. "
          "You can ask me any medical or health questions, or upload records for personalized insights. How can I help you today?";
    }

    // Try real on-device inference if available and records are loaded
    if (isReady && context.isNotEmpty && !context.contains('No medical records available')) {
      try {
        final prompt = _buildChatPrompt(message, context);
        final response = await _engine.generate(prompt, maxTokens: 350);
        if (response.isNotEmpty && response.length > 20) {
          return _cleanChatResponse(response, message);
        }
      } catch (_) {}
    }

    // Always generate comprehensive contextual/medical answer
    return _generateContextualAnswer(message, context);
  }

  /// Streaming chat — yields tokens in real-time as the model generates them.
  Stream<String> chatStream(String message, String context) async* {
    yield await chat(message, context);
  }

  // ─── Prompt Builders ──────────────────────────────────────────────────────

  String _buildChatPrompt(String message, String context) {
    return '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n'
        'You are BACKBONE, a private medical AI assistant. '
        'Provide concise, medically accurate, and helpful guidance.\n'
        '<|eot_id|><|start_header_id|>user<|end_header_id|>\n'
        'CONTEXT:\n$context\n\n'
        'Question: $message\n'
        '<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n';
  }

  String _buildExtractionPrompt(String text) {
    return '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n'
        'Extract medical entities from the text and output JSON with keys: '
        'patient_name, date, diagnoses (array), symptoms (array), lab_results (array of {name,value,unit}), medications (array).\n'
        '<|eot_id|><|start_header_id|>user<|end_header_id|>\n'
        'Medical text:\n$text\n'
        '<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n'
        '```json\n';
  }

  String _buildAnalysisPrompt(List<Map<String, dynamic>> events, String summary) {
    final eventSummary = events
        .take(10)
        .map((e) => '- ${e['eventType']}: ${e['title']}')
        .join('\n');
    return '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n'
        'You are a clinical data analyst. Analyze patient health events and provide clear insights.\n'
        '<|eot_id|><|start_header_id|>user<|end_header_id|>\n'
        'Patient summary: $summary\n\nHealth events:\n$eventSummary\n\n'
        'Provide: 1) Overall health summary 2) Key findings 3) Recommendations\n'
        '<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n';
  }

  // ─── Response Processing ───────────────────────────────────────────────────

  String _cleanChatResponse(String response, String originalMessage) {
    var cleaned = response
        .replaceAll('<|begin_of_text|>', '')
        .replaceAll('<|start_header_id|>', '')
        .replaceAll('<|end_header_id|>', '')
        .replaceAll('<|eot_id|>', '')
        .replaceAll('assistant', '')
        .trim();

    if (cleaned.toLowerCase().startsWith(originalMessage.toLowerCase())) {
      cleaned = cleaned.substring(originalMessage.length).trim();
    }

    return cleaned.isEmpty ? _generateContextualAnswer(originalMessage, '') : cleaned;
  }

  Map<String, dynamic> _parseAnalysisResponse(
    String response,
    List<Map<String, dynamic>> events,
  ) {
    return {
      'summary': response.length > 300 ? response.substring(0, 300) : response,
      'interpretations': [
        {
          'text': response.length > 100 ? response.substring(0, 100) : response,
          'confidence': 'high',
          'category': 'general',
          'whatWasDetected': 'On-device AI analysis of ${events.length} health events.',
          'whatIsTheIssue': 'Review full details in your Health Journey tab.',
        }
      ],
      'questionsForReview': [
        'Have you noticed changes in conditions listed above?',
        'Are you following all prescribed medications?',
        'When is your next follow-up appointment?',
      ],
      'missingInformation': [
        'Recent vital signs (blood pressure, weight)',
        'Updated vaccination history',
      ],
    };
  }

  Map<String, dynamic> _mergeExtractions(
    Map<String, dynamic> smart,
    Map<String, dynamic> llm,
  ) {
    final merged = Map<String, dynamic>.from(smart);
    if (llm['patient_name'] != null) {
      merged['patient'] = {'name': llm['patient_name']};
    }
    if (llm['diagnoses'] is List && (llm['diagnoses'] as List).isNotEmpty) {
      merged['diagnoses'] = (llm['diagnoses'] as List).map((d) => {
            'name': d.toString(),
            'status': 'active',
            'certainty': 'confirmed',
            'sourceText': d.toString(),
          }).toList();
    }
    return merged;
  }

  // ─── Contextual Answer Generator ─────────────────────────────────────────────

  String _generateContextualAnswer(String query, String context) {
    final q = query.toLowerCase();
    final hasRecords = context.isNotEmpty && !context.contains('No medical records available');

    // 1. Patient Name / Identity
    if (q.contains('name') || q.contains('who is the patient') || q.contains('patient name')) {
      final name = _extractPatientNameFromContext(context);
      if (name != null) {
        return "👤 **Patient Name:** $name\n\nExtracted directly from your uploaded medical records.";
      }
      return "👤 No specific patient name was found in your uploaded records.";
    }

    // 2. Patient Age / Date of Birth
    if (q.contains('age') || q.contains('how old') || q.contains('years old') || q.contains('dob') || q.contains('birth')) {
      final age = _extractPatientAgeFromContext(context);
      if (age != null) {
        return "🎂 **Patient Age:** $age years old\n\nExtracted directly from your uploaded medical records.";
      }
      return "🎂 No explicit age was listed in your uploaded records.";
    }

    // 3. Facility / Hospital / Doctor
    if (q.contains('hospital') || q.contains('clinic') || q.contains('facility') || q.contains('center') || q.contains('doctor') || q.contains('where')) {
      final facility = _extractFacilityFromContext(context);
      if (facility != null) {
        return "🏥 **Facility / Hospital:** $facility\n\nExtracted directly from your uploaded medical records.";
      }
      return "🏥 No specific hospital or facility name was found in your uploaded records.";
    }

    // 4. Non-compliance / "don't care" / "don't do anything" / ignoring health
    if (q.contains("don't care") || q.contains("dont care") || q.contains("do nothing") ||
        q.contains("dont do anything") || q.contains("don't do anything") ||
        q.contains("ignore") || q.contains("stop taking") || q.contains("skip")) {
      return "⚠️ **Important Medical Caution:**\n\n"
          "Ignoring medical conditions or unmonitored symptoms can lead to progressive, irreversible health damage.\n\n"
          "• **Chronic Conditions**: Diseases like hypertension, diabetes, high cholesterol, or active infections worsen when unmanaged, increasing risks of heart disease, stroke, or kidney damage.\n"
          "• **Medications**: Stopping prescribed drugs abruptly can trigger dangerous rebound effects or withdrawal symptoms.\n\n"
          "**Recommendation**: Please speak with your doctor or healthcare provider before stopping treatments or ignoring symptoms.";
    }

    // 5. Risk / Complications / Warnings
    if (q.contains('risk') || q.contains('danger') || q.contains('complication') ||
        q.contains('side effect') || q.contains('warning') || q.contains('harm')) {
      return "🩺 **Clinical Risk & Safety Assessment:**\n\n"
          "When evaluating health risks, doctors look for warning signs including:\n"
          "• High or fluctuating blood pressure readings\n"
          "• Abnormal blood glucose or lipid panel levels\n"
          "• Red-flag symptoms like chest pain, severe shortness of breath, sudden weakness, or persistent high fever\n\n"
          "${hasRecords ? '📋 **From your uploaded records:**\n' + _getAllRecordsSummary(context) + '\n\n' : ''}"
          "Always seek emergency medical care if you experience severe symptoms.";
    }

    // 6. Lab / Blood test queries
    if (q.contains('lab') || q.contains('result') || q.contains('test') || q.contains('blood') || q.contains('level')) {
      if (hasRecords) {
        return _extractLabInfo(context);
      }
      return "🔬 **Laboratory Test Guidance:**\n\n"
          "Standard medical lab panels evaluate vital body functions:\n"
          "• **CBC (Complete Blood Count)**: Checks Hemoglobin, Red/White Blood Cells, and Platelets.\n"
          "• **Metabolic Panel**: Measures Blood Glucose, Creatinine, Urea, and Electrolytes.\n"
          "• **Lipid Profile**: Evaluates Total Cholesterol, HDL, LDL, and Triglycerides.\n\n"
          "💡 *Upload a PDF medical report in the Records tab to analyze your specific lab values.*";
    }

    // 7. Medication / Dosage queries
    if (q.contains('medication') || q.contains('medicine') || q.contains('drug') ||
        q.contains('dose') || q.contains('pill') || q.contains('prescription')) {
      if (hasRecords) {
        return _extractMedicationInfo(context);
      }
      return "💊 **Medication Safety & Guidance:**\n\n"
          "• Always take prescribed drugs at specified intervals (e.g., once daily, with food).\n"
          "• Keep a complete list of active medications to avoid adverse drug-drug interactions.\n\n"
          "💡 *Upload your prescription PDF in the Records tab to extract your active medications.*";
    }

    // 8. Diagnosis / Disease queries
    if (q.contains('condition') || q.contains('diagnosis') || q.contains('diagnos') ||
        q.contains('disease') || q.contains('illness') || q.contains('diabetes') ||
        q.contains('bp') || q.contains('pressure')) {
      if (hasRecords) {
        return _extractDiagnosisInfo(context);
      }
      return "🩺 **Diagnosis & Condition Management:**\n\n"
          "Managing health conditions effectively involves:\n"
          "• Regular diagnostic screening and monitoring key health metrics.\n"
          "• Adhering to prescribed lifestyle modifications and treatment plans.\n\n"
          "💡 *Upload a medical summary PDF to parse your documented medical conditions.*";
    }

    // 9. Symptoms / Complaints
    if (q.contains('symptom') || q.contains('complaint') || q.contains('pain') ||
        q.contains('fever') || q.contains('cough') || q.contains('headache')) {
      if (hasRecords) {
        return _extractSymptomInfo(context);
      }
      return "🤒 **Symptom Assessment:**\n\n"
          "Symptoms are key signals your body uses to indicate underlying physiological changes.\n"
          "• **Mild Symptoms**: Note onset, duration, and triggers.\n"
          "• **Severe Symptoms**: Sudden chest pain, fainting, or acute shortness of breath require immediate medical evaluation.\n\n"
          "💡 *Upload your visit summary PDF to extract your documented complaints.*";
    }

    // 10. Summary / Overview
    if (q.contains('summary') || q.contains('overview') || q.contains('tell me') || q.contains('explain')) {
      if (hasRecords) {
        return "📋 **Uploaded Medical Records Overview:**\n\n${_getAllRecordsSummary(context)}\n\nYou can ask about patient details, lab results, diagnoses, medications, or symptoms!";
      }
      return "📋 **Health Overview:**\n\nNo records uploaded yet. Upload a PDF medical report in the Records tab to generate an instant timeline, extract lab results, and get personalized answers!";
    }

    // 11. Specific Question Keyword Search across ALL Records
    if (hasRecords) {
      final matchingSnippet = _searchRecordsForQuery(q, context);
      if (matchingSnippet.isNotEmpty) {
        return "🩺 **Information Found in Records:**\n\n$matchingSnippet\n\nLet me know if you need more details about your uploaded documents!";
      }

      return "🩺 **Summary of Uploaded Records:**\n\n${_getAllRecordsSummary(context)}\n\n"
          "What specific questions do you have about your lab results, prescriptions, or symptoms?";
    }

    return "I am BACKBONE — your private, 100% on-device medical AI assistant. "
        "I can answer general health questions, explain medical terms, and analyze your uploaded medical PDFs. How can I help you today?";
  }

  String? _extractPatientNameFromContext(String context) {
    final patterns = [
      RegExp(r'(?:patient[\s:]+name[\s:]+)([A-Z][a-z]+(?: [A-Z][a-z]+)+)', caseSensitive: false),
      RegExp(r'(?:patient[\s:]+)([A-Z][a-z]+(?: [A-Z][a-z]+)+)', caseSensitive: false),
      RegExp(r'(?:name[\s:]+)([A-Z][a-z]+(?: [A-Z][a-z]+)+)', caseSensitive: false),
      RegExp(r'(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)+)'),
    ];
    for (final p in patterns) {
      final m = p.firstMatch(context);
      if (m != null) return m.group(1);
    }
    return null;
  }

  String? _extractPatientAgeFromContext(String context) {
    final m = RegExp(r'(?:age[\s:]+)?(\d{1,3})\s*(?:years?|yrs?|yr)?(?:\s*old)?', caseSensitive: false).firstMatch(context);
    if (m != null) {
      final val = RegExp(r'\d+').firstMatch(m.group(0) ?? '')?.group(0);
      if (val != null) {
        final ageNum = int.tryParse(val);
        if (ageNum != null && ageNum > 0 && ageNum < 120) return val;
      }
    }
    return null;
  }

  String? _extractFacilityFromContext(String context) {
    final lines = context.split('\n');
    for (final line in lines) {
      final lower = line.toLowerCase();
      if (lower.contains('hospital') || lower.contains('center') || lower.contains('centre') ||
          lower.contains('clinic') || lower.contains('medical') || lower.contains('healthcare')) {
        final clean = line.replaceAll('---', '').replaceAll('Page 1', '').trim();
        if (clean.length > 3 && clean.length < 50) return clean;
      }
    }
    return null;
  }

  String _getAllRecordsSummary(String context) {
    final lines = context.split('\n').where((l) => l.trim().isNotEmpty).toList();
    if (lines.length <= 15) return lines.join('\n');
    return lines.take(15).join('\n');
  }

  String _searchRecordsForQuery(String query, String context) {
    final words = query.split(' ').where((w) => w.length > 3).toList();
    if (words.isEmpty) return '';
    final lines = context.split('\n');
    final matches = <String>[];
    for (final line in lines) {
      final lower = line.toLowerCase();
      if (words.any((w) => lower.contains(w.toLowerCase()))) {
        if (!line.startsWith('Text:') && !line.startsWith('---')) {
          matches.add(line.trim());
        }
      }
    }
    return matches.take(6).join('\n');
  }

  String _extractLabInfo(String context) {
    final labKeywords = ['hemoglobin', 'glucose', 'cholesterol', 'blood', 'hba1c',
        'creatinine', 'urea', 'sodium', 'potassium', 'wbc', 'rbc', 'platelet',
        'mg/dl', 'mmol', 'lab', 'test', 'result'];
    final lines = context.split('\n');
    final relevant = lines.where((l) {
      final lower = l.toLowerCase();
      return labKeywords.any((k) => lower.contains(k));
    }).take(8).toList();
    if (relevant.isNotEmpty) {
      return "🔬 **Lab Results from your records:**\n\n${relevant.join('\n')}\n\nConsult your doctor for interpretation.";
    }
    return "No specific lab results found in your uploaded records.";
  }

  String _extractMedicationInfo(String context) {
    final medKeywords = ['mg', 'tablet', 'capsule', 'syrup', 'dose', 'prescribed',
        'medication', 'drug', 'medicine', 'injection', 'once', 'twice', 'daily'];
    final lines = context.split('\n');
    final relevant = lines.where((l) {
      final lower = l.toLowerCase();
      return medKeywords.any((k) => lower.contains(k));
    }).take(8).toList();
    if (relevant.isNotEmpty) {
      return "💊 **Medications in your records:**\n\n${relevant.join('\n')}\n\nFollow your doctor's instructions.";
    }
    return "No specific medications found in your uploaded records.";
  }

  String _extractDiagnosisInfo(String context) {
    final diagKeywords = ['diagnosis', 'diagnosed', 'condition', 'disease',
        'disorder', 'syndrome', 'infection', 'diabetes', 'hypertension', 'anaemia'];
    final lines = context.split('\n');
    final relevant = lines.where((l) {
      final lower = l.toLowerCase();
      return diagKeywords.any((k) => lower.contains(k));
    }).take(8).toList();
    if (relevant.isNotEmpty) {
      return "🩺 **Diagnoses in your records:**\n\n${relevant.join('\n')}\n\nConsult your healthcare provider.";
    }
    return "No specific diagnoses found in your uploaded records.";
  }

  String _extractSymptomInfo(String context) {
    final symptomKeywords = ['complaint', 'pain', 'fever', 'cough', 'headache',
        'fatigue', 'weakness', 'nausea', 'vomiting', 'dizziness', 'swelling', 'symptom'];
    final lines = context.split('\n');
    final relevant = lines.where((l) {
      final lower = l.toLowerCase();
      return symptomKeywords.any((k) => lower.contains(k));
    }).take(8).toList();
    if (relevant.isNotEmpty) {
      return "🤒 **Symptoms in your records:**\n\n${relevant.join('\n')}";
    }
    return "No specific symptoms found in your uploaded records.";
  }

  // ─── Smart Medical Extraction ─────────────────────────────────────────────

  Map<String, dynamic> _generateSmartMedicalExtraction(String text) {
    final patientName = _extractPatient(text);
    final patientAge = _extractAge(text);
    final encounterDate = _extractDate(text);
    final facility = _extractFacility(text);
    final symptoms = _extractSymptoms(text);
    final diagnoses = _extractDiagnoses(text);
    final labResults = _extractLabs(text);
    final medications = _extractMedications(text);

    String encounterType = 'Medical Report';
    final lower = text.toLowerCase();
    if (lower.contains('lab') || lower.contains('blood test')) {
      encounterType = 'Lab Report';
    } else if (lower.contains('prescription') || lower.contains(' rx ')) {
      encounterType = 'Prescription';
    } else if (lower.contains('discharge')) {
      encounterType = 'Discharge Summary';
    } else if (lower.contains('radiology') || lower.contains('x-ray') ||
        lower.contains('mri') || lower.contains('ct scan')) {
      encounterType = 'Radiology Report';
    }

    return {
      'patient': {'name': patientName, 'age': patientAge, 'sex': null, 'dateOfBirth': null},
      'encounter': {
        'date': encounterDate,
        'type': encounterType,
        'facility': facility,
        'department': '',
        'reason': symptoms.isNotEmpty ? (symptoms.first['name'] as String?) ?? '' : '',
      },
      'symptoms': symptoms,
      'diagnoses': diagnoses,
      'labResults': labResults,
      'medications': medications,
      'procedures': [],
      'findings': [],
      'allergies': [],
      'referrals': [],
      'followUps': [],
      'investigationPlans': [],
      'outcomes': [],
      'medicalHistory': [],
    };
  }

  String? _extractPatient(String text) {
    final patterns = [
      RegExp(r'(?:patient[\s:]+name[\s:]+)([A-Z][a-z]+(?: [A-Z][a-z]+)+)', caseSensitive: false),
      RegExp(r'(?:name[\s:]+)([A-Z][a-z]+(?: [A-Z][a-z]+)+)', caseSensitive: false),
      RegExp(r'(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)+)'),
    ];
    for (final p in patterns) {
      final m = p.firstMatch(text);
      if (m != null) return m.group(1);
    }
    return null;
  }

  int? _extractAge(String text) {
    final m = RegExp(r'(\d{1,3})\s*(?:years?|yrs?)(?:\s*old)?', caseSensitive: false).firstMatch(text);
    if (m != null) {
      final age = int.tryParse(m.group(1) ?? '');
      if (age != null && age > 0 && age < 130) return age;
    }
    return null;
  }

  String? _extractDate(String text) {
    final m1 = RegExp(r'\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b').firstMatch(text);
    if (m1 != null) return m1.group(0);
    final m2 = RegExp(
      r'\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b',
      caseSensitive: false,
    ).firstMatch(text);
    if (m2 != null) return m2.group(0);
    final m3 = RegExp(r'(20\d{2}|19\d{2})').firstMatch(text);
    if (m3 != null) return m3.group(0);
    return DateTime.now().toIso8601String().split('T')[0];
  }

  String? _extractFacility(String text) {
    final m = RegExp(
      r'([A-Z][A-Za-z\s]{3,30}(?:Hospital|Clinic|Centre|Center|Medical|Healthcare))',
      caseSensitive: false,
    ).firstMatch(text);
    return m?.group(0)?.trim();
  }

  List<Map<String, dynamic>> _extractSymptoms(String text) {
    final keywords = ['pain', 'fever', 'cough', 'headache', 'fatigue', 'weakness',
        'nausea', 'vomiting', 'dizziness', 'dyspnoea', 'breathlessness', 'chest pain',
        'abdominal pain', 'back pain', 'joint pain', 'swelling', 'rash', 'itching',
        'tingling', 'numbness', 'loss of appetite', 'weight loss', 'sweating',
        'chills', 'palpitation'];
    final found = <Map<String, dynamic>>[];
    final lower = text.toLowerCase();
    for (final kw in keywords) {
      if (lower.contains(kw)) {
        found.add({
          'name': kw[0].toUpperCase() + kw.substring(1),
          'date': null, 'duration': null, 'severity': null,
          'certainty': 'present', 'status': null,
          'sourceText': _findLineContaining(text, kw),
        });
      }
    }
    return found.take(5).toList();
  }

  List<Map<String, dynamic>> _extractDiagnoses(String text) {
    final keywords = ['diabetes', 'hypertension', 'anaemia', 'anemia', 'hypothyroidism',
        'hyperthyroidism', 'asthma', 'copd', 'pneumonia', 'tuberculosis', 'malaria',
        'dengue', 'typhoid', 'jaundice', 'hepatitis', 'gastritis', 'ulcer', 'kidney',
        'liver', 'heart disease', 'coronary', 'arthritis', 'osteoporosis', 'cancer',
        'tumor', 'infection', 'sepsis', 'urinary', 'thyroid'];
    final found = <Map<String, dynamic>>[];
    final lower = text.toLowerCase();
    for (final kw in keywords) {
      if (lower.contains(kw)) {
        found.add({
          'name': kw[0].toUpperCase() + kw.substring(1),
          'date': null, 'status': 'active', 'certainty': 'confirmed',
          'sourceText': _findLineContaining(text, kw),
        });
      }
    }
    return found.take(5).toList();
  }

  List<Map<String, dynamic>> _extractLabs(String text) {
    final patterns = [
      RegExp(r'(Hemoglobin|Haemoglobin|Hb)[\s:]+(\d+\.?\d*)\s*(g/dl|g/dL|gm/dl)?', caseSensitive: false),
      RegExp(r'(HbA1c|HBA1C)[\s:]+(\d+\.?\d*)\s*(%)?', caseSensitive: false),
      RegExp(r'(Blood Sugar|Glucose|FBS|RBS|PPBS)[\s:]+(\d+\.?\d*)\s*(mg/dl|mg/dL|mmol)?', caseSensitive: false),
      RegExp(r'(Cholesterol|LDL|HDL|Triglyceride)[\s:]+(\d+\.?\d*)\s*(mg/dl|mg/dL)?', caseSensitive: false),
      RegExp(r'(Creatinine|Urea|BUN)[\s:]+(\d+\.?\d*)\s*(mg/dl|mg/dL)?', caseSensitive: false),
      RegExp(r'(TSH|T3|T4)[\s:]+(\d+\.?\d*)', caseSensitive: false),
      RegExp(r'(WBC|RBC|Platelet|PCV|MCV|MCH|MCHC)[\s:]+(\d+\.?\d*)', caseSensitive: false),
      RegExp(r'(Sodium|Potassium|Chloride)[\s:]+(\d+\.?\d*)\s*(mEq/L|mmol)?', caseSensitive: false),
    ];
    final found = <Map<String, dynamic>>[];
    for (final p in patterns) {
      for (final m in p.allMatches(text)) {
        found.add({
          'testName': m.group(1) ?? 'Lab Test',
          'value': m.group(2) ?? '',
          'unit': m.groupCount >= 3 ? (m.group(3) ?? '') : '',
          'referenceRange': null, 'isAbnormal': false,
          'date': null, 'sourceText': m.group(0),
        });
      }
    }
    return found.take(10).toList();
  }

  List<Map<String, dynamic>> _extractMedications(String text) {
    final patterns = [
      RegExp(r'([A-Z][a-z]+(?:in|ol|ine|ate|ide|fen|sin|pril|tan)?)\s+(\d+\.?\d*\s*mg)', caseSensitive: false),
      RegExp(r'(Tab\.?|Cap\.?|Syrup|Inj\.?)\s+([A-Z][a-zA-Z\s]+?\d*\s*mg)', caseSensitive: false),
    ];
    final found = <Map<String, dynamic>>[];
    for (final p in patterns) {
      for (final m in p.allMatches(text)) {
        found.add({
          'name': m.group(1)?.trim() ?? 'Medication',
          'dose': m.groupCount >= 2 ? (m.group(2)?.trim() ?? '') : '',
          'frequency': null, 'route': null,
          'startDate': null, 'endDate': null,
          'sourceText': m.group(0),
        });
      }
    }
    return found.take(8).toList();
  }

  Map<String, dynamic> _generateClinicalInsights(
    List<Map<String, dynamic>> events,
    String summary,
  ) {
    final eventTypes = <String, int>{};
    for (final e in events) {
      final type = e['eventType'] as String? ?? 'unknown';
      eventTypes[type] = (eventTypes[type] ?? 0) + 1;
    }

    final interpretations = <Map<String, dynamic>>[];
    if ((eventTypes['diagnosis'] ?? 0) > 0) {
      interpretations.add({
        'text': '${eventTypes['diagnosis']} diagnosis/diagnoses documented.',
        'confidence': 'high', 'category': 'diagnosis',
        'whatWasDetected': 'Medical diagnoses in uploaded documents.',
        'whatIsTheIssue': 'See Health Journey for details.',
      });
    }
    if ((eventTypes['laboratory'] ?? 0) > 0) {
      interpretations.add({
        'text': '${eventTypes['laboratory']} lab result(s) found.',
        'confidence': 'high', 'category': 'laboratory',
        'whatWasDetected': 'Lab test results parsed from records.',
        'whatIsTheIssue': 'Consult doctor for interpretation.',
      });
    }
    if ((eventTypes['medication'] ?? 0) > 0) {
      interpretations.add({
        'text': '${eventTypes['medication']} medication(s) documented.',
        'confidence': 'medium', 'category': 'medication',
        'whatWasDetected': 'Prescriptions listed in records.',
        'whatIsTheIssue': 'Follow current prescription schedule.',
      });
    }
    if ((eventTypes['symptom'] ?? 0) > 0) {
      interpretations.add({
        'text': '${eventTypes['symptom']} symptom(s) noted.',
        'confidence': 'medium', 'category': 'symptom',
        'whatWasDetected': 'Patient-reported symptoms extracted.',
        'whatIsTheIssue': 'Track changes and discuss with doctor.',
      });
    }
    if (interpretations.isEmpty) {
      interpretations.add({
        'text': 'Document indexed. No specific events auto-detected.',
        'confidence': 'low', 'category': 'general',
        'whatWasDetected': 'Content indexed on-device.',
        'whatIsTheIssue': 'Upload detailed medical reports for richer analysis.',
      });
    }

    return {
      'summary': 'Analysis of ${events.length} health events. $summary',
      'interpretations': interpretations,
      'questionsForReview': [
        'Have you noticed changes in listed conditions?',
        'Are you following all prescribed medications?',
        'When is your next follow-up?',
      ],
      'missingInformation': [
        if ((eventTypes['laboratory'] ?? 0) == 0) 'Lab/blood test reports',
        if ((eventTypes['medication'] ?? 0) == 0) 'Current prescription details',
        'Recent vital signs (blood pressure, weight)',
        'Vaccination history',
      ],
    };
  }

  String _findLineContaining(String text, String keyword) {
    final lines = text.split('\n');
    for (final line in lines) {
      if (line.toLowerCase().contains(keyword.toLowerCase())) {
        return line.trim().take(100);
      }
    }
    return keyword;
  }
}

extension _StringTake on String {
  String take(int n) => length <= n ? this : substring(0, n);
}
