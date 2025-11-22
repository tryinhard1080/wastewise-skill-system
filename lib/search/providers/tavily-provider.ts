/**
 * Tavily Search Provider
 *
 * Adapter for Tavily AI search API.
 * Fallback provider for general web search.
 *
 * @see https://docs.tavily.com
 */

import type { SearchProvider, SearchResult, SearchOptions } from '../types'

export class TavilyProvider implements SearchProvider {
  name = 'tavily'
  private apiKey: string
  private baseUrl = 'https://api.tavily.com'

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Tavily API key is required')
    }
    this.apiKey = apiKey
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        max_results: options.maxResults || 10,
        include_domains: options.domains,
        exclude_domains: options.excludeDomains,
        search_depth: 'advanced',
        include_answer: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Tavily API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return (data.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.content || '',
      publishedDate: result.published_date,
      score: result.score,
    }))
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: 'test',
          max_results: 1,
        }),
      })
      return response.ok
    } catch {
      return false
    }
  }
}
