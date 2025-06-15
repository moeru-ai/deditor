import type { ProjectionAlgorithm } from '@/constants'

export interface DataPointStyle {
  color?: string
}

export interface UMAPParameters {
  dimensions: number
  neighbors: number
  minDistance: number
  spread: number
}

export interface PCAParameters {
  dimensions: number
  center: boolean
  scale: boolean
  ignoreZeroVariance: boolean
}

export interface TSNEParameters {
  dimensions: number
  iterations: number
  perplexity: number
  learningRate: number
}

export type ProjectionParameters
  = | { type: ProjectionAlgorithm.UMAP, params: UMAPParameters }
    | { type: ProjectionAlgorithm.PCA, params: PCAParameters }
    | { type: ProjectionAlgorithm.TSNE, params: TSNEParameters }
