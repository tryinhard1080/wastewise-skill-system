/**
 * Search Manager
 *
 * Multi-provider search abstraction with automatic fallbacks and caching.
 *
 * Features:
 * - Automatic failover to backup providers
 * - Response caching to reduce API costs
 * - Performance monitoring
 * - Health checks
 *
 * Provider Priority (fallback order):
 * 1. Exa (primary - best for semantic/ordinance search)
 * 2. Tavily (fallback - good for general search)
 * 3. Brave (fallback - general web search)
 */

import { ExaProvider } from "./providers/exa-provider";
import { TavilyProvider } from "./providers/tavily-provider";
import { BraveProvider } from "./providers/brave-provider";
import { SearchCache } from "./search-cache";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";
import type {
  SearchProvider,
  SearchResponse,
  SearchOptions,
  ProviderHealth,
} from "./types";

export class SearchManager {
  // Protected for testing purposes
  protected providers: SearchProvider[];
  private cache: SearchCache;

  constructor() {
    // Initialize providers (order determines fallback priority)
    this.providers = [];

    // Primary: Exa (best for semantic search and ordinances)
    if (process.env.EXA_API_KEY) {
      try {
        this.providers.push(new ExaProvider(process.env.EXA_API_KEY));
        logger.info("Exa provider initialized");
      } catch (error) {
        logger.warn("Failed to initialize Exa provider", {
          error: (error as Error).message,
        });
      }
    }

    // Fallback 1: Tavily
    if (process.env.TAVILY_API_KEY) {
      try {
        this.providers.push(new TavilyProvider(process.env.TAVILY_API_KEY));
        logger.info("Tavily provider initialized");
      } catch (error) {
        logger.warn("Failed to initialize Tavily provider", {
          error: (error as Error).message,
        });
      }
    }

    // Fallback 2: Brave
    if (process.env.BRAVE_API_KEY) {
      try {
        this.providers.push(new BraveProvider(process.env.BRAVE_API_KEY));
        logger.info("Brave provider initialized");
      } catch (error) {
        logger.warn("Failed to initialize Brave provider", {
          error: (error as Error).message,
        });
      }
    }

    if (this.providers.length === 0) {
      throw new Error(
        "No search providers configured. Set at least one: EXA_API_KEY, TAVILY_API_KEY, or BRAVE_API_KEY",
      );
    }

    logger.info("SearchManager initialized", {
      providers: this.providers.map((p) => p.name),
    });

    this.cache = new SearchCache();
  }

  /**
   * Search with automatic fallbacks and caching
   */
  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse> {
    const startTime = performance.now();
    const timerId = metrics.startTimer("search.execution");

    // Check cache first
    const cached = await this.cache.get(query, options);
    if (cached) {
      metrics.stopTimer(timerId);
      metrics.increment("search.cache_hit");

      logger.info("Search cache hit", {
        query: query.substring(0, 50),
        provider: cached.provider,
      });

      return {
        ...cached,
        cached: true,
        executionTime: performance.now() - startTime,
      };
    }

    metrics.increment("search.cache_miss");

    // Try each provider until one succeeds
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        logger.info("Attempting search", {
          query: query.substring(0, 50),
          provider: provider.name,
        });

        const results = await provider.search(query, options);

        const response: SearchResponse = {
          query,
          results,
          provider: provider.name,
          cached: false,
          executionTime: performance.now() - startTime,
        };

        // Cache successful response
        await this.cache.set(query, options, response);

        metrics.stopTimer(timerId);
        metrics.increment(`search.provider.${provider.name}.success`);

        logger.info("Search successful", {
          query: query.substring(0, 50),
          provider: provider.name,
          resultCount: results.length,
          executionTime: response.executionTime,
        });

        return response;
      } catch (error) {
        lastError = error as Error;
        metrics.increment(`search.provider.${provider.name}.failed`);

        logger.warn("Search provider failed, trying next", {
          query: query.substring(0, 50),
          provider: provider.name,
          error: lastError.message,
        });

        continue;
      }
    }

    // All providers failed
    metrics.stopTimer(timerId);
    metrics.increment("search.all_providers_failed");

    logger.error("All search providers failed", lastError!, {
      query: query.substring(0, 50),
      providers: this.providers.map((p) => p.name),
    });

    throw new Error(
      `Search failed: ${lastError?.message || "All providers unavailable"}`,
    );
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<ProviderHealth> {
    const health: ProviderHealth = {};

    await Promise.all(
      this.providers.map(async (provider) => {
        try {
          health[provider.name] = await provider.isAvailable();
        } catch {
          health[provider.name] = false;
        }
      }),
    );

    logger.info("Provider health check completed", { health });

    return health;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.stats();
  }

  /**
   * Clear cache
   */
  async clearCache() {
    await this.cache.clear();
    logger.info("Search cache cleared");
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanupCache() {
    const removed = await this.cache.cleanup();
    logger.info("Cache cleanup completed", { entriesRemoved: removed });
    return removed;
  }

  /**
   * Get list of available providers
   */
  getProviders(): string[] {
    return this.providers.map((p) => p.name);
  }
}

// Singleton instance
let searchManagerInstance: SearchManager | null = null;

/**
 * Get the shared SearchManager instance
 */
export function getSearchManager(): SearchManager {
  if (!searchManagerInstance) {
    searchManagerInstance = new SearchManager();
  }
  return searchManagerInstance;
}
