<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { useVModel } from '@vueuse/core'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    bg="neutral-900/80 hover:neutral-900"
    border="2 solid neutral-700/20 hover:primary-700/50"
    rounded-lg px-3 py-2 text-sm outline-none
    transition="colors duration-300 ease-in-out"
  >
</template>
