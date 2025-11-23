/**
 * Brave Search Provider
 *
 * Adapter for Brave Search API.
 * Fallback provider for general web search.
 *
 * @see https://brave.com/search/api/
 */

import type { SearchProvider, SearchResult, SearchOptions } from "../types";

export class BraveProvider implements SearchProvider {
  name = "brave";
  private apiKey: string;
  private baseUrl = "https://api.search.brave.com/res/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Brave API key is required");
    }
    this.apiKey = apiKey;
  }

  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      count: (options.maxResults || 10).toString(),
    });

    // Brave doesn't support date filtering in the same way
    // Domain filtering is not directly supported either
    // These would need to be filtered post-search if needed

    const response = await fetch(`${this.baseUrl}/web/search?${params}`, {
      headers: {
        "X-Subscription-Token": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brave API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    let results = (data.web?.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.description || "",
      publishedDate: result.page_age,
      score: undefined, // Brave doesn't provide relevance scores
    }));

    // Apply domain filtering if specified
    if (options.domains && options.domains.length > 0) {
      results = results.filter((result: SearchResult) =>
        options.domains!.some((domain) => result.url.includes(domain)),
      );
    }

    if (options.excludeDomains && options.excludeDomains.length > 0) {
      results = results.filter(
        (result: SearchResult) =>
          !options.excludeDomains!.some((domain) =>
            result.url.includes(domain),
          ),
      );
    }

    return results;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/web/search?q=test&count=1`,
        {
          headers: {
            "X-Subscription-Token": this.apiKey,
            Accept: "application/json",
          },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
