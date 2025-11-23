// Tavily API types

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  images?: string[];
  answer?: string;
}

export interface TavilySearchParams {
  query: string;
  searchDepth?: "basic" | "advanced";
  includeAnswer?: boolean;
  includeImages?: boolean;
  maxResults?: number;
}
