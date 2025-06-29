// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

// Modifications Copyright (c) 2025 Project AIRI Team

/** UMAP options */
export interface UMAPOptions {
  /** The input distance metric */
  metric?: 'euclidean' | 'cosine'

  /** The nearest neighbor method. By default we use HNSW with its default parameters. */
  knn_method?: 'hnsw' | 'nndescent' | 'vptree'

  /** The initialization method. By default we use spectral initialization. */
  initialize_method?: 'spectral' | 'random' | 'none'

  local_connectivity?: number
  bandwidth?: number
  mix_ratio?: number
  spread?: number
  min_dist?: number
  a?: number
  b?: number
  repulsion_strength?: number
  n_epochs?: number
  learning_rate?: number
  negative_sample_rate?: number
  n_neighbors?: number
  /** The random seed. */
  seed?: number
}

export interface UMAP {
  /** The current epoch number */
  get epoch(): number

  /** The input dimension */
  get input_dim(): number

  /** The output dimension */
  get output_dim(): number

  /**
   * Get the current embedding.
   * The resulting Float32Array points to WASM internal memory.
   * If you need to use the data outside this library or after further
   * interaction with this library, make sure to create a copy
   * of the array, as the underlying memory may change.
   */
  get embedding(): Float32Array

  /**
   * Run the UMAP algorithm until reaching `epoch_limit` epochs,
   * or to completion if `epoch_limit` is not specified.
   * @param epoch_limit the epoch number to run to
   */
  run: (epoch_limit?: number) => void

  /** Destroy the instance and release resources */
  destroy: () => void
}

/**
 * Initialize a UMAP instance.
 * @param count the number of data points
 * @param input_dim the input dimension
 * @param output_dim the output dimension
 * @param data the data array. Must be a Float32Array with count * input_dim elements.
 * @param options options
 */
export function createUMAP(
  count: number,
  input_dim: number,
  output_dim: number,
  data: Float32Array,
  options?: UMAPOptions,
): Promise<UMAP>

/** KNN options */
export interface KNNOptions {
  /** The distance metric */
  metric?: 'euclidean' | 'cosine'

  /** The nearest neighbor method. By default we use HNSW with its default parameters. */
  method?: 'hnsw' | 'nndescent' | 'vptree'
}

export interface KNNQueryResult {
  indices: Int32Array
  distnaces: Float32Array
}

export interface KNN {
  query_by_index: (index: number, k: number) => KNNQueryResult
  query_by_vector: (data: Float32Array, k: number) => KNNQueryResult
  destroy: () => void
}

export function createKNN(count: number, input_dim: number, data: Float32Array, options?: KNNOptions): Promise<KNN>
