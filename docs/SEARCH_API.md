# Search API Documentation

Multi-provider search abstraction layer with automatic fallbacks and caching for WasteWise regulatory research.

## Overview

The Search API provides a unified interface for multiple search providers (Exa, Tavily, Brave Search) with automatic failover, response caching, and performance monitoring.

### Key Features

- **Multi-provider support**: Exa (primary), Tavily, Brave Search
- **Automatic fallbacks**: If one provider fails, automatically tries the next
- **Response caching**: Reduce API costs with 24-hour cache (configurable)
- **Performance tracking**: Execution time and cache hit rates
- **Health monitoring**: Check provider availability

## Architecture

```
┌─────────────────┐
│ SearchManager   │  ← Single entry point
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────┐  ┌──────────────┐
│ SearchCache │  │  Providers   │
└─────────────┘  │              │
                 ├─ Exa         │
                 ├─ Tavily      │
                 └─ Brave       │
                 └──────────────┘
```

## Configuration

### Environment Variables

Configure at least one search provider in `.env.local`:

```bash
# Primary provider (recommended)
EXA_API_KEY=your-exa-key-here

# Fallback providers (optional but recommended for redundancy)
TAVILY_API_KEY=your-tavily-key-here
BRAVE_API_KEY=your-brave-key-here
```

### Provider Priority (Fallback Order)

1. **Exa** (primary) - Best for semantic search and ordinance discovery
2. **Tavily** (fallback) - AI-native general web search
3. **Brave** (fallback) - General web search

The system automatically tries providers in order until one succeeds.

### Getting API Keys

- **Exa**: [https://exa.ai](https://exa.ai) - Semantic search, excellent for ordinances
- **Tavily**: [https://tavily.com](https://tavily.com) - AI-native search API
- **Brave**: [https://brave.com/search/api](https://brave.com/search/api) - Web search API

## Usage

### Basic Search

```typescript
import { getSearchManager } from "@/lib/search";

const searchManager = getSearchManager();

const response = await searchManager.search(
  "Austin, TX waste management ordinances",
  {
    maxResults: 10,
    domains: ["municode.com", ".gov"],
  },
);

console.log(response.provider); // 'exa'
console.log(response.cached); // false (first call)
console.log(response.results); // Array of search results
```

### Search Options

```typescript
interface SearchOptions {
  maxResults?: number; // Default: 10
  dateFilter?: "day" | "week" | "month" | "year";
  domains?: string[]; // Filter by specific domains
  excludeDomains?: string[]; // Exclude specific domains
}

// Example with all options
const response = await searchManager.search("waste ordinances", {
  maxResults: 5,
  dateFilter: "year", // Only results from last year
  domains: ["municode.com"], // Only from municode.com
  excludeDomains: ["spam.com"], // Exclude spam.com
});
```

### Health Checks

```typescript
const health = await searchManager.healthCheck();

console.log(health);
// {
//   exa: true,
//   tavily: true,
//   brave: false
// }
```

### Cache Management

```typescript
// Get cache statistics
const stats = await searchManager.getCacheStats();
console.log(stats);
// {
//   size: 42,
//   maxSize: 1000,
//   maxAge: 86400000,
//   hitRate: 0.73
// }

// Clear cache manually
await searchManager.clearCache();

// Cleanup expired entries
const removed = await searchManager.cleanupCache();
console.log(`Removed ${removed} expired entries`);
```

## Response Format

### SearchResponse

```typescript
interface SearchResponse {
  query: string; // The search query
  results: SearchResult[]; // Array of results
  provider: string; // Which provider was used ('exa', 'tavily', 'brave')
  cached: boolean; // Whether results came from cache
  executionTime: number; // Time in milliseconds
}
```

### SearchResult

```typescript
interface SearchResult {
  title: string; // Page title
  url: string; // Page URL
  snippet: string; // Text snippet/summary
  publishedDate?: string; // Publication date (if available)
  score?: number; // Relevance score (if available)
}
```

## Caching Strategy

### Default Configuration

- **Max Age**: 24 hours (86400000 ms)
- **Max Size**: 1000 entries
- **Eviction**: LRU (Least Recently Used)

### Cache Key Generation

Cache keys are generated from:

- Query text (normalized, lowercase, trimmed)
- Search options (maxResults, domains, etc.)

Identical queries with identical options will hit the cache.

```typescript
// These will use the same cache entry
await searchManager.search("test", { maxResults: 10 });
await searchManager.search("test", { maxResults: 10 });

// These will use different cache entries
await searchManager.search("test", { maxResults: 5 });
await searchManager.search("test", { maxResults: 10 });
```

### Cache Expiration

Entries are automatically expired after 24 hours. You can customize this:

```typescript
import { SearchCache } from "@/lib/search";

// Create cache with 1 hour TTL and max 500 entries
const cache = new SearchCache(
  60 * 60 * 1000, // 1 hour
  500, // max entries
);
```

### Cost Optimization Tips

1. **Use caching effectively**: Identical queries within 24 hours are free
2. **Configure multiple providers**: Fallback prevents total failures
3. **Filter by domains**: Reduces irrelevant results and API costs
4. **Adjust maxResults**: Request only what you need
5. **Monitor cache hit rate**: High hit rate = lower costs

## Adding New Providers

To add a new search provider:

### 1. Create Provider Class

```typescript
// lib/search/providers/my-provider.ts
import type { SearchProvider, SearchResult, SearchOptions } from "../types";

export class MyProvider implements SearchProvider {
  name = "my-provider";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("My Provider API key is required");
    }
    this.apiKey = apiKey;
  }

  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    // Implement search logic
    const response = await fetch(/* ... */);
    const data = await response.json();

    return data.results.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
      publishedDate: result.date,
      score: result.relevance,
    }));
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test API availability
      await this.search("test", { maxResults: 1 });
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. Register in SearchManager

```typescript
// lib/search/search-manager.ts
import { MyProvider } from './providers/my-provider'

constructor() {
  // ... existing providers ...

  // Add new provider
  if (process.env.MY_PROVIDER_API_KEY) {
    try {
      this.providers.push(new MyProvider(process.env.MY_PROVIDER_API_KEY))
      logger.info('MyProvider initialized')
    } catch (error) {
      logger.warn('Failed to initialize MyProvider', {
        error: (error as Error).message
      })
    }
  }
}
```

### 3. Update Environment Template

```bash
# .env.template
MY_PROVIDER_API_KEY=your-key-here
```

## Error Handling

### Provider Failures

When a provider fails, the system automatically tries the next provider:

```typescript
try {
  const response = await searchManager.search("query");
  console.log(`Used provider: ${response.provider}`);
} catch (error) {
  // Only throws if ALL providers fail
  console.error("All search providers failed:", error);
}
```

### Handling No Results

```typescript
const response = await searchManager.search("obscure query");

if (response.results.length === 0) {
  console.log("No results found");
} else {
  console.log(`Found ${response.results.length} results`);
}
```

## Performance Monitoring

The SearchManager automatically tracks metrics:

```typescript
// Metrics tracked:
// - search.execution (timer)
// - search.cache_hit (counter)
// - search.cache_miss (counter)
// - search.provider.{name}.success (counter)
// - search.provider.{name}.failed (counter)
// - search.all_providers_failed (counter)
```

View metrics in logs:

```
[INFO] Search cache hit { query: "test", provider: "exa" }
[INFO] Search successful { query: "test", provider: "exa", resultCount: 10, executionTime: 342 }
[WARN] Search provider failed, trying next { provider: "exa", error: "Rate limit exceeded" }
```

## Best Practices

### 1. Configure Multiple Providers

Always configure at least 2 providers for redundancy:

```bash
EXA_API_KEY=...        # Primary
TAVILY_API_KEY=...     # Fallback
```

### 2. Use Domain Filtering for Ordinances

```typescript
const response = await searchManager.search("Austin TX waste ordinances", {
  domains: [
    "municode.com",
    ".gov",
    "municipal.codes",
    "qcode.us",
    "amlegal.com",
  ],
});
```

### 3. Respect Rate Limits

The cache helps prevent rate limit issues. For high-volume scenarios:

- Increase cache size
- Increase cache TTL
- Implement request throttling

### 4. Monitor Health

Periodically check provider health:

```typescript
// Run every 5 minutes
setInterval(
  async () => {
    const health = await searchManager.healthCheck();
    if (Object.values(health).every((h) => !h)) {
      // Alert: All providers are down!
    }
  },
  5 * 60 * 1000,
);
```

### 5. Handle Graceful Degradation

```typescript
try {
  const response = await searchManager.search("query");
  return processResults(response.results);
} catch (error) {
  // All providers failed - return cached/default data
  logger.error("Search failed, using fallback", error);
  return getFallbackResults();
}
```

## Testing

### Unit Tests

```bash
# Run search tests
pnpm test __tests__/search

# Run specific test file
pnpm test __tests__/search/search-manager.test.ts
```

### Integration Tests

```bash
# Test with real API keys (in .env.test)
EXA_API_KEY=real-key pnpm test:integration
```

## Troubleshooting

### Issue: "No search providers configured"

**Solution**: Set at least one API key in `.env.local`:

```bash
EXA_API_KEY=your-key-here
```

### Issue: All providers failing

**Causes**:

- Invalid API keys
- Rate limits exceeded
- Network connectivity issues

**Solution**:

1. Check API key validity
2. Check provider health: `await searchManager.healthCheck()`
3. Review logs for specific errors
4. Verify network connectivity

### Issue: Low cache hit rate

**Causes**:

- Different search options
- Short cache TTL
- High query variation

**Solution**:

1. Check cache stats: `await searchManager.getCacheStats()`
2. Normalize queries before searching
3. Increase cache size/TTL if needed

### Issue: Slow search performance

**Causes**:

- Primary provider slow/failing
- Network latency
- No caching

**Solution**:

1. Check which provider is being used
2. Verify cache is enabled and working
3. Configure faster fallback providers
4. Increase cache TTL for longer-lived results

## Migration from Exa-only

If you're migrating from direct Exa client usage:

### Before

```typescript
import { getExaClient } from "@/lib/api/exa-client";

const exaClient = getExaClient();
const results = await exaClient.searchOrdinances(city, state);
```

### After

```typescript
import { getSearchManager } from "@/lib/search";

const searchManager = getSearchManager();
const response = await searchManager.search(
  `${city}, ${state} municipal waste ordinances`,
  {
    maxResults: 10,
    domains: ["municode.com", ".gov"],
  },
);

const ordinances = response.results.map((result) => ({
  title: result.title,
  url: result.url,
  summary: result.snippet,
}));
```

**Benefits**:

- Automatic fallback if Exa fails
- Response caching (reduced costs)
- Performance monitoring
- Provider flexibility

## Support

For issues or questions:

1. Check logs for detailed error messages
2. Verify API keys are valid
3. Test provider health
4. Review this documentation

## Future Enhancements

- [ ] Redis/Upstash cache for distributed systems
- [ ] Rate limiting per provider
- [ ] Circuit breaker pattern for failing providers
- [ ] Search result ranking/scoring
- [ ] Provider preference configuration
- [ ] Advanced caching strategies (stale-while-revalidate)
