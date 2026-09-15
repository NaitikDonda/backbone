import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:backbone_mobile/providers/patient_provider.dart';
import 'package:backbone_mobile/services/local_ai_service.dart';
import 'package:backbone_mobile/core/theme/app_colors.dart';
import 'package:backbone_mobile/providers/theme_provider.dart';

class InsightsScreen extends StatefulWidget {
  const InsightsScreen({super.key});

  @override
  State<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends State<InsightsScreen>
    with SingleTickerProviderStateMixin {
  final LocalAIService _aiService = LocalAIService();

  bool _isAnalyzing = false;
  Map<String, dynamic>? _analysisResult;
  String _analysisStep = '';
  double _analysisProgress = 0.0;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _runAnalysis() async {
    final patientProvider = Provider.of<PatientProvider>(context, listen: false);
    final events = patientProvider.events;
    final records = patientProvider.records;

    if (events.isEmpty && records.isEmpty) {
      _showNoDataDialog();
      return;
    }

    setState(() {
      _isAnalyzing = true;
      _analysisResult = null;
      _analysisProgress = 0.1;
      _analysisStep = 'Loading your health records...';
    });

    await Future.delayed(const Duration(milliseconds: 400));

    setState(() {
      _analysisProgress = 0.3;
      _analysisStep = 'Scanning ${events.length} timeline events...';
    });

    await Future.delayed(const Duration(milliseconds: 500));

    setState(() {
      _analysisProgress = 0.55;
      _analysisStep = 'Identifying patterns in diagnoses & lab results...';
    });

    await Future.delayed(const Duration(milliseconds: 500));

    setState(() {
      _analysisProgress = 0.75;
      _analysisStep = 'Generating clinical insights...';
    });

    // Build summary from events
    final summary = _buildSummary(events, records);
    final eventsJson = events
        .map((e) => {
              'id': e.id,
              'eventType': e.eventType,
              'title': e.title,
              'description': e.description ?? '',
              'date': e.date?.toIso8601String(),
            })
        .toList();

    final result = await _aiService.analyzeHealthHistory(eventsJson, summary);

    setState(() {
      _analysisProgress = 1.0;
      _analysisStep = 'Analysis complete.';
      _analysisResult = result;
      _isAnalyzing = false;
    });
  }

  String _buildSummary(List events, List records) {
    return '${records.length} medical document(s) uploaded. '
        '${events.length} clinical events extracted. '
        'Event types: ${_countTypes(events)}';
  }

  String _countTypes(List events) {
    final map = <String, int>{};
    for (final e in events) {
      final t = (e.eventType as String?) ?? 'unknown';
      map[t] = (map[t] ?? 0) + 1;
    }
    return map.entries.map((e) => '${e.value} ${e.key}(s)').join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Consumer<PatientProvider>(
      builder: (context, patientProvider, child) {
        return Scaffold(
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            title: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(CupertinoIcons.sparkles, color: AppColors.cyanAccent, size: 16),
                const SizedBox(width: 8),
                Text(
                  'AI Insights',
                  style: TextStyle(
                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: Icon(
                  isDark ? CupertinoIcons.sun_max_fill : CupertinoIcons.moon_fill,
                  color: isDark ? CupertinoColors.systemYellow : AppColors.primaryBlue,
                  size: 20,
                ),
                onPressed: () => themeProvider.toggleTheme(),
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: RefreshIndicator(
            color: AppColors.cyanAccent,
            backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            onRefresh: () async {
              await patientProvider.loadRecords();
              await patientProvider.loadEvents();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Stats Row ──────────────────────────────────────────────────
                  _buildStatsRow(patientProvider, isDark),
                  const SizedBox(height: 20),

                  // ── Run Analysis Card ──────────────────────────────────────────
                  _buildRunAnalysisCard(isDark),
                  const SizedBox(height: 20),

                  // ── Analysis Progress ──────────────────────────────────────────
                  if (_isAnalyzing) ...[
                    _buildAnalysisProgress(isDark),
                    const SizedBox(height: 20),
                  ],

                  // ── Analysis Results ───────────────────────────────────────────
                  if (_analysisResult != null) ...[
                    _buildAnalysisResults(_analysisResult!, isDark),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // ─── Stats Row ───────────────────────────────────────────────────────────────

  Widget _buildStatsRow(PatientProvider provider, bool isDark) {
    final eventTypes = <String, int>{};
    for (final e in provider.events) {
      final t = e.eventType;
      eventTypes[t] = (eventTypes[t] ?? 0) + 1;
    }

    return Row(
      children: [
        _statChip('📄', '${provider.records.length}', 'Records', isDark),
        const SizedBox(width: 8),
        _statChip('🔬', '${eventTypes['laboratory'] ?? 0}', 'Labs', isDark),
        const SizedBox(width: 8),
        _statChip('🩺', '${eventTypes['diagnosis'] ?? 0}', 'Diagnoses', isDark),
        const SizedBox(width: 8),
        _statChip('💊', '${eventTypes['medication'] ?? 0}', 'Meds', isDark),
      ],
    );
  }

  Widget _statChip(String emoji, String count, String label, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 4),
            Text(
              count,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Run Analysis Card ────────────────────────────────────────────────────────

  Widget _buildRunAnalysisCard(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primaryBlue.withValues(alpha: 0.15),
            AppColors.cyanAccent.withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _isAnalyzing ? _pulseAnimation.value : 1.0,
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.primaryBlue.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        CupertinoIcons.sparkles,
                        color: AppColors.cyanAccent,
                        size: 24,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Health Pattern Analysis',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    Text(
                      'AI reviews all records and tells you what\'s happening',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: CupertinoButton(
              padding: const EdgeInsets.symmetric(vertical: 14),
              color: _isAnalyzing ? AppColors.primaryBlue.withValues(alpha: 0.5) : AppColors.primaryBlue,
              borderRadius: BorderRadius.circular(16),
              onPressed: _isAnalyzing ? null : _runAnalysis,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_isAnalyzing)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  else
                    const Icon(CupertinoIcons.play_arrow_solid, color: Colors.white, size: 18),
                  const SizedBox(width: 10),
                  Text(
                    _isAnalyzing ? 'Analyzing...' : 'Run Full Analysis',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Analysis Progress ────────────────────────────────────────────────────────

  Widget _buildAnalysisProgress(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _analysisStep,
                style: TextStyle(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              Text(
                '${(_analysisProgress * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                  color: AppColors.cyanAccent,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _analysisProgress,
              backgroundColor: AppColors.primaryBlue.withValues(alpha: 0.15),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.cyanAccent),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }

  // ─── Analysis Results ─────────────────────────────────────────────────────────

  Widget _buildAnalysisResults(Map<String, dynamic> result, bool isDark) {
    final summary = result['summary'] as String? ?? '';
    final interpretations = result['interpretations'] as List? ?? [];
    final questions = result['questionsForReview'] as List? ?? [];
    final missing = result['missingInformation'] as List? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Summary
        _sectionHeader('📋 Summary', isDark),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
          ),
          child: Text(
            summary,
            style: TextStyle(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              fontSize: 14,
              height: 1.5,
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Interpretations
        if (interpretations.isNotEmpty) ...[
          _sectionHeader('🔍 What Was Found', isDark),
          const SizedBox(height: 8),
          ...interpretations.map((item) => _buildInterpretationCard(item as Map<String, dynamic>, isDark)),
        ],

        const SizedBox(height: 8),

        // Questions for Review
        if (questions.isNotEmpty) ...[
          _sectionHeader('❓ Questions to Discuss with Your Doctor', isDark),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
            ),
            child: Column(
              children: questions.asMap().entries.map((entry) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: AppColors.cyanAccent.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${entry.key + 1}',
                            style: const TextStyle(
                              color: AppColors.cyanAccent,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          entry.value as String,
                          style: TextStyle(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Missing Information
        if (missing.isNotEmpty) ...[
          _sectionHeader('⚠ Missing Information', isDark),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.symptom.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.symptom.withValues(alpha: 0.25)),
            ),
            child: Column(
              children: missing.map((item) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      const Icon(CupertinoIcons.exclamationmark_circle,
                          color: AppColors.symptom, size: 14),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item as String,
                          style: TextStyle(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Disclaimer
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurfaceLight : AppColors.lightSurfaceLight,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(CupertinoIcons.shield_fill, color: AppColors.privacyGreen, size: 16),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'All analysis runs 100% on-device. No data is sent externally. This is not a substitute for professional medical advice.',
                  style: TextStyle(
                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInterpretationCard(Map<String, dynamic> item, bool isDark) {
    final category = item['category'] as String? ?? 'general';
    final color = _categoryColor(category);
    final confidence = item['confidence'] as String? ?? 'medium';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.06),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 40,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['text'] as String? ?? '',
                      style: TextStyle(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _badge(category.toUpperCase(), color),
                        const SizedBox(width: 6),
                        _badge('${confidence.toUpperCase()} CONFIDENCE',
                            confidence == 'high' ? AppColors.privacyGreen : AppColors.procedure),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (item['whatWasDetected'] != null) ...[
            const SizedBox(height: 10),
            Text(
              '🔎 ${item['whatWasDetected']}',
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
          if (item['whatIsTheIssue'] != null) ...[
            const SizedBox(height: 4),
            Text(
              '💡 ${item['whatIsTheIssue']}',
              style: TextStyle(
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, bool isDark) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
      ),
    );
  }

  Widget _badge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w800),
      ),
    );
  }

  Color _categoryColor(String category) {
    switch (category) {
      case 'diagnosis':
        return AppColors.diagnosis;
      case 'laboratory':
        return AppColors.laboratory;
      case 'medication':
        return AppColors.medication;
      case 'symptom':
        return AppColors.symptom;
      default:
        return AppColors.primaryBlue;
    }
  }

  void _showNoDataDialog() {
    showCupertinoDialog(
      context: context,
      builder: (context) => CupertinoAlertDialog(
        title: const Text('No Records Found'),
        content: const Text(
          'Please upload at least one PDF medical report in the Records tab before running analysis.',
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('OK'),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}
