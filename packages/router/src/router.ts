import { search, semanticSearch } from './search.js'
import type { AskResponse, RouterIndex, RouteResult } from './types.js'

/**
 * Patterns that indicate an off-topic query.
 * When matched, the router returns an empty result with scopeViolation: true
 * and a redirect suggestion rather than attempting to route.
 */
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(write|create|generate|build)\s+(a\s+)?(react|vue|angular|component|function|class|script|code|test)\b/i,
  /\b(capital|president|population|history|recipe|weather|sport|movie|music)\b/i,
  /\bwho\s+is\b/i,
  /\bwhat\s+is\s+(the\s+)?[a-z]+\s+(of|in)\b/i,
]

function isOffTopic(query: string): boolean {
  return OFF_TOPIC_PATTERNS.some((re) => re.test(query))
}

/**
 * Routes a natural-language query against the pre-built index.
 *
 * - Off-topic queries return `{ results: [], scopeViolation: true }`.
 * - In-scope queries return up to 5 results sorted by confidence.
 */
export function route(query: string, index: RouterIndex): AskResponse {
  if (isOffTopic(query)) {
    return {
      results: [],
      query,
      indexedAt: index.indexedAt,
      scopeViolation: true,
    }
  }

  const results: RouteResult[] = search(query, index.entries)

  return {
    results,
    query,
    indexedAt: index.indexedAt,
  }
}

/**
 * Routes a natural-language query using semantic (embedding-based) similarity.
 *
 * Off-topic queries still return `scopeViolation: true` without running the
 * (potentially expensive) embedding step.
 *
 * @param query   - Natural-language query.
 * @param index   - RouterIndex with `embedding` fields populated.
 * @param embedFn - Function that embeds an array of texts into vectors.
 */
export async function routeSemantic(
  query: string,
  index: RouterIndex,
  embedFn: (texts: string[]) => Promise<number[][]>,
): Promise<AskResponse> {
  if (isOffTopic(query)) {
    return {
      results: [],
      query,
      indexedAt: index.indexedAt,
      scopeViolation: true,
    }
  }

  const results = await semanticSearch(query, index.entries, embedFn)

  return {
    results,
    query,
    indexedAt: index.indexedAt,
  }
}
