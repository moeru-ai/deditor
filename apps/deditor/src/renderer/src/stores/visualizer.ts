import type * as THREE from 'three'

import type { DataPointStyle, ProjectionParameters } from '@/types/visualizer'

import { PCA } from 'ml-pca'
import { TSNE } from 'msvana-tsne'
import { defineStore } from 'pinia'
import { UMAP } from 'umap-js'
import { readonly, ref } from 'vue'

import { ProjectionAlgorithm } from '@/constants'
import { toVec3s } from '@/utils/three'

export const useVisualizerStore = defineStore('visualizer', () => {
  const data = ref<any[]>([]) // This can be strings or any visualizable data
  const vectors = ref<number[][]>([])
  const points = ref<THREE.Vector3[]>()
  const styles = ref<string[]>([])
  const styleDefinitions = ref<Record<string, DataPointStyle>>({})

  const projection = ref<ProjectionParameters>()

  const add = (data: any, vector: number[], style?: string | [string, DataPointStyle]) => {
    data.value.push(data)
    vectors.value.push([...vector])
    if (style) {
      if (typeof style === 'string') {
        styles.value.push(style)
      }
      else {
        const [styleKey, styleDefinition] = style
        styles.value.push(styleKey)
        styleDefinitions.value[styleKey] = styleDefinition
      }
    }
  }

  const remove = (index: number) => {
    if (index < 0 || index >= data.value.length) {
      return
    }

    data.value.splice(index, 1)
    vectors.value.splice(index, 1)
    styles.value.splice(index, 1)
    points.value?.splice(index, 1)
  }

  const defineStyle = (key: string, style: DataPointStyle) => {
    if (styleDefinitions.value[key]) {
      console.warn(`Overwriting existing style definition for key: ${key}`, styleDefinitions.value[key])
    }

    styleDefinitions.value[key] = style
  }

  /**
   * Unset a style definition by its key arbitrarily.
   * This does not remove data points that still reference this style.
   *
   * @param key The key of the style
   */
  const unsetStyle = (key: string) => {
    delete styleDefinitions.value[key]
  }

  const resetVectors = (source: number[][]) => {
    vectors.value = source.map(v => [...v])
  }

  const visualize = () => {
    switch (projection.value?.type) {
      case ProjectionAlgorithm.UMAP: {
        const params = projection.value.params
        const umap = new UMAP({
          nComponents: params.dimensions,
          nNeighbors: params.neighbors,
          minDist: params.minDistance,
        })

        try {
          points.value = toVec3s(umap.fit(vectors.value as number[][]))
        }
        catch (error) {
          // Sometimes this can fail if the params do not fit the data
          // Not a big problem
          console.warn('UMAP projection failed:', error)
        }
        break
      }
      case ProjectionAlgorithm.PCA: {
        const params = projection.value.params
        const pca = new PCA(vectors.value as number[][], {
          center: params.center,
          scale: params.scale,
          ignoreZeroVariance: params.ignoreZeroVariance,
        })
        points.value = toVec3s(pca.predict(vectors.value as number[][], { nComponents: params.dimensions }).to2DArray())
        break
      }
      case ProjectionAlgorithm.TSNE: {
        const params = projection.value.params
        const tsne = new TSNE({
          nDims: params.dimensions,
          nIter: params.iterations,
          perplexity: params.perplexity,
          learningRate: params.learningRate,
        })
        points.value = toVec3s(tsne.transform(vectors.value as number[][]))
        break
      }
    }
  }

  return {
    data: readonly(data),
    vectors: readonly(vectors),
    points: readonly(points),
    styles: readonly(styles),
    styleDefinitions: readonly(styleDefinitions),
    projection,
    resetVectors,
    add,
    remove,
    defineStyle,
    unsetStyle,
    visualize,
  }
})
