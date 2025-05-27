<script setup lang="ts">
import type { MenuItemConfig } from '../components/context-menu/basic/builder/types'

import { Pane, Splitpanes } from 'splitpanes'
import { computed, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import PaneArea from '../components/container/PaneArea.vue'
import DatasourcesContextMenu from '../components/context-menu/datasources/index.vue'
import { useDatasourcesStore } from '../stores/datasources'

const route = useRoute()
const datasourcesStore = useDatasourcesStore()

const editing = computed(() => route.path.match(/\/datasources\/([^/]+)\/edit/))

// Define checkbox and radio states
const showBookmarks = ref(false)
const showFullUrls = ref(false)
const selectedPerson = ref('pedro')

// Define the menu configuration
const menuConfig = computed<MenuItemConfig[]>(() => ([
  {
    type: 'item',
    value: 'new-tab',
    label: 'New Tab',
    shortcut: '⌘+T',
    onClick: () => console.log('New Tab clicked'),
  },
  {
    type: 'sub',
    value: 'more-tools',
    label: 'More Tools',
    children: [
      {
        type: 'item',
        label: 'Save Page As…',
        shortcut: '⌘+S',
        onClick: () => console.log('Save Page clicked'),
      },
      {
        type: 'item',
        label: 'Create Shortcut…',
        onClick: () => console.log('Create Shortcut clicked'),
      },
      {
        type: 'item',
        label: 'Name Window…',
        onClick: () => console.log('Name Window clicked'),
      },
      { type: 'separator' },
      {
        type: 'item',
        label: 'Developer Tools',
        onClick: () => console.log('Developer Tools clicked'),
      },
    ],
  },
  {
    type: 'item',
    value: 'new-window',
    label: 'New Window',
    shortcut: '⌘+N',
    onClick: () => console.log('New Window clicked'),
  },
  {
    type: 'item',
    value: 'new-private-window',
    label: 'New Private Window',
    shortcut: '⇧+⌘+N',
    onClick: () => console.log('New Private Window clicked'),
  },
  { type: 'separator' },
  {
    type: 'checkbox',
    value: 'show-bookmarks',
    label: 'Show Bookmarks',
    shortcut: '⌘+B',
    modelValue: showBookmarks.value,
    onUpdate: (val) => {
      showBookmarks.value = val
      console.log('Show Bookmarks:', val)
    },
  },
  {
    type: 'checkbox',
    value: 'show-full-urls',
    label: 'Show Full URLs',
    modelValue: showFullUrls.value,
    onUpdate: (val) => {
      showFullUrls.value = val
      console.log('Show Full URLs:', val)
    },
  },
  { type: 'separator' },
  {
    type: 'label',
    label: 'People',
  },
  {
    type: 'radio',
    value: 'selected-person',
    modelValue: selectedPerson.value,
    options: [
      { value: 'pedro', label: 'Pedro Duarte' },
      { value: 'colm', label: 'Colm Tuite' },
    ],
    onUpdate: (val) => {
      selectedPerson.value = val
      console.log('Selected Person:', val)
    },
  },
  { type: 'separator' },
  {
    type: 'sub',
    label: 'First Level Submenu',
    children: [
      {
        type: 'item',
        label: 'Submenu Item 1',
        onClick: () => console.log('Submenu Item 1 clicked'),
      },
      {
        type: 'sub',
        label: 'Second Level Submenu',
        children: [
          {
            type: 'item',
            label: 'Nested Item 1',
            onClick: () => console.log('Nested Item 1 clicked'),
          },
          {
            type: 'sub',
            label: 'Third Level Submenu',
            children: [
              {
                type: 'item',
                label: 'Deeply Nested Item',
                onClick: () => console.log('Deeply Nested Item clicked'),
              },
            ],
          },
        ],
      },
    ],
  },
]))
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-0.8 bg-transparent">
      <Pane :min-size="20" :size="20">
        <PaneArea flex flex-col gap-2>
          <div relative h-full w-full flex flex-col gap-2>
            <h2 text="neutral-300/80" mb-1 flex justify-between>
              Datasources
            </h2>
            <div relative flex flex-1 flex-col>
              <div v-if="datasourcesStore.datasources.length === 0" class="text-neutral-500" flex flex-1 flex-col items-center justify-center gap-2>
                <div i-ph:empty-light text-4xl />
                <div flex items-center justify-center>
                  <span>Connect one by</span>
                  <button
                    bg="neutral-900/70 hover:neutral-900"
                    ml-1 inline-block flex items-center gap-1 rounded-lg py-1 pl-1 pr-2 text-sm outline-none
                    @click="datasourcesStore.datasources.push({ driver: 'postgres', name: `Datasource ${datasourcesStore.datasources.length + 1}`, connectionString: '', id: String(datasourcesStore.datasources.length + 1) })"
                  >
                    <div i-ph:plus-light /> Add
                  </button>
                </div>
              </div>
              <div flex flex-col gap="0.5">
                <DatasourcesContextMenu :config="menuConfig">
                  <RouterLink
                    v-for="(datasource, index) in datasourcesStore.datasources"
                    :key="index"
                    :to="`/datasources/${datasource.driver}/edit/${datasource.id}`"
                    bg="hover:neutral-700/80"
                    active-class="bg-neutral-700/50"
                    flex items-center gap-2 rounded-md px-2 py-1 text-sm
                    transition="all duration-100 ease-in-out"
                  >
                    <template v-if="datasource.driver === 'postgres'">
                      <div i-drizzle-orm-icons:postgresql />
                      <div>{{ datasource.name }}</div>
                    </template>
                  </RouterLink>
                </DatasourcesContextMenu>
              </div>
              <button
                bg="neutral-900/70 hover:neutral-900"
                w="[calc(100%-1rem)]"
                fixed bottom-2 left-2 flex items-center gap-1 rounded-xl px-3 py-2 text-sm outline-none
                transition="all duration-300 ease-in-out"
                @click="datasourcesStore.datasources.push({ driver: 'postgres', name: `Datasource ${datasourcesStore.datasources.length + 1}`, connectionString: '', id: String(datasourcesStore.datasources.length + 1) })"
              >
                <div i-ph:plus-light />
                <div>
                  Add
                </div>
              </button>
            </div>
          </div>
        </PaneArea>
      </Pane>
      <Pane v-if="editing" :min-size="20" :size="80">
        <PaneArea flex flex-col gap-2>
          <RouterView />
        </PaneArea>
      </Pane>
    </Splitpanes>
  </div>
</template>
