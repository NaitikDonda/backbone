import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:backbone_mobile/providers/patient_provider.dart';
import 'package:backbone_mobile/services/model_manager_service.dart';
import 'package:backbone_mobile/core/theme/app_colors.dart';
import 'package:backbone_mobile/providers/theme_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProvider = Provider.of<ThemeProvider>(context);
    final modelManager = Provider.of<ModelManagerService>(context);

    return Consumer<PatientProvider>(
      builder: (context, patientProvider, child) {
        return Scaffold(
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            title: Text(
              'Settings',
              style: TextStyle(color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
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
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
              children: [
                // ── On-Device AI Model Section ──────────────────────────────────
                _sectionHeader('On-Device AI Engine', isDark),
                const SizedBox(height: 8),
                _buildModelStatusCard(modelManager, isDark, context),
                const SizedBox(height: 20),

                // ── Data Management Section ─────────────────────────────────────
                _sectionHeader('Data Management', isDark),
                const SizedBox(height: 8),
                _buildDataCard(patientProvider, isDark, context),
                const SizedBox(height: 20),

                // ── Privacy Section ─────────────────────────────────────────────
                _sectionHeader('Privacy & Security', isDark),
                const SizedBox(height: 8),
                _buildPrivacyCard(isDark),
                const SizedBox(height: 20),

                // ── About ───────────────────────────────────────────────────────
                _sectionHeader('About', isDark),
                const SizedBox(height: 8),
                _buildAboutCard(isDark),
              ],
            ),
          ),
        );
      },
    );
  }

  // ─── Model Status Card ────────────────────────────────────────────────────

  Widget _buildModelStatusCard(
    ModelManagerService modelManager,
    bool isDark,
    BuildContext context,
  ) {
    final isDownloaded = modelManager.modelPath != null;
    final isDownloading = modelManager.isDownloading;

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
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isDownloaded ? AppColors.privacyGreen : AppColors.primaryBlue)
                      .withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isDownloaded
                      ? CupertinoIcons.checkmark_shield_fill
                      : CupertinoIcons.cloud_download_fill,
                  color: isDownloaded ? AppColors.privacyGreen : AppColors.primaryBlue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'BACKBONE v2 (0.5B Medical AI)',
                      style: TextStyle(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      isDownloaded
                          ? '⚡ Q4_K_M GGUF (398 MB) Downloaded'
                          : isDownloading
                              ? 'Downloading from HuggingFace...'
                              : 'Recommended Mobile AI Model',
                      style: TextStyle(
                        color: isDownloaded
                            ? AppColors.privacyGreen
                            : isDark
                                ? AppColors.darkTextMuted
                                : AppColors.lightTextMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          if (isDownloading) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: modelManager.downloadProgress > 0 ? modelManager.downloadProgress : null,
                backgroundColor: isDark ? AppColors.darkSurfaceLight : AppColors.lightSurfaceLight,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryBlue),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 10),
          ],

          // Status message
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurfaceLight : AppColors.lightSurfaceLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              modelManager.statusMessage,
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                fontSize: 12,
                fontFamily: 'monospace',
              ),
            ),
          ),

          const SizedBox(height: 14),

          // Download / Action Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: isDownloaded
                    ? (isDark ? AppColors.darkSurfaceLight : AppColors.lightSurfaceLight)
                    : AppColors.primaryBlue,
                foregroundColor: isDownloaded
                    ? (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary)
                    : Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: isDownloading
                  ? null
                  : () {
                      if (isDownloaded) {
                        modelManager.deleteDownloadedModel();
                      } else {
                        modelManager.downloadQwenModel();
                      }
                    },
              icon: Icon(
                isDownloaded
                    ? CupertinoIcons.trash
                    : isDownloading
                        ? CupertinoIcons.arrow_2_circlepath
                        : CupertinoIcons.arrow_down_circle_fill,
                size: 18,
              ),
              label: Text(
                isDownloaded
                    ? 'Delete BACKBONE v2 Model'
                    : isDownloading
                        ? 'Downloading...'
                        : 'Download BACKBONE v2 Model (398 MB)',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Model info chips
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _infoChip('BACKBONE v2', AppColors.primaryBlue, isDark),
              _infoChip('0.5B Medical AI', AppColors.cyanAccent, isDark),
              _infoChip('Q4_K_M GGUF', AppColors.laboratory, isDark),
              _infoChip('398 MB Size', AppColors.privacyGreen, isDark),
            ],
          ),
        ],
      ),
    );
  }


  Widget _infoChip(String label, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700),
      ),
    );
  }

  // ─── Data Management ──────────────────────────────────────────────────────

  Widget _buildDataCard(
    PatientProvider patientProvider,
    bool isDark,
    BuildContext context,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
      ),
      child: Column(
        children: [
          _listTile(
            CupertinoIcons.chat_bubble_2_fill,
            'Reset Chat History',
            'Clear AI assistant conversation messages',
            isDark,
            trailing: IconButton(
              icon: const Icon(CupertinoIcons.arrow_counterclockwise, color: AppColors.cyanAccent, size: 20),
              onPressed: () => _showResetChatDialog(patientProvider, context),
            ),
          ),
          Divider(height: 1, color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
          _listTile(
            CupertinoIcons.doc_fill,
            'Medical Documents',
            '${patientProvider.records.length} stored locally',
            isDark,
          ),
          Divider(height: 1, color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
          _listTile(
            CupertinoIcons.bolt_horizontal_circle_fill,
            'Timeline Events',
            '${patientProvider.events.length} parsed events',
            isDark,
          ),
          Divider(height: 1, color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
          _listTile(
            CupertinoIcons.trash_fill,
            'Purge All Records & Chat',
            'Delete all local documents, events & chat history',
            isDark,
            trailing: IconButton(
              icon: const Icon(CupertinoIcons.trash, color: AppColors.diagnosis, size: 20),
              onPressed: () => _showDeleteAllDialog(patientProvider, context),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Privacy Card ─────────────────────────────────────────────────────────

  Widget _buildPrivacyCard(bool isDark) {
    final points = [
      ('🔒', 'Zero telemetry', 'No analytics or tracking'),
      ('📵', 'No API calls', 'AI runs 100% on your iPhone'),
      ('💾', 'Local storage only', 'Records stored in sandboxed app directory'),
      ('🚫', 'No account needed', 'No sign-in, no cloud sync'),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
      ),
      child: Column(
        children: points.map((p) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              children: [
                Text(p.$1, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.$2,
                        style: TextStyle(
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        p.$3,
                        style: TextStyle(
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  // ─── About Card ───────────────────────────────────────────────────────────

  Widget _buildAboutCard(bool isDark) {
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primaryBlue, AppColors.cyanAccent],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(CupertinoIcons.waveform_path_ecg, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'BACKBONE Mobile',
                    style: TextStyle(
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                  Text(
                    'Version 1.0.0 • On-Device AI',
                    style: TextStyle(
                      color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            'BACKBONE uses llama.cpp with Metal GPU acceleration to run a local '
            'Llama 3.2 model directly on your iPhone. Your medical records, '
            'diagnoses, and lab results never leave your device.',
            style: TextStyle(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              fontSize: 12,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  Widget _sectionHeader(String title, bool isDark) {
    return Text(
      title.toUpperCase(),
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
        letterSpacing: 0.8,
      ),
    );
  }

  Widget _listTile(
    IconData icon,
    String title,
    String subtitle,
    bool isDark, {
    Widget? trailing,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primaryBlue, size: 20),
      title: Text(
        title,
        style: TextStyle(
          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
          fontSize: 12,
        ),
      ),
      trailing: trailing,
    );
  }

  void _showResetChatDialog(PatientProvider patientProvider, BuildContext context) {
    showCupertinoDialog(
      context: context,
      builder: (dialogContext) => CupertinoAlertDialog(
        title: const Text('Reset Chat History'),
        content: const Text(
          'This will clear all previous conversation messages with the AI assistant.',
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(dialogContext),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Reset Chat'),
            onPressed: () {
              Navigator.pop(dialogContext);
              patientProvider.clearChatHistory();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Chat history reset successfully'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showDeleteAllDialog(PatientProvider patientProvider, BuildContext context) {
    showCupertinoDialog(
      context: context,
      builder: (dialogContext) => CupertinoAlertDialog(
        title: const Text('Purge All Records & Chat'),
        content: const Text(
          'This will permanently delete all medical documents, timeline events, and chat history from your device. Cannot be undone.',
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(dialogContext),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Purge All'),
            onPressed: () {
              Navigator.pop(dialogContext);
              patientProvider.deleteAllRecordsAndChat();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All local records and chat history purged'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}