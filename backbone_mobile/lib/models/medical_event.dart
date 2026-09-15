import 'package:json_annotation/json_annotation.dart';

part 'medical_event.g.dart';

@JsonSerializable()
class MedicalEvent {
  final String id;
  final String patientId;
  final String eventType;
  final String title;
  final String? description;
  final DateTime? date;
  final DateTime? endDate;
  final String? status;
  final String? severity;
  final String sourceRecordId;
  final String sourceDocumentName;
  final String? sourceText;
  final Map<String, dynamic>? metadata;

  MedicalEvent({
    required this.id,
    required this.patientId,
    required this.eventType,
    required this.title,
    this.description,
    this.date,
    this.endDate,
    this.status,
    this.severity,
    required this.sourceRecordId,
    required this.sourceDocumentName,
    this.sourceText,
    this.metadata,
  });

  factory MedicalEvent.fromJson(Map<String, dynamic> json) =>
      _$MedicalEventFromJson(json);

  Map<String, dynamic> toJson() => _$MedicalEventToJson(this);
}