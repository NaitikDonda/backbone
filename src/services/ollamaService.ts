export interface OllamaResponse {
  response: string;
  done: boolean;
}

export interface OllamaError {
  error: string;
}

export interface OllamaFallbackResult {
  success: boolean;
  data?: unknown;
  error?: string;
  fallbackUsed: boolean;
  fallbackReason?: 'unavailable' | 'timeout' | 'malformed_json' | 'model_not_available' | 'other';
}

export class OllamaService {
  private static instance: OllamaService;
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  private constructor() {
    // Ollama base URL - configurable via environment variable
    this.baseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
    // Default model for general use
    this.model = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';
    // Timeout for requests in milliseconds
    this.timeoutMs = 120000; // 2 minutes
  }

  static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if the configured model is available
   */
  async isModelAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return false;
      
      const data = await response.json();
      const models = data.models || [];
      return models.some((m: any) => m.name.includes(this.model));
    } catch (error) {
      return false;
    }
  }

  /**
   * Send a prompt to Ollama and return the response
   */
  async generate(prompt: string, systemPrompt?: string, format?: 'json' | 'text'): Promise<string> {
    const outputFormat = format || 'json'; // Default to JSON if not specified
    console.log('[OllamaService] Starting generation...');
    console.log('[OllamaService] Model:', this.model);
    console.log('[OllamaService] Base URL:', this.baseUrl);
    console.log('[OllamaService] Prompt length:', prompt.length);
    console.log('[OllamaService] System prompt length:', systemPrompt?.length || 0);
    console.log('[OllamaService] Format:', outputFormat);
    
    try {
      console.log('[OllamaService] Sending request to Ollama...');
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system: systemPrompt,
          stream: false,
          format: outputFormat === 'json' ? 'json' : undefined, // Only specify format for JSON mode
          options: {
            temperature: 0.3,
            top_p: 0.9,
            num_ctx: 4096, // Reduced context window for faster processing
            num_predict: 2048, // Allow more tokens for complete JSON responses
            mirostat: 2, // Enable mirostat for faster, better quality sampling
          },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      console.log('[OllamaService] Response status:', response.status);
      
      if (!response.ok) {
        const errorData: OllamaError = await response.json();
        console.error('[OllamaService] Ollama error:', errorData);
        throw new Error(`Ollama error: ${errorData.error || response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      console.log('[OllamaService] Response received, length:', data.response.length);
      console.log('[OllamaService] Response preview:', data.response.substring(0, 200));
      return data.response;
    } catch (error) {
      console.error('[OllamaService] Generation failed:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate response: ${error.message}`);
      }
      throw new Error('Failed to generate response: Unknown error');
    }
  }

  /**
   * Send a prompt to Ollama and expect JSON response
   */
  async generateJson<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const response = await this.generate(prompt, systemPrompt);
    
    try {
      console.log('[OllamaService] Raw response:', response);
      
      // Step 1: Strip markdown code fences if present
      let cleanedResponse = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Step 2: Remove leading prose before the first [ or {
      const arrayStart = cleanedResponse.indexOf('[');
      const objectStart = cleanedResponse.indexOf('{');
      
      let jsonString: string;
      
      if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
        // Response contains a JSON array — find matching closing bracket
        const jsonEnd = cleanedResponse.lastIndexOf(']');
        if (jsonEnd === -1 || jsonEnd < arrayStart) {
          throw new Error('No valid JSON array found in response');
        }
        jsonString = cleanedResponse.substring(arrayStart, jsonEnd + 1);
      } else if (objectStart !== -1) {
        // Response contains a JSON object — find matching closing brace
        const jsonEnd = cleanedResponse.lastIndexOf('}');
        if (jsonEnd === -1 || jsonEnd < objectStart) {
          throw new Error('No valid JSON object found in response');
        }
        jsonString = cleanedResponse.substring(objectStart, jsonEnd + 1);
      } else {
        console.error('[OllamaService] No valid JSON found in response');
        throw new Error('No valid JSON found in response');
      }
      
      console.log('[OllamaService] Extracted JSON string (first 500 chars):', jsonString.substring(0, 500));
      
      const parsed = JSON.parse(jsonString) as T;
      console.log('[OllamaService] Parsed JSON successfully');
      
      return parsed;
    } catch (error) {
      console.error('[OllamaService] JSON parsing failed:', error);
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate with fallback - returns structured result with fallback status
   */
  async generateWithFallback<T>(
    prompt: string,
    systemPrompt?: string,
    fallbackData?: T
  ): Promise<OllamaFallbackResult> {
    try {
      // Check if Ollama is available
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          data: fallbackData,
          error: 'Ollama service is unavailable',
          fallbackUsed: true,
          fallbackReason: 'unavailable',
        };
      }

      // Check if model is available
      const modelAvailable = await this.isModelAvailable();
      if (!modelAvailable) {
        return {
          success: false,
          data: fallbackData,
          error: `Model "${this.model}" is not available`,
          fallbackUsed: true,
          fallbackReason: 'model_not_available',
        };
      }

      // Generate response
      const response = await this.generate(prompt, systemPrompt);
      
      return {
        success: true,
        data: response,
        fallbackUsed: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Determine fallback reason
      let fallbackReason: OllamaFallbackResult['fallbackReason'] = 'other';
      if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
        fallbackReason = 'timeout';
      } else if (errorMessage.includes('JSON')) {
        fallbackReason = 'malformed_json';
      }

      return {
        success: false,
        data: fallbackData,
        error: errorMessage,
        fallbackUsed: true,
        fallbackReason,
      };
    }
  }

  /**
   * Generate JSON with fallback - returns structured result with fallback status
   */
  async generateJsonWithFallback<T>(
    prompt: string,
    systemPrompt?: string,
    fallbackData?: T
  ): Promise<OllamaFallbackResult> {
    try {
      // Check if Ollama is available
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          data: fallbackData,
          error: 'Ollama service is unavailable',
          fallbackUsed: true,
          fallbackReason: 'unavailable',
        };
      }

      // Check if model is available
      const modelAvailable = await this.isModelAvailable();
      if (!modelAvailable) {
        return {
          success: false,
          data: fallbackData,
          error: `Model "${this.model}" is not available`,
          fallbackUsed: true,
          fallbackReason: 'model_not_available',
        };
      }

      // Generate JSON response
      const data = await this.generateJson<T>(prompt, systemPrompt);
      
      return {
        success: true,
        data,
        fallbackUsed: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Determine fallback reason
      let fallbackReason: OllamaFallbackResult['fallbackReason'] = 'other';
      if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
        fallbackReason = 'timeout';
      } else if (errorMessage.includes('JSON')) {
        fallbackReason = 'malformed_json';
      }

      return {
        success: false,
        data: fallbackData,
        error: errorMessage,
        fallbackUsed: true,
        fallbackReason,
      };
    }
  }

  /**
   * Get the configured model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Set the model (for testing purposes)
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set the base URL (for testing purposes)
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }
}
