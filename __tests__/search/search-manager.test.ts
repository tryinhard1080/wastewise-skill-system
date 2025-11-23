/**
 * SearchManager Tests
 *
 * Test multi-provider search with fallbacks and caching.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchManager } from "@/lib/search/search-manager";
import type { SearchProvider, SearchResult } from "@/lib/search/types";

// Mock logger and metrics
vi.mock("@/lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/observability/metrics", () => ({
  metrics: {
    startTimer: vi.fn(() => "timer-id"),
    stopTimer: vi.fn(),
    increment: vi.fn(),
  },
}));

describe("SearchManager", () => {
  // Store original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  // afterEach is defined by vitest
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const afterEach = (fn: () => void) => fn();

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe("Initialization", () => {
    it("should initialize with Exa provider when EXA_API_KEY is set", () => {
      process.env.EXA_API_KEY = "test-exa-key";
      const manager = new SearchManager();

      expect(manager.getProviders()).toContain("exa");
    });

    it("should initialize with Tavily provider when TAVILY_API_KEY is set", () => {
      process.env.TAVILY_API_KEY = "test-tavily-key";
      const manager = new SearchManager();

      expect(manager.getProviders()).toContain("tavily");
    });

    it("should initialize with Brave provider when BRAVE_API_KEY is set", () => {
      process.env.BRAVE_API_KEY = "test-brave-key";
      const manager = new SearchManager();

      expect(manager.getProviders()).toContain("brave");
    });

    it("should initialize with all providers when all keys are set", () => {
      process.env.EXA_API_KEY = "test-exa-key";
      process.env.TAVILY_API_KEY = "test-tavily-key";
      process.env.BRAVE_API_KEY = "test-brave-key";
      const manager = new SearchManager();

      expect(manager.getProviders()).toEqual(["exa", "tavily", "brave"]);
    });

    it("should throw error when no providers are configured", () => {
      // Clear all search provider env vars
      delete process.env.EXA_API_KEY;
      delete process.env.TAVILY_API_KEY;
      delete process.env.BRAVE_API_KEY;

      expect(() => new SearchManager()).toThrow(
        "No search providers configured",
      );
    });
  });

  describe("Cache Functionality", () => {
    beforeEach(() => {
      process.env.EXA_API_KEY = "test-key";
    });

    it("should return cached results on second identical search", async () => {
      const manager = new SearchManager();

      // Mock the provider's search method
      const mockResults: SearchResult[] = [
        {
          title: "Test Result",
          url: "https://example.com",
          snippet: "Test snippet",
        },
      ];

      // @ts-expect-error - Access protected property for testing
      const provider = manager.providers[0];
      provider.search = vi.fn().mockResolvedValue(mockResults);

      // First search - should call provider
      const result1 = await manager.search("test query");
      expect(result1.cached).toBe(false);
      expect(provider.search).toHaveBeenCalledTimes(1);

      // Second search - should return cached
      const result2 = await manager.search("test query");
      expect(result2.cached).toBe(true);
      expect(provider.search).toHaveBeenCalledTimes(1); // Not called again
    });

    it("should not cache different queries", async () => {
      const manager = new SearchManager();

      // @ts-expect-error - Access protected property for testing
      const provider = manager.providers[0];
      provider.search = vi.fn().mockResolvedValue([]);

      await manager.search("query 1");
      await manager.search("query 2");

      expect(provider.search).toHaveBeenCalledTimes(2);
    });

    it("should allow cache clearing", async () => {
      const manager = new SearchManager();

      // @ts-expect-error - Access protected property for testing
      const provider = manager.providers[0];
      provider.search = vi.fn().mockResolvedValue([]);

      // First search
      await manager.search("test query");

      // Clear cache
      await manager.clearCache();

      // Second search - should call provider again
      await manager.search("test query");
      expect(provider.search).toHaveBeenCalledTimes(2);
    });

    it("should provide cache statistics", async () => {
      const manager = new SearchManager();

      // @ts-expect-error - Access protected property for testing
      const provider = manager.providers[0];
      provider.search = vi.fn().mockResolvedValue([]);

      // Perform some searches
      await manager.search("query 1");
      await manager.search("query 2");
      await manager.search("query 1"); // Cache hit

      const stats = await manager.getCacheStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  describe("Health Checks", () => {
    it("should check health of all providers", async () => {
      process.env.EXA_API_KEY = "test-exa-key";
      process.env.TAVILY_API_KEY = "test-tavily-key";
      process.env.BRAVE_API_KEY = "test-brave-key";

      const manager = new SearchManager();

      // @ts-expect-error - Mock isAvailable for all providers
      manager.providers.forEach((provider) => {
        provider.isAvailable = vi.fn().mockResolvedValue(true);
      });

      const health = await manager.healthCheck();

      expect(health).toEqual({
        exa: true,
        tavily: true,
        brave: true,
      });
    });

    it("should detect unhealthy providers", async () => {
      process.env.EXA_API_KEY = "test-key";

      const manager = new SearchManager();

      // @ts-expect-error - Mock unhealthy provider
      manager.providers[0].isAvailable = vi.fn().mockResolvedValue(false);

      const health = await manager.healthCheck();

      expect(health.exa).toBe(false);
    });
  });

  describe("Provider Fallback", () => {
    beforeEach(() => {
      process.env.EXA_API_KEY = "test-exa-key";
      process.env.TAVILY_API_KEY = "test-tavily-key";
      process.env.BRAVE_API_KEY = "test-brave-key";
    });

    it("should fallback to second provider when first fails", async () => {
      const manager = new SearchManager();

      const mockResults: SearchResult[] = [
        { title: "Result", url: "https://example.com", snippet: "Test" },
      ];

      // @ts-expect-error - Mock first provider to fail, second to succeed
      manager.providers[0].search = vi
        .fn()
        .mockRejectedValue(new Error("Provider 1 failed"));
      // @ts-expect-error - Mock second provider to succeed
      manager.providers[1].search = vi.fn().mockResolvedValue(mockResults);

      const result = await manager.search("test query");

      expect(result.provider).toBe("tavily");
      expect(result.results).toEqual(mockResults);
      // @ts-expect-error - Access protected property
      expect(manager.providers[0].search).toHaveBeenCalled();
      // @ts-expect-error - Access protected property
      expect(manager.providers[1].search).toHaveBeenCalled();
    });

    it("should fallback through all providers until one succeeds", async () => {
      const manager = new SearchManager();

      const mockResults: SearchResult[] = [
        { title: "Result", url: "https://example.com", snippet: "Test" },
      ];

      // @ts-expect-error - Mock first two to fail, third to succeed
      manager.providers[0].search = vi
        .fn()
        .mockRejectedValue(new Error("Failed"));
      // @ts-expect-error - Mock second to fail
      manager.providers[1].search = vi
        .fn()
        .mockRejectedValue(new Error("Failed"));
      // @ts-expect-error - Mock third to succeed
      manager.providers[2].search = vi.fn().mockResolvedValue(mockResults);

      const result = await manager.search("test query");

      expect(result.provider).toBe("brave");
      expect(result.results).toEqual(mockResults);
    });

    it("should throw error when all providers fail", async () => {
      const manager = new SearchManager();

      // @ts-expect-error - Mock all providers to fail
      manager.providers.forEach((provider) => {
        provider.search = vi.fn().mockRejectedValue(new Error("Failed"));
      });

      await expect(manager.search("test query")).rejects.toThrow(
        "Search failed",
      );
    });
  });

  describe("Search Options", () => {
    beforeEach(() => {
      process.env.EXA_API_KEY = "test-key";
    });

    it("should pass search options to provider", async () => {
      const manager = new SearchManager();

      // @ts-expect-error - Access protected property
      const provider = manager.providers[0];
      provider.search = vi.fn().mockResolvedValue([]);

      const options = {
        maxResults: 5,
        domains: ["example.com"],
        excludeDomains: ["spam.com"],
        dateFilter: "week" as const,
      };

      await manager.search("test query", options);

      expect(provider.search).toHaveBeenCalledWith("test query", options);
    });
  });

  describe("Performance Tracking", () => {
    beforeEach(() => {
      process.env.EXA_API_KEY = "test-key";
    });

    it("should track execution time", async () => {
      const manager = new SearchManager();

      // @ts-expect-error - Access protected property
      manager.providers[0].search = vi.fn().mockResolvedValue([]);

      const result = await manager.search("test query");

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
