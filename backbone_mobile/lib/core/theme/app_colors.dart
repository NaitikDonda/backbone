import 'package:flutter/material.dart';

class AppColors {
  // Dark Backgrounds
  static const Color darkBackground = Color(0xFF0B0F19);
  static const Color darkSurface = Color(0xFF141A29);
  static const Color darkSurfaceLight = Color(0xFF1E2638);
  static const Color darkCardBorder = Color(0xFF2A344A);

  // Light Backgrounds
  static const Color lightBackground = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceLight = Color(0xFFF1F5F9);
  static const Color lightCardBorder = Color(0xFFE2E8F0);

  // Brand Accents
  static const Color primaryBlue = Color(0xFF2979FF);
  static const Color primaryBlueGlow = Color(0x332979FF);
  static const Color cyanAccent = Color(0xFF00B0FF);
  static const Color privacyGreen = Color(0xFF00C853);
  static const Color privacyGreenGlow = Color(0x3300E676);

  // Medical Category Colors
  static const Color symptom = Color(0xFFFF9100);
  static const Color diagnosis = Color(0xFFFF1744);
  static const Color laboratory = Color(0xFFD500F9);
  static const Color medication = Color(0xFF00C853);
  static const Color procedure = Color(0xFFFFC400);

  // Text Colors (Dark Mode)
  static const Color darkTextPrimary = Color(0xFFF1F5F9);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextMuted = Color(0xFF64748B);

  // Text Colors (Light Mode)
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF475569);
  static const Color lightTextMuted = Color(0xFF94A3B8);

  // Glassmorphism overlays
  static const Color glassBorder = Color(0x33FFFFFF);

  // Backward compatibility static fields
  static const Color background = darkBackground;
  static const Color surface = darkSurface;
  static const Color surfaceLight = darkSurfaceLight;
  static const Color cardBorder = darkCardBorder;
  static const Color textPrimary = darkTextPrimary;
  static const Color textSecondary = darkTextSecondary;
  static const Color textMuted = darkTextMuted;
}
