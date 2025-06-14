import type * as THREE from 'three'

import type { DataPointStyle } from '@/types/visualizer'

import { defineStore } from 'pinia'
import { readonly, ref } from 'vue'

import { toVec3s } from '@/utils/three'

export const useVisualizerStore = defineStore('visualizer', () => {
  const data = ref<any[]>([]) // This can be strings or any visualizable data
  const vectors = ref<number[][]>([])
  const points = ref<THREE.Vector3[]>()
  const styles = ref<string[]>([])
  const styleDefinitions = ref<Record<string, DataPointStyle>>({})

  const resetVectors = (source: number[][]) => {
    vectors.value = source.map(v => [...v])
    points.value = undefined
  }

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

  const mutatePoints = (source: number[][]) => {
    if (points.value && source.length !== vectors.value.length) {
      throw new Error(
        `Expected new point array to be of the same length as vectors (${vectors.value.length}) but received ${source.length}.`,
      )
    }

    // Copy and prevent outside mutation
    points.value = toVec3s(source)
  }

  return {
    data: readonly(data),
    vectors: readonly(vectors),
    points: readonly(points),
    styles: readonly(styles),
    styleDefinitions: readonly(styleDefinitions),
    resetVectors,
    add,
    remove,
    defineStyle,
    unsetStyle,
    mutatePoints,
  }
})
