/**
 * Exa Search Provider
 *
 * Adapter for Exa.ai semantic search API.
 * Primary provider for regulatory/ordinance searches.
 *
 * @see https://docs.exa.ai
 */

import type { SearchProvider, SearchResult, SearchOptions } from "../types";

export class ExaProvider implements SearchProvider {
  name = "exa";
  private apiKey: string;
  private baseUrl = "https://api.exa.ai";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Exa API key is required");
    }
    this.apiKey = apiKey;
  }

  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        query,
        num_results: options.maxResults || 10,
        include_domains: options.domains,
        exclude_domains: options.excludeDomains,
        start_published_date: this.getDateFilter(options.dateFilter),
        use_autoprompt: true,
        type: "neural",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Exa API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return (data.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.text || "",
      publishedDate: result.published_date,
      score: result.score,
    }));
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          query: "test",
          num_results: 1,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getDateFilter(
    filter?: "day" | "week" | "month" | "year",
  ): string | undefined {
    if (!filter) return undefined;

    const now = new Date();
    const periods = {
      day: 1,
      week: 7,
      month: 30,
      year: 365,
    };

    const daysAgo = periods[filter];
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString();
  }
}
