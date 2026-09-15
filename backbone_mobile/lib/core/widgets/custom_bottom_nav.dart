import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import '../theme/app_colors.dart';

class CustomBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const CustomBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  static const _tabs = [
    _NavTab(CupertinoIcons.house_fill, CupertinoIcons.house, 'Home'),
    _NavTab(CupertinoIcons.doc_text_fill, CupertinoIcons.doc_text, 'Records'),
    _NavTab(CupertinoIcons.sparkles, CupertinoIcons.sparkles, 'Insights'),
    _NavTab(CupertinoIcons.chart_bar_square_fill, CupertinoIcons.chart_bar_square, 'Journey'),
    _NavTab(CupertinoIcons.chat_bubble_2_fill, CupertinoIcons.chat_bubble_2, 'Chat'),
    _NavTab(CupertinoIcons.gear_alt_fill, CupertinoIcons.gear_alt, 'Settings'),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 20),
      height: 62,
      decoration: BoxDecoration(
        color: isDark
            ? AppColors.darkSurface.withValues(alpha: 0.95)
            : AppColors.lightSurface.withValues(alpha: 0.97),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: isDark
              ? AppColors.glassBorder.withValues(alpha: 0.15)
              : AppColors.lightCardBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.1),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(
          _tabs.length,
          (index) => _buildNavItem(index, isDark),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, bool isDark) {
    final tab = _tabs[index];
    final isSelected = currentIndex == index;

    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(index),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          margin: const EdgeInsets.symmetric(horizontal: 3, vertical: 8),
          padding: isSelected
              ? const EdgeInsets.symmetric(horizontal: 8, vertical: 5)
              : const EdgeInsets.symmetric(horizontal: 4, vertical: 5),
          decoration: isSelected
              ? BoxDecoration(
                  color: AppColors.primaryBlue.withValues(alpha: isDark ? 0.22 : 0.12),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: AppColors.primaryBlue.withValues(alpha: 0.4),
                    width: 1,
                  ),
                )
              : null,
          child: isSelected
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(tab.activeIcon, color: AppColors.primaryBlue, size: 18),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        tab.label,
                        style: TextStyle(
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      tab.inactiveIcon,
                      color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                      size: 20,
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _NavTab {
  final IconData activeIcon;
  final IconData inactiveIcon;
  final String label;

  const _NavTab(this.activeIcon, this.inactiveIcon, this.label);
}
