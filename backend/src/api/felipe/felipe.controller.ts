// hono
import type { Context } from "hono";

// llm services
import { PROVIDERS, MODELS } from "../../services/llm/lllm.constants.js";
import { llmServiceManager } from "../../services/llm/llm.service.js";

// polymarket service
import { polymarketService } from "../../services/polymarket/index.js";
import type { PolymarketMarket } from "../../services/polymarket/index.js";

// tavily service
import { tavilyService } from "../../services/tavily/index.js";

// firestore service
import { decisionFirestoreService } from "../../services/firestore/index.js";

/**
 * Helper function to clean and parse JSON from LLM response
 */
function cleanAndParseJSON(content: string): any {
  console.log("📄 Raw LLM response length:", content.length);
  console.log("📄 First 500 chars:", content.substring(0, 500));
  console.log("📄 Last 500 chars:", content.substring(Math.max(0, content.length - 500)));

  // Strategy 1: Direct parse
  try {
    console.log("🔧 Trying Strategy 1: Direct parse");
    const parsed = JSON.parse(content);
    console.log("✅ Strategy 1 succeeded");
    return parsed;
  } catch (error) {
    console.log("❌ Strategy 1 failed:", error instanceof Error ? error.message : String(error));
  }

  // Strategy 2: Extract JSON object with regex
  try {
    console.log("🔧 Trying Strategy 2: Regex extraction");
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("✅ Strategy 2 succeeded");
      return parsed;
    }
  } catch (error) {
    console.log("❌ Strategy 2 failed:", error instanceof Error ? error.message : String(error));
  }

  // Strategy 3: Clean common JSON issues
  try {
    console.log("🔧 Trying Strategy 3: Clean and parse");
    let cleaned = content;

    // Extract JSON if wrapped in markdown
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleaned = codeBlockMatch[1];
      console.log("  - Extracted from code block");
    }

    // Remove any text before first {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
      console.log("  - Removed text before first brace");
    }

    // Remove any text after last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
      console.log("  - Removed text after last brace");
    }

    // Fix common issues
    cleaned = cleaned
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
      .replace(/"(\w+)":/g, '"$1":'); // Ensure keys are quoted

    console.log("  - Applied cleaning rules");
    console.log("  - Cleaned first 300 chars:", cleaned.substring(0, 300));

    const parsed = JSON.parse(cleaned);
    console.log("✅ Strategy 3 succeeded");
    return parsed;
  } catch (error) {
    console.log("❌ Strategy 3 failed:", error instanceof Error ? error.message : String(error));
  }

  // Strategy 4: Try to find and parse the consequences array directly
  try {
    console.log("🔧 Trying Strategy 4: Extract consequences array");
    const consequencesMatch = content.match(/"consequences"\s*:\s*\[([\s\S]*)\]/);
    if (consequencesMatch) {
      const arrayContent = consequencesMatch[1];
      const parsed = JSON.parse(`[${arrayContent}]`);
      console.log("✅ Strategy 4 succeeded, found", parsed.length, "consequences");
      return { consequences: parsed };
    }
  } catch (error) {
    console.log("❌ Strategy 4 failed:", error instanceof Error ? error.message : String(error));
  }

  // If all strategies fail, throw with detailed error
  console.error("🚨 All parsing strategies failed!");
  console.error("🚨 Full response:", content);
  throw new Error(`Failed to parse JSON response after trying 4 strategies. Response length: ${content.length}`);
}

// controller
export const felipeController = {
  // get basic health status
  startDecisionMaking: async (c: Context) => {
    const body = await c.req.json();

    const message = body.message;
    const email = body.email;

    const PROVIDER = PROVIDERS.CEREBRAS;
    const MODEL = MODELS.GPT_OSS;

    // Step 1a: Generate search keywords for Polymarket (inglés)
    console.log("📝 Generating Polymarket search keywords...");
    const polymarketKeywordsPrompt = `
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

    // Step 1b: Generate search queries for Tavily (español)
    console.log("📝 Generating Tavily search queries...");
    const tavilyQueriesPrompt = `
      Analiza esta decisión del usuario y genera 3-5 queries de búsqueda EN ESPAÑOL para buscar información actualizada en internet sobre esta decisión.

      Las queries deben buscar:
      - Noticias recientes relacionadas
      - Análisis de expertos
      - Tendencias actuales
      - Riesgos y oportunidades
      - Datos estadísticos relevantes

      IMPORTANTE: Las queries DEBEN ser en ESPAÑOL.

      Ejemplos:
      - Decisión: "Voy a invertir en Bitcoin" → ["inversión bitcoin 2024 análisis expertos", "riesgos invertir criptomonedas", "bitcoin noticias recientes", "predicciones precio bitcoin 2025"]
      - Decisión: "Voy a renunciar para emprender" → ["emprendimiento Chile 2024", "riesgos emprender startup", "financiamiento emprendedores", "casos éxito emprendimientos"]
      - Decisión: "Me voy a mudar a Chile" → ["costo de vida Chile 2024", "mejores ciudades vivir Chile", "trabajo extranjeros Chile", "calidad vida Santiago"]

      Decisión del usuario: ${message}

      Responde ÚNICAMENTE con un JSON válido:
      {
        "queries": ["query1", "query2", ...]
      }
    `;

    // Generate both in parallel
    const [polymarketKeywordsResponse, tavilyQueriesResponse] = await Promise.all([
      llmServiceManager.generateText(
        {
          prompt: polymarketKeywordsPrompt,
          temperature: 0.7,
          model: MODEL,
        },
        PROVIDER
      ),
      llmServiceManager.generateText(
        {
          prompt: tavilyQueriesPrompt,
          temperature: 0.7,
          model: MODEL,
        },
        PROVIDER
      ),
    ]);

    // Parse Polymarket keywords
    console.log("📥 Received Polymarket keywords, attempting to parse...");
    let polymarketKeywords: string[] = [];
    try {
      const keywordsJson = cleanAndParseJSON(polymarketKeywordsResponse.content);
      polymarketKeywords = keywordsJson.keywords || [];
      console.log(`✅ Successfully parsed ${polymarketKeywords.length} Polymarket keywords`);
    } catch (error) {
      console.error("⚠️ Failed to parse Polymarket keywords:", error);
      polymarketKeywords = [];
    }

    // Parse Tavily queries
    console.log("📥 Received Tavily queries, attempting to parse...");
    let tavilyQueries: string[] = [];
    try {
      const queriesJson = cleanAndParseJSON(tavilyQueriesResponse.content);
      tavilyQueries = queriesJson.queries || [];
      console.log(`✅ Successfully parsed ${tavilyQueries.length} Tavily queries`);
    } catch (error) {
      console.error("⚠️ Failed to parse Tavily queries:", error);
      tavilyQueries = [];
    }

    console.log(`🔍 Polymarket keywords (${polymarketKeywords.length}):`, polymarketKeywords);
    console.log(`🔍 Tavily queries (${tavilyQueries.length}):`, tavilyQueries);

    // Step 2: Search Polymarket and Tavily in parallel
    console.log("🔍 Searching Polymarket and Tavily in parallel...");

    const [polymarketMarkets, tavilyResults] = await Promise.all([
      // Polymarket search
      (async () => {
        if (polymarketKeywords.length === 0) return [];
        try {
          const markets = await polymarketService.searchMultipleKeywords(polymarketKeywords);
          const filtered = polymarketService.filterByRelevance(markets, 500);
          console.log(`📊 Found ${filtered.length} relevant Polymarket markets`);
          return filtered;
        } catch (error) {
          console.error("Error searching Polymarket:", error);
          return [];
        }
      })(),

      // Tavily search
      (async () => {
        if (tavilyQueries.length === 0) return [];
        try {
          const results = await tavilyService.searchMultipleQueries(tavilyQueries);
          const filtered = tavilyService.filterByRelevance(results, 0.5);
          console.log(`📰 Found ${filtered.length} relevant Tavily results`);
          return filtered;
        } catch (error) {
          console.error("Error searching Tavily:", error);
          return [];
        }
      })(),
    ]);

    // Step 3: Build enriched context from Polymarket and Tavily
    let contextSections: string[] = [];

    // Polymarket context
    if (polymarketMarkets.length > 0) {
      const polymarketContext = `
📊 DATOS DE POLYMARKET (Mercados de predicción con dinero real):
Los siguientes mercados muestran probabilidades reales basadas en apuestas de miles de personas:

${polymarketMarkets.slice(0, 15).map((market, idx) =>
  `${idx + 1}. "${market.question}"
   - Probabilidad: ${market.probability}%
   - Volumen: $${(market.volume / 1000).toFixed(1)}k
   - URL: ${market.url}`
).join("\n\n")}`;
      contextSections.push(polymarketContext);
    }

    // Tavily context
    if (tavilyResults.length > 0) {
      const tavilyContext = `
📰 INFORMACIÓN ACTUAL DE INTERNET (vía Tavily):
Los siguientes son artículos y noticias recientes relevantes para esta decisión:

${tavilyResults.slice(0, 10).map((result, idx) =>
  `${idx + 1}. "${result.title}"
   - Contenido: ${result.content.substring(0, 200)}...
   - Relevancia: ${(result.score * 100).toFixed(0)}%
   - URL: ${result.url}
   ${result.publishedDate ? `- Fecha: ${result.publishedDate}` : ""}`
).join("\n\n")}`;
      contextSections.push(tavilyContext);
    }

    const enrichedContext = contextSections.length > 0
      ? `\n\nCONTEXTO DE INFORMACIÓN REAL:\n${contextSections.join("\n\n")}

IMPORTANTE: Usa este contexto real para fundamentar tus consecuencias:
- Las probabilidades de Polymarket deben INFLUIR en tus estimaciones
- La información de Tavily te da contexto actual y tendencias reales
- NO inventes consecuencias, fundamenta en los datos proporcionados`
      : "";

    console.log(`📚 Context built: ${polymarketMarkets.length} Polymarket markets + ${tavilyResults.length} Tavily results`);

    // Step 4: Generate consequences with Polymarket context (with retry logic)
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

      ${enrichedContext}

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

    // Try generating consequences with automatic retry on parse failure
    let consequences = [];
    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎲 Attempt ${attempt}/${maxRetries} to generate consequences`);

        // Lower temperature on retries for more reliable JSON
        const temperature = attempt === 1 ? 0.8 : 0.3;
        console.log(`   Temperature: ${temperature}`);

        const llmResponse = await llmServiceManager.generateText(
          {
            prompt: message,
            systemPrompt: systemPrompt,
            model: MODEL,
            temperature,
          },
          PROVIDER
        );

        console.log("📥 Received LLM response, attempting to parse...");

        const parsedResponse = cleanAndParseJSON(llmResponse.content);
        consequences = parsedResponse.consequences || [];

        if (consequences.length === 0) {
          throw new Error("No consequences found in response");
        }

        console.log(`✅ Successfully parsed ${consequences.length} consequences on attempt ${attempt}`);
        break; // Success, exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Attempt ${attempt} failed:`, lastError.message);

        if (attempt === maxRetries) {
          console.error("🚨 All retry attempts exhausted");
          throw new Error(
            `Failed to generate valid consequences after ${maxRetries} attempts. Last error: ${lastError.message}`
          );
        }

        console.log(`⏳ Retrying with lower temperature...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
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

    // Step 6: Save decision to Firestore
    console.log("💾 Saving decision to Firestore...");
    let savedDecision;
    try {
      savedDecision = await decisionFirestoreService.createDecision({
        userId: email,
        decision: message,
        consequences: consequences,
      });
      console.log("✅ Decision saved with ID:", savedDecision.id);
    } catch (error) {
      console.error("Error saving decision to Firestore:", error);
      // Continue even if saving fails - don't break the user experience
    }

    return c.json({
      consequences: consequences,
      decisionId: savedDecision?.id,
    });
  },

  // Get all decisions for a user
  getDecisions: async (c: Context) => {
    const email = c.req.query("email");

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    try {
      const decisions = await decisionFirestoreService.getDecisionsByUserId(email);
      return c.json({ decisions });
    } catch (error) {
      console.error("Error getting decisions:", error);
      return c.json({ error: "Failed to get decisions" }, 500);
    }
  },

  // Get a specific decision by ID
  getDecisionById: async (c: Context) => {
    const decisionId = c.req.param("id");
    const email = c.req.query("email");

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    try {
      const decision = await decisionFirestoreService.getDecisionById(decisionId);

      if (!decision) {
        return c.json({ error: "Decision not found" }, 404);
      }

      // Verify ownership
      if (decision.userId !== email) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      return c.json({ decision });
    } catch (error) {
      console.error("Error getting decision:", error);
      return c.json({ error: "Failed to get decision" }, 500);
    }
  },

  // Delete a decision
  deleteDecision: async (c: Context) => {
    const decisionId = c.req.param("id");
    const email = c.req.query("email");

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    try {
      await decisionFirestoreService.deleteDecision(decisionId, email);
      return c.json({ success: true });
    } catch (error) {
      console.error("Error deleting decision:", error);
      return c.json({ error: "Failed to delete decision" }, 500);
    }
  },

  // Expand a consequence (generate consequences of a consequence)
  expandConsequence: async (c: Context) => {
    const body = await c.req.json();
    const { consequence, email } = body;

    if (!consequence || !email) {
      return c.json({ error: "Consequence and email are required" }, 400);
    }

    console.log(`🌳 Expanding consequence: "${consequence.nombre}"`);

    const PROVIDER = PROVIDERS.CEREBRAS;
    const MODEL = MODELS.GPT_OSS;

    // Generate a prompt to expand this consequence
    const expansionPrompt = `La consecuencia "${consequence.nombre}" va a ocurrir.

Descripción: ${consequence.descripcion}

Ahora analiza: ¿Qué 10 nuevas consecuencias podrían derivarse de que esto ocurra?`;

    const systemPrompt = `
Eres Felipe, un asistente experto en análisis de consecuencias y exploración de futuros posibles.

El usuario ha seleccionado una consecuencia específica. Ahora debes explorar QUÉ PASARÍA SI ESA CONSECUENCIA OCURRE.

Genera exactamente 10 posibles consecuencias secundarias que podrían derivarse de que la consecuencia primaria ocurra.

IMPORTANTE sobre las probabilidades:
- Las probabilidades son INDEPENDIENTES (NO deben sumar 100%)
- Cada consecuencia tiene su propia probabilidad de ocurrir DADO que la consecuencia primaria ya ocurrió
- Incluye al menos 2-3 consecuencias de BAJA probabilidad (1-10%) pero de ALTO IMPACTO
- Las consecuencias más probables (60-80%) deben ser las más realistas
- Las consecuencias moderadas (20-50%) deben ser plausibles pero menos comunes

Para cada consecuencia debes proporcionar:
- nombre: Un nombre corto y descriptivo EN ESPAÑOL (máximo 6 palabras)
- descripcion: Una descripción detallada EN ESPAÑOL (2-3 oraciones)
- probabilidad: Un porcentaje entre 1-100 que indica qué tan probable es que esta consecuencia secundaria ocurra
- impactos: Un array de 3-5 impactos específicos EN ESPAÑOL
- polymarketQueries: Un array de 2-3 queries EN INGLÉS para Polymarket
- polymarketInfluenced: Un booleano (siempre false para expansiones)

IMPORTANTE:
- TODO el contenido (nombre, descripcion, impactos) debe estar EN ESPAÑOL
- SOLO polymarketQueries debe estar EN INGLÉS
- Debes responder ÚNICAMENTE con un JSON válido

Formato de respuesta:
{
  "consequences": [
    {
      "nombre": "string en español",
      "descripcion": "string en español",
      "probabilidad": number,
      "impactos": ["string en español", "string en español"],
      "polymarketQueries": ["query in english", "query in english"],
      "polymarketInfluenced": false
    }
  ]
}

Usuario: ${email}
`;

    try {
      const llmResponse = await llmServiceManager.generateText(
        {
          prompt: expansionPrompt,
          systemPrompt: systemPrompt,
          model: MODEL,
          temperature: 0.7,
        },
        PROVIDER
      );

      console.log("📥 Received expansion response, attempting to parse...");
      const parsedResponse = cleanAndParseJSON(llmResponse.content);
      const expandedConsequences = parsedResponse.consequences || [];
      console.log(`✅ Generated ${expandedConsequences.length} expanded consequences`);

      // Add empty relatedMarkets to each consequence
      const consequencesWithMarkets = expandedConsequences.map((cons: any) => ({
        ...cons,
        relatedMarkets: [],
      }));

      return c.json({
        consequences: consequencesWithMarkets,
      });
    } catch (error) {
      console.error("Error expanding consequence:", error);
      return c.json({ error: "Failed to expand consequence" }, 500);
    }
  },
};
