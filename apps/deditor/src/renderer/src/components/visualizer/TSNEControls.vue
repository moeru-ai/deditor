<script setup lang="ts">
import type { TSNEParameters } from '@/types'

import { Range } from '@proj-airi/ui'
import { reactive, watch } from 'vue'

import { FieldDescription, FieldLabel, FormField } from '@/components/form'
import { ProjectionAlgorithm } from '@/constants'
import { useVisualizerStore } from '@/stores'

const visualizerStore = useVisualizerStore()

const params = reactive<TSNEParameters>({
  dimensions: 3,
  iterations: 1000,
  perplexity: 20,
  learningRate: 100,
})

watch(params, () => {
  visualizerStore.projection = { type: ProjectionAlgorithm.TSNE, params }
}, { deep: true, immediate: true })
</script>

<template>
  <div flex flex-col gap-4>
    <FormField>
      <FieldLabel>
        Iterations
      </FieldLabel>
      <Range
        v-model="params.iterations"
        :max="10000"
        :min="1000"
        :step="1000"
      />
      <FieldDescription>
        <span>Maximum number of iterations for the optimization.</span>
        <span min-w-9ch text-right>{{ params.iterations.toLocaleString() }}</span>
      </FieldDescription>
    </FormField>

    <FormField>
      <FieldLabel>
        Perplexity
      </FieldLabel>
      <Range
        v-model="params.perplexity"
        :max="50"
        :min="5"
        :step="1"
      />
      <FieldDescription>
        <span>
          The perplexity is related to the number of nearest neighbors that is used in other manifold learning algorithms. Larger datasets usually require a larger perplexity.Consider selecting a value between 5 and 50. Different values can result in significantly different results. The perplexity must be less than the number of samples.
        </span>
        <span min-w-6ch text-right>{{ params.perplexity }}</span>
      </FieldDescription>
    </FormField>

    <FormField>
      <FieldLabel>
        Learning Rate
      </FieldLabel>
      <Range
        v-model="params.learningRate"
        :max="2000"
        :min="10"
        :step="10"
      />
      <FieldDescription>
        <span>
          The learning rate for t-SNE is between 10 and 1,000. If the learning rate is too high, the data may look like a "ball" with any point approximately equidistant from its nearest neighbors. If the learning rate is too low, most points may look compressed in a dense cloud with few outliers.
        </span>
        <span min-w-6ch text-right>{{ params.learningRate.toLocaleString() }}</span>
      </FieldDescription>
    </FormField>
  </div>
</template>
