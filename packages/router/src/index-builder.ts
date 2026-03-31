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

/** Lowercase, strip punctuation, split on whitespace, deduplicate. */
export function tokenise(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s/-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
  return [...new Set(tokens)]
}
