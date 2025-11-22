// LLM Providers
export const PROVIDERS = {
  GEMINI: "gemini",
  CEREBRAS: "cerebras",
} as const;

export type ProviderType = (typeof PROVIDERS)[keyof typeof PROVIDERS];

// LLM Models
export const MODELS = {
  // GEMINI models
  GEMINI_2_0_FLASH_EXP: "gemini-2.0-flash-exp",
  GEMINI_2_5_FLASH: "gemini-2.5-flash",
  GEMINI_2_5_PRO: "gemini-2.5-pro",

  // CEREBRAS models
  GPT_OSS: "openai/gpt-oss-120b",
  QWEN_3_235B_A22B_THINKING_2507: "qwen/qwen3-235b-a22b-thinking-2507",
  LLAMA_4_MAVERICK: "meta-llama/llama-4-maverick",
} as const;

export type ModelType = (typeof MODELS)[keyof typeof MODELS];
