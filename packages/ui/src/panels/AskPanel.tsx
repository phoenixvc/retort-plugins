import { useState, useEffect, useRef } from 'react'
import type { AskResponse, RouteResult } from '../../../router/src/types'

interface AskPanelProps {
  /** Base URL of the state-watcher HTTP server, e.g. "http://127.0.0.1:4321" */
  baseUrl: string
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="ask-confidence" title={`${pct}% confidence`}>
      <div className="ask-confidence__fill" style={{ width: `${pct}%` }} />
      <span className="ask-confidence__label">{pct}%</span>
    </div>
  )
}

function ResultCard({ result }: { result: RouteResult }) {
  return (
    <div className="ask-result">
      <div className="ask-result__header">
        <span className="ask-result__name">{result.name}</span>
        <ConfidenceBar value={result.confidence} />
      </div>
      <p className="ask-result__explanation">{result.explanation}</p>
      {result.suggestedCommand && (
        <code className="ask-result__command">{result.suggestedCommand}</code>
      )}
      {result.configSnippet && (
        <pre className="ask-result__snippet">{result.configSnippet}</pre>
      )}
    </div>
  )
}

export function AskPanel({ baseUrl }: AskPanelProps) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<AskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResponse(null)
      setError(null)
      return
    }

    debounceRef.current = setTimeout(() => {
      void fetchResults(query)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  async function fetchResults(q: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/api/ask?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as AskResponse
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function renderBody() {
    if (!query.trim()) {
      return (
        <p className="ask-hint">
          Ask about agent teams, rules, or configuration.
          <br />
          e.g. <em>"Which team handles video content?"</em>
        </p>
      )
    }

    if (loading) return <p className="ask-loading">Searching…</p>

    if (error) return <p className="ask-error">Error: {error}</p>

    if (!response) return null

    if (response.scopeViolation) {
      return (
        <p className="ask-scope-violation">
          That question is outside my scope. Try asking about Retort teams, agents, or configuration.
          For implementation help, use <code>/team-frontend</code> or similar commands.
        </p>
      )
    }

    if (response.results.length === 0) {
      return <p className="ask-empty">No matching teams or agents found.</p>
    }

    return (
      <ul className="ask-results">
        {response.results.map((r) => (
          <li key={r.id}>
            <ResultCard result={r} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="ask-panel">
      <div className="ask-search-box">
        <input
          ref={inputRef}
          type="search"
          className="ask-input"
          placeholder="Which team handles…?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Ask about agent teams"
        />
      </div>
      <div className="ask-body">{renderBody()}</div>
    </div>
  )
}
