<script setup lang="ts">
import type { DuckDBWasmDrizzleDatabase } from '@proj-airi/drizzle-duckdb-wasm'

import { drizzle } from '@proj-airi/drizzle-duckdb-wasm'
import { getImportUrlBundles } from '@proj-airi/duckdb-wasm/bundles/import-url-browser'
import { BasicTextarea } from '@proj-airi/ui'
import { Pane, Splitpanes } from 'splitpanes'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import Button from '../components/basic/Button.vue'
import PaneCard from '../components/container/PaneCard.vue'
import Chat from '../components/table/Chat.vue'

const input = ref(`[${Array.from({ length: 100 }, (_, i) => `{"question": "What is the answer to ${i}?", "answer": "It's ${i}."}`).join(',')}]`)

const results = ref<Record<string, unknown>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const selectedRow = ref<Record<string, unknown>>()

const db = ref<DuckDBWasmDrizzleDatabase>()

async function client() {
  return (await db.value!.$client)
}

async function loadDataset() {
  if (!db.value)
    return

  const c = await client()
  await c.db.registerFileText('qa.jsonl', input.value)
  const [{ count }] = await db.value.execute<{ count: number }>(`SELECT COUNT(*) AS count FROM read_json('qa.jsonl')`)
  total.value = count

  const res = await db.value.execute<Record<string, unknown>>(`
SELECT *
FROM read_json('qa.jsonl')
LIMIT ${pageSize.value} OFFSET ${(page.value - 1) * pageSize.value}
`)

  results.value = res
}

watch(page, async () => {
  await loadDataset()
})

onMounted(async () => {
  db.value = drizzle({ connection: { bundles: getImportUrlBundles(), logger: false } })
  await loadDataset()
})

onUnmounted(async () => {
  (await db.value?.$client)?.close()
})

function canPagePrevious() {
  return page.value > 1
}

function canPageNext() {
  return page.value * pageSize.value < total.value
}

function handlePagePrevious() {
  if (canPagePrevious())
    page.value--
}

function handlePageNext() {
  if (canPageNext())
    page.value++
}

function handleRowClick(_index: number, row: Record<string, unknown>) {
  selectedRow.value = row
}
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-0.8 bg-transparent">
      <Pane :min-size="20" :size="60">
        <Splitpanes horizontal class="flex gap-0.8">
          <Pane min-size="20" :size="40">
            <PaneCard flex flex-col gap-2>
              <h2 text="neutral-300/80" mb-1 flex justify-between>
                <div>
                  Query From
                </div>
              </h2>
              <div w-full flex gap-2 text-sm>
                <Button w-full>
                  <div i-ph:folder-dotted-fill />
                  <div>One-Time</div>
                </Button>
                <Button w-full>
                  <div i-ph:folder-notch-plus-fill />
                  <div>Files</div>
                </Button>
                <Button w-full>
                  <div i-ph:database-fill />
                  <div>Datasets</div>
                </Button>
              </div>
              <div h-full max-h-full flex flex-col gap-2 overflow-y-scroll rounded-lg>
                <BasicTextarea
                  v-model="input"
                  placeholder="请输入"
                  bg="neutral-900/80 hover:neutral-900" border="2 solid neutral-700/20 hover:primary-700/50"
                  min-h-30 rounded-lg border-none px-3 py-2 text-sm font-mono outline-none
                  transition="colors duration-300 ease-in-out"
                />
              </div>
            </PaneCard>
          </Pane>
          <Pane min-size="20" :size="60">
            <PaneCard
              :enter-delay="100"
              flex flex-col gap-2
            >
              <h2 text="neutral-300/80" mb-1 flex justify-between>
                <div>
                  Results
                </div>
              </h2>
              <Chat
                :data="results"
                :total="Number(total)"
                :page="page"
                :page-size="pageSize"
                @page-previous="handlePagePrevious"
                @page-next="handlePageNext"
                @row-click="handleRowClick"
              />
            </PaneCard>
          </Pane>
        </Splitpanes>
      </Pane>
      <Pane :min-size="20" :size="40">
        <PaneCard
          :enter-delay="200"
          flex flex-col gap-2 overflow-y-scroll
        >
          <h2 text="neutral-300/80" mb-1 flex justify-between>
            <div>
              Chat
            </div>
          </h2>
          <div flex flex-col gap-2>
            <template v-if="typeof selectedRow === 'object'">
              <template v-if="'question' in selectedRow">
                <div>
                  <div
                    bg="neutral-900/50" transition="all duration-300 ease-in-out"
                    mb-2 mr-6 self-end
                    rounded-lg p-2 text-white
                  >
                    {{ selectedRow.question }}
                  </div>
                  <div
                    mb-2 ml-6 self-start
                    rounded-lg
                    bg="primary-900/50" transition="all duration-300 ease-in-out"
                    p-2
                    text-white
                  >
                    <div whitespace-pre-wrap>
                      {{ selectedRow.answer }}
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </PaneCard>
      </Pane>
    </Splitpanes>
  </div>
</template>
