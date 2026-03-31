import { describe, it, expect } from 'vitest'
import { buildIndex } from './index-builder.js'
import type { TeamLike } from './index-builder.js'
import { route } from './router.js'
import { search } from './search.js'

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
