// Common types for LLM services

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  images?: {
    data: Buffer;
    mimeType: string;
  }[];
  metadata?: {
    userId?: string;
    sessionId?: string;
    tags?: Record<string, string>;
    [key: string]: any;
  };
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface LLMService {
  generateText(request: LLMRequest): Promise<LLMResponse>;
  generateTextStream?(
    request: LLMRequest
  ): AsyncGenerator<string, void, unknown>;
  isAvailable(): boolean;
}

export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export type LLMProvider = "gemini" | "cerebras";

// Document processing types
export interface DocumentProcessingRequest {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
  caseId: string;
}

export interface DocumentProcessingResponse {
  extractedContent: string;
  suggestedName: string;
  documentType: string;
  confidence: number;
  success: boolean;
  error?: string;
}
