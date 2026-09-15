import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:backbone_mobile/providers/patient_provider.dart';
import 'package:backbone_mobile/services/model_manager_service.dart';
import 'package:backbone_mobile/core/theme/app_colors.dart';
import 'package:backbone_mobile/core/widgets/custom_bottom_nav.dart';
import 'package:backbone_mobile/screens/records_screen.dart';
import 'package:backbone_mobile/screens/journey_screen.dart';
import 'package:backbone_mobile/screens/chat_screen.dart';
import 'package:backbone_mobile/screens/insights_screen.dart';
import 'package:backbone_mobile/screens/settings_screen.dart';
import 'package:backbone_mobile/providers/theme_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomeDashboardTab(),
    const RecordsScreen(),
    const InsightsScreen(),
    const JourneyScreen(),
    const ChatScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }
}

// ─── Home Dashboard Tab ───────────────────────────────────────────────────────

class HomeDashboardTab extends StatelessWidget {
  const HomeDashboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    final modelManager = Provider.of<ModelManagerService>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<PatientProvider>(
      builder: (context, patientProvider, child) {
        final records = patientProvider.records;
        final events = patientProvider.events;

        return Scaffold(
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          body: SafeArea(
            child: RefreshIndicator(
              color: AppColors.cyanAccent,
              backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              onRefresh: () async {
                await patientProvider.loadRecords();
                await patientProvider.loadEvents();
              },
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                slivers: [
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _buildHeader(context, themeProvider, isDark),
                        const SizedBox(height: 16),
                        _buildModelStatusBanner(modelManager, isDark),
                        const SizedBox(height: 20),
                        _buildQuickStats(records, events, isDark),
                        const SizedBox(height: 20),
                        _buildActionGrid(context, isDark),
                        const SizedBox(height: 24),
                        _buildHealthJourneySection(events, isDark),
                        const SizedBox(height: 40),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, ThemeProvider themeProvider, bool isDark) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.privacyGreen,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'BACKBONE MOBILE',
                    style: TextStyle(
                      color: AppColors.cyanAccent,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.1,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Patient Dashboard',
                style: TextStyle(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        IconButton(
          icon: Icon(
            isDark ? CupertinoIcons.sun_max_fill : CupertinoIcons.moon_fill,
            color: isDark ? CupertinoColors.systemYellow : AppColors.primaryBlue,
            size: 22,
          ),
          onPressed: () => themeProvider.toggleTheme(),
        ),
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurfaceLight : AppColors.lightSurfaceLight,
            shape: BoxShape.circle,
            border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
          ),
          child: Icon(
            CupertinoIcons.person_crop_circle,
            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            size: 22,
          ),
        ),
      ],
    );
  }

  Widget _buildModelStatusBanner(ModelManagerService modelManager, bool isDark) {
    if (modelManager.isDownloading) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.primaryBlue.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Downloading Local AI Model',
                    style: TextStyle(
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  '${(modelManager.downloadProgress * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(color: AppColors.cyanAccent, fontWeight: FontWeight.w800, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: modelManager.downloadProgress,
                backgroundColor: AppColors.primaryBlue.withValues(alpha: 0.2),
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.cyanAccent),
                minHeight: 4,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              modelManager.statusMessage,
              style: TextStyle(
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                fontSize: 11,
              ),
            ),
          ],
        ),
      );
    }

    final isReady = modelManager.isModelReady || modelManager.isEngineRunning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isReady
            ? AppColors.privacyGreen.withValues(alpha: 0.1)
            : AppColors.symptom.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isReady
              ? AppColors.privacyGreen.withValues(alpha: 0.3)
              : AppColors.symptom.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isReady ? AppColors.privacyGreen : AppColors.symptom,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isReady ? '🔒 On-device AI ready — no data leaves your phone' : modelManager.statusMessage,
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats(List records, List events, bool isDark) {
    final diagCount = events.where((e) => e.eventType == 'diagnosis').length;
    final labCount = events.where((e) => e.eventType == 'laboratory').length;

    return Row(
      children: [
        _statCard('${records.length}', 'Records', CupertinoIcons.doc_text_fill, AppColors.primaryBlue, isDark),
        const SizedBox(width: 10),
        _statCard('${events.length}', 'Events', CupertinoIcons.bolt_fill, AppColors.cyanAccent, isDark),
        const SizedBox(width: 10),
        _statCard('$diagCount', 'Diagnoses', CupertinoIcons.heart_fill, AppColors.diagnosis, isDark),
        const SizedBox(width: 10),
        _statCard('$labCount', 'Labs', CupertinoIcons.waveform_path_ecg, AppColors.laboratory, isDark),
      ],
    );
  }

  Widget _statCard(String value, String label, IconData icon, Color color, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionGrid(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Actions',
            style: TextStyle(
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  'Upload Record',
                  CupertinoIcons.arrow_up_doc_fill,
                  AppColors.primaryBlue,
                  isDark,
                  () {},
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildActionButton(
                  'Run Analysis',
                  CupertinoIcons.sparkles,
                  AppColors.cyanAccent,
                  isDark,
                  () {},
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildActionButton(
                  'AI Chat',
                  CupertinoIcons.chat_bubble_text_fill,
                  AppColors.privacyGreen,
                  isDark,
                  () {},
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, bool isDark, VoidCallback onTap) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurfaceLight : AppColors.lightSurfaceLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              fontWeight: FontWeight.w600,
              fontSize: 11,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildHealthJourneySection(List events, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Health Timeline Overview',
          style: TextStyle(
            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        events.isEmpty
            ? Container(
                padding: const EdgeInsets.all(20),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
                ),
                child: Column(
                  children: [
                    Icon(CupertinoIcons.doc_plaintext,
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted, size: 32),
                    const SizedBox(height: 8),
                    Text(
                      'No timeline events yet.',
                      style: TextStyle(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Upload PDF medical reports to automatically build your timeline.',
                      style: TextStyle(
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        fontSize: 11,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              )
            : Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
                ),
                child: Column(
                  children: events.take(5).map((event) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: _getEventTypeColor(event.eventType),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  event.title,
                                  style: TextStyle(
                                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (event.description != null)
                                  Text(
                                    event.description!,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                      fontSize: 11,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Text(
                            event.date != null
                                ? '${event.date!.day}/${event.date!.month}/${event.date!.year}'
                                : '',
                            style: TextStyle(
                              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
      ],
    );
  }

  Color _getEventTypeColor(String type) {
    switch (type) {
      case 'symptom': return AppColors.symptom;
      case 'diagnosis': return AppColors.diagnosis;
      case 'laboratory': return AppColors.laboratory;
      case 'medication': return AppColors.medication;
      case 'procedure': return AppColors.procedure;
      default: return AppColors.primaryBlue;
    }
  }
}
