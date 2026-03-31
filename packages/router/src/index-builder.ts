import type { RouterEntry, RouterIndex } from './types.js'

export interface TeamLike {
  id: string
  name: string
  focus: string
  scope: string[]
  accepts: string[]
}

/**
 * Builds a keyword index from an array of team objects.
 * Phase 1: pure keyword tokenisation — no ML embeddings required.
 */
export function buildIndex(teams: TeamLike[]): RouterIndex {
  const entries: RouterEntry[] = teams.map((team) => {
    const raw = [
      team.name,
      team.focus,
      ...team.scope,
      ...team.accepts,
    ].join(' ')

    return {
      type: 'team',
      id: team.id,
      name: team.name,
      keywords: tokenise(raw),
      explanation: `The ${team.name} team handles ${team.focus.toLowerCase()}.`,
      suggestedCommand: `/team-${team.id}`,
    }
  })

  return { entries, indexedAt: new Date().toISOString() }
}

/**
 * Builds a semantic index from an array of team objects by generating
 * embeddings for each entry.
 *
 * Phase 2: uses ML embeddings via @xenova/transformers.
 * Requires the optional @xenova/transformers dependency to be installed.
 *
 * @param teams     - Team definitions to index.
 * @param embedFn   - Embedding function; defaults to the built-in `embed()`.
 * @returns           RouterIndex with `embedding` populated on each entry.
 */
export async function buildSemanticIndex(
  teams: TeamLike[],
  embedFn?: (texts: string[]) => Promise<number[][]>,
): Promise<RouterIndex> {
  const { embed } = await import('./embed.js')
  const doEmbed = embedFn ?? embed

  // Build plain entries first (reuse Phase-1 logic).
  const base = buildIndex(teams)

  // Compute text representations for embedding.
  const texts = teams.map((team) =>
    [team.name, team.focus, ...team.scope, ...team.accepts].join(' '),
  )

  const embeddings = await doEmbed(texts)

  const entries: RouterEntry[] = base.entries.map((entry, i) => ({
    ...entry,
    embedding: embeddings[i],
  }))

  return { entries, indexedAt: base.indexedAt }
}

/** Lowercase, strip punctuation, split on whitespace, deduplicate. */
export function tokenise(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s/-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
  return [...new Set(tokens)]
}
