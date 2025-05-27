<script setup lang="ts">
import type { MenuItemConfig } from './types'

import {
  ContextMenuCheckboxItem,
  ContextMenuItemIndicator,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
} from 'reka-ui'
import { computed, inject } from 'vue'

import ContextMenuItem from '../ContextMenuItem.vue'
import ContextMenuSubContent from '../ContextMenuSubContent.vue'
import ContextMenuSubTrigger from '../ContextMenuSubTrigger.vue'
import { contextMenuStates } from './constants'

const props = defineProps<{
  item: MenuItemConfig
}>()

// Inject the menu state from parent
const menuContext = inject(contextMenuStates)

// Handle the value for checkboxes and radio buttons
const modelValue = computed({
  get() {
    if (!props.item.value || !menuContext)
      return undefined
    return menuContext.state.value[props.item.value]
  },
  set(value) {
    if (!props.item.value || !menuContext)
      return
    menuContext.updateState(props.item.value, value)
  },
})

const commonClasses = 'group text-grass11 data-[disabled]:text-mauve8 relative h-[25px] flex select-none items-center rounded-md px-[5px] pl-[25px] text-xs leading-none outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-primary-900/50 data-[highlighted]:text-primary-300'
</script>

<template>
  <!-- Regular menu item -->
  <ContextMenuItem v-if="item.type === 'item'" :value="item.value" :disabled="item.disabled" @click="item.onClick && item.onClick()">
    {{ item.label }}
    <div v-if="item.shortcut" class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white">
      {{ item.shortcut }}
    </div>
  </ContextMenuItem>

  <!-- Submenu -->
  <ContextMenuSub v-else-if="item.type === 'sub'">
    <ContextMenuSubTrigger :value="item.value" :disabled="item.disabled">
      {{ item.label }}
      <div class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white">
        <div i-ph:caret-right-bold />
      </div>
    </ContextMenuSubTrigger>
    <ContextMenuPortal>
      <ContextMenuSubContent
        :side-offset="item.sideOffset || 2"
        :align-offset="item.alignOffset || -5"
      >
        <template v-for="(childItem, _index) in item.children" :key="_index">
          <ContextMenuRenderer :item="childItem" />
        </template>
      </ContextMenuSubContent>
    </ContextMenuPortal>
  </ContextMenuSub>

  <!-- Separator -->
  <ContextMenuSeparator v-else-if="item.type === 'separator'" class="m-[5px] h-[1px] bg-primary-900/40" />

  <!-- Checkbox item -->
  <ContextMenuCheckboxItem
    v-else-if="item.type === 'checkbox'"
    v-model="modelValue"
    :class="commonClasses"
  >
    <ContextMenuItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
      <div i-ph:check-bold />
    </ContextMenuItemIndicator>
    {{ item.label }}
    <div v-if="item.shortcut" class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white">
      {{ item.shortcut }}
    </div>
  </ContextMenuCheckboxItem>

  <!-- Radio group -->
  <template v-else-if="item.type === 'radio'">
    <ContextMenuLabel v-if="item.label" class="text-mauve11 pl-[25px] text-xs leading-[25px]">
      {{ item.label }}
    </ContextMenuLabel>
    <ContextMenuRadioGroup v-model="modelValue">
      <ContextMenuRadioItem
        v-for="(option, idx) in item.options"
        :key="idx"
        :class="commonClasses"
        :value="option.value"
      >
        <ContextMenuItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
          <div i-ph:dot-outline-fill />
        </ContextMenuItemIndicator>
        {{ option.label }}
      </ContextMenuRadioItem>
    </ContextMenuRadioGroup>
  </template>

  <!-- Label -->
  <ContextMenuLabel v-else-if="item.type === 'label'" class="text-mauve11 pl-[25px] text-xs leading-[25px]">
    {{ item.label }}
  </ContextMenuLabel>
</template>
