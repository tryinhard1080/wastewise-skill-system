/**
 * SearchCache Tests
 *
 * Test cache functionality including expiration and LRU eviction.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchCache } from '@/lib/search/search-cache'
import type { SearchResponse } from '@/lib/search/types'

describe('SearchCache', () => {
  let cache: SearchCache

  beforeEach(() => {
    cache = new SearchCache(1000, 5) // 1 second TTL, max 5 entries
  })

  const mockResponse: SearchResponse = {
    query: 'test',
    results: [{ title: 'Test', url: 'https://example.com', snippet: 'Test snippet' }],
    provider: 'exa',
    cached: false,
    executionTime: 100,
  }

  describe('Basic Cache Operations', () => {
    it('should cache and retrieve search results', async () => {
      await cache.set('test query', {}, mockResponse)
      const cached = await cache.get('test query', {})

      expect(cached).toEqual(mockResponse)
    })

    it('should return null for cache miss', async () => {
      const cached = await cache.get('nonexistent', {})
      expect(cached).toBeNull()
    })

    it('should distinguish between different queries', async () => {
      await cache.set('query 1', {}, mockResponse)
      await cache.set('query 2', {}, { ...mockResponse, query: 'query 2' })

      const cached1 = await cache.get('query 1', {})
      const cached2 = await cache.get('query 2', {})

      expect(cached1?.query).toBe('test')
      expect(cached2?.query).toBe('query 2')
    })

    it('should distinguish between different options', async () => {
      await cache.set('query', { maxResults: 5 }, mockResponse)
      await cache.set('query', { maxResults: 10 }, { ...mockResponse, query: 'different' })

      const cached1 = await cache.get('query', { maxResults: 5 })
      const cached2 = await cache.get('query', { maxResults: 10 })

      expect(cached1?.query).toBe('test')
      expect(cached2?.query).toBe('different')
    })

    it('should be case-insensitive for queries', async () => {
      await cache.set('Test Query', {}, mockResponse)
      const cached = await cache.get('test query', {})

      expect(cached).not.toBeNull()
    })
  })

  describe('Cache Expiration', () => {
    it('should expire entries after TTL', async () => {
      const shortCache = new SearchCache(100, 10) // 100ms TTL

      await shortCache.set('query', {}, mockResponse)

      // Should exist immediately
      let cached = await shortCache.get('query', {})
      expect(cached).not.toBeNull()

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Should be expired
      cached = await shortCache.get('query', {})
      expect(cached).toBeNull()
    })

    it('should not expire fresh entries', async () => {
      const longCache = new SearchCache(10000, 10) // 10 second TTL

      await longCache.set('query', {}, mockResponse)

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should still exist
      const cached = await longCache.get('query', {})
      expect(cached).not.toBeNull()
    })
  })

  describe('LRU Eviction', () => {
    it('should evict oldest entry when max size is reached', async () => {
      // Cache with max 3 entries
      const smallCache = new SearchCache(60000, 3)

      // Add 3 entries
      await smallCache.set('query1', {}, mockResponse)
      await smallCache.set('query2', {}, mockResponse)
      await smallCache.set('query3', {}, mockResponse)

      // All should exist
      expect(await smallCache.get('query1', {})).not.toBeNull()
      expect(await smallCache.get('query2', {})).not.toBeNull()
      expect(await smallCache.get('query3', {})).not.toBeNull()

      // Add 4th entry - should evict query1
      await smallCache.set('query4', {}, mockResponse)

      expect(await smallCache.get('query1', {})).toBeNull()
      expect(await smallCache.get('query2', {})).not.toBeNull()
      expect(await smallCache.get('query3', {})).not.toBeNull()
      expect(await smallCache.get('query4', {})).not.toBeNull()
    })
  })

  describe('Cache Management', () => {
    it('should clear entire cache', async () => {
      await cache.set('query1', {}, mockResponse)
      await cache.set('query2', {}, mockResponse)

      await cache.clear()

      expect(await cache.get('query1', {})).toBeNull()
      expect(await cache.get('query2', {})).toBeNull()
      expect(await cache.size()).toBe(0)
    })

    it('should return current cache size', async () => {
      expect(await cache.size()).toBe(0)

      await cache.set('query1', {}, mockResponse)
      expect(await cache.size()).toBe(1)

      await cache.set('query2', {}, mockResponse)
      expect(await cache.size()).toBe(2)
    })

    it('should cleanup expired entries', async () => {
      const shortCache = new SearchCache(100, 10) // 100ms TTL

      await shortCache.set('query1', {}, mockResponse)
      await shortCache.set('query2', {}, mockResponse)
      await shortCache.set('query3', {}, mockResponse)

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      const removed = await shortCache.cleanup()

      expect(removed).toBe(3)
      expect(await shortCache.size()).toBe(0)
    })

    it('should not cleanup fresh entries', async () => {
      const longCache = new SearchCache(10000, 10) // 10 second TTL

      await longCache.set('query1', {}, mockResponse)
      await longCache.set('query2', {}, mockResponse)

      const removed = await longCache.cleanup()

      expect(removed).toBe(0)
      expect(await longCache.size()).toBe(2)
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      await cache.set('query', {}, mockResponse)

      // Hit
      await cache.get('query', {})
      // Miss
      await cache.get('nonexistent', {})
      // Hit
      await cache.get('query', {})

      const stats = await cache.stats()

      expect(stats.hitRate).toBe(0.67) // 2 hits / 3 total (rounded)
    })

    it('should report cache configuration', async () => {
      const stats = await cache.stats()

      expect(stats.maxSize).toBe(5)
      expect(stats.maxAge).toBe(1000)
    })

    it('should reset hit rate after clear', async () => {
      await cache.set('query', {}, mockResponse)
      await cache.get('query', {})

      await cache.clear()

      const stats = await cache.stats()
      expect(stats.hitRate).toBe(0)
    })
  })
})
