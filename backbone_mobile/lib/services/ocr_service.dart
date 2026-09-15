import 'dart:io';
import 'package:syncfusion_flutter_pdf/pdf.dart';

class OCRService {
  Future<String> extractTextFromPDF(String filePath) async {
    try {
      final File file = File(filePath);
      if (!await file.exists()) {
        throw Exception('PDF file not found: $filePath');
      }

      final bytes = await file.readAsBytes();
      print('PDF file size: ${bytes.length} bytes');

      final PdfDocument document = PdfDocument(inputBytes: bytes);
      final PdfTextExtractor extractor = PdfTextExtractor(document);

      final StringBuffer buffer = StringBuffer();
      final int pageCount = document.pages.count;
      print('PDF page count: $pageCount');

      for (int i = 0; i < pageCount; i++) {
        final pageText = extractor.extractText(startPageIndex: i, endPageIndex: i);
        if (pageText.isNotEmpty) {
          buffer.writeln('--- Page ${i + 1} ---');
          buffer.writeln(pageText);
          buffer.writeln();
          print('Extracted ${pageText.length} characters from page ${i + 1}');
        } else {
          print('No text found on page ${i + 1}');
        }
      }

      document.dispose();

      final extracted = buffer.toString().trim();
      print('Total extracted text length: ${extracted.length} characters');
      
      if (extracted.isEmpty) {
        return 'PDF loaded but no selectable text found. This may be a scanned/image-based PDF.';
      }
      return extracted;
    } catch (e) {
      print('PDF extraction error: $e');
      throw Exception('Failed to extract text from PDF: $e');
    }
  }

  Future<String> extractTextFromImage(String filePath) async {
    try {
      return 'Image text extraction not yet implemented.';
    } catch (e) {
      throw Exception('Failed to extract text from image: $e');
    }
  }
}
