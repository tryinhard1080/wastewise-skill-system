/**
 * Exa API Client
 *
 * Provides semantic search capabilities for finding municipal ordinances,
 * regulations, and compliance requirements.
 *
 * @see https://docs.exa.ai
 */

import { logger } from "@/lib/observability/logger";

export interface ExaSearchOptions {
  query: string;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  useAutoprompt?: boolean;
  type?: "neural" | "keyword";
}

export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
}

export interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
  resolvedSearchType?: string;
}

export interface ExaContentsOptions {
  ids: string[];
  text?: boolean | { maxCharacters?: number; includeHtmlTags?: boolean };
  highlights?: boolean | { numSentences?: number; highlightsPerUrl?: number };
  summary?: boolean | { query?: string };
}

export interface ExaContentsResult {
  url: string;
  id: string;
  title: string;
  text?: string;
  highlights?: string[];
  summary?: string;
}

export class ExaClient {
  private apiKey: string;
  private baseUrl = "https://api.exa.ai";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EXA_API_KEY || "";

    if (!this.apiKey) {
      logger.warn(
        "Exa API key not configured. Search functionality will be limited.",
      );
    }
  }

  /**
   * Search for web content using neural semantic search
   */
  async search(options: ExaSearchOptions): Promise<ExaSearchResponse> {
    if (!this.apiKey) {
      throw new Error("Exa API key not configured");
    }

    try {
      logger.info("Exa search started", {
        query: options.query,
        numResults: options.numResults,
      });

      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          query: options.query,
          num_results: options.numResults || 10,
          include_domains: options.includeDomains,
          exclude_domains: options.excludeDomains,
          start_published_date: options.startPublishedDate,
          end_published_date: options.endPublishedDate,
          use_autoprompt: options.useAutoprompt !== false, // Default to true
          type: options.type || "neural",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error("Exa search failed", new Error(error), {
          status: response.status,
          query: options.query,
        });
        throw new Error(`Exa API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      logger.info("Exa search completed", {
        query: options.query,
        resultsCount: data.results?.length || 0,
      });

      return {
        results: data.results || [],
        autopromptString: data.autoprompt_string,
        resolvedSearchType: data.resolved_search_type,
      };
    } catch (error) {
      logger.error("Exa search error", error as Error, {
        query: options.query,
      });
      throw error;
    }
  }

  /**
   * Get full content for specific URLs/IDs
   */
  async getContents(options: ExaContentsOptions): Promise<ExaContentsResult[]> {
    if (!this.apiKey) {
      throw new Error("Exa API key not configured");
    }

    try {
      logger.info("Exa get contents started", { idsCount: options.ids.length });

      const response = await fetch(`${this.baseUrl}/contents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          ids: options.ids,
          text: options.text,
          highlights: options.highlights,
          summary: options.summary,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error("Exa get contents failed", new Error(error), {
          status: response.status,
        });
        throw new Error(`Exa API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      logger.info("Exa get contents completed", {
        resultsCount: data.results?.length || 0,
      });

      return data.results || [];
    } catch (error) {
      logger.error("Exa get contents error", error as Error);
      throw error;
    }
  }

  /**
   * Search and get full contents in one call
   */
  async searchAndGetContents(
    searchOptions: ExaSearchOptions,
    contentsOptions?: Partial<Omit<ExaContentsOptions, "ids">>,
  ): Promise<ExaContentsResult[]> {
    // First, perform the search
    const searchResults = await this.search(searchOptions);

    if (searchResults.results.length === 0) {
      return [];
    }

    // Extract IDs from search results (Exa returns URLs as IDs)
    const ids = searchResults.results.map((r) => r.url);

    // Get full contents
    return this.getContents({
      ids,
      text: contentsOptions?.text ?? true,
      highlights: contentsOptions?.highlights ?? true,
      summary: contentsOptions?.summary,
    });
  }

  /**
   * Find municipal ordinances for a specific location
   */
  async searchOrdinances(
    city: string,
    state: string,
    county?: string,
    topic?: string,
  ): Promise<ExaSearchResponse> {
    const locationParts = [city, county, state].filter(Boolean);
    const location = locationParts.join(", ");

    const query = topic
      ? `${location} municipal code ordinance regulations about ${topic}`
      : `${location} municipal code waste management trash collection ordinances`;

    return this.search({
      query,
      numResults: 5,
      includeDomains: [
        "municode.com",
        ".gov",
        "municipal.codes",
        "qcode.us",
        "amlegal.com",
      ],
      useAutoprompt: true,
      type: "neural",
    });
  }
}

// Singleton instance
let exaClientInstance: ExaClient | null = null;

/**
 * Get the shared Exa client instance
 */
export function getExaClient(): ExaClient {
  if (!exaClientInstance) {
    exaClientInstance = new ExaClient();
  }
  return exaClientInstance;
}
