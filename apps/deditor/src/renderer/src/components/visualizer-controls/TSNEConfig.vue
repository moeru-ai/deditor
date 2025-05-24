<script setup lang="ts">
import type { TSNEProjectionConfig } from '@/utils/data-projection'

import { Range } from '@proj-airi/ui'
import { reactive, watch } from 'vue'

import { FieldDescription, FieldLabel, FormField } from '@/components/form'

const emit = defineEmits<{
  update: [config: TSNEProjectionConfig]
}>()

const model = reactive({
  nIter: 1_000,
  perplexity: 20,
  learningRate: 100,
})

watch(model, (newModel) => {
  emit('update', {
    nDims: 3,
    nIter: newModel.nIter,
    perplexity: newModel.perplexity,
    learningRate: newModel.learningRate,
  })
}, { immediate: true, deep: true })
</script>

<template>
  <div flex flex-col gap-4>
    <FormField>
      <FieldLabel>
        Iterations
      </FieldLabel>
      <Range
        v-model="model.nIter"
        :max="10_000"
        :min="1_000"
        :step="1_000"
      />
      <FieldDescription>
        <span>Maximum number of iterations for the optimization.</span>
        <span min-w-9ch text-right>{{ model.nIter.toLocaleString() }}</span>
      </FieldDescription>
    </FormField>

    <FormField>
      <FieldLabel>
        Perplexity
      </FieldLabel>
      <Range
        v-model="model.perplexity"
        :max="50"
        :min="5"
        :step="1"
      />
      <FieldDescription>
        <span>
          The perplexity is related to the number of nearest neighbors that is used in other manifold learning algorithms. Larger datasets usually require a larger perplexity.Consider selecting a value between 5 and 50. Different values can result in significantly different results. The perplexity must be less than the number of samples.
        </span>
        <span min-w-6ch text-right>{{ model.perplexity.toLocaleString() }}</span>
      </FieldDescription>
    </FormField>

    <FormField>
      <FieldLabel>
        Learning Rate
      </FieldLabel>
      <Range
        v-model="model.learningRate"
        :max="2_000"
        :min="10"
        :step="10"
      />
      <FieldDescription>
        <span>
          The learning rate for t-SNE is between 10 and 1,000. If the learning rate is too high, the data may look like a ‘ball’ with any point approximately equidistant from its nearest neighbors. If the learning rate is too low, most points may look compressed in a dense cloud with few outliers.
        </span>
        <span min-w-6ch text-right>{{ model.learningRate.toLocaleString() }}</span>
      </FieldDescription>
    </FormField>
  </div>
  <!-- <form flex flex-col gap-4>
    <FormField v-slot="{ componentField, value }" name="iterations">
      <FormItem flex flex-col gap-2>
        <FormLabel>Iterations</FormLabel>

        <FormDescription flex justify-between gap-4>
          <span>Maximum number of iterations for the optimization.</span>
          <span min-w-9ch text-right>{{ (value?.[0] as Number).toLocaleString() }}</span>
        </FormDescription>
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField, value }" name="perplexity">
      <FormItem flex flex-col gap-2>
        <FormLabel>Perplexity</FormLabel>
        <Slider
          :model-value="componentField.modelValue"
          :max="50"
          :min="5"
          :step="1"
          :name="componentField.name"
          @update:model-value="componentField['onUpdate:modelValue']"
        />
        <FormDescription flex justify-between gap-4>
          <span>
            The perplexity is related to the number of nearest neighbors that is used in other manifold learning algorithms. Larger datasets usually require a larger perplexity.Consider selecting a value between 5 and 50. Different values can result in significantly different results. The perplexity must be less than the number of samples.
          </span>
          <span min-w-6ch text-right>{{ (value?.[0] as Number).toLocaleString() }}</span>
        </FormDescription>
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField, value }" name="learningRate">
      <FormItem flex flex-col gap-2>
        <FormLabel>Learning Rate</FormLabel>
        <Slider
          :model-value="componentField.modelValue"
          :max="2_000"
          :min="10"
          :step="10"
          :name="componentField.name"
          @update:model-value="componentField['onUpdate:modelValue']"
        />
        <FormDescription flex justify-between gap-4>
          <span>
            The learning rate for t-SNE is between 10 and 1,000. If the learning rate is too high, the data may look like a ‘ball’ with any point approximately equidistant from its nearest neighbors. If the learning rate is too low, most points may look compressed in a dense cloud with few outliers.
          </span>
          <span min-w-6ch text-right>{{ (value?.[0] as Number).toLocaleString() }}</span>
        </FormDescription>
      </FormItem>
    </FormField>
  </form> -->
</template>
