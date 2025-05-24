<script setup lang="ts">
import type { PCAProjectionConfig } from '@/utils/data-projection'

import { Checkbox } from '@proj-airi/ui'
import { reactive, watch } from 'vue'

import { FieldDescription, FieldLabel, FormField } from '@/components/form'

const emit = defineEmits<{
  update: [config: PCAProjectionConfig]
}>()

const model = reactive({
  center: true,
  scale: true,
  ignoreZeroVariance: true,
})

watch(model, (newModel) => {
  emit('update', {
    options: {
      center: newModel.center,
      scale: newModel.scale,
      ignoreZeroVariance: newModel.ignoreZeroVariance,
    },
    predict: {
      nComponents: 3,
    },
  })
}, { immediate: true, deep: true })
</script>

<template>
  <div flex flex-col gap-4>
    <FormField>
      <FieldLabel>
        Center
      </FieldLabel>
      <Checkbox
        v-model="model.center"
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
        v-model="model.scale"
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
        v-model="model.ignoreZeroVariance"
      />
      <FieldDescription>
        <span>
          Whether to skip any features (columns) that have zero variance. Features with zero variance do not contribute useful information and can cause errors in PCA computation.
        </span>
      </FieldDescription>
    </FormField>
  </div>
</template>
