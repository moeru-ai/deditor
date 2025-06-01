<script lang="ts">
</script>

<script setup lang="ts" generic="V extends string | number = string | number">
import { watch } from 'vue'

export interface SegmentedControlItem<V> {
  label: string
  value: V
}

const props = defineProps<{
  items: SegmentedControlItem<V>[]
}>()

const active = defineModel<V>()

watch(() => props.items, (items) => {
  active.value = items[0].value
}, { deep: true, immediate: true })
</script>

<template>
  <div
    class="w-[min-content]"
    items-center justify-center rounded-lg p-1 bg="neutral-900/80"
    flex="~ row gap-1"
  >
    <button
      v-for="item in props.items"
      :key="item.value"
      :class="[{
        'hover:bg-primary/30': active !== item.value,
        'bg-primary': active === item.value,
      }]"
      rounded-md px-3 py-1 text-sm text-white
      transition="colors duration-300 ease-in-out"
      @click="active = item.value"
    >
      {{ item.label }}
    </button>
  </div>
</template>
