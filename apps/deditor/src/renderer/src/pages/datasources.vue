<script setup lang="ts">
import type { MenuItemConfig } from '../components/context-menu/basic/builder/types'
import type { Datasource } from '../stores'

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { Pane, Splitpanes } from 'splitpanes'
import { computed, h } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import { DATASOURCE_DRIVER_ICONS, DATASOURCE_DRIVER_NAMES } from '@/libs/datasources'

import PaneArea from '../components/container/PaneArea.vue'
import DatasourcesContextMenu from '../components/context-menu/datasources/index.vue'
import DatasourcesContextMenuPaneArea from '../components/context-menu/datasources/pane-area.vue'
import { DatasourceDriverEnum } from '../libs/datasources'
import { useDatasourcesStore } from '../stores'

const route = useRoute() // nested view
const router = useRouter()
const datasourcesStore = useDatasourcesStore()

const id = computed(() => (route.params as any)?.id)
const editing = computed(() => route.path.match(/\/datasources\/([^/]+)\/edit/))

const breakpoints = useBreakpoints(breakpointsTailwind)
const isSmallerThan2XL = breakpoints.smaller('2xl')

function handleClick(datasource: Datasource) {
  router.push(`/datasources/${datasource.driver}/inspect/${datasource.id}`)
}

function handleAdd() {
  const newDatasource = datasourcesStore.createDatasource(DatasourceDriverEnum.Postgres)
  datasourcesStore.datasources.push(newDatasource)
  router.push(`/datasources/${newDatasource.driver}/edit/${newDatasource.id}`)
}

function handleEdit(datasource?: Datasource) {
  if (!datasource) {
    return
  }
  if (editing.value && id.value === datasource.id) {
    // If already editing the same datasource, do nothing
    return
  }

  router.push(`/datasources/${datasource.driver}/edit/${datasource.id}`)
}

function handleDelete(datasource?: Datasource) {
  if (!datasource)
    return

  if (id.value === datasource.id) {
    // If the current datasource is being deleted, redirect to the datasources list
    router.replace('/datasources')
  }

  const index = datasourcesStore.datasources.findIndex(ds => ds.id === datasource.id)
  if (index !== -1) {
    datasourcesStore.datasources.splice(index, 1)
  }
}

// Define the menu configuration
const menuConfig = computed<MenuItemConfig<Datasource>[]>(() => ([
  {
    type: 'item',
    value: 'edit',
    label: 'Edit',
    shortcut: 'Enter',
    onClick: ({ data }) => handleEdit(data),
  },
  {
    type: 'item',
    value: 'delete',
    label: 'Delete',
    shortcut: '⌘ + Del',
    onClick: ({ data }) => handleDelete(data),
  },
]))

const paneAreaMenuConfig = computed<MenuItemConfig<any, DatasourceDriverEnum>[]>(() => ([
  {
    type: 'sub',
    label: 'Add...',
    shortcut: '⌘ + D',
    children: Object.values(DatasourceDriverEnum).map(driver => ({
      type: 'item',
      value: driver,
      renderLabel: () => {
        return h('div', {
          class: 'inline-flex items-center gap-2',
        }, [
          h('div', { class: DATASOURCE_DRIVER_ICONS[driver] ?? 'i-ph:question' }),
          h('div', DATASOURCE_DRIVER_NAMES[driver] ?? driver),
        ])
      },
      onClick: () => {
        const newDatasource = datasourcesStore.createDatasource(driver)
        datasourcesStore.datasources.push(newDatasource)
        router.push(`/datasources/${newDatasource.driver}/edit/${newDatasource.id}`)
      },
    })),
  },
]))

const paneDatasourceListSize = computed(() => isSmallerThan2XL.value ? 20 : 10)
const paneDatasourceEditSize = computed(() => isSmallerThan2XL.value ? 80 : 70)
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-0.8 bg-transparent">
      <Pane :min-size="10" :size="paneDatasourceListSize">
        <PaneArea flex flex-col gap-2>
          <div relative h-full w-full flex flex-col gap-2>
            <h2 text="neutral-300/80" mb-1 flex justify-between>
              Datasources
            </h2>
            <div relative flex flex-1 flex-col>
              <div v-if="datasourcesStore.datasources.length === 0" class="text-neutral-500 <lg:px-4" flex flex-1 flex-col items-center justify-center gap-2>
                <div i-ph:empty-light text-4xl />
                <div flex items-center justify-center>
                  <span>Connect one by</span>
                  <button
                    bg="neutral-900/70 hover:neutral-900"
                    ml-1 inline-block flex items-center gap-1 rounded-lg py-1 pl-1 pr-2 text-sm outline-none
                    @click="handleAdd"
                  >
                    <div i-ph:plus-light /> Add
                  </button>
                </div>
              </div>
              <div gap="0.5" h-fit max-h="[calc(100dvh-9rem)]" flex flex-col overflow-y-scroll>
                <DatasourcesContextMenu
                  v-for="(datasource, index) in datasourcesStore.datasources"
                  :key="index"
                  :config="menuConfig"
                  :data="datasource"
                  @click="() => handleClick(datasource)"
                >
                  <div
                    bg="hover:neutral-700/80"
                    active-class="bg-neutral-700/50"
                    transition="all duration-100 ease-in-out"
                    flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1 text-sm
                  >
                    <div :class="DATASOURCE_DRIVER_ICONS[datasource.driver] ?? 'i-ph:question'" />
                    <div>{{ datasource?.name }}</div>
                  </div>
                </DatasourcesContextMenu>
              </div>
              <DatasourcesContextMenuPaneArea :config="paneAreaMenuConfig">
                <div h-full flex-1 max-h="[calc(100dvh-10rem)]" />
              </DatasourcesContextMenuPaneArea>
              <button
                bg="neutral-900/70 hover:neutral-900"
                w="[calc(100%-1rem)]"
                fixed bottom-2 left-2 flex items-center gap-1 rounded-xl px-3 py-2 text-sm outline-none
                backdrop-blur-sm
                transition="all duration-300 ease-in-out"
                @click="handleAdd"
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
      <Pane :min-size="20" :size="paneDatasourceEditSize">
        <PaneArea flex flex-col gap-2>
          <RouterView />
        </PaneArea>
      </Pane>
    </Splitpanes>
  </div>
</template>
