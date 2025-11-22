// types
import type {
  LLMService,
  LLMRequest,
  LLMResponse,
  LLMConfig,
} from "../types/llm.types.js";

// Cerebras models for fallback on rate limiting
const CEREBRAS_FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3-235b-a22b-thinking-2507",
  "meta-llama/llama-4-maverick",
] as const;

export class CerebrasService implements LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    const MAX_OUTPUT_TOKENS =
      request.maxTokens || this.config.maxTokens || 10000;

    // Prepare messages array for OpenRouter format (shared across retries)
    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({
        role: "system",
        content: request.systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: request.prompt,
    });

    // Try with fallback models on 429 rate limiting
    let lastError: Error | null = null;

    for (const fallbackModel of CEREBRAS_FALLBACK_MODELS) {
      try {
        console.log(`🔄 Attempting with model: ${fallbackModel}`);

        // Measure timing explicitly
        const start = Date.now();

        // Try without provider restriction first to see if model is available
        const requestBody = {
          model: fallbackModel,
          provider: {
            only: ["Cerebras"],
          },
          messages: messages,
          temperature: request.temperature || this.config.temperature || 0.7,
          max_tokens: MAX_OUTPUT_TOKENS,
          usage: {
            include: true,
          },
        };

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              "HTTP-Referer": "https://cristianvaldivia.cl",
              "X-Title": "Simon",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        const end = Date.now();
        const duration = end - start;

        console.log(`🔄 Response time: ${duration}ms`);

        if (!response.ok) {
          const errorText = await response.text();
          console.log("❌ Error response:", errorText);
          console.log("❌ Status:", response.status, response.statusText);
          console.log(
            "❌ Headers:",
            Object.fromEntries(response.headers.entries())
          );

          const errorMessage = `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`;

          // If it's a 429, try the next model
          if (response.status === 429) {
            console.log(
              `⚠️ Rate limited on ${fallbackModel}, trying next model...`
            );
            lastError = new Error(errorMessage);
            continue;
          }

          throw new Error(errorMessage);
        }

        // Success! Return the response
        const completion = (await response.json()) as {
          choices: {
            message: { content: string };
            finish_reason: string;
          }[];
          usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
          };
        };

        const text = completion.choices[0]?.message?.content || "";
        const finishReason = completion.choices[0]?.finish_reason || "stop";

        const usage = {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        };

        const llmResponse = {
          content: text,
          usage,
          model: fallbackModel,
          finishReason,
        };

        console.log(`✅ Success with model: ${fallbackModel}`);

        return llmResponse;
      } catch (error) {
        // If error tracking was already done above (for HTTP errors), just re-throw
        if (
          error instanceof Error &&
          error.message.includes("OpenRouter API error")
        ) {
          throw error;
        }

        // For other errors, track and throw
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        throw new Error(`Cerebras API error: ${errorMessage}`);
      }
    }

    // If we've exhausted all models, throw the last error
    if (lastError) {
      console.error(`❌ All Cerebras models rate limited`);
      throw new Error(
        `All Cerebras models are rate limited: ${lastError.message}`
      );
    }

    throw new Error("Unexpected error: no models were tried");
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }
}
