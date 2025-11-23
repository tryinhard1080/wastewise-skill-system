/**
 * Search API Types
 *
 * Common interfaces for multi-provider search abstraction layer.
 * Supports Exa, Tavily, Brave Search with automatic fallbacks.
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  provider: string;
  cached: boolean;
  executionTime: number;
}

export interface SearchOptions {
  maxResults?: number;
  dateFilter?: "day" | "week" | "month" | "year";
  domains?: string[]; // Filter by specific domains
  excludeDomains?: string[];
}

export interface SearchProvider {
  name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  isAvailable(): Promise<boolean>;
}

export interface ProviderHealth {
  [provider: string]: boolean;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  maxAge: number;
  hitRate?: number;
}
