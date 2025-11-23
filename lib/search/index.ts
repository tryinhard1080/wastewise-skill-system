/**
 * Search API Abstraction Layer
 *
 * Multi-provider search with automatic fallbacks and caching.
 *
 * Usage:
 * ```typescript
 * import { getSearchManager } from '@/lib/search'
 *
 * const searchManager = getSearchManager()
 * const results = await searchManager.search('query', { maxResults: 10 })
 * ```
 */

export { SearchManager, getSearchManager } from "./search-manager";
export { SearchCache } from "./search-cache";
export { ExaProvider } from "./providers/exa-provider";
export { TavilyProvider } from "./providers/tavily-provider";
export { BraveProvider } from "./providers/brave-provider";

export type {
  SearchResult,
  SearchResponse,
  SearchOptions,
  SearchProvider,
  ProviderHealth,
  CacheStats,
} from "./types";
