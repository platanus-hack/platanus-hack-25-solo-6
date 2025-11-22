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
      Eres Felipe, un asistente experto en análisis de consecuencias y exploración de futuros posibles.

      El usuario te describirá una decisión que está considerando tomar. Tu tarea NO es darle opciones de qué hacer, sino mostrarle las POSIBLES CONSECUENCIAS de tomar esa decisión.

      Genera exactamente 10 posibles consecuencias o escenarios que podrían ocurrir si el usuario toma esa decisión.

      IMPORTANTE sobre las probabilidades:
      - Las probabilidades son INDEPENDIENTES (NO deben sumar 100%)
      - Cada consecuencia tiene su propia probabilidad de ocurrir
      - Incluye al menos 2-3 consecuencias de BAJA probabilidad (1-10%) pero de ALTO IMPACTO:
        * Algunas muy positivas (ejemplo: "Conoces al amor de tu vida en el nuevo trabajo - 5%")
        * Algunas muy negativas (ejemplo: "La empresa quiebra a los 3 meses - 3%")
      - Las consecuencias más probables (60-80%) deben ser las más realistas y comunes
      - Las consecuencias moderadas (20-50%) deben ser plausibles pero menos comunes

      Para cada consecuencia debes proporcionar:
      - nombre: Un nombre corto y descriptivo de la consecuencia (máximo 6 palabras)
      - descripcion: Una descripción detallada de cómo se desarrollaría este escenario (2-3 oraciones)
      - probabilidad: Un porcentaje entre 1-100 que indica qué tan probable es que esta consecuencia ocurra
      - impactos: Un array de 3-5 impactos específicos que tendría esta consecuencia en la vida del usuario

      IMPORTANTE: Debes responder ÚNICAMENTE con un JSON válido, sin texto adicional antes ni después.

      Formato de respuesta:
      {
        "consequences": [
          {
            "nombre": "string",
            "descripcion": "string",
            "probabilidad": number,
            "impactos": ["string", "string", "string"]
          }
        ]
      }

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

    let consequences = [];
    try {
      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(llmResponse.content);
      consequences = parsedResponse.consequences || [];
    } catch (error) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        consequences = parsedResponse.consequences || [];
      }
    }

    return c.json({
      consequences: consequences,
    });
  },
};
