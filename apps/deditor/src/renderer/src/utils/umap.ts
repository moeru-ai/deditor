/**
 * Gets the number of epochs for optimizing the projection.
 *
 * https://github.com/PAIR-code/umap-js/blob/7767b1d0dd4b47718b5ad32d0f65dfb3b955d428/src/umap.ts#L1064-L1086
 */
export function selectNEpochs(count: number) {
  if (count <= 2500) {
    return 500
  }
  else if (count <= 5000) {
    return 400
  }
  else if (count <= 7500) {
    return 300
  }
  else {
    return 200
  }
}
