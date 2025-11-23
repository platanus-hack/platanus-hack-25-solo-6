// Decision types for Firestore

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

export interface Decision {
  id: string;
  userId: string; // email del usuario
  decision: string; // texto de la decisión
  consequences: Consequence[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDecisionRequest {
  userId: string;
  decision: string;
  consequences: Consequence[];
}
