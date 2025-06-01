<script setup lang="ts">
import type { ProjectionAlgorithm } from '@/types/visualizer'

import { Select } from '@proj-airi/ui'
import { ref } from 'vue'

import { FieldLabel, FormField } from '@/components/form'
import { PROJECTION_ALGORITHMS } from '@/constants/visualizer'

import PCAControls from './PCAControls.vue'
import TSNEControls from './TSNEControls.vue'
import UMAPControls from './UMAPControls.vue'

const algorithm = ref<ProjectionAlgorithm>(PROJECTION_ALGORITHMS.UMAP)
</script>

<template>
  <div flex flex-col gap-4>
    <h2>Projection</h2>
    <div flex flex-col gap-4>
      <FormField>
        <FieldLabel>
          Algorithm
        </FieldLabel>

        <Select
          v-model="algorithm"
          :options="[
            { label: 'UMAP', value: PROJECTION_ALGORITHMS.UMAP },
            { label: 'PCA', value: PROJECTION_ALGORITHMS.PCA },
            { label: 't-SNE', value: PROJECTION_ALGORITHMS.TSNE },
          ]"
        />
      </FormField>

      <UMAPControls v-if="algorithm === PROJECTION_ALGORITHMS.UMAP" />
      <PCAControls v-else-if="algorithm === PROJECTION_ALGORITHMS.PCA" />
      <TSNEControls v-else-if="algorithm === PROJECTION_ALGORITHMS.TSNE" />
    </div>
  </div>
</template>
