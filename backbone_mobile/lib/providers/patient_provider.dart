import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import '../models/medical_record.dart';
import '../models/medical_event.dart';

class PatientProvider with ChangeNotifier {
  List<MedicalRecord> _records = [];
  List<MedicalEvent> _events = [];
  String? _currentPatientId;
  bool _isLoading = false;
  String? _error;

  List<MedicalRecord> get records => _records;
  List<MedicalEvent> get events => _events;
  String? get currentPatientId => _currentPatientId;
  bool get isLoading => _isLoading;
  String? get error => _error;

  PatientProvider() {
    _initialize();
  }

  Future<void> _initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _currentPatientId = prefs.getString('current_patient_id');
    if (_currentPatientId == null) {
      _currentPatientId = DateTime.now().millisecondsSinceEpoch.toString();
      await prefs.setString('current_patient_id', _currentPatientId!);
    }
    await loadRecords();
    await loadEvents();
  }

  Future<void> loadRecords() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final db = await _getDatabase();
      final List<Map<String, dynamic>> maps = await db.query('medical_records');
      _records = maps.map((map) => MedicalRecord.fromJson(map)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadEvents() async {
    try {
      final db = await _getDatabase();
      final List<Map<String, dynamic>> maps = await db.query('medical_events');
      _events = maps.map((map) => MedicalEvent.fromJson(map)).toList();
    } catch (e) {
      _error = e.toString();
    }
  }


  Future<Database> _getDatabase() async {
    final directory = await getApplicationDocumentsDirectory();
    final dbPath = join(directory.path, 'backbone.db');
    return openDatabase(
      dbPath,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE medical_records(
            id TEXT PRIMARY KEY,
            patientId TEXT NOT NULL,
            filename TEXT NOT NULL,
            documentType TEXT NOT NULL,
            fileType TEXT NOT NULL,
            fileSize INTEGER NOT NULL,
            uploadedAt TEXT NOT NULL,
            recordDate TEXT,
            processingStatus TEXT NOT NULL,
            processingError TEXT,
            extractedText TEXT,
            structuredExtraction TEXT,
            metadata TEXT,
            description TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE medical_events(
            id TEXT PRIMARY KEY,
            patientId TEXT NOT NULL,
            eventType TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT,
            endDate TEXT,
            status TEXT,
            severity TEXT,
            sourceRecordId TEXT NOT NULL,
            sourceDocumentName TEXT NOT NULL,
            sourceText TEXT,
            metadata TEXT
          )
        ''');
      },
    );
  }

  Future<void> addRecord(MedicalRecord record) async {
    _isLoading = true;
    notifyListeners();

    try {
      final db = await _getDatabase();
      final map = record.toJson();
      // Ensure all Map values are converted to valid SQLite types (num, String, Uint8List)
      final sqlMap = <String, dynamic>{};
      map.forEach((key, value) {
        if (value == null) {
          sqlMap[key] = null;
        } else if (value is Map || value is List) {
          sqlMap[key] = value.toString();
        } else {
          sqlMap[key] = value;
        }
      });

      await db.insert(
        'medical_records',
        sqlMap,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _records.removeWhere((r) => r.id == record.id);
      _records.add(record);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteRecord(String recordId) async {
    try {
      final db = await _getDatabase();
      await db.delete('medical_records', where: 'id = ?', whereArgs: [recordId]);
      _records.removeWhere((r) => r.id == recordId);
      await db.delete('medical_events', where: 'sourceRecordId = ?', whereArgs: [recordId]);
      _events.removeWhere((e) => e.sourceRecordId == recordId);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      notifyListeners();
    }
  }

  Future<void> deleteAllRecords() async {
    try {
      final db = await _getDatabase();
      await db.delete('medical_records');
      await db.delete('medical_events');
      _records.clear();
      _events.clear();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      notifyListeners();
    }
  }

  Future<void> addEvents(List<MedicalEvent> events) async {
    try {
      final db = await _getDatabase();
      final batch = db.batch();
      for (final event in events) {
        final map = event.toJson();
        final sqlMap = <String, dynamic>{};
        map.forEach((key, value) {
          if (value == null) {
            sqlMap[key] = null;
          } else if (value is Map || value is List) {
            sqlMap[key] = value.toString();
          } else {
            sqlMap[key] = value;
          }
        });
        batch.insert('medical_events', sqlMap, conflictAlgorithm: ConflictAlgorithm.replace);
      }
      await batch.commit();
      _events.addAll(events);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      notifyListeners();
    }
  }

  int _chatResetSignal = 0;
  int get chatResetSignal => _chatResetSignal;

  void clearChatHistory() {
    _chatResetSignal++;
    notifyListeners();
  }

  Future<void> deleteAllRecordsAndChat() async {
    await deleteAllRecords();
    _chatResetSignal++;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
