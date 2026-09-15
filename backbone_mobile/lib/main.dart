import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:backbone_mobile/providers/patient_provider.dart';
import 'package:backbone_mobile/providers/theme_provider.dart';
import 'package:backbone_mobile/services/local_ai_service.dart';
import 'package:backbone_mobile/services/model_manager_service.dart';
import 'package:backbone_mobile/screens/home_screen.dart';
import 'package:backbone_mobile/core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BackboneApp());
}

class BackboneApp extends StatefulWidget {
  const BackboneApp({super.key});

  @override
  State<BackboneApp> createState() => _BackboneAppState();
}

class _BackboneAppState extends State<BackboneApp> with WidgetsBindingObserver {
  final ModelManagerService _modelManager = ModelManagerService();
  final LocalAIService _aiService = LocalAIService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _modelManager.shutdownEngine();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.detached || state == AppLifecycleState.paused) {
      _modelManager.shutdownEngine();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => PatientProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider.value(value: _modelManager),
        Provider<LocalAIService>.value(value: _aiService),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'BACKBONE',
            debugShowCheckedModeBanner: false,

            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            home: const HomeScreen(),
          );
        },
      ),
    );
  }
}
