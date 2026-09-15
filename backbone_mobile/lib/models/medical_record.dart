import 'package:json_annotation/json_annotation.dart';

part 'medical_record.g.dart';

@JsonSerializable()
class MedicalRecord {
  final String id;
  final String patientId;
  final String filename;
  final String documentType;
  final String fileType;
  final int fileSize;
  final DateTime uploadedAt;
  final DateTime? recordDate;
  final String processingStatus;
  final String? processingError;
  final String? extractedText;
  final Map<String, dynamic>? structuredExtraction;
  final Map<String, dynamic>? metadata;
  final String? description;

  MedicalRecord({
    required this.id,
    required this.patientId,
    required this.filename,
    required this.documentType,
    required this.fileType,
    required this.fileSize,
    required this.uploadedAt,
    this.recordDate,
    required this.processingStatus,
    this.processingError,
    this.extractedText,
    this.structuredExtraction,
    this.metadata,
    this.description,
  });

  factory MedicalRecord.fromJson(Map<String, dynamic> json) =>
      _$MedicalRecordFromJson(json);

  Map<String, dynamic> toJson() => _$MedicalRecordToJson(this);
}