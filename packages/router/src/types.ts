export interface RouteResult {
  type: 'team' | 'agent' | 'rule' | 'doc'
  id: string
  name: string
  /** 0–1 keyword overlap score */
  confidence: number
  explanation: string
  suggestedCommand?: string
  configSnippet?: string
}

export interface RouterEntry {
  type: RouteResult['type']
  id: string
  name: string
  /** Tokenised keywords derived from name + focus + scope + accepts */
  keywords: string[]
  explanation: string
  suggestedCommand?: string
  /** Normalised embedding vector (Phase 2 — optional) */
  embedding?: number[]
}

export interface RouterIndex {
  entries: RouterEntry[]
  indexedAt: string
}

export interface AskResponse {
  results: RouteResult[]
  query: string
  indexedAt: string
  scopeViolation?: true
}
