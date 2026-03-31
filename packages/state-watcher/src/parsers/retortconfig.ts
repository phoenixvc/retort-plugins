import * as fs from 'fs'
import * as path from 'path'

export interface CogmeshConfig {
  endpoint: string | null
  secret: string | null
}

/**
 * Reads .retortconfig and extracts the `cogmesh:` block values.
 * Substitutes ${VAR} references with process.env values.
 */
export function parseCogmeshConfig(root: string): CogmeshConfig {
  const configPath = path.join(root, '.retortconfig')
  let content: string
  try {
    content = fs.readFileSync(configPath, 'utf-8')
  } catch {
    return { endpoint: null, secret: null }
  }

  // Extract the indented block under `cogmesh:`
  const blockMatch = /^cogmesh:\s*\n((?:[ \t]+[^\n]*\n?)*)/m.exec(content)
  if (!blockMatch) return { endpoint: null, secret: null }
  const block = blockMatch[1]

  return {
    endpoint: resolveEnv(extractScalar(block, 'endpoint')),
    secret: resolveEnv(extractScalar(block, 'secret')),
  }
}

function extractScalar(block: string, key: string): string | null {
  const m = new RegExp(`^[ \\t]+${key}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, 'm').exec(block)
  return m?.[1]?.trim() ?? null
}

/** Replaces ${VAR} with process.env.VAR (leaves intact if not set). */
function resolveEnv(value: string | null): string | null {
  if (!value) return null
  return value.replace(/\$\{([^}]+)\}/g, (_, name: string) => process.env[name] ?? `\${${name}}`)
}
