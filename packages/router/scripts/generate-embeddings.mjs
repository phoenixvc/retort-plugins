#!/usr/bin/env node
/**
 * generate-embeddings.mjs
 *
 * Generates semantic embeddings for the 13 standard Retort agent teams and
 * writes the result to packages/router/data/embeddings.json.
 *
 * Usage:
 *   node packages/router/scripts/generate-embeddings.mjs
 *
 * Requires @xenova/transformers to be installed (optional dependency).
 * The model is cached automatically in ~/.cache/huggingface.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../data/embeddings.json')

/** The 13 standard Retort agent teams. */
const RETORT_TEAMS = [
  {
    id: 'backend',
    name: 'Backend',
    focus: 'API, services, core logic, database integrations',
    scope: ['apps/api/**', 'services/**'],
    accepts: ['feature', 'bug', 'performance'],
  },
  {
    id: 'frontend',
    name: 'Frontend',
    focus: 'UI, components, PWA, accessibility, React, Next.js',
    scope: ['apps/web/**', 'apps/marketing/**'],
    accepts: ['feature', 'bug', 'ui'],
  },
  {
    id: 'data',
    name: 'Data',
    focus: 'Database models, migrations, query optimisation, Prisma',
    scope: ['db/**', 'migrations/**', 'prisma/**'],
    accepts: ['migration', 'feature', 'bug'],
  },
  {
    id: 'infra',
    name: 'Infrastructure',
    focus: 'IaC, cloud resources, Terraform, Bicep, Azure',
    scope: ['infra/**', 'terraform/**', 'bicep/**'],
    accepts: ['chore', 'feature', 'ci'],
  },
  {
    id: 'devops',
    name: 'DevOps',
    focus: 'CI/CD, pipelines, containers, Docker, deployment automation',
    scope: ['.github/workflows/**', 'docker/**'],
    accepts: ['chore', 'ci', 'performance'],
  },
  {
    id: 'testing',
    name: 'Testing',
    focus: 'Unit tests, integration tests, E2E tests, coverage, Vitest, Playwright',
    scope: ['**/*.test.*', 'tests/**', 'e2e/**'],
    accepts: ['test', 'bug', 'quality'],
  },
  {
    id: 'security',
    name: 'Security',
    focus: 'Auth, compliance, audit, secrets management, RBAC',
    scope: ['auth/**', 'security/**'],
    accepts: ['security', 'bug', 'compliance'],
  },
  {
    id: 'docs',
    name: 'Documentation',
    focus: 'Technical documentation, ADRs, guides, changelogs, API docs',
    scope: ['docs/**', 'README.md', 'CHANGELOG.md'],
    accepts: ['docs', 'chore'],
  },
  {
    id: 'product',
    name: 'Product',
    focus: 'Product requirements, features, roadmap, PRDs, user stories',
    scope: ['docs/product/**', 'docs/prd/**'],
    accepts: ['feature', 'epic', 'product'],
  },
  {
    id: 'quality',
    name: 'Quality',
    focus: 'Code review, refactoring, bug triage, technical debt',
    scope: ['**/*'],
    accepts: ['bug', 'refactor', 'review'],
  },
  {
    id: 'forge',
    name: 'TeamForge',
    focus: 'Agent team spec creation, validation, Retort sync, AgentKit configuration',
    scope: ['.agentkit/spec/**'],
    accepts: ['chore', 'feat', 'config'],
  },
  {
    id: 'strategic-ops',
    name: 'Strategic Ops',
    focus: 'Cross-project coordination, planning, architectural strategy, roadmap alignment',
    scope: ['docs/planning/**', 'docs/architecture/**'],
    accepts: ['planning', 'strategy', 'coordination'],
  },
  {
    id: 'cost-ops',
    name: 'Cost Ops',
    focus: 'AI cost reduction, LLM spend tracking, vendor optimisation, token budgets',
    scope: ['docs/cost-ops/**', 'config/models/**'],
    accepts: ['cost', 'optimisation', 'vendor'],
  },
]

async function main() {
  console.log('Loading @xenova/transformers pipeline…')

  // Dynamic import so we get a clear error if the optional dep is missing.
  let buildSemanticIndex
  try {
    const mod = await import('../dist/index.js')
    buildSemanticIndex = mod.buildSemanticIndex
  } catch {
    console.error(
      'ERROR: Could not import dist/index.js. Run `npm run build -w @retort-plugins/router` first.',
    )
    process.exit(1)
  }

  console.log(`Generating embeddings for ${RETORT_TEAMS.length} teams…`)
  const index = await buildSemanticIndex(RETORT_TEAMS)

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2), 'utf-8')

  console.log(`Embeddings written to ${OUTPUT_PATH}`)
  console.log(`Indexed at: ${index.indexedAt}`)
  console.log(`Teams indexed: ${index.entries.length}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
