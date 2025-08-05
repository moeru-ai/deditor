<script setup lang="ts">
import type { ConnectionThroughParameters, DatasourceTable } from '../../../../../libs/datasources'

import { computedAsync } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { fullyQualifiedTableName } from '@/libs/datasources/utils'

import DataTable from '../../../../../components/table/DataTable.vue'
import { useDatasource, useDatasourceSessionsStore, useDatasourcesStore } from '../../../../../stores'

const route = useRoute('/datasources/postgres/edit/[id]/')
const id = computed(() => route.params.id)

const results = ref<Record<string, unknown>[]>([])
const total = ref(0)
const error = ref<unknown>()

const selectedRow = ref<Record<string, unknown>>()

const datasourcesStore = storeToRefs(useDatasourcesStore())
const datasourceSessionsStore = useDatasourceSessionsStore()

const page = ref(1)
const pageSize = ref(20)
const sortedColumns = ref<{ id: string, desc: boolean }[]>([])

const datasource = useDatasource(id, datasourcesStore.datasources)
const datasourceTable = ref<{ schema?: string | null, table: string }>()
const datasourceTables = computedAsync(async () => {
  if (!datasource.datasource.value?.driver || !datasource.datasource.value) {
    return []
  }

  const tables = await datasourceSessionsStore.listTablesByParameters(
    datasource.datasource.value?.driver,
    datasource.datasource.value as ConnectionThroughParameters,
  )

  return tables
    .map<DatasourceTable>(t => ({
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

async function loadTableData() {
  error.value = undefined

  if (!datasourceTable.value) {
    results.value = []
    return
  }

  try {
    results.value = await datasource.findMany(
      datasourceTable.value,
      sortedColumns.value,
      pageSize.value,
      page.value,
    )

    total.value = await datasource.count(
      datasourceTable.value,
      sortedColumns.value,
    )
  }
  catch (err) {
    error.value = err
    console.error('Error loading table data:', err)
  }
}

watch([id, datasourceTable, datasourceTables], async () => {
  results.value = []
  sortedColumns.value = []

  await loadTableData()
}, {
  immediate: true,
  deep: true,
})

watch(datasourceTables, () => {
  if (!datasourceTables.value) {
    return
  }

  if (datasourceTables.value?.length > 0 && !datasourceTable.value) {
    datasourceTable.value = datasourceTables.value[0]
  }
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
  error.value = undefined

  if (!datasourceTable.value) {
    results.value = []
    return
  }

  datasource.findMany(
    datasourceTable.value,
    sortedColumns.value,
    pageSize.value,
    page.value,
  ).then(res => results.value = res).catch((err) => {
    error.value = err
    console.error('Error sorting data:', err)
  })
}
</script>

<template>
  <div h-full flex flex-col>
    <div flex>
      <h2 text="neutral-300/80" mb-1 flex flex-1>
        Inspect Postgres Datasource
      </h2>
      <RouterLink to="/datasources">
        <div i-ph:x-bold text="neutral-300/80" />
      </RouterLink>
    </div>
    <div flex flex-col gap-2 overflow-y-scroll>
      <div>
        <select v-model="datasourceTable" class="focus:outline-none" w-full rounded-lg px-2 py-1 font-mono>
          <option v-for="(table, index) of datasourceTables" :key="index" :value="table" font-mono>
            {{ fullyQualifiedTableName(table) }}
          </option>
        </select>
      </div>
      <div v-if="error" bg="red-500/10" flex flex-col gap-3 rounded-lg px-5 py-4 text-sm>
        <div text-base>
          Encountered an error while loading data:
        </div>
        <div op-80>
          <template v-if="typeof error === 'object'">
            <div v-if="'stack' in error && error.stack" whitespace-pre-wrap font-mono>
              {{ error.stack }}
            </div>
            <div v-else-if="'message' in error && error.message" whitespace-pre-wrap font-mono>
              {{ error.message }}
            </div>
          </template>
          <template v-if="typeof error === 'object'">
            <div v-if="'cause' in error && error.cause && typeof error.cause === 'object' && 'stack' in error.cause && error.cause.stack" whitespace-pre-wrap font-mono>
              {{ error.cause.stack }}
            </div>
            <div v-else-if="'cause' in error && error.cause" font-mono>
              {{ error.cause }}
            </div>
          </template>
        </div>
      </div>
      <DataTable
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
    </div>
  </div>
</template>
