import { apiFetch } from "./api.service";

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  probability: number;
  volume: number;
  liquidity: number;
  endDate: string;
  url: string;
  active: boolean;
  outcomes?: string[];
}

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface Consequence {
  nombre: string;
  descripcion: string;
  probabilidad: number;
  impactos: string[];
  polymarketQueries: string[];
  polymarketInfluenced: boolean;
  relatedMarkets: PolymarketMarket[];
  expandedConsequences?: Consequence[]; // Consecuencias expandidas recursivamente
}

export interface StartDecisionMakingRequest {
  message: string;
  email: string;
}

export interface StartDecisionMakingResponse {
  inputType?: "decision" | "question";
  consequences: Consequence[];
  decisionId?: string;
  tavilyResults?: TavilyResult[];
}

export interface Decision {
  id: string;
  userId: string;
  decision: string;
  consequences: Consequence[];
  createdAt: string;
  updatedAt?: string;
}

export interface GetDecisionsResponse {
  decisions: Decision[];
}

export interface GetDecisionByIdResponse {
  decision: Decision;
}

/**
 * Felipe service - handles all Felipe-related API calls
 */
export const felipeService = {
  /**
   * Analyze a decision and get possible consequences
   */
  async startDecisionMaking(
    request: StartDecisionMakingRequest
  ): Promise<{
    inputType?: "decision" | "question";
    consequences: Consequence[];
    decisionId?: string;
    tavilyResults?: TavilyResult[];
  }> {
    const response = await apiFetch<StartDecisionMakingResponse>(
      "/felipe/start-decision-making",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    // Sort consequences by probability (highest first)
    const sortedConsequences = response.consequences.sort(
      (a, b) => b.probabilidad - a.probabilidad
    );

    return {
      inputType: response.inputType,
      consequences: sortedConsequences,
      decisionId: response.decisionId,
      tavilyResults: response.tavilyResults,
    };
  },

  /**
   * Get all decisions for the current user
   */
  async getDecisions(email: string): Promise<Decision[]> {
    const response = await apiFetch<GetDecisionsResponse>(
      `/felipe/decisions?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
      }
    );

    return response.decisions;
  },

  /**
   * Get a specific decision by ID
   */
  async getDecisionById(
    decisionId: string,
    email: string
  ): Promise<Decision> {
    const response = await apiFetch<GetDecisionByIdResponse>(
      `/felipe/decisions/${decisionId}?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
      }
    );

    return response.decision;
  },

  /**
   * Delete a decision
   */
  async deleteDecision(decisionId: string, email: string): Promise<void> {
    await apiFetch(
      `/felipe/decisions/${decisionId}?email=${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );
  },

  /**
   * Expand a consequence (get consequences of a consequence)
   */
  async expandConsequence(
    decisionId: string,
    nodeId: string,
    originalDecision: string,
    consequence: Consequence,
    email: string
  ): Promise<Consequence[]> {
    const response = await apiFetch<StartDecisionMakingResponse>(
      "/felipe/expand-consequence",
      {
        method: "POST",
        body: JSON.stringify({
          decisionId,
          nodeId,
          originalDecision,
          consequence,
          email,
        }),
      }
    );

    return response.consequences;
  },
};
