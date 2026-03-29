import * as fs from 'fs'
import * as path from 'path'
import type { BacklogItem } from '../protocol.js'

/**
 * Parses AGENT_BACKLOG.md — expects a markdown table with columns:
 *   | Title | Priority | Status | Team |
 * Rows beginning with '-' or a header label are skipped.
 * Priority words (P0-P3, or high/medium/low) are normalised to the
 * BacklogItem priority union. Status is normalised to the status union.
 */
export function parseBacklog(root: string): BacklogItem[] {
  const filePath = path.join(root, 'AGENT_BACKLOG.md')
  if (!fs.existsSync(filePath)) return []

  const content = fs.readFileSync(filePath, 'utf-8')
  const items: BacklogItem[] = []

  // Match rows: | title | priority | status | optional-team |
  const rowRegex = /^\|\s*([^|]+?)\s*\|\s*(P[0-3]|high|medium|low)\s*\|\s*([^|]+?)\s*\|(?:\s*([^|]*?)\s*\|)?/gim
  let match: RegExpExecArray | null

  while ((match = rowRegex.exec(content)) !== null) {
    const [, rawTitle, rawPriority, rawStatus, rawTeam] = match
    const title = rawTitle.trim()
    if (!title || title.startsWith('-') || title.toLowerCase() === 'title') continue

    items.push({
      id: slugify(title),
      title,
      status: normaliseStatus(rawStatus.trim()),
      priority: normalisePriority(rawPriority.trim()),
      team: rawTeam?.trim() || undefined,
    })
  }

  return items
}

function normaliseStatus(raw: string): BacklogItem['status'] {
  const s = raw.toLowerCase()
  if (s.includes('progress') || s === 'wip') return 'in-progress'
  if (s === 'done' || s === 'closed' || s === 'completed') return 'done'
  if (s === 'blocked') return 'blocked'
  return 'open'
}

function normalisePriority(raw: string): BacklogItem['priority'] {
  const p = raw.toLowerCase()
  if (p === 'p0' || p === 'high') return 'high'
  if (p === 'p1' || p === 'medium') return 'medium'
  return 'low'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
