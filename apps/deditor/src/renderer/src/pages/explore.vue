<script setup lang="ts">
import type { DuckDBWasmDrizzleDatabase } from '@proj-airi/drizzle-duckdb-wasm'

import type { DatasourceThroughConnectionParameters } from '../stores'

import { drizzle } from '@proj-airi/drizzle-duckdb-wasm'
import { getImportUrlBundles } from '@proj-airi/drizzle-duckdb-wasm/bundles/import-url-browser'
import { BasicTextarea } from '@proj-airi/ui'
import { computedAsync } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { Pane, Splitpanes } from 'splitpanes'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import Button from '../components/basic/Button.vue'
import PaneArea from '../components/container/PaneArea.vue'
import Chat from '../components/table/Chat.vue'
import { useDatasource, useDatasourceSessionsStore, useDatasourcesStore } from '../stores'

const input = ref(`[${Array.from({ length: 100 }, (_, i) => `{"question": "What is the answer to ${i}?", "answer": "It's ${i}."}`).join(',')}]`)

const results = ref<Record<string, unknown>[]>([])
const total = ref(0)
const selectedRow = ref<Record<string, unknown>>()

const queryFrom = ref<'one-time' | 'files' | 'datasets' | 'datasources'>('one-time')

const queryFromDatasourceId = ref<string>()
const _queryFromDatasources = storeToRefs(useDatasourcesStore())
const datasourceSessionsStore = useDatasourceSessionsStore()

const page = ref(1)
const pageSize = ref(20)
const sortedColumns = ref<{ id: string, desc: boolean }[]>([])

const datasource = useDatasource(
  queryFromDatasourceId,
  _queryFromDatasources.datasources,
)

const queryFromDatasourceTables = computedAsync(async () => {
  if (!datasource.datasource.value?.driver || !datasource.datasource.value) {
    return []
  }

  const tables = await datasourceSessionsStore.listTablesByParameters(
    datasource.datasource.value?.driver,
    datasource.datasource.value as DatasourceThroughConnectionParameters,
  )

  return tables
    .map(t => ({
      schema: t.table_schema,
      table: t.table_name,
    }))
    .filter((t) => {
      if (!t.schema) {
        return true
      }

      return t.schema !== 'information_schema'
        && t.schema !== 'pg_catalog'
    })
})
const queryFromDatasourceTable = ref<{ schema?: string | null, table: string }>()

const inMemoryDB = ref<DuckDBWasmDrizzleDatabase>()

async function inMemoryDBClient() {
  return (await inMemoryDB.value!.$client)
}

async function loadFromSelectedOneTime() {
  if (!inMemoryDB.value)
    return

  const c = await inMemoryDBClient()
  await c.db.registerFileText('qa.jsonl', input.value)
  const [{ count }] = await inMemoryDB.value.execute<{ count: number }>(`SELECT COUNT(*) AS count FROM read_json('qa.jsonl')`)
  total.value = count

  const res = await inMemoryDB.value.execute<Record<string, unknown>>(`
SELECT *
FROM read_json('qa.jsonl')
LIMIT ${pageSize.value} OFFSET ${(page.value - 1) * pageSize.value}
`)

  results.value = res
}

watch(queryFrom, async () => {
  results.value = []
  sortedColumns.value = []

  if (!queryFromDatasourceTable.value) {
    return
  }

  switch (queryFrom.value) {
    case 'one-time':
      await loadFromSelectedOneTime()
      break
    case 'datasources':
      results.value = await datasource.findMany(
        queryFromDatasourceTable.value,
        sortedColumns.value,
        pageSize.value,
        page.value,
      )

      break
  }
})

watch([queryFromDatasourceId, queryFromDatasourceTable], async () => {
  results.value = []
  sortedColumns.value = []

  if (!queryFromDatasourceTable.value) {
    return
  }

  results.value = await datasource.findMany(
    queryFromDatasourceTable.value,
    sortedColumns.value,
    pageSize.value,
    page.value,
  )
})

onMounted(async () => {
  inMemoryDB.value = drizzle({ connection: { bundles: getImportUrlBundles(), logger: false } })

  if (!queryFromDatasourceTable.value) {
    return
  }

  switch (queryFrom.value) {
    case 'one-time':
      await loadFromSelectedOneTime()
      break
    case 'datasources':
      results.value = await datasource.findMany(
        queryFromDatasourceTable.value,
        sortedColumns.value,
        pageSize.value,
        page.value,
      )
      break
  }
})

onUnmounted(async () => {
  (await inMemoryDB.value?.$client)?.close()
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

function handleUpdateData(rowIndex: number, columnId: string, value: unknown) {
  // Update your data here
  // Example:
  const newData = [...results.value]
  newData[rowIndex][columnId] = value
  results.value = newData
}

function handleSortingChange(newSortedColumns: { id: string, desc: boolean }[]) {
  sortedColumns.value = newSortedColumns

  if (!queryFromDatasourceTable.value) {
    return
  }

  datasource.findMany(
    queryFromDatasourceTable.value,
    sortedColumns.value,
    pageSize.value,
    page.value,
  ).then(res => results.value = res)
}
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-0.8 bg-transparent">
      <Pane :min-size="20" :size="60">
        <Splitpanes horizontal class="flex gap-0.8">
          <Pane min-size="20" :size="40">
            <PaneArea flex flex-col gap-2>
              <h2 text="neutral-300/80" mb-1 flex justify-between>
                <div>
                  Query From
                </div>
              </h2>
              <div w-full flex gap-2 text-sm>
                <Button w-full @click="queryFrom = 'one-time'">
                  <div i-ph:folder-dotted-fill />
                  <div>One-Time</div>
                </Button>
                <!-- <Button w-full @click="queryFrom = 'files'">
                  <div i-ph:folder-notch-plus-fill />
                  <div>Files</div>
                </Button>
                <Button w-full @click="queryFrom = 'datasets'">
                  <div i-ph:database-fill />
                  <div>Datasets</div>
                </Button> -->
                <Button w-full @click="queryFrom = 'datasources'">
                  <div i-ph:hard-drives-fill />
                  <div>Datasources</div>
                </Button>
              </div>
              <div v-if="queryFrom === 'one-time'" h-full max-h-full flex flex-col gap-2 overflow-y-scroll rounded-lg>
                <BasicTextarea
                  v-model="input"
                  placeholder="请输入"
                  bg="neutral-900/80 hover:neutral-900" border="2 solid neutral-700/20 hover:primary-700/50"
                  min-h-30 rounded-lg border-none px-3 py-2 text-sm font-mono outline-none
                  transition="colors duration-300 ease-in-out"
                />
              </div>
              <div v-if="queryFrom === 'datasources'" h-full max-h-full flex flex-col gap-2 overflow-y-scroll rounded-lg>
                <select v-model="queryFromDatasourceId" rounded-lg px-2 py-1 class="focus:outline-none">
                  <option v-for="item in _queryFromDatasources.datasources.value" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
                <select v-model="queryFromDatasourceTable" rounded-lg px-2 py-1 class="focus:outline-none" font-mono>
                  <option v-for="table in queryFromDatasourceTables" :key="`${table.schema}.${table.table}`" :value="table" font-mono>
                    {{ table.schema }}.{{ table.table }}
                  </option>
                </select>
              </div>
            </PaneArea>
          </Pane>
          <Pane min-size="20" :size="60">
            <PaneArea
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
                @update-data="handleUpdateData"
                @sorting-change="handleSortingChange"
              />
            </PaneArea>
          </Pane>
        </Splitpanes>
      </Pane>
      <Pane :min-size="20" :size="40">
        <PaneArea
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
        </PaneArea>
      </Pane>
    </Splitpanes>
  </div>
</template>
