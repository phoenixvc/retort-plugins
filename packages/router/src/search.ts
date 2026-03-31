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

/**
 * Computes the cosine similarity between two equal-length vectors.
 *
 * Returns a value in [−1, 1].  Returns 0 for zero-magnitude vectors to avoid
 * division by zero.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Semantic search using pre-computed embeddings.
 *
 * If entries have no embeddings (Phase-1 index), falls back to keyword
 * `search()` so callers never need to branch on index version.
 *
 * @param query   - Natural-language query string.
 * @param entries - RouterEntry array (may or may not have `embedding`).
 * @param embedFn - Function that embeds an array of texts.
 * @returns         Top-K results sorted by descending cosine similarity.
 */
export async function semanticSearch(
  query: string,
  entries: RouterEntry[],
  embedFn: (texts: string[]) => Promise<number[][]>,
): Promise<RouteResult[]> {
  const entriesWithEmbeddings = entries.filter((e) => e.embedding !== undefined)

  // Fall back to keyword search when no embeddings are available.
  if (entriesWithEmbeddings.length === 0) {
    return search(query, entries)
  }

  const [queryEmbedding] = await embedFn([query])

  return entriesWithEmbeddings
    .map((entry) => ({
      entry,
      confidence: cosineSimilarity(queryEmbedding, entry.embedding as number[]),
    }))
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
