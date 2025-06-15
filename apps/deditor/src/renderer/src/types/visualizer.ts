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

export type ProjectionParameters
  = | { type: ProjectionAlgorithm.UMAP, params: UMAPParameters }
    | { type: ProjectionAlgorithm.PCA, params: PCAParameters }
