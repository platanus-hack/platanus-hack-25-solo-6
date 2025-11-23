// Polymarket service for searching prediction markets

import type {
  PolymarketSearchResponse,
  PolymarketSearchParams,
  PolymarketMarket,
  PolymarketEvent,
  PolymarketMarketResponse,
} from "./types/polymarket.types.js";

const POLYMARKET_API_BASE = "https://gamma-api.polymarket.com";
const DEFAULT_TIMEOUT = 10000; // 10 seconds (increased for reliability)

export class PolymarketService {
  private baseUrl: string;
  private timeout: number;

  constructor(
    baseUrl: string = POLYMARKET_API_BASE,
    timeout: number = DEFAULT_TIMEOUT
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Search markets on Polymarket
   */
  async searchMarkets(
    params: PolymarketSearchParams
  ): Promise<PolymarketSearchResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", params.q);

    if (params.limit_per_type !== undefined) {
      queryParams.append("limit_per_type", params.limit_per_type.toString());
    }
    if (params.keep_closed_markets !== undefined) {
      queryParams.append(
        "keep_closed_markets",
        params.keep_closed_markets.toString()
      );
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
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Polymarket API error: ${response.status} ${response.statusText}`
        );
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
   * Search a single keyword with retry logic
   */
  private async searchKeywordWithRetry(
    keyword: string,
    maxRetries: number = 1
  ): Promise<PolymarketSearchResponse | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          console.log(
            `  ⏳ Retrying "${keyword}" after ${delay}ms (attempt ${
              attempt + 1
            }/${maxRetries + 1})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const result = await this.searchMarkets({
          q: keyword,
          limit_per_type: 15,
          keep_closed_markets: 0,
          search_tags: false,
          search_profiles: false,
        });

        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(
            `❌ Failed to search "${keyword}" after ${
              maxRetries + 1
            } attempts:`,
            error instanceof Error ? error.message : String(error)
          );
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Search multiple keywords in batches with retry logic
   * More reliable than Promise.all - doesn't overwhelm the API
   */
  async searchMultipleKeywords(
    keywords: string[]
  ): Promise<PolymarketMarket[]> {
    const BATCH_SIZE = 4; // Process 4 keywords at a time
    const markets: PolymarketMarket[] = [];
    const seenIds = new Set<string>();

    console.log(
      `🔍 Searching ${keywords.length} keywords in batches of ${BATCH_SIZE}...`
    );

    // Process keywords in batches
    for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
      const batch = keywords.slice(i, i + BATCH_SIZE);
      console.log(
        `  📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(", ")}`
      );

      // Search this batch in parallel (with retry)
      const batchPromises = batch.map((keyword) =>
        this.searchKeywordWithRetry(keyword, 1)
      );
      const batchResults = await Promise.all(batchPromises);

      // Process results from this batch
      for (const result of batchResults) {
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
    }

    console.log(`✅ Found ${markets.length} unique markets from all keywords`);

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

      if (
        market.lastTradePrice !== undefined &&
        market.lastTradePrice !== null
      ) {
        // lastTradePrice is already in decimal format (0.0-1.0)
        probability = Math.round(market.lastTradePrice * 100);

        // console.log(
        //   `  📊 Using lastTradePrice: ${market.lastTradePrice} → ${probability}%`
        // );
      } else if (market.outcomePrices && market.outcomePrices.length > 0) {
        // First outcome price is typically the "Yes" probability (as string)
        const firstOutcomePrice = parseFloat(market.outcomePrices[0] || "0.5");
        probability = Math.round(firstOutcomePrice * 100);
        // console.log(
        //   `  📊 Using outcomePrices[0]: ${market.outcomePrices[0]} → ${probability}%`
        // );
      } else {
        console.log(`  ⚠️  No price data, using default: ${probability}%`);
      }

      const volumeNum = market.volumeNum ?? parseFloat(market.volume || "0");
      const liquidityNum =
        market.liquidityNum ?? parseFloat(market.liquidity || "0");

      const processedMarket: PolymarketMarket = {
        id: market.id,
        question: market.question,
        probability,
        volume: volumeNum,
        liquidity: liquidityNum,
        endDate: market.endDate || event.endDate || "",
        url: `https://polymarket.com/event/${event.slug}`,
        active:
          market.active !== undefined
            ? market.active
            : market.closed !== undefined
            ? !market.closed
            : true,
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
   * Get trending/popular markets by searching broad categories
   */
  async getTrendingMarkets(limit: number = 30): Promise<PolymarketMarket[]> {
    console.log("🔥 Fetching trending markets from Polymarket...");

    // Search broad categories to get popular current markets
    const trendingKeywords = [
      "trump",
      "election",
      "politics",
      "economy",
      "stock market",
      "crypto",
      "bitcoin",
      "AI",
      "technology",
      "sports",
      "world",
      "war",
      "climate",
    ];

    const markets = await this.searchMultipleKeywords(trendingKeywords);

    const now = new Date();

    // Sort by volume (highest first) and take top N
    const sortedMarkets = markets
      .filter((m) => {
        // Check active
        if (!m.active) return false;

        // Check volume
        if (m.volume <= 100) return false;

        // Check if not expired
        if (m.endDate && m.endDate.length > 0) {
          const endDate = new Date(m.endDate);
          if (endDate <= now) {
            // console.log(`  ❌ Trending market expired: "${m.question}" (${m.endDate})`);
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);

    console.log(`🔥 Found ${sortedMarkets.length} trending markets`);
    return sortedMarkets;
  }

  /**
   * Filter markets by relevance score
   */
  filterByRelevance(
    markets: PolymarketMarket[],
    minVolume: number = 100,
    minProbability: number = 1,
    maxProbability: number = 99
  ): PolymarketMarket[] {
    // const now = new Date();

    const filtered = markets.filter((market) => {
      const meetsVolume = market.volume >= minVolume;
      const meetsActive = market.active;
      const meetsProbability =
        market.probability >= minProbability &&
        market.probability <= maxProbability;

      // Check if market has already ended (endDate < now)
      // let isNotExpired = true;

      // if (market.endDate && market.endDate.length > 0) {
      //   const endDate = new Date(market.endDate);
      //   isNotExpired = endDate > now;
      // }

      if (!meetsActive) {
        console.log(`  ❌ Filtered out "${market.question}" - not active`);
        return false;
      }

      // if (!isNotExpired) {
      //   console.log(
      //     `  ❌ Filtered out "${market.question}" - already ended (${market.endDate})`
      //   );
      //   return false;
      // }

      if (!meetsVolume) {
        // console.log(
        //   `  ❌ Filtered out "${
        //     market.question
        //   }" - low volume ($${market.volume.toFixed(0)})`
        // );
        return false;
      }

      if (!meetsProbability) {
        // console.log(
        //   `  ❌ Filtered out "${market.question}" - extreme probability (${market.probability}%)`
        // );
        return false;
      }

      return true;
    });

    console.log(
      `  ✅ Filtered: ${markets.length} → ${filtered.length} markets`
    );
    return filtered.slice(0, 30); // Max 30 markets total
  }
}

// Singleton instance
export const polymarketService = new PolymarketService();
