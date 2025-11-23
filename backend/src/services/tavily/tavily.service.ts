// Tavily search service for real-time web information

import type {
  TavilySearchParams,
  TavilySearchResponse,
  TavilySearchResult,
} from "./types/tavily.types.js";

const TAVILY_API_URL = "https://api.tavily.com/search";
const DEFAULT_TIMEOUT = 5000; // 5 seconds

export class TavilyService {
  private apiKey: string;
  private timeout: number;

  constructor(apiKey: string, timeout: number = DEFAULT_TIMEOUT) {
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Search web with Tavily
   */
  async search(params: TavilySearchParams): Promise<TavilySearchResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(TAVILY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: params.query,
          search_depth: params.searchDepth || "basic",
          include_answer: params.includeAnswer ?? true,
          include_images: params.includeImages ?? false,
          max_results: params.maxResults || 5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      return {
        query: params.query,
        results: data.results || [],
        images: data.images,
        answer: data.answer,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Tavily request timeout");
      }
      throw error;
    }
  }

  /**
   * Search multiple queries in parallel
   */
  async searchMultipleQueries(queries: string[]): Promise<TavilySearchResult[]> {
    const searchPromises = queries.map((query) =>
      this.search({
        query,
        searchDepth: "basic",
        includeAnswer: true,
        maxResults: 3,
      }).catch((error) => {
        console.error(`Error searching Tavily for "${query}":`, error);
        return null;
      })
    );

    const results = await Promise.all(searchPromises);
    const allResults: TavilySearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const result of results) {
      if (!result) continue;

      for (const item of result.results) {
        // Skip duplicates
        if (seenUrls.has(item.url)) continue;

        allResults.push(item);
        seenUrls.add(item.url);
      }
    }

    // Sort by score (highest first)
    return allResults.sort((a, b) => b.score - a.score);
  }

  /**
   * Filter results by relevance score
   */
  filterByRelevance(results: TavilySearchResult[], minScore: number = 0.5): TavilySearchResult[] {
    return results
      .filter((result) => result.score >= minScore)
      .slice(0, 15); // Max 15 results
  }
}

// Singleton instance
const apiKey = process.env["TAVILY_API_KEY"] || "";
if (!apiKey) {
  console.warn("⚠️  TAVILY_API_KEY not found in environment variables");
}

export const tavilyService = new TavilyService(apiKey);
