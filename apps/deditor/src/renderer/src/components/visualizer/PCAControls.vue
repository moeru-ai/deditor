<script setup lang="ts">
import { Checkbox } from '@proj-airi/ui'
import { watchDebounced } from '@vueuse/core'
import { PCA } from 'ml-pca'
import { reactive } from 'vue'

import SegmentedControl from '@/components/basic/SegmentedControl.vue'
import { FieldDescription, FieldLabel, FormField } from '@/components/form'
import { useVisualizerStore } from '@/stores'
import { toVec3s } from '@/utils/three'

const visualizerStore = useVisualizerStore()

const params = reactive({
  dimensions: 3,
  center: true,
  scale: true,
  ignoreZeroVariance: true,
})

watchDebounced<[typeof params, typeof visualizerStore.vectors], true>([params, visualizerStore.vectors], ([params, vectors]) => {
  const pca = new PCA(vectors as number[][], {
    center: params.center,
    scale: params.scale,
    ignoreZeroVariance: params.ignoreZeroVariance,
  })
  visualizerStore.points = toVec3s(pca.predict(vectors as number[][], { nComponents: params.dimensions }).to2DArray())
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
