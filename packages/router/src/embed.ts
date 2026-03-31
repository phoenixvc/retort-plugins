/**
 * Embedding helper — wraps @xenova/transformers for Phase 2 semantic routing.
 *
 * The pipeline is a singleton: it is loaded once and reused across calls so
 * the model weights are not re-downloaded on every invocation.
 */

// Dynamic import keeps @xenova/transformers as an optional runtime dep; the
// package is listed as an optionalDependency in package.json so consumers
// that only use Phase-1 keyword routing don't have to install it.
type PipelineType = (
  texts: string[],
  options?: { pooling?: string; normalize?: boolean },
) => Promise<{ data: Float32Array | number[] }>

type FeatureExtractionPipeline = (texts: string[], opts?: object) => Promise<{ data: Float32Array | number[] }>

let _pipeline: FeatureExtractionPipeline | undefined

/**
 * Returns (and caches) the feature-extraction pipeline.
 * Throws if @xenova/transformers is not installed.
 */
async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (_pipeline) return _pipeline

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { pipeline } = (await import('@xenova/transformers')) as { pipeline: (task: string, model: string) => Promise<PipelineType> }
  _pipeline = (await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')) as unknown as FeatureExtractionPipeline
  return _pipeline
}

/**
 * Embed a batch of texts and return normalised float vectors.
 *
 * @param texts - Array of strings to embed (must be non-empty).
 * @returns     - Array of normalised float arrays, one per input text.
 */
// all-MiniLM-L6-v2 produces 384-dimensional embeddings.
const EMBEDDING_DIM = 384

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const extractor = await getPipeline()

  // Process the whole batch in a single pipeline call instead of N serial calls.
  // output.data is a flat Float32Array of shape [batch_size × EMBEDDING_DIM].
  const output = await extractor(texts, { pooling: 'mean', normalize: true })
  const results: number[][] = []
  for (let i = 0; i < texts.length; i++) {
    const start = i * EMBEDDING_DIM
    results.push(Array.from(output.data.slice(start, start + EMBEDDING_DIM)))
  }
  return results
}

/**
 * Resets the cached pipeline singleton.  Intended for use in tests only.
 * @internal
 */
export function _resetPipelineCache(): void {
  _pipeline = undefined
}
