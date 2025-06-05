<script setup lang="ts">
import { Select } from '@proj-airi/ui'
import { ref } from 'vue'

import { FieldLabel, FormField } from '@/components/form'
import PCAControls from '@/components/visualizer/PCAControls.vue'
import TSNEControls from '@/components/visualizer/TSNEControls.vue'
import UMAPControls from '@/components/visualizer/UMAPControls.vue'
import { ProjectionAlgorithm } from '@/constants'

const algorithm = ref<ProjectionAlgorithm>(ProjectionAlgorithm.UMAP)
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
            { label: 'UMAP', value: ProjectionAlgorithm.UMAP },
            { label: 'PCA', value: ProjectionAlgorithm.PCA },
            { label: 't-SNE', value: ProjectionAlgorithm.TSNE },
          ]"
        />
      </FormField>

      <UMAPControls v-if="algorithm === ProjectionAlgorithm.UMAP" />
      <PCAControls v-else-if="algorithm === ProjectionAlgorithm.PCA" />
      <TSNEControls v-else-if="algorithm === ProjectionAlgorithm.TSNE" />
    </div>
  </div>
</template>
