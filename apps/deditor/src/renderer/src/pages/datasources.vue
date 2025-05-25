<script setup lang="ts">
import { Pane, Splitpanes } from 'splitpanes'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import PaneArea from '../components/container/PaneArea.vue'
import { useDatasourcesStore } from '../stores/datasources'

const route = useRoute()
const datasourcesStore = useDatasourcesStore()

const editing = computed(() => route.path.match(/\/datasources\/([^/]+)\/edit/))
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
