import { apiFetch } from "./api.service";

export interface Consequence {
  nombre: string;
  descripcion: string;
  probabilidad: number;
  impactos: string[];
}

export interface StartDecisionMakingRequest {
  message: string;
  email: string;
}

export interface StartDecisionMakingResponse {
  consequences: Consequence[];
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
  ): Promise<Consequence[]> {
    const response = await apiFetch<StartDecisionMakingResponse>(
      "/felipe/start-decision-making",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    // Sort consequences by probability (highest first)
    return response.consequences.sort(
      (a, b) => b.probabilidad - a.probabilidad
    );
  },
};
