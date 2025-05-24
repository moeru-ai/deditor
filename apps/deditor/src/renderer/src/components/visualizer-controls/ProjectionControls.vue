<script setup lang="ts">
import type { ProjectionConfig } from '@/components/plot/ScatterEmbeddings3d.vue'
import type { PCAProjectionConfig, TSNEProjectionConfig } from '@/utils/data-projection'

import { Select } from '@proj-airi/ui'
import { computed, ref, watch } from 'vue'

import { FieldLabel, FormField } from '@/components/form'
import PCAConfig from '@/components/visualizer-controls/PCAConfig.vue'
import TSNEConfig from '@/components/visualizer-controls/TSNEConfig.vue'

const emit = defineEmits<{
  update: [config: ProjectionConfig]
}>()

const algorithm = ref<'pca' | 'tsne'>('pca')
const tsneConfig = ref<TSNEProjectionConfig>()
const pcaConfig = ref<PCAProjectionConfig>()

const config = computed<ProjectionConfig>(() => {
  switch (algorithm.value) {
    case 'pca':
      return {
        algorithm: 'pca',
        pcaConfig: pcaConfig.value!,
      }
    case 'tsne':
      return {
        algorithm: 'tsne',
        tsneConfig: tsneConfig.value!,
      }
    default:
      throw new Error(`Unknown projection algorithm: ${algorithm.value}`)
  }
})

watch(config, (newConfig) => {
  emit('update', newConfig)
}, { immediate: true, deep: true })
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
          {
            label: 'PCA',
            value: 'pca',
          }, {
            label: 't-SNE',
            value: 'tsne',
          },
        ]"
      />
    </FormField>

    <TSNEConfig v-if="algorithm === 'tsne'" @update="tsneConfig = $event" />
    <PCAConfig v-else-if="algorithm === 'pca'" @update="pcaConfig = $event" />
  </div>
  </div>
</template>
