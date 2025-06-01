<script setup lang="ts">
import type { ProvidedVisualizerState, VisualizerState } from '@/types/visualizer'

import { Checkbox } from '@proj-airi/ui'
import { watchDebounced } from '@vueuse/core'
import { PCA } from 'ml-pca'
import { inject, reactive } from 'vue'

import SegmentedControl from '@/components/basic/SegmentedControl.vue'
import { FieldDescription, FieldLabel, FormField } from '@/components/form'
import { ProvidedVisualizerStateKey } from '@/constants'
import { toVec3s } from '@/utils/three'

const visualizerState = inject<ProvidedVisualizerState>(ProvidedVisualizerStateKey)!

const params = reactive({
  dimensions: 3,
  center: true,
  scale: true,
  ignoreZeroVariance: true,
})

watchDebounced([params, () => visualizerState.vectors], ([params__, vectors_]) => {
  const params_ = params__ as typeof params // :-\
  const vectors = vectors_ as unknown as VisualizerState['vectors'] // :-\
  const pca = new PCA(vectors, {
    center: params_.center,
    scale: params_.scale,
    ignoreZeroVariance: params_.ignoreZeroVariance,
  })
  visualizerState.points = toVec3s(pca.predict(vectors, { nComponents: params_.dimensions }).to2DArray())
}, { immediate: true, debounce: 100 })
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
        Center
      </FieldLabel>
      <Checkbox
        v-model="params.center"
      />
      <FieldDescription>
        <span>Whether the data should be mean-centered.</span>
      </FieldDescription>
    </FormField>

    <FormField>
      <FieldLabel>
        Scale
      </FieldLabel>
      <Checkbox
        v-model="params.scale"
      />
      <FieldDescription>
        <span>Whether the data should be scaled to unit variance.</span>
      </FieldDescription>
    </FormField>

    <FormField>
      <FieldLabel>
        Ignore Zero Variance
      </FieldLabel>
      <Checkbox
        v-model="params.ignoreZeroVariance"
      />
      <FieldDescription>
        <span>
          Whether to skip any features (columns) that have zero variance. Features with zero variance do not contribute useful information and can cause errors in PCA computation.
        </span>
      </FieldDescription>
    </FormField>
  </div>
</template>
