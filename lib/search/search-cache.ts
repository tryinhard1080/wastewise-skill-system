/**
 * Search Cache
 *
 * In-memory cache for search results to reduce API costs.
 * Uses LRU eviction when max size is reached.
 *
 * Future Enhancement: Replace with Redis/Upstash for distributed caching
 */

import { createHash } from 'crypto'
import type { SearchResponse, SearchOptions, CacheStats } from './types'

interface CacheEntry {
  response: SearchResponse
  timestamp: number
}

export class SearchCache {
  private cache: Map<string, CacheEntry>
  private maxAge: number // milliseconds
  private maxSize: number // number of entries
  private hits = 0
  private misses = 0

  constructor(maxAge = 24 * 60 * 60 * 1000, maxSize = 1000) {
    // 24 hours default, 1000 entries
    this.cache = new Map()
    this.maxAge = maxAge
    this.maxSize = maxSize
  }

  /**
   * Generate cache key from query and options
   */
  private getCacheKey(query: string, options: SearchOptions): string {
    const key = JSON.stringify({ query: query.toLowerCase().trim(), options })
    return createHash('md5').update(key).digest('hex')
  }

  /**
   * Get cached search results
   */
  async get(query: string, options: SearchOptions): Promise<SearchResponse | null> {
    const key = this.getCacheKey(query, options)
    const entry = this.cache.get(key)

    if (!entry) {
      this.misses++
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    return entry.response
  }

  /**
   * Store search results in cache
   */
  async set(query: string, options: SearchOptions, response: SearchResponse): Promise<void> {
    const key = this.getCacheKey(query, options)

    // Evict oldest entries if cache is full (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<CacheStats> {
    const total = this.hits + this.misses
    const hitRate = total > 0 ? this.hits / total : 0

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimals
    }
  }

  /**
   * Get current cache size
   */
  async size(): Promise<number> {
    return this.cache.size
  }

  /**
   * Remove expired entries
   */
  async cleanup(): Promise<number> {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }
}
