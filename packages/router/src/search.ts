import { tokenise } from './index-builder.js'
import type { RouterEntry, RouteResult } from './types.js'

const TOP_K = 5

/**
 * Score a single entry against the query tokens.
 *
 * Confidence = |query_tokens ∩ entry_keywords| / |query_tokens|
 * Clamped to [0, 1].  Entries with zero overlap are excluded.
 */
function score(queryTokens: string[], entry: RouterEntry): number {
  if (queryTokens.length === 0) return 0
  const entrySet = new Set(entry.keywords)
  const hits = queryTokens.filter((t) => entrySet.has(t)).length
  return hits / queryTokens.length
}

/**
 * Returns the top-K RouteResults for a query, sorted by descending confidence.
 * Results with confidence === 0 are excluded.
 */
export function search(query: string, entries: RouterEntry[]): RouteResult[] {
  const queryTokens = tokenise(query)

  return entries
    .map((entry) => ({ entry, confidence: score(queryTokens, entry) }))
    .filter(({ confidence }) => confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, TOP_K)
    .map(({ entry, confidence }) => ({
      type: entry.type,
      id: entry.id,
      name: entry.name,
      confidence: Math.round(confidence * 100) / 100,
      explanation: entry.explanation,
      suggestedCommand: entry.suggestedCommand,
    }))
}
