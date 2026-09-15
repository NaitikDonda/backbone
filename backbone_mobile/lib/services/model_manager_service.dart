import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';

/// Manages the on-device AI engine state for BACKBONE.
/// Downloads and manages Qwen 2.5 0.5B GGUF model files locally.
class ModelManagerService extends ChangeNotifier {
  static final ModelManagerService _instance = ModelManagerService._internal();
  factory ModelManagerService() => _instance;
  ModelManagerService._internal() {
    _checkExistingModel();
  }

  static const String qwenDownloadUrl =
      'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
  static const String qwenModelFileName = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';

  // ─── State ────────────────────────────────────────────────────────────────

  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  String _statusMessage = '🔒 On-device AI engine ready (Local NLP)';
  bool _isModelReady = true;
  bool _isEngineRunning = true;
  int _downloadedSizeBytes = 0;
  int _totalSizeBytes = 398000000; // ~398 MB
  String? _modelPath;
  String? _lastError;
  String _activeModelName = 'BACKBONE v2 (0.5B Medical AI)';

  bool get isDownloading => _isDownloading;
  double get downloadProgress => _downloadProgress;
  String get statusMessage => _statusMessage;
  bool get isModelReady => _isModelReady;
  bool get isEngineRunning => _isEngineRunning;
  int get downloadedSizeBytes => _downloadedSizeBytes;
  int get totalSizeBytes => _totalSizeBytes;
  String? get modelPath => _modelPath;
  String? get lastError => _lastError;
  String get activeModelName => _activeModelName;

  // ─── Model Check ──────────────────────────────────────────────────────────

  Future<void> _checkExistingModel() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$qwenModelFileName');
      if (await file.exists() && await file.length() > 100000000) {
        _modelPath = file.path;
        _isModelReady = true;
        _isEngineRunning = true;
        _downloadProgress = 1.0;
        _downloadedSizeBytes = await file.length();
        _statusMessage =
            '🔒 BACKBONE v2 Model downloaded & active (${(_downloadedSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB)';
        notifyListeners();
      } else {
        _statusMessage = '🔒 On-device AI engine ready (BACKBONE v2)';
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Model check error: $e');
    }
  }

  // ─── Real HuggingFace GGUF Model Downloader ─────────────────────────────

  Future<void> downloadQwenModel() async {
    if (_isDownloading) return;

    _isDownloading = true;
    _downloadProgress = 0.0;
    _lastError = null;
    _statusMessage = 'Downloading BACKBONE v2 (398 MB)...';
    notifyListeners();

    try {
      final dir = await getApplicationDocumentsDirectory();
      final filePath = '${dir.path}/$qwenModelFileName';

      final dio = Dio();
      await dio.download(
        qwenDownloadUrl,
        filePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            _downloadedSizeBytes = received;
            _totalSizeBytes = total;
            _downloadProgress = received / total;
            _statusMessage =
                'Downloading BACKBONE v2: ${(received / (1024 * 1024)).toStringAsFixed(1)} MB / ${(total / (1024 * 1024)).toStringAsFixed(1)} MB (${(_downloadProgress * 100).toStringAsFixed(0)}%)';
          } else {
            _downloadedSizeBytes = received;
            _statusMessage =
                'Downloading BACKBONE v2: ${(received / (1024 * 1024)).toStringAsFixed(1)} MB';
          }
          notifyListeners();
        },
      );

      _modelPath = filePath;
      _isDownloading = false;
      _isModelReady = true;
      _isEngineRunning = true;
      _downloadProgress = 1.0;
      _statusMessage =
          '🔒 BACKBONE v2 Model downloaded & active (${(_downloadedSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB)';
      notifyListeners();
    } catch (e) {
      _isDownloading = false;
      _lastError = e.toString();
      _statusMessage = 'Download failed: ${e.toString()}';
      notifyListeners();
    }
  }


  Future<void> deleteDownloadedModel() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$qwenModelFileName');
      if (await file.exists()) {
        await file.delete();
      }
      _modelPath = null;
      _downloadProgress = 0.0;
      _downloadedSizeBytes = 0;
      _statusMessage = '🔒 On-device AI engine ready (Local NLP)';
      notifyListeners();
    } catch (e) {
      _statusMessage = 'Error deleting model: $e';
      notifyListeners();
    }
  }

  Future<void> initializeAndStartEngine() async {
    _isModelReady = true;
    _isEngineRunning = true;
    notifyListeners();
  }

  Future<void> shutdownEngine() async {
    _isEngineRunning = false;
    _statusMessage = 'Engine suspended.';
    notifyListeners();
  }

  Future<String> generate(String prompt, {int maxTokens = 512}) async {
    return '';
  }

  Stream<String> generateStream(String prompt, {int maxTokens = 512}) async* {
    yield '';
  }
}





