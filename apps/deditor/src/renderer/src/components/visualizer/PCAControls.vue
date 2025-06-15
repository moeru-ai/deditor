<script setup lang="ts">
import type { PCAParameters } from '@/types'

import { Checkbox } from '@proj-airi/ui'
import { reactive, watch } from 'vue'

import SegmentedControl from '@/components/basic/SegmentedControl.vue'
import { FieldDescription, FieldLabel, FormField } from '@/components/form'
import { ProjectionAlgorithm } from '@/constants'
import { useVisualizerStore } from '@/stores'

const visualizerStore = useVisualizerStore()

const params = reactive<PCAParameters>({
  dimensions: 3,
  center: true,
  scale: true,
  ignoreZeroVariance: true,
})

watch(params, () => {
  visualizerStore.projection = { type: ProjectionAlgorithm.PCA, params }
}, { deep: true, immediate: true })
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
