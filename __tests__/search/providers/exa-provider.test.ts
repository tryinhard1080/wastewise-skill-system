/**
 * ExaProvider Tests
 *
 * Test Exa search provider adapter.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExaProvider } from '@/lib/search/providers/exa-provider'

// Mock fetch
global.fetch = vi.fn()

describe('ExaProvider', () => {
  let provider: ExaProvider

  beforeEach(() => {
    provider = new ExaProvider('test-api-key')
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should require API key', () => {
      expect(() => new ExaProvider('')).toThrow('Exa API key is required')
    })

    it('should set provider name', () => {
      expect(provider.name).toBe('exa')
    })
  })

  describe('Search', () => {
    it('should successfully search and return results', async () => {
      const mockResponse = {
        results: [
          {
            title: 'Test Result',
            url: 'https://example.com',
            text: 'Test snippet',
            published_date: '2025-01-01',
            score: 0.95,
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const results = await provider.search('test query')

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        title: 'Test Result',
        url: 'https://example.com',
        snippet: 'Test snippet',
        publishedDate: '2025-01-01',
        score: 0.95,
      })
    })

    it('should handle search with options', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query', {
        maxResults: 5,
        domains: ['example.com'],
        excludeDomains: ['spam.com'],
        dateFilter: 'week',
      })

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.num_results).toBe(5)
      expect(requestBody.include_domains).toEqual(['example.com'])
      expect(requestBody.exclude_domains).toEqual(['spam.com'])
      expect(requestBody.start_published_date).toBeDefined()
    })

    it('should use default maxResults of 10', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query')

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.num_results).toBe(10)
    })

    it('should handle API errors', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      await expect(provider.search('test query')).rejects.toThrow(
        'Exa API error: 401 - Unauthorized'
      )
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      await expect(provider.search('test query')).rejects.toThrow('Network error')
    })

    it('should handle empty results', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const results = await provider.search('test query')

      expect(results).toEqual([])
    })

    it('should handle missing optional fields', async () => {
      const mockResponse = {
        results: [
          {
            title: 'Test Result',
            url: 'https://example.com',
            // Missing: text, published_date, score
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const results = await provider.search('test query')

      expect(results[0]).toEqual({
        title: 'Test Result',
        url: 'https://example.com',
        snippet: '',
        publishedDate: undefined,
        score: undefined,
      })
    })
  })

  describe('Date Filtering', () => {
    it('should filter by day', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query', { dateFilter: 'day' })

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.start_published_date).toBeDefined()

      const startDate = new Date(requestBody.start_published_date)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      // Should be approximately 1 day ago (within 1 hour tolerance)
      expect(Math.abs(startDate.getTime() - yesterday.getTime())).toBeLessThan(
        60 * 60 * 1000
      )
    })

    it('should filter by week', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query', { dateFilter: 'week' })

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      const startDate = new Date(requestBody.start_published_date)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      expect(Math.abs(startDate.getTime() - weekAgo.getTime())).toBeLessThan(
        60 * 60 * 1000
      )
    })

    it('should filter by month', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query', { dateFilter: 'month' })

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      const startDate = new Date(requestBody.start_published_date)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      expect(Math.abs(startDate.getTime() - monthAgo.getTime())).toBeLessThan(
        60 * 60 * 1000
      )
    })

    it('should filter by year', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query', { dateFilter: 'year' })

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      const startDate = new Date(requestBody.start_published_date)
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

      expect(Math.abs(startDate.getTime() - yearAgo.getTime())).toBeLessThan(
        24 * 60 * 60 * 1000 // 1 day tolerance
      )
    })

    it('should not filter when dateFilter is not provided', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query')

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.start_published_date).toBeUndefined()
    })
  })

  describe('Health Check', () => {
    it('should return true when API is available', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      const isAvailable = await provider.isAvailable()

      expect(isAvailable).toBe(true)
    })

    it('should return false when API is unavailable', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      })

      const isAvailable = await provider.isAvailable()

      expect(isAvailable).toBe(false)
    })

    it('should return false on network error', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const isAvailable = await provider.isAvailable()

      expect(isAvailable).toBe(false)
    })
  })

  describe('API Request Format', () => {
    it('should send correct headers', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query')

      const fetchCall = (global.fetch as any).mock.calls[0]
      const headers = fetchCall[1].headers

      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['x-api-key']).toBe('test-api-key')
    })

    it('should use POST method', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query')

      const fetchCall = (global.fetch as any).mock.calls[0]

      expect(fetchCall[1].method).toBe('POST')
    })

    it('should use correct endpoint', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query')

      const fetchCall = (global.fetch as any).mock.calls[0]

      expect(fetchCall[0]).toBe('https://api.exa.ai/search')
    })

    it('should enable autoprompt by default', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query')

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.use_autoprompt).toBe(true)
    })

    it('should use neural search by default', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      })

      await provider.search('test query')

      const fetchCall = (global.fetch as any).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.type).toBe('neural')
    })
  })
})
