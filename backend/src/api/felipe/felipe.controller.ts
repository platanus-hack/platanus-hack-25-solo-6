// hono
import type { Context } from "hono";

// llm services
import { PROVIDERS, MODELS } from "../../services/llm/lllm.constants.js";
import { llmServiceManager } from "../../services/llm/llm.service.js";

// polymarket service
import { polymarketService } from "../../services/polymarket/index.js";
import type { PolymarketMarket } from "../../services/polymarket/index.js";

// controller
export const felipeController = {
  // get basic health status
  startDecisionMaking: async (c: Context) => {
    const body = await c.req.json();

    const message = body.message;
    const email = body.email;

    const PROVIDER = PROVIDERS.CEREBRAS;
    const MODEL = MODELS.GPT_OSS;

    // Step 1: Generate search keywords for Polymarket using fast LLM
    console.log("📝 Generating Polymarket search keywords...");
    const keywordsPrompt = `
      Analiza esta decisión del usuario y genera 5-8 keywords o queries EN INGLÉS para buscar mercados de predicción relevantes en Polymarket.

      IMPORTANTE: Las keywords DEBEN ser en INGLÉS (no español), relacionadas con eventos futuros que podrían afectar la decisión.

      Ejemplos:
      - Decisión: "Voy a invertir en Bitcoin" → ["bitcoin price 2025", "crypto regulation", "btc 100k", "federal reserve rates"]
      - Decisión: "Voy a renunciar para emprender" → ["startup success rate", "economic recession", "tech jobs market", "venture capital"]
      - Decisión: "Me voy a mudar a Chile" → ["chile economy 2025", "latin america housing", "santiago real estate", "chile politics"]

      Decisión del usuario: ${message}

      Responde ÚNICAMENTE con un JSON válido:
      {
        "keywords": ["keyword1", "keyword2", ...]
      }
    `;

    const keywordsResponse = await llmServiceManager.generateText(
      {
        prompt: keywordsPrompt,
        temperature: 0.7,
        model: MODEL,
      },
      PROVIDER
    );

    let keywords: string[] = [];
    try {
      const keywordsJson = JSON.parse(keywordsResponse.content);
      keywords = keywordsJson.keywords || [];
    } catch (error) {
      const jsonMatch = keywordsResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const keywordsJson = JSON.parse(jsonMatch[0]);
        keywords = keywordsJson.keywords || [];
      }
    }

    console.log(`🔍 Generated ${keywords.length} keywords:`, keywords);

    // Step 2: Search Polymarket with keywords
    console.log("🎲 Searching Polymarket markets...");
    let polymarketMarkets: PolymarketMarket[] = [];

    if (keywords.length > 0) {
      try {
        polymarketMarkets = await polymarketService.searchMultipleKeywords(keywords);
        polymarketMarkets = polymarketService.filterByRelevance(polymarketMarkets, 500);
        console.log(`📊 Found ${polymarketMarkets.length} relevant Polymarket markets`);
      } catch (error) {
        console.error("Error searching Polymarket:", error);
        // Continue without Polymarket data if it fails
      }
    }

    // Step 3: Build context from Polymarket markets
    let polymarketContext = "";
    if (polymarketMarkets.length > 0) {
      polymarketContext = `\n\nDATOS DE POLYMARKET (Mercados de predicción reales):
Los siguientes mercados de Polymarket muestran probabilidades reales basadas en dinero real apostado por miles de personas:

${polymarketMarkets.slice(0, 20).map((market, idx) =>
  `${idx + 1}. "${market.question}"
   - Probabilidad actual: ${market.probability}%
   - Volumen de apuestas: $${(market.volume / 1000).toFixed(1)}k
   - Activo: ${market.active ? "Sí" : "No"}
   - URL: ${market.url}`
).join("\n\n")}

IMPORTANTE: Estos datos de Polymarket deben INFLUIR en las probabilidades que asignes a tus consecuencias.
Si hay un mercado relevante, ajusta tu probabilidad para que sea coherente con los datos reales.`;
    }

    // Step 4: Generate consequences with Polymarket context
    console.log("🤖 Generating consequences with Polymarket context...");
    const systemPrompt = `
      Eres Felipe, un asistente experto en análisis de consecuencias y exploración de futuros posibles.

      El usuario te describirá una decisión que está considerando tomar. Tu tarea NO es darle opciones de qué hacer, sino mostrarle las POSIBLES CONSECUENCIAS de tomar esa decisión.

      Genera exactamente 20 posibles consecuencias o escenarios que podrían ocurrir si el usuario toma esa decisión.

      IMPORTANTE sobre las probabilidades:
      - Las probabilidades son INDEPENDIENTES (NO deben sumar 100%)
      - Cada consecuencia tiene su propia probabilidad de ocurrir
      - Incluye al menos 3-5 consecuencias de BAJA probabilidad (1-10%) pero de ALTO IMPACTO:
        * Algunas muy positivas (ejemplo: "Conoces al amor de tu vida en el nuevo trabajo - 5%")
        * Algunas muy negativas (ejemplo: "La empresa quiebra a los 3 meses - 3%")
      - Las consecuencias más probables (60-80%) deben ser las más realistas y comunes
      - Las consecuencias moderadas (20-50%) deben ser plausibles pero menos comunes

      Para cada consecuencia debes proporcionar:
      - nombre: Un nombre corto y descriptivo EN ESPAÑOL de la consecuencia (máximo 6 palabras)
      - descripcion: Una descripción detallada EN ESPAÑOL de cómo se desarrollaría este escenario (2-3 oraciones)
      - probabilidad: Un porcentaje entre 1-100 que indica qué tan probable es que esta consecuencia ocurra
      - impactos: Un array de 3-5 impactos específicos EN ESPAÑOL que tendría esta consecuencia en la vida del usuario
      - polymarketQueries: Un array de 2-3 queries/keywords EN INGLÉS que el usuario podría usar para buscar más mercados relacionados en Polymarket sobre esta consecuencia específica (ejemplo: ["bitcoin price", "tech stocks 2025", "AI regulation"])
      - polymarketInfluenced: Un booleano que indica si esta consecuencia fue influenciada por datos reales de Polymarket (true si hay mercados relevantes, false si no)

      ${polymarketContext}

      IMPORTANTE:
      - TODO el contenido (nombre, descripcion, impactos) debe estar EN ESPAÑOL
      - SOLO polymarketQueries debe estar EN INGLÉS
      - Debes responder ÚNICAMENTE con un JSON válido, sin texto adicional antes ni después

      Formato de respuesta:
      {
        "consequences": [
          {
            "nombre": "string en español",
            "descripcion": "string en español",
            "probabilidad": number,
            "impactos": ["string en español", "string en español", "string en español"],
            "polymarketQueries": ["query in english", "query in english", "query in english"],
            "polymarketInfluenced": boolean
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
        temperature: 0.8,
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

    // Step 5: Attach relevant Polymarket markets to each consequence
    console.log("🔗 Matching Polymarket markets to consequences...");
    consequences = consequences.map((consequence: any) => {
      // Find related markets based on queries
      const relatedMarkets: PolymarketMarket[] = [];

      if (consequence.polymarketQueries && polymarketMarkets.length > 0) {
        // Simple matching: find markets that contain any of the query keywords
        const queries = consequence.polymarketQueries.map((q: string) => q.toLowerCase());

        for (const market of polymarketMarkets) {
          const marketText = `${market.question} ${market.description || ""}`.toLowerCase();

          // Check if any query keyword appears in the market
          const isRelevant = queries.some((query: string) => {
            const keywords = query.split(" ");
            return keywords.some(keyword => marketText.includes(keyword));
          });

          if (isRelevant && relatedMarkets.length < 5) {
            relatedMarkets.push(market);
          }
        }
      }

      return {
        ...consequence,
        relatedMarkets,
      };
    });

    console.log("✅ Generated", consequences.length, "consequences");

    return c.json({
      consequences: consequences,
    });
  },
};
