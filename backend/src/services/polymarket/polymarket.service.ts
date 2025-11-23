// Polymarket service for searching prediction markets

import type {
  PolymarketSearchResponse,
  PolymarketSearchParams,
  PolymarketMarket,
  PolymarketEvent,
  PolymarketMarketResponse,
} from "./types/polymarket.types.js";

const POLYMARKET_API_BASE = "https://gamma-api.polymarket.com";
const DEFAULT_TIMEOUT = 5000; // 5 seconds

export class PolymarketService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = POLYMARKET_API_BASE, timeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Search markets on Polymarket
   */
  async searchMarkets(params: PolymarketSearchParams): Promise<PolymarketSearchResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", params.q);

    if (params.limit_per_type !== undefined) {
      queryParams.append("limit_per_type", params.limit_per_type.toString());
    }
    if (params.keep_closed_markets !== undefined) {
      queryParams.append("keep_closed_markets", params.keep_closed_markets.toString());
    }
    if (params.search_tags !== undefined) {
      queryParams.append("search_tags", params.search_tags.toString());
    }
    if (params.search_profiles !== undefined) {
      queryParams.append("search_profiles", params.search_profiles.toString());
    }

    const url = `${this.baseUrl}/public-search?${queryParams.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as PolymarketSearchResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Polymarket request timeout");
      }
      throw error;
    }
  }

  /**
   * Search multiple keywords and aggregate results
   */
  async searchMultipleKeywords(keywords: string[]): Promise<PolymarketMarket[]> {
    const searchPromises = keywords.map((keyword) =>
      this.searchMarkets({
        q: keyword,
        limit_per_type: 5,
        keep_closed_markets: 0,
        search_tags: false,
        search_profiles: false,
      }).catch((error) => {
        console.error(`Error searching Polymarket for "${keyword}":`, error);
        return null;
      })
    );

    const results = await Promise.all(searchPromises);
    const markets: PolymarketMarket[] = [];
    const seenIds = new Set<string>();

    for (const result of results) {
      if (!result) continue;

      for (const event of result.events) {
        for (const market of event.markets) {
          // Skip if we've already seen this market
          if (seenIds.has(market.id)) continue;

          const processedMarket = this.processMarket(market, event);
          if (processedMarket) {
            markets.push(processedMarket);
            seenIds.add(market.id);
          }
        }
      }
    }

    // Sort by volume (most traded first)
    return markets.sort((a, b) => b.volume - a.volume);
  }

  /**
   * Process a raw market response into our format
   */
  private processMarket(
    market: PolymarketMarketResponse,
    event: PolymarketEvent
  ): PolymarketMarket | null {
    try {
      // Calculate probability - prefer lastTradePrice, fallback to outcomePrices
      let probability = 50; // default

      if (market.lastTradePrice !== undefined && market.lastTradePrice !== null) {
        // lastTradePrice is already in decimal format (0.0-1.0)
        probability = Math.round(market.lastTradePrice * 100);
        console.log(`  📊 Using lastTradePrice: ${market.lastTradePrice} → ${probability}%`);
      } else if (market.outcomePrices && market.outcomePrices.length > 0) {
        // First outcome price is typically the "Yes" probability (as string)
        const firstOutcomePrice = parseFloat(market.outcomePrices[0] || "0.5");
        probability = Math.round(firstOutcomePrice * 100);
        console.log(`  📊 Using outcomePrices[0]: ${market.outcomePrices[0]} → ${probability}%`);
      } else {
        console.log(`  ⚠️  No price data, using default: ${probability}%`);
      }

      const volumeNum = market.volumeNum ?? parseFloat(market.volume || "0");
      const liquidityNum = market.liquidityNum ?? parseFloat(market.liquidity || "0");

      const processedMarket: PolymarketMarket = {
        id: market.id,
        question: market.question,
        probability,
        volume: volumeNum,
        liquidity: liquidityNum,
        endDate: market.endDate || event.endDate || "",
        url: `https://polymarket.com/event/${event.slug}`,
        active: market.active !== undefined ? market.active : (market.closed !== undefined ? !market.closed : true),
      };

      // Add optional fields only if they have non-undefined values
      const description = market.description || event.description;
      if (description !== undefined) {
        processedMarket.description = description;
      }

      if (market.outcomes !== undefined) {
        processedMarket.outcomes = market.outcomes;
      }

      return processedMarket;
    } catch (error) {
      console.error("Error processing market:", error);
      return null;
    }
  }

  /**
   * Filter markets by relevance score
   */
  filterByRelevance(
    markets: PolymarketMarket[],
    minVolume: number = 1000,
    minProbability: number = 5,
    maxProbability: number = 95
  ): PolymarketMarket[] {
    const filtered = markets.filter((market) => {
      const meetsVolume = market.volume >= minVolume;
      const meetsActive = market.active;
      const meetsProbability = market.probability >= minProbability && market.probability <= maxProbability;

      if (!meetsActive) {
        console.log(`  ❌ Filtered out "${market.question}" - not active`);
        return false;
      }

      if (!meetsVolume) {
        console.log(`  ❌ Filtered out "${market.question}" - low volume ($${market.volume.toFixed(0)})`);
        return false;
      }

      if (!meetsProbability) {
        console.log(`  ❌ Filtered out "${market.question}" - extreme probability (${market.probability}%)`);
        return false;
      }

      return true;
    });

    console.log(`  ✅ Filtered: ${markets.length} → ${filtered.length} markets`);
    return filtered.slice(0, 30); // Max 30 markets total
  }
}

// Singleton instance
export const polymarketService = new PolymarketService();
