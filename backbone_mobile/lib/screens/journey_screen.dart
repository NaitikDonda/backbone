import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:backbone_mobile/providers/patient_provider.dart';
import 'package:backbone_mobile/core/theme/app_colors.dart';

class JourneyScreen extends StatefulWidget {
  const JourneyScreen({super.key});

  @override
  State<JourneyScreen> createState() => _JourneyScreenState();
}

class _JourneyScreenState extends State<JourneyScreen> {
  String _selectedCategory = 'all';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<PatientProvider>(
      builder: (context, patientProvider, child) {
        final events = patientProvider.events;
        final filteredEvents = _selectedCategory == 'all'
            ? events
            : events.where((e) => e.eventType == _selectedCategory).toList();

        return Scaffold(
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            title: Text(
              'Health Journey',
              style: TextStyle(color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(48),
              child: _buildCategoryFilterBar(isDark),
            ),
          ),
          body: RefreshIndicator(
            color: AppColors.cyanAccent,
            backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            onRefresh: () async {
              await patientProvider.loadEvents();
            },
            child: filteredEvents.isEmpty
                ? SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(
                      height: MediaQuery.of(context).size.height * 0.7,
                      child: _buildEmptyState(isDark),
                    ),
                  )
                : _buildTimeline(filteredEvents, isDark),
          ),
        );
      },
    );
  }

  Widget _buildCategoryFilterBar(bool isDark) {
    final categories = [
      {'key': 'all', 'label': 'All'},
      {'key': 'diagnosis', 'label': 'Diagnoses'},
      {'key': 'medication', 'label': 'Meds'},
      {'key': 'symptom', 'label': 'Symptoms'},
      {'key': 'laboratory', 'label': 'Labs'},
    ];

    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final cat = categories[index];
          final isSelected = _selectedCategory == cat['key'];
          return ChoiceChip(
            label: Text(cat['label']!),
            selected: isSelected,
            selectedColor: AppColors.primaryBlue,
            backgroundColor: isDark ? AppColors.darkSurfaceLight : AppColors.lightSurfaceLight,
            labelStyle: TextStyle(
              color: isSelected ? Colors.white : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
            side: BorderSide(
              color: isSelected ? AppColors.cyanAccent : (isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
            ),
            onSelected: (selected) {
              if (selected) {
                setState(() {
                  _selectedCategory = cat['key']!;
                });
              }
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                shape: BoxShape.circle,
                border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
              ),
              child: const Icon(
                CupertinoIcons.chart_bar_square_fill,
                size: 64,
                color: AppColors.primaryBlue,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No Timeline Events Available',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Upload medical records to populate your interactive patient journey stream.',
              style: TextStyle(
                fontSize: 14,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeline(List events, bool isDark) {
    final datedEvents = events.toList();
    datedEvents.sort((a, b) {
      if (a.date == null) return 1;
      if (b.date == null) return -1;
      return b.date!.compareTo(a.date!);
    });

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
      itemCount: datedEvents.length,
      itemBuilder: (context, index) {
        final event = datedEvents[index];
        return _buildTimelineItem(event, isDark);
      },
    );
  }

  Widget _buildTimelineItem(dynamic event, bool isDark) {
    final color = _getEventTypeColor(event.eventType);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 4,
            height: 48,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
              boxShadow: [
                BoxShadow(color: color.withValues(alpha: 0.5), blurRadius: 8),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        event.title,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        event.eventType.toUpperCase(),
                        style: TextStyle(
                          color: color,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                if (event.description != null && event.description!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    event.description!,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(CupertinoIcons.clock, size: 12, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                    const SizedBox(width: 4),
                    Text(
                      _formatDate(event.date),
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getEventTypeColor(String type) {
    switch (type) {
      case 'symptom':
        return AppColors.symptom;
      case 'diagnosis':
        return AppColors.diagnosis;
      case 'laboratory':
        return AppColors.laboratory;
      case 'medication':
        return AppColors.medication;
      case 'procedure':
        return AppColors.procedure;
      default:
        return AppColors.primaryBlue;
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Date undocumented';
    return '${date.day} ${_getMonthAbbreviation(date.month)} ${date.year}';
  }

  String _getMonthAbbreviation(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }
}
