// hono
import type { Context } from "hono";

// llm services
import { PROVIDERS, MODELS } from "../../services/llm/lllm.constants.js";
import { llmServiceManager } from "../../services/llm/llm.service.js";

// controller
export const felipeController = {
  // get basic health status
  startDecisionMaking: async (c: Context) => {
    const body = await c.req.json();

    const message = body.message;
    const email = body.email;

    const PROVIDER = PROVIDERS.CEREBRAS;
    const MODEL = MODELS.GPT_OSS;

    const systemPrompt = `
      Eres Felipe, un asistente que ayuda a tomar decisiones complejas.
      Analiza la información proporcionada por el usuario y formula preguntas aclaratorias si es necesario.
      Proporciona recomendaciones basadas en los datos y preferencias del usuario.
      Mantén un tono profesional y empático.
      Usuario: ${email}      
    `;

    const llmResponse = await llmServiceManager.generateText(
      {
        prompt: message,
        systemPrompt: systemPrompt,
        model: MODEL,
      },
      PROVIDER
    );

    const messageResponse = llmResponse.content;

    return c.json({
      message: messageResponse,
    });
  },
};
