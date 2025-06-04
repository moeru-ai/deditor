<script setup lang="ts">
import type { DuckDBWasmDrizzleDatabase } from '@proj-airi/drizzle-duckdb-wasm'
import type { SQL } from 'drizzle-orm'

import type { DatasourceDriverMap, DatasourceThroughConnectionParameters } from '../stores/datasources'

import { drizzle } from '@proj-airi/drizzle-duckdb-wasm'
import { getImportUrlBundles } from '@proj-airi/drizzle-duckdb-wasm/bundles/import-url-browser'
import { BasicTextarea } from '@proj-airi/ui'
import { sql } from 'drizzle-orm'
import { storeToRefs } from 'pinia'
import { Pane, Splitpanes } from 'splitpanes'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import Button from '../components/basic/Button.vue'
import PaneArea from '../components/container/PaneArea.vue'
import Chat from '../components/table/Chat.vue'
import { useDatasourceSessionsStore, useDatasourcesStore } from '../stores/datasources'

const input = ref(`[${Array.from({ length: 100 }, (_, i) => `{"question": "What is the answer to ${i}?", "answer": "It's ${i}."}`).join(',')}]`)

const results = ref<Record<string, unknown>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedRow = ref<Record<string, unknown>>()

const queryFrom = ref<'one-time' | 'files' | 'datasets' | 'datasources'>('one-time')

const queryFromDatasourceId = ref<string>()
const _queryFromDatasources = storeToRefs(useDatasourcesStore())
const datasourceSessions = useDatasourceSessionsStore()

const queryFromDatasourceTables = ref<{ schema?: string | null, table?: string | null }[]>([])
const queryFromDatasourceTable = ref<{ schema?: string | null, table?: string | null }>()

const inMemoryDB = ref<DuckDBWasmDrizzleDatabase>()

const sortedColumns = ref<{ id: string, desc: boolean }[]>([])

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

async function prepareQuery(): Promise<{
  driver: keyof DatasourceDriverMap
  datasource: DatasourceThroughConnectionParameters
  table?: { schema?: string | null, table?: string | null }
} | undefined> {
  if (!queryFromDatasourceId.value) {
    return
  }

  const queryFromDatasource = _queryFromDatasources.datasources.value.find(ds => ds.id === queryFromDatasourceId.value)
  if (!queryFromDatasource) {
    return
  }

  const driver = queryFromDatasource.driver as keyof DatasourceDriverMap
  const datasource = queryFromDatasource as DatasourceThroughConnectionParameters
  await datasourceSessions.connectByParameters(driver, datasource)

  const tables = await datasourceSessions.listTablesByParameters(driver, datasource)
  queryFromDatasourceTables.value = tables
    .map(t => ({ schema: t.table_schema, table: t.table_name }))
    .filter((t) => {
      if (!t.schema) {
        return true
      }

      return t.schema !== 'information_schema' && t.schema !== 'pg_catalog'
    })

  if (queryFromDatasourceTable.value == null) {
    return {
      driver,
      datasource,
    }
  }

  const table = queryFromDatasourceTables.value.find(t => t.schema === queryFromDatasourceTable.value?.schema && t.table === queryFromDatasourceTable.value?.table)
  if (!table) {
    return {
      driver,
      datasource,
    }
  }

  return {
    driver,
    datasource,
    table,
  }
}

async function tableFromPreparedQuery() {
  const beforeQuery = await prepareQuery()
  if (!beforeQuery) {
    return
  }

  const { table } = beforeQuery
  if (!table) {
    return
  }

  return table
}

async function query<T>(query: SQL<T>) {
  const beforeQuery = await prepareQuery()
  if (!beforeQuery) {
    return [] as Record<string, unknown>[]
  }

  const { driver, datasource } = beforeQuery

  const table = await tableFromPreparedQuery()
  if (!table) {
    return [] as Record<string, unknown>[]
  }

  return await datasourceSessions.executeSQLByParameters<Record<string, unknown>>(driver, datasource, query)
}

async function loadFromSelectedDatasource() {
  const table = await tableFromPreparedQuery()
  if (!table)
    return

  const q = sql`SELECT * FROM `
  if (table.schema) {
    q.append(sql`${sql.identifier(table.schema)}.${sql.identifier(table.table!)}`)
  }
  else {
    q.append(sql`${sql.identifier(table.table!)}`)
  }

  if (sortedColumns.value.length > 0) {
    const orderByClauses = sortedColumns.value.map((col) => {
      const direction = col.desc ? sql`DESC` : sql`ASC`
      return sql`${sql.identifier(col.id)} ${direction}`
    })

    q.append(sql` ORDER BY ${sql.join(orderByClauses, sql`, `)}`)
  }

  q.append(sql` LIMIT ${pageSize.value} OFFSET ${(page.value - 1) * pageSize.value}`)

  results.value = await query(q)
}

watch(queryFrom, async () => {
  results.value = []
  sortedColumns.value = []

  switch (queryFrom.value) {
    case 'one-time':
      await loadFromSelectedOneTime()
      break
    case 'datasources':
      await loadFromSelectedDatasource()
      break
  }
})

watch([queryFromDatasourceId, queryFromDatasourceTable], async () => {
  results.value = []
  sortedColumns.value = []

  await loadFromSelectedDatasource()
})

onMounted(async () => {
  inMemoryDB.value = drizzle({ connection: { bundles: getImportUrlBundles(), logger: false } })

  switch (queryFrom.value) {
    case 'one-time':
      await loadFromSelectedOneTime()
      break
    case 'datasources':
      await loadFromSelectedDatasource()
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
  loadFromSelectedDatasource()
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
                  <option v-for="datasource in _queryFromDatasources.datasources.value" :key="datasource.id" :value="datasource.id">
                    {{ datasource.name }}
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
