// Polymarket API types

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  probability: number; // 0-100
  volume: number;
  liquidity: number;
  endDate: string;
  url: string;
  active: boolean;
  outcomes?: string[];
}

export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  markets: PolymarketMarketResponse[];
  tags?: string[];
  enableOrderBook?: boolean;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
}

export interface PolymarketMarketResponse {
  id: string;
  question: string;
  description?: string;
  outcomes?: string[];
  outcomePrices?: string[];
  lastTradePrice?: number;
  bestBid?: number;
  bestAsk?: number;
  volume?: string;
  volumeNum?: number;
  liquidity?: string;
  liquidityNum?: number;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  enableOrderBook?: boolean;
}

export interface PolymarketSearchResponse {
  events: PolymarketEvent[];
  tags: Array<{
    id: string;
    label: string;
    slug: string;
    event_count: number;
  }>;
  profiles: Array<any>;
  pagination: {
    hasMore: boolean;
    totalResults: number;
  };
}

export interface PolymarketSearchParams {
  q: string;
  limit_per_type?: number;
  keep_closed_markets?: number;
  search_tags?: boolean;
  search_profiles?: boolean;
}
