// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'medical_record.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MedicalRecord _$MedicalRecordFromJson(Map<String, dynamic> json) =>
    MedicalRecord(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      filename: json['filename'] as String,
      documentType: json['documentType'] as String,
      fileType: json['fileType'] as String,
      fileSize: (json['fileSize'] as num).toInt(),
      uploadedAt: DateTime.parse(json['uploadedAt'] as String),
      recordDate: json['recordDate'] == null
          ? null
          : DateTime.parse(json['recordDate'] as String),
      processingStatus: json['processingStatus'] as String,
      processingError: json['processingError'] as String?,
      extractedText: json['extractedText'] as String?,
      structuredExtraction:
          json['structuredExtraction'] as Map<String, dynamic>?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      description: json['description'] as String?,
    );

Map<String, dynamic> _$MedicalRecordToJson(MedicalRecord instance) =>
    <String, dynamic>{
      'id': instance.id,
      'patientId': instance.patientId,
      'filename': instance.filename,
      'documentType': instance.documentType,
      'fileType': instance.fileType,
      'fileSize': instance.fileSize,
      'uploadedAt': instance.uploadedAt.toIso8601String(),
      'recordDate': instance.recordDate?.toIso8601String(),
      'processingStatus': instance.processingStatus,
      'processingError': instance.processingError,
      'extractedText': instance.extractedText,
      'structuredExtraction': instance.structuredExtraction,
      'metadata': instance.metadata,
      'description': instance.description,
    };
