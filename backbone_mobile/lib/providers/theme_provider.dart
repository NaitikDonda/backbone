import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  ThemeMode get themeMode => _themeMode;

  ThemeProvider() {
    _loadThemeFromPrefs();
  }

  Future<void> _loadThemeFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final savedMode = prefs.getString('theme_mode');
    if (savedMode == 'light') {
      _themeMode = ThemeMode.light;
    } else if (savedMode == 'dark') {
      _themeMode = ThemeMode.dark;
    } else {
      _themeMode = ThemeMode.system;
    }
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    if (_themeMode == ThemeMode.dark) {
      _themeMode = ThemeMode.light;
    } else if (_themeMode == ThemeMode.light) {
      _themeMode = ThemeMode.system;
    } else {
      _themeMode = ThemeMode.dark;
    }

    final prefs = await SharedPreferences.getInstance();
    if (_themeMode == ThemeMode.light) {
      await prefs.setString('theme_mode', 'light');
    } else if (_themeMode == ThemeMode.dark) {
      await prefs.setString('theme_mode', 'dark');
    } else {
      await prefs.remove('theme_mode');
    }

    notifyListeners();
  }

  Future<void> setSystemTheme() async {
    _themeMode = ThemeMode.system;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('theme_mode');
    notifyListeners();
  }
}