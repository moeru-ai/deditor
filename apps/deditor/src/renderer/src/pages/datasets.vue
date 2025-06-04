<script setup lang="ts">
import { nanoid } from '@deditor-app/shared'
import { Pane, Splitpanes } from 'splitpanes'
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import PaneArea from '../components/container/PaneArea.vue'

const route = useRoute('/datasets/[type]/edit/[id]/')
const router = useRouter()

const editing = computed(() => route.path.match(/\/datasets\/([^/]+)\/edit/))

function handleNew() {
  router.push(`/datasets/text/edit/${nanoid()}`)
}
const paneDatasourceListSize = computed(() => editing.value ? 10 : 10)
const paneDatasourceEditSize = computed(() => editing.value ? 20 : 20)
const paneDatasourcePreviewSize = computed(() => editing.value ? 70 : 70)
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-0.8 bg-transparent">
      <Pane :min-size="10" :size="paneDatasourceListSize">
        <PaneArea flex flex-col gap-2>
          <div relative h-full w-full flex flex-col gap-2>
            <h2 text="neutral-300/80" mb-1 flex justify-between>
              Datasets
            </h2>
            <div relative flex flex-1 flex-col>
              <div v-if="true" class="text-neutral-500 <lg:px-4" flex flex-1 flex-col items-center justify-center gap-2>
                <div i-ph:empty-light text-4xl />
                <div flex flex-wrap items-center justify-center>
                  <span>Import / Generate one by</span>
                  <button
                    bg="neutral-900/70 hover:neutral-900"
                    ml-1 inline-block flex items-center gap-1 rounded-lg py-1 pl-1 pr-2 text-sm outline-none
                    @click="handleNew"
                  >
                    <div i-ph:plus-light /> New
                  </button>
                </div>
              </div>
              <button
                bg="neutral-900/70 hover:neutral-900"
                w="[calc(100%-1rem)]"
                fixed bottom-2 left-2 flex items-center gap-1 rounded-xl px-3 py-2 text-sm outline-none
                transition="all duration-300 ease-in-out"
                @click="handleNew"
              >
                <div i-ph:plus-light />
                <div>
                  New
                </div>
              </button>
            </div>
          </div>
        </PaneArea>
      </Pane>
      <Pane :min-size="20" :size="paneDatasourceEditSize">
        <PaneArea v-if="editing" flex flex-col gap-2>
          <RouterView />
        </PaneArea>
      </Pane>
      <Pane :min-size="20" :size="paneDatasourcePreviewSize" />
    </Splitpanes>
  </div>
</template>
