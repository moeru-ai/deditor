<script setup lang="ts">
import {
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableRoot,
} from 'reka-ui'

const props = defineProps<{ previewClass?: string }>()
const emits = defineEmits<{ (e: 'blur'): void }>()
const inputValue = defineModel<string>({ default: '', type: String, required: false })
</script>

<template>
  <div class="w-[250px]">
    <EditableRoot
      v-model="inputValue"
      default-value="Click to edit 'Reka UI'"
      class="flex flex-col gap-4"
    >
      <EditableArea>
        <EditablePreview :class="props.previewClass" />
        <EditableInput outline="1 offset-1 solid neutral-200" bg-transparent outline-none @blur="emits('blur')" />
      </EditableArea>
    </EditableRoot>
  </div>
</template>
