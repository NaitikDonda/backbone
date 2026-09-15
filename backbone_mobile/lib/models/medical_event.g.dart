// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'medical_event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MedicalEvent _$MedicalEventFromJson(Map<String, dynamic> json) => MedicalEvent(
  id: json['id'] as String,
  patientId: json['patientId'] as String,
  eventType: json['eventType'] as String,
  title: json['title'] as String,
  description: json['description'] as String?,
  date: json['date'] == null ? null : DateTime.parse(json['date'] as String),
  endDate: json['endDate'] == null
      ? null
      : DateTime.parse(json['endDate'] as String),
  status: json['status'] as String?,
  severity: json['severity'] as String?,
  sourceRecordId: json['sourceRecordId'] as String,
  sourceDocumentName: json['sourceDocumentName'] as String,
  sourceText: json['sourceText'] as String?,
  metadata: json['metadata'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$MedicalEventToJson(MedicalEvent instance) =>
    <String, dynamic>{
      'id': instance.id,
      'patientId': instance.patientId,
      'eventType': instance.eventType,
      'title': instance.title,
      'description': instance.description,
      'date': instance.date?.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'status': instance.status,
      'severity': instance.severity,
      'sourceRecordId': instance.sourceRecordId,
      'sourceDocumentName': instance.sourceDocumentName,
      'sourceText': instance.sourceText,
      'metadata': instance.metadata,
    };
