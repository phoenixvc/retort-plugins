import * as fs from 'fs'
import * as path from 'path'
import type { Team } from '../protocol.js'

/**
 * Parses .agentkit/spec/AGENT_TEAMS.yaml (or the root AGENT_TEAMS.md
 * fallback) and returns the list of teams.
 *
 * YAML spec format (primary):
 *   teams:
 *     - id: backend
 *       name: Backend
 *       focus: "API, services, core logic"
 *       scope: ["apps/api/**"]
 *       accepts: ["feature", "bug"]
 *       handoffChain: ["testing", "quality"]
 *
 * The markdown fallback extracts team names from table rows in
 * AGENT_TEAMS.md and produces minimal Team objects with sensible defaults.
 */
export function parseTeams(root: string): Team[] {
  // Try YAML spec first
  const yamlPath = path.join(root, '.agentkit', 'spec', 'AGENT_TEAMS.yaml')
  if (fs.existsSync(yamlPath)) {
    const teams = parseTeamsYaml(yamlPath)
    if (teams.length > 0) return teams
  }

  // Fallback: markdown table in AGENT_TEAMS.md
  const mdPath = path.join(root, 'AGENT_TEAMS.md')
  if (fs.existsSync(mdPath)) {
    return parseTeamsMd(mdPath)
  }

  return []
}

// ---------------------------------------------------------------------------
// YAML parser (hand-rolled — avoids a yaml dependency in the daemon)
// ---------------------------------------------------------------------------

function parseTeamsYaml(filePath: string): Team[] {
  let content: string
  try {
    content = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return []
  }

  const teams: Team[] = []
  // Split on team list items (lines starting with "  - id:")
  const blocks = content.split(/(?=^\s{2}-\s+id:)/m).filter((b) => b.includes('id:'))

  for (const block of blocks) {
    const id = extractScalar(block, 'id')
    const name = extractScalar(block, 'name')
    if (!id || !name) continue

    teams.push({
      id,
      name,
      focus: extractScalar(block, 'focus') ?? '',
      scope: extractList(block, 'scope'),
      accepts: extractList(block, 'accepts'),
      handoffChain: extractList(block, 'handoffChain'),
    })
  }

  return teams
}

/** Extracts a plain scalar value: `  key: value` */
function extractScalar(block: string, key: string): string | undefined {
  const re = new RegExp(`^\\s+${key}:\\s*["']?([^"'\\n]+)["']?`, 'm')
  const m = re.exec(block)
  return m?.[1]?.trim()
}

/** Extracts an inline or block sequence for a given key. */
function extractList(block: string, key: string): string[] {
  // Inline: key: ["a", "b"]  or  key: [a, b]
  const reInline = new RegExp(`^\\s+${key}:\\s*\\[([^\\]]+)\\]`, 'm')
  const inlineMatch = reInline.exec(block)
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
  }

  // Block sequence under the key:
  //   key:
  //     - item1
  //     - item2
  const reBlock = new RegExp(`^(\\s+)${key}:\\s*\\n((?:\\1\\s+-[^\\n]+\\n)*)`, 'm')
  const blockMatch = reBlock.exec(block)
  if (blockMatch) {
    return blockMatch[2]
      .split('\n')
      .map((line) => line.replace(/^\s+-\s*/, '').trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
  }

  return []
}

// ---------------------------------------------------------------------------
// Markdown fallback parser
// ---------------------------------------------------------------------------

function parseTeamsMd(filePath: string): Team[] {
  let content: string
  try {
    content = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return []
  }

  const teams: Team[] = []

  // Match table rows: | Team | Focus | ... |
  // Only the first two columns are required.
  const rowRegex = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm
  let match: RegExpExecArray | null

  while ((match = rowRegex.exec(content)) !== null) {
    const [, rawName, rawFocus] = match
    const name = rawName.trim()
    if (!name || name.startsWith('-') || name.toLowerCase() === 'team') continue

    teams.push({
      id: slugify(name),
      name,
      focus: rawFocus.trim(),
      scope: [],
      accepts: [],
      handoffChain: [],
    })
  }

  return teams
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
