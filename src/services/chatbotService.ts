import { OllamaService } from './ollamaService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatbotResponse {
  message: string;
  success: boolean;
  error?: string;
}

const CHATBOT_SYSTEM_PROMPT = `You are BACKBONE, a medical record assistant that answers questions ONLY based on the provided medical records.

CRITICAL RULES:
1. You MUST ONLY answer questions using information from the provided medical records context.
2. If a question asks about information NOT present in the records, you MUST respond: "I cannot answer this question based on the available medical records."
3. Do NOT use any external knowledge, general medical information, or assumptions beyond what is explicitly stated in the records.
4. Do NOT provide medical advice, diagnoses, or treatment recommendations.
5. Do NOT make up or infer information that is not in the records.
6. If the records are empty or insufficient, respond: "No medical records are available to answer this question."

ANSWERING RULES:
- Only use facts explicitly stated in the provided records
- If asked about a symptom, condition, medication, or lab result that is NOT in the records, say it's not documented
- If asked about dates, only use dates that appear in the records
- If asked about providers, only use provider names that appear in the records
- Be concise and direct
- Reference the specific record or document when possible (e.g., "According to the lab report from March 2024...")

EXAMPLES:
Good: "According to the lab report from March 12, 2024, the hemoglobin level was 9.2 g/dL."
Bad: "The patient has anemia." (diagnostic)

Good: "The records show fatigue was documented in consultations in 2022 and 2023."
Bad: "The patient has chronic fatigue syndrome." (diagnostic)

Good: "I cannot answer this question about diabetes treatment as it is not mentioned in the available records."
Bad: "Common diabetes treatments include metformin..." (external knowledge)

Remember: You are a record-based assistant, not a medical advisor. Stick strictly to what is documented.`;

export class ChatbotService {
  private static instance: ChatbotService;
  private ollamaService: OllamaService;
  private conversationHistory: ChatMessage[] = [];

  private constructor() {
    this.ollamaService = OllamaService.getInstance();
  }

  static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  /**
   * Build context from medical records
   */
  private buildRecordsContext(records: any[]): string {
    if (!records || records.length === 0) {
      return "No medical records available.";
    }

    let context = "AVAILABLE MEDICAL RECORDS:\n\n";
    
    records.forEach((record, index) => {
      context += `--- Record ${index + 1} ---\n`;
      context += `Document Type: ${record.documentType || 'Unknown'}\n`;
      context += `Filename: ${record.filename || 'Unknown'}\n`;
      
      if (record.recordDate) {
        context += `Date: ${record.recordDate}\n`;
      }
      
      if (record.extractedText) {
        context += `Extracted Text:\n${record.extractedText}\n`;
      }
      
      if (record.structuredExtraction) {
        const extraction = record.structuredExtraction;
        
        if (extraction.patient) {
          context += `Patient: ${extraction.patient.name || 'Unknown'}\n`;
        }
        
        if (extraction.symptoms && extraction.symptoms.length > 0) {
          context += `Symptoms: ${extraction.symptoms.map((s: any) => s.name).join(', ')}\n`;
        }
        
        if (extraction.diagnoses && extraction.diagnoses.length > 0) {
          context += `Diagnoses: ${extraction.diagnoses.map((d: any) => d.name).join(', ')}\n`;
        }
        
        if (extraction.labResults && extraction.labResults.length > 0) {
          context += `Lab Results:\n`;
          extraction.labResults.forEach((lab: any) => {
            context += `  - ${lab.testName}: ${lab.value} ${lab.unit || ''}`;
            if (lab.isAbnormal) context += ' (Abnormal)';
            context += '\n';
          });
        }
        
        if (extraction.medications && extraction.medications.length > 0) {
          context += `Medications: ${extraction.medications.map((m: any) => m.name).join(', ')}\n`;
        }
      }
      
      context += '\n';
    });

    return context;
  }

  /**
   * Send a message to the chatbot
   */
  async sendMessage(
    userMessage: string,
    records: any[]
  ): Promise<ChatbotResponse> {
    try {
      // Check if Ollama is available
      const isAvailable = await this.ollamaService.isAvailable();
      if (!isAvailable) {
        return {
          message: '',
          success: false,
          error: 'Chatbot is not available. Please ensure Ollama is running locally.',
        };
      }

      // Check if model is available
      const isModelAvailable = await this.ollamaService.isModelAvailable();
      if (!isModelAvailable) {
        return {
          message: '',
          success: false,
          error: `Model "${this.ollamaService.getModel()}" is not available.`,
        };
      }

      // Build context from records
      const recordsContext = this.buildRecordsContext(records);

      // Build conversation history
      const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
        { role: 'user', content: `${recordsContext}\n\nQuestion: ${userMessage}` },
      ];

      // Add conversation history (last 10 messages to stay within context limits)
      const recentHistory = this.conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }

      // Send to Ollama
      const response = await this.ollamaService.generate(
        messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
        CHATBOT_SYSTEM_PROMPT
      );

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      });
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      });

      return {
        message: response,
        success: true,
      };
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        message: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Check if chatbot is available
   */
  async isAvailable(): Promise<{ available: boolean; reason?: string }> {
    const isAvailable = await this.ollamaService.isAvailable();
    if (!isAvailable) {
      return {
        available: false,
        reason: 'Ollama is not running. Please start Ollama locally.',
      };
    }

    const isModelAvailable = await this.ollamaService.isModelAvailable();
    if (!isModelAvailable) {
      return {
        available: false,
        reason: `Model "${this.ollamaService.getModel()}" is not available in Ollama.`,
      };
    }

    return { available: true };
  }
}
