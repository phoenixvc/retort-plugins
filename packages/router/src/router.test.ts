import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildIndex, buildSemanticIndex } from './index-builder.js'
import type { TeamLike } from './index-builder.js'
import { route, routeSemantic } from './router.js'
import { search, cosineSimilarity, semanticSearch } from './search.js'

const TEAMS: TeamLike[] = [
  {
    id: 'frontend',
    name: 'Frontend',
    focus: 'UI, components, PWA, video, media, React',
    scope: ['apps/web/**'],
    accepts: ['feature', 'bug'],
  },
  {
    id: 'backend',
    name: 'Backend',
    focus: 'API, services, core logic, database',
    scope: ['apps/api/**', 'services/**'],
    accepts: ['feature', 'bug', 'performance'],
  },
  {
    id: 'security',
    name: 'Security',
    focus: 'Auth, compliance, audit, secrets',
    scope: ['auth/**', 'security/**'],
    accepts: ['security', 'bug'],
  },
  {
    id: 'devops',
    name: 'DevOps',
    focus: 'CI/CD, pipelines, containers, deployment',
    scope: ['.github/workflows/**', 'docker/**'],
    accepts: ['chore', 'ci'],
  },
  {
    id: 'product',
    name: 'Product',
    focus: 'Features, PRDs, roadmap, video content, media production',
    scope: ['docs/product/**', 'docs/prd/**'],
    accepts: ['feature', 'epic'],
  },
]

// ---------------------------------------------------------------------------
// Phase 1 tests (must all continue to pass)
// ---------------------------------------------------------------------------

describe('buildIndex', () => {
  it('creates one entry per team', () => {
    const index = buildIndex(TEAMS)
    expect(index.entries).toHaveLength(TEAMS.length)
  })

  it('sets suggestedCommand from team id', () => {
    const index = buildIndex(TEAMS)
    const frontend = index.entries.find((e) => e.id === 'frontend')
    expect(frontend?.suggestedCommand).toBe('/team-frontend')
  })

  it('includes indexedAt timestamp', () => {
    const index = buildIndex(TEAMS)
    expect(new Date(index.indexedAt).getTime()).toBeGreaterThan(0)
  })
})

describe('route — in-scope queries', () => {
  const index = buildIndex(TEAMS)

  it('routes "which team handles video content" to frontend or product', () => {
    const { results } = route('which team handles video content', index)
    const ids = results.map((r) => r.id)
    expect(ids.some((id) => id === 'frontend' || id === 'product')).toBe(true)
  })

  it('returns confidence >= 0.6 for a clear match', () => {
    const { results } = route('api services backend', index)
    expect(results[0].confidence).toBeGreaterThanOrEqual(0.6)
  })

  it('routes "auth compliance audit" to security', () => {
    const { results } = route('auth compliance audit', index)
    expect(results[0].id).toBe('security')
  })

  it('routes "CI CD pipelines" to devops', () => {
    const { results } = route('CI CD pipelines', index)
    expect(results[0].id).toBe('devops')
  })

  it('does not set scopeViolation for in-scope queries', () => {
    const response = route('which team handles api work', index)
    expect(response.scopeViolation).toBeUndefined()
  })
})

describe('route — scope violations', () => {
  const index = buildIndex(TEAMS)

  it('returns scopeViolation for "write a react component"', () => {
    const { results, scopeViolation } = route('write a react component', index)
    expect(scopeViolation).toBe(true)
    expect(results).toHaveLength(0)
  })

  it('returns scopeViolation for "what is the capital of France"', () => {
    const { results, scopeViolation } = route('what is the capital of France', index)
    expect(scopeViolation).toBe(true)
    expect(results).toHaveLength(0)
  })

  it('returns scopeViolation for "generate a function"', () => {
    const { scopeViolation } = route('generate a function', index)
    expect(scopeViolation).toBe(true)
  })
})

describe('search', () => {
  const index = buildIndex(TEAMS)

  it('returns empty array for empty query', () => {
    const results = search('', index.entries)
    expect(results).toHaveLength(0)
  })

  it('returns results sorted by descending confidence', () => {
    const results = search('api backend services', index.entries)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].confidence).toBeGreaterThanOrEqual(results[i].confidence)
    }
  })

  it('excludes entries with zero overlap', () => {
    // "xyzzy" won't match anything
    const results = search('xyzzy', index.entries)
    expect(results).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Phase 2 tests
// ---------------------------------------------------------------------------

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = [1, 0, 0]
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 5)
  })

  it('returns a positive value for similar (non-orthogonal) vectors', () => {
    const result = cosineSimilarity([1, 1, 0], [1, 0, 0])
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(1)
  })

  it('returns 0 for zero-magnitude vectors (no division by zero)', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0)
    expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0)
  })
})

describe('semanticSearch', () => {
  // Controlled mock embeddings: 3-dimensional unit vectors
  // TEAMS order: [frontend, backend, security, devops, product]
  // frontend → [0, 1, 0]
  // backend  → [1, 0, 0]  ← query [1,0,0] should match this
  // security → [0, 0, 1]
  // devops   → [0.7071, 0.7071, 0]
  // product  → [0, 0.7071, 0.7071]

  const mockEntries = TEAMS.map((team, i) => {
    const vectors: number[][] = [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 1],
      [0.7071, 0.7071, 0],
      [0, 0.7071, 0.7071],
    ]
    return {
      type: 'team' as const,
      id: team.id,
      name: team.name,
      keywords: [],
      explanation: `The ${team.name} team.`,
      embedding: vectors[i],
    }
  })

  const mockEmbedFn = vi.fn(async (texts: string[]) => {
    // Query "api backend" → [1, 0, 0] (points toward backend)
    return texts.map(() => [1, 0, 0])
  })

  it('returns results sorted by descending cosine similarity', async () => {
    const results = await semanticSearch('api backend', mockEntries, mockEmbedFn)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].confidence).toBeGreaterThanOrEqual(results[i].confidence)
    }
  })

  it('returns the backend team first when query embedding matches backend vector', async () => {
    const results = await semanticSearch('api backend', mockEntries, mockEmbedFn)
    expect(results[0].id).toBe('backend')
  })

  it('calls embedFn with the query text', async () => {
    const fn = vi.fn(async (texts: string[]) => texts.map(() => [1, 0, 0]))
    await semanticSearch('hello', mockEntries, fn)
    expect(fn).toHaveBeenCalledWith(['hello'])
  })

  it('falls back to keyword search when no entries have embeddings', async () => {
    const noEmbeddingEntries = TEAMS.map((team) => ({
      type: 'team' as const,
      id: team.id,
      name: team.name,
      keywords: ['api', 'backend', 'services'],
      explanation: `The ${team.name} team.`,
    }))
    const fn = vi.fn(async (texts: string[]) => texts.map(() => [1, 0, 0]))
    const results = await semanticSearch('api backend', noEmbeddingEntries, fn)
    // fn should NOT be called because we fell back to keyword search
    expect(fn).not.toHaveBeenCalled()
    // keyword search should still return results
    expect(results.length).toBeGreaterThan(0)
  })
})

describe('buildSemanticIndex', () => {
  it('populates embedding on each entry', async () => {
    const mockEmbed = vi.fn(async (texts: string[]) =>
      texts.map(() => [0.1, 0.2, 0.3]),
    )
    const index = await buildSemanticIndex(TEAMS, mockEmbed)
    for (const entry of index.entries) {
      expect(entry.embedding).toBeDefined()
      expect(Array.isArray(entry.embedding)).toBe(true)
    }
  })

  it('produces one entry per team', async () => {
    const mockEmbed = vi.fn(async (texts: string[]) =>
      texts.map(() => [0.1, 0.2, 0.3]),
    )
    const index = await buildSemanticIndex(TEAMS, mockEmbed)
    expect(index.entries).toHaveLength(TEAMS.length)
  })
})

describe('routeSemantic', () => {
  const mockEmbedFn = vi.fn(async (texts: string[]) =>
    // backend-pointing vector
    texts.map(() => [1, 0, 0]),
  )

  beforeEach(() => { mockEmbedFn.mockClear() })

  it('returns results for a valid in-scope query', async () => {
    const mockEmbed = vi.fn(async (texts: string[]) =>
      texts.map(() => [0.1, 0.2, 0.3]),
    )
    const index = await buildSemanticIndex(TEAMS, mockEmbed)
    const response = await routeSemantic('which team handles API work', index, mockEmbedFn)
    expect(response.results.length).toBeGreaterThan(0)
    expect(response.query).toBe('which team handles API work')
    expect(response.scopeViolation).toBeUndefined()
  })

  it('returns scopeViolation and empty results for an off-topic query', async () => {
    const mockEmbed = vi.fn(async (texts: string[]) =>
      texts.map(() => [0.1, 0.2, 0.3]),
    )
    const index = await buildSemanticIndex(TEAMS, mockEmbed)
    const response = await routeSemantic('write a react component', index, mockEmbedFn)
    expect(response.scopeViolation).toBe(true)
    expect(response.results).toHaveLength(0)
    // embedFn should not be called for off-topic queries
    expect(mockEmbedFn).not.toHaveBeenCalled()
  })

  it('includes indexedAt from the index', async () => {
    const mockEmbed = vi.fn(async (texts: string[]) =>
      texts.map(() => [0.1, 0.2, 0.3]),
    )
    const index = await buildSemanticIndex(TEAMS, mockEmbed)
    const response = await routeSemantic('devops pipelines', index, mockEmbedFn)
    expect(response.indexedAt).toBe(index.indexedAt)
  })
})
