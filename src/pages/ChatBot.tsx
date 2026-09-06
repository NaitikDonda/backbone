import { useState, useEffect, useRef } from 'react';
import { mockPatient } from '../data/mockData';
import { useRecordStorage } from '../hooks/useRecordStorage';
import { ChatbotService, type ChatMessage } from '../services/chatbotService';

export function ChatBot() {
  const { records } = useRecordStorage(mockPatient.id);
  const chatbotService = ChatbotService.getInstance();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityReason, setAvailabilityReason] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasRecords = records.length > 0;
  const isLocked = !hasRecords;

  // Check availability on mount
  useEffect(() => {
    chatbotService.isAvailable().then(({ available, reason }) => {
      setIsAvailable(available);
      setAvailabilityReason(reason || '');
    });
  }, [chatbotService]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await chatbotService.sendMessage(userMessage, records);
      
      if (response.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Error: ${response.error || 'Failed to get response'}`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'An unexpected error occurred. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    chatbotService.clearHistory();
    setMessages([]);
  };

  if (!isAvailable) {
    return (
      <div className="max-w-4xl">
        <div className="mb-16">
          <h1 className="text-display text-text-primary mb-4">Chat with Your Records</h1>
          <p className="text-h2 text-text-secondary font-light">
            Ask questions about your medical records
          </p>
        </div>

        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="text-4xl text-text-muted">◈</div>
            <div className="flex-1">
              <h3 className="text-h3 text-text-primary mb-3">Chatbot Unavailable</h3>
              <p className="text-body-large text-text-secondary leading-relaxed">
                {availabilityReason || 'The chatbot service is not available. Please ensure Ollama is running locally.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="max-w-4xl">
        <div className="mb-16">
          <h1 className="text-display text-text-primary mb-4">Chat with Your Records</h1>
          <p className="text-h2 text-text-secondary font-light">
            Ask questions about your medical records
          </p>
        </div>

        <div className="bg-surface rounded-lg border border-border-light p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="text-4xl text-text-muted">🔒</div>
            <div className="flex-1">
              <h3 className="text-h3 text-text-primary mb-3">Chatbot Locked</h3>
              <p className="text-body-large text-text-secondary leading-relaxed mb-6">
                Upload medical records to unlock the chatbot. You can only ask questions about information in your uploaded records.
              </p>
              <button className="btn btn-primary">
                Upload Records
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-16 flex items-center justify-between">
        <div>
          <h1 className="text-display text-text-primary mb-4">Chat with Your Records</h1>
          <p className="text-h2 text-text-secondary font-light">
            Ask questions about your medical records
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="btn btn-ghost text-small"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Chat Container */}
      <div className="bg-surface rounded-lg border border-border-light shadow-sm overflow-hidden">
        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="text-center py-24">
              <div className="text-6xl mb-6 text-text-muted">💬</div>
              <h2 className="text-h2 text-text-primary mb-4">Start a Conversation</h2>
              <p className="text-body-large text-text-secondary max-w-xl mx-auto">
                Ask questions about your medical records. The chatbot will only answer based on information in your uploaded documents.
              </p>
              <div className="mt-8 text-small text-text-tertiary">
                Example questions:
              </div>
              <div className="mt-4 space-y-2 text-body text-text-secondary">
                <div className="bg-background p-3 rounded border border-border-light">
                  "What symptoms are documented in my records?"
                </div>
                <div className="bg-background p-3 rounded border border-border-light">
                  "What were my latest lab results?"
                </div>
                <div className="bg-background p-3 rounded border border-border-light">
                  "What medications am I taking?"
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-accent-primary text-white'
                    : 'bg-background text-text-secondary'
                }`}
              >
                <div className="text-body leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
                <div className={`text-tiny mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-text-tertiary'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-background rounded-lg p-4 text-text-secondary">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border-light p-4">
          <div className="flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your records..."
              className="flex-1 resize-none border border-border-light rounded-lg p-3 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="btn btn-primary self-end"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div className="mt-2 text-tiny text-text-tertiary">
            The chatbot only answers questions based on your uploaded medical records.
          </div>
        </div>
      </div>
    </div>
  );
}
