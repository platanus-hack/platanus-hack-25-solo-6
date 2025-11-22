// google ai sdk
import { GoogleGenerativeAI } from "@google/generative-ai";

// types
import type {
  LLMService,
  LLMRequest,
  LLMResponse,
  LLMConfig,
} from "../types/llm.types.js";

export class GeminiService implements LLMService {
  private client: GoogleGenerativeAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    const modelName =
      request.model || this.config.model || "gemini-2.0-flash-exp";

    const MAX_OUTPUT_TOKENS =
      request.maxTokens || this.config.maxTokens || 65535;

    try {
      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: request.temperature || this.config.temperature || 0.7,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      });

      // Prepare the content with system message, prompt and images
      const parts: any[] = [];

      // Add system prompt if provided
      if (request.systemPrompt) {
        parts.push({ text: request.systemPrompt });
      }

      // Add main prompt
      parts.push({ text: request.prompt });

      // Add images if provided
      if (request.images && request.images.length > 0) {
        for (const image of request.images) {
          parts.push({
            inlineData: {
              data: image.data.toString("base64"),
              mimeType: image.mimeType,
            },
          });
        }
      }

      const result = await model.generateContent(parts);
      const response = result.response;
      const text = response.text();

      const usage = {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens:
          result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
      };

      return {
        content: text,
        usage,
        model: modelName,
        finishReason: result.response.candidates?.[0]?.finishReason || "STOP",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Gemini API error:", errorMessage);
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }
}
