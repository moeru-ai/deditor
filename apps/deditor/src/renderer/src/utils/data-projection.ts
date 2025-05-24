import type { PCAModel, PCAOptions, PredictOptions } from 'ml-pca'

import { PCA } from 'ml-pca'
import { TSNE } from 'msvana-tsne'

export type TSNEProjectionConfig = Exclude<ConstructorParameters<typeof TSNE>[0], undefined>

export function projectTSNE(matrix: number[][], config?: TSNEProjectionConfig) {
  const tsne = new TSNE(config)
  // TODO: We can also tap more info by here
  return tsne.transform(matrix)
}

export interface PCAProjectionConfig {
  options?: PCAOptions
  model?: PCAModel
  predict?: PredictOptions
}

export function projectPCA(matrix: number[][], config?: PCAProjectionConfig) {
  const pca = new PCA(matrix, config?.options, config?.model)
  // TODO: We can also tap more info by here
  return pca.predict(matrix, config?.predict).to2DArray() // Might not be efficient than not converting
}
