import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:backbone_mobile/providers/patient_provider.dart';
import 'package:backbone_mobile/services/local_ai_service.dart';
import 'package:backbone_mobile/core/theme/app_colors.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final LocalAIService _aiService = LocalAIService();
  
  final List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  int _lastResetSignal = 0;

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<PatientProvider>(
      builder: (context, patientProvider, child) {
        if (patientProvider.chatResetSignal != _lastResetSignal) {
          _lastResetSignal = patientProvider.chatResetSignal;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                _messages.clear();
              });
            }
          });
        }
        return Scaffold(
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            title: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: AppColors.privacyGreen, shape: BoxShape.circle),
                ),
                const SizedBox(width: 8),
                Text('Local AI Health Assistant', style: TextStyle(color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary)),
              ],
            ),
          ),
          body: Column(
            children: [
              Expanded(
                child: _messages.isEmpty && !_isLoading
                    ? _buildEmptyState(isDark)
                    : _buildMessagesList(isDark),
              ),
              _buildInputArea(patientProvider.records, isDark),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withValues(alpha: 0.15),
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
            ),
            child: const Icon(
              CupertinoIcons.chat_bubble_2_fill,
              size: 56,
              color: AppColors.cyanAccent,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Private Record Intelligence',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Ask questions about your uploaded lab reports, diagnoses, and treatment plans. Answers rely strictly on local data.',
            style: TextStyle(
              fontSize: 14,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          Text(
            'SUGGESTED PROMPTS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 12),
          _buildPromptChip('Summarize my recent lab results', isDark),
          _buildPromptChip('What medications are documented?', isDark),
          _buildPromptChip('List any diagnosed conditions', isDark),
        ],
      ),
    );
  }

  Widget _buildPromptChip(String prompt, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: InkWell(
        onTap: () {
          _messageController.text = prompt;
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                prompt,
                style: TextStyle(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Icon(CupertinoIcons.arrow_up_right, color: AppColors.cyanAccent, size: 14),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessagesList(bool isDark) {
    final totalCount = _messages.length + (_isLoading ? 1 : 0);
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: totalCount,
      itemBuilder: (context, index) {
        if (index == _messages.length && _isLoading) {
          return _TypingIndicator(isDark: isDark);
        }
        final message = _messages[index];
        return _buildMessageBubble(message, isDark);
      },
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message, bool isDark) {
    final isUser = message['isUser'] as bool;
    
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        constraints: const BoxConstraints(maxWidth: 290),
        decoration: BoxDecoration(
          color: isUser ? AppColors.primaryBlue : (isDark ? AppColors.darkSurface : AppColors.lightSurface),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isUser ? 20 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 20),
          ),
          border: isUser ? null : Border.all(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
        ),
        child: Text(
          message['text'] as String,
          style: TextStyle(
            color: isUser ? Colors.white : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
            fontSize: 14,
            height: 1.4,
          ),
        ),
      ),
    );
  }

  Widget _buildInputArea(List records, bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        border: Border(
          top: BorderSide(color: isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder, width: 1),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                style: TextStyle(color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Ask about your health records...',
                  fillColor: isDark ? AppColors.darkSurfaceLight : AppColors.lightSurfaceLight,
                ),
              ),
            ),
            const SizedBox(width: 10),
            IconButton(
              style: IconButton.styleFrom(
                backgroundColor: AppColors.primaryBlue,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _isLoading ? null : () => _sendMessage(records),
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(CupertinoIcons.arrow_up, color: Colors.white, size: 20),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendMessage(List records) async {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;

    setState(() {
      _isLoading = true;
      _messages.add({
        'text': message,
        'isUser': true,
        'timestamp': DateTime.now().toIso8601String(),
      });
      _messageController.clear();
    });

    _scrollToBottom();

    try {
      final context = _buildRecordsContext(records);
      
      // Random delay between 1.5 seconds and 2.0 seconds for natural AI model thinking
      final randomDelayMs = 1500 + Random().nextInt(500);
      await Future.delayed(Duration(milliseconds: randomDelayMs));

      final response = await _aiService.chat(message, context);
      
      setState(() {
        _messages.add({
          'text': response,
          'isUser': false,
          'timestamp': DateTime.now().toIso8601String(),
        });
      });
      
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _messages.add({
          'text': 'Local Model Response Error: $e',
          'isUser': false,
          'timestamp': DateTime.now().toIso8601String(),
        });
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  String _buildRecordsContext(List records) {
    if (records.isEmpty) return 'No medical records available.';
    final buffer = StringBuffer();
    for (var i = 0; i < records.length; i++) {
      final record = records[i];
      buffer.writeln('Record ${i + 1}: ${record.filename} (${record.documentType})');
      if (record.extractedText != null) {
        buffer.writeln('Text: ${record.extractedText}');
      }
    }
    return buffer.toString();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }
}

// ─── 3 Dots Typing Indicator Widget ──────────────────────────────────────────

class _TypingIndicator extends StatefulWidget {
  final bool isDark;
  const _TypingIndicator({required this.isDark});

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: widget.isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(4),
            bottomRight: Radius.circular(20),
          ),
          border: Border.all(color: widget.isDark ? AppColors.darkCardBorder : AppColors.lightCardBorder),
        ),
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (index) {
                final delay = index * 0.25;
                final value = ((_controller.value - delay) % 1.0);
                final opacity = (value < 0.5 ? value * 2 : (1.0 - value) * 2).clamp(0.25, 1.0);
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: AppColors.cyanAccent.withValues(alpha: opacity),
                    shape: BoxShape.circle,
                  ),
                );
              }),
            );
          },
        ),
      ),
    );
  }
}
