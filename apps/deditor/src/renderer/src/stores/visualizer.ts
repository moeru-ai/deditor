import type * as THREE from 'three'

import type { DataPointStyle } from '@/types/visualizer'

import { defineStore } from 'pinia'
import { readonly, ref } from 'vue'

import { toVec3s } from '@/utils/three'

export const useVisualizerStore = defineStore('visualizer', () => {
  const data_ = ref<any[]>([]) // This can be strings or any visualizable data
  const vectors = ref<number[][]>([])
  const points_ = ref<THREE.Vector3[]>([])
  const styles = ref<string[]>([])
  const styleDefinitions = ref<Record<string, DataPointStyle>>({})

  const add = (data: any, vector: number[], style?: string | [string, DataPointStyle]) => {
    data_.value.push(data)
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
    if (index < 0 || index >= data_.value.length) {
      return
    }

    data_.value.splice(index, 1)
    vectors.value.splice(index, 1)
    styles.value.splice(index, 1)
    points_.value.splice(index, 1)
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

  const mutatePoints = (points: number[][]) => {
    if (points.length !== vectors.value.length) {
      throw new Error(
        `Expected new point array to be of the same length (${points_.value.length}) but received ${points.length}.`,
      )
    }

    // Copy and prevent outside mutation
    points_.value = toVec3s(points)
  }

  return {
    data: readonly(data_),
    vectors: readonly(vectors),
    points: readonly(points_),
    styles: readonly(styles),
    styleDefinitions: readonly(styleDefinitions),
    add,
    remove,
    defineStyle,
    unsetStyle,
    mutatePoints,
  }
})
