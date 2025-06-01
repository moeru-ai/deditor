<script setup lang="ts">
import type { ProvidedVisualizerState } from '@/types/visualizer'

import { Range } from '@proj-airi/ui'
import { watchDebounced } from '@vueuse/core'
import { UMAP } from 'umap-js'
import { inject, reactive, shallowRef, watch } from 'vue'

import SegmentedControl from '@/components/basic/SegmentedControl.vue'
import { FieldDescription, FieldLabel, FormField } from '@/components/form'
import { ProvidedVisualizerStateKey } from '@/constants'
import { toVec3s } from '@/utils/three'

const state = inject<ProvidedVisualizerState>(ProvidedVisualizerStateKey)!

const params = reactive({
  dimensions: 3,
  neighbors: 15,
  minDistance: 0.1,
  spread: 1.0,
})

const umap = shallowRef<UMAP>()

watchDebounced(params, (params) => {
  umap.value = new UMAP({
    nComponents: params.dimensions,
    nNeighbors: params.neighbors,
    minDist: params.minDistance,
  })
}, { immediate: true, debounce: 100 })

watch([umap, () => state.vectors], ([umap, vectors]) => {
  if (!umap) {
    return
  }
  let projections: number[][] = []
  try {
    projections = umap.fit(vectors)
  }
  catch (error) {
    // Sometimes this can fail if the params do not fit the data
    // Not a big problem
    console.warn('UMAP projection failed:', error)
  }
  state.points = toVec3s(projections)
}, { immediate: true })
</script>

<template>
  <div flex flex-col gap-4>
    <FormField>
      <FieldLabel>
        Dimensions
      </FieldLabel>
      <SegmentedControl
        v-model="params.dimensions"
        :items="[
          { label: '3D', value: 3 },
          { label: '2D', value: 2 },
        ]"
      />
    </FormField>

    <FormField>
      <FieldLabel>
        Neighbors
      </FieldLabel>
      <Range
        v-model="params.neighbors"
        :max="100"
        :min="2"
        :step="1"
      />
      <FieldDescription>
        <span>The size of local neighborhood (in terms of number of neighboring sample points) used for manifold approximation. Larger values result in more global views of the manifold, while smaller values result in more local data being preserved. In general values should be in the range 2 to 100.</span>
        <span min-w-5ch text-right>{{ params.neighbors }}</span>
      </FieldDescription>
    </FormField>

    <FormField>
      <FieldLabel>
        Minimum Distance
      </FieldLabel>
      <Range
        v-model="params.minDistance"
        :max="1"
        :min="0"
        :step="0.01"
      />
      <FieldDescription>
        <span>The effective minimum distance between embedded points. Smaller values will result in a more clustered/clumped embedding where nearby points on the manifold are drawn closer together, while larger values will result on a more even dispersal of points. The value should be set relative to the <b>Spread</b> value, which determines the scale at which embedded points will be spread out.</span>
        <span min-w-5ch text-right>{{ params.minDistance }}</span>
      </FieldDescription>
    </FormField>

    <FormField>
      <FieldLabel>
        Spread
      </FieldLabel>
      <Range
        v-model="params.spread"
        :max="5"
        :min="0.01"
        :step="0.01"
      />
      <FieldDescription>
        <span>The effective scale of embedded points. In combination with <b>Minimum Distance</b> this determines how clustered/clumped the embedded points are.</span>
        <span min-w-5ch text-right>{{ params.spread }}</span>
      </FieldDescription>
    </FormField>
  </div>
</template>
