import { llmServiceManager, createLLMService } from "./index.js";

export const initializeLLMServices = () => {
  try {
    // Initialize Gemini service (optional)
    if (process.env["GEMINI_API_KEY"]) {
      const geminiService = createLLMService("gemini", {
        apiKey: process.env["GEMINI_API_KEY"],
        model: "gemini-2.0-flash-exp",
        temperature: 0.7,
        maxTokens: 1000,
      });
      llmServiceManager.registerService("gemini", geminiService);
      console.log("✅ Gemini LLM service initialized");
    }

    // Initialize Cerebras service via OpenRouter (optional)
    if (process.env["OPENROUTER_API_KEY"]) {
      const cerebrasService = createLLMService("cerebras", {
        apiKey: process.env["OPENROUTER_API_KEY"],
        model: "cerebras/cerebras-llama-3.1-70b-instruct",
        temperature: 0.7,
        maxTokens: 10000,
      });
      llmServiceManager.registerService("cerebras", cerebrasService);
      console.log("✅ Cerebras LLM service initialized (via OpenRouter)");
    }

    if (llmServiceManager.getAvailableProviders().length === 0) {
      console.warn("⚠️  No LLM services available - check API keys");
    }
  } catch (error) {
    console.error("❌ Failed to initialize LLM services:", error);
  }
};
