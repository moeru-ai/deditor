import type * as THREE from 'three'
import type { Reactive } from 'vue'

import type { PROJECTION_ALGORITHMS } from '@/constants/visualizer'

export type ProjectionAlgorithm = typeof PROJECTION_ALGORITHMS[keyof typeof PROJECTION_ALGORITHMS]

export type StyleKey = string

export interface Style {
  color?: string
}

export interface VisualizerState {
  texts: string[]
  vectors: number[][]
  points: THREE.Vector3[]
  styles: StyleKey[]
  styleDefinitions: Record<string, Style>
}

export type ProvidedVisualizerState = Reactive<VisualizerState>
