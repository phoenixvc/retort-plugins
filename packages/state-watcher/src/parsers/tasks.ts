import * as fs from 'fs'
import * as path from 'path'
import type { AgentTask } from '../protocol.js'

/**
 * Scans .claude/state/tasks/ for individual task JSON files and returns
 * all successfully parsed tasks. Files that fail to parse are silently
 * skipped — a single malformed file should not crash the watcher.
 */
export function parseTasks(root: string): AgentTask[] {
  const tasksDir = path.join(root, '.claude', 'state', 'tasks')
  if (!fs.existsSync(tasksDir)) return []

  const tasks: AgentTask[] = []

  let entries: string[]
  try {
    entries = fs.readdirSync(tasksDir)
  } catch {
    return []
  }

  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue
    const filePath = path.join(tasksDir, entry)
    const task = parseTaskFile(filePath)
    if (task) tasks.push(task)
  }

  return tasks
}

/**
 * Parses a single task JSON file.  Returns null if the file cannot be
 * read or does not satisfy the minimum required shape.
 */
export function parseTaskFile(filePath: string): AgentTask | null {
  let raw: string
  try {
    raw = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  if (!isTaskShape(data)) return null
  return data
}

function isTaskShape(v: unknown): v is AgentTask {
  if (typeof v !== 'object' || v === null) return false
  const obj = v as Record<string, unknown>
  return (
    typeof obj['id'] === 'string' &&
    typeof obj['title'] === 'string' &&
    typeof obj['status'] === 'string' &&
    typeof obj['createdAt'] === 'string' &&
    typeof obj['updatedAt'] === 'string'
  )
}
