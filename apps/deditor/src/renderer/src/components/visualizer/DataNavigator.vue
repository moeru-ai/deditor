<script setup lang="ts">
import type { RowSelectionState } from '@tanstack/vue-table'

import type { ConnectionThroughParameters, DatasourceTable } from '@/libs/datasources'
import type { Datasource } from '@/stores'

import { computedAsync } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import Button from '@/components/basic/Button.vue'
import DatasourceTablePicker from '@/components/datasource/DatasourceTablePicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasource, useDatasourceSessionsStore, useDatasourcesStore, useVisualizerStore } from '@/stores'

const visualizerStore = useVisualizerStore()
const datasourcesStore = useDatasourcesStore()

const queryFromDatasource = ref<Datasource>()
const queryFromTable = ref<DatasourceTable>()

const rowSelection = ref<RowSelectionState>({})

const { datasources } = storeToRefs(datasourcesStore)
const { datasource, findMany, count } = useDatasource(computed(() => queryFromDatasource.value?.id), datasources)
const session = useDatasourceSessionsStore()

const tableColumns = computedAsync(() => {
  if (!datasource.value || !queryFromTable.value) {
    return []
  }

  const { driver } = datasource.value
  const { schema, table } = queryFromTable.value

  if (!schema || !table) {
    return []
  }

  return session.listColumnsByParameters(
    driver,
    datasource.value as ConnectionThroughParameters,
    table,
    schema,
  )
})

const visualizingColumn = ref<string>()
const page = ref(1)
const pageSize = ref(20)
const sortedColumns = ref<{ id: string, desc: boolean }[]>([])

const results = computedAsync(() => {
  return queryFromTable.value
    ? findMany(queryFromTable.value, [], pageSize.value, page.value)
    : []
})

const total = computedAsync(() => {
  return queryFromTable.value
    ? count(
        queryFromTable.value,
        sortedColumns.value,
      )
    : 0
})

function canPagePrevious() {
  return page.value > 1
}

function canPageNext() {
  return page.value * pageSize.value < (total.value || 0)
}

function handlePagePrevious() {
  if (canPagePrevious())
    page.value--
}

function handlePageNext() {
  if (canPageNext())
    page.value++
}

function handleSortingChange(newSortedColumns: { id: string, desc: boolean }[]) {
  sortedColumns.value = newSortedColumns

  if (!queryFromTable.value) {
    results.value = []
    return
  }

  findMany(
    queryFromTable.value,
    sortedColumns.value,
    pageSize.value,
    page.value,
  ).then(res => results.value = res)
}

function visualize() {
  const column = visualizingColumn.value
  if (!queryFromTable.value || !column || !results.value)
    return

  // const tableSchema = pgTable(table, {
  //   vector: vector(visualizingColumn.value, { dimensions: 1024 }),
  // })

  // const qb = new QueryBuilder()
  // const test = qb.select({ vector: tableSchema.vector })
  //   .from(tableSchema)
  //   .where(isNotNull(tableSchema.vector))
  //   .offset(0)
  //   .limit(10)

  const vectors = results.value
    .filter((_, i) => rowSelection.value[i])
    .map(row => row[column] as number[])

  visualizerStore.resetVectors(vectors)
}
</script>

<template>
  <div flex="~ col gap-3" h-full w-full py-1>
    <DatasourceTablePicker
      v-model:datasource="queryFromDatasource"
      v-model:table="queryFromTable"
    />

    <div flex="grow" w-full overflow-hidden rounded-lg>
      <DataTable
        v-if="results"
        :data="results"
        :total="results.length"
        :page="page"
        :page-size="pageSize"
        @page-previous="handlePagePrevious"
        @page-next="handlePageNext"
        @row-click="() => {}"
        @update-data="() => {}"
        @sorting-change="handleSortingChange"
        @selection-change="rowSelection = $event"
      />
    </div>

    <div grid="~ cols-[repeat(4,1fr)] gap-2">
      <div>
        <Select v-if="tableColumns" v-model="visualizingColumn">
          <SelectTrigger>
            <SelectValue>
              <template v-if="visualizingColumn">
                Visualizing {{ visualizingColumn }}
              </template>
              <template v-else>
                Select a column to visualize
              </template>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="column of tableColumns.filter(c => c.column_name).map(c => c.column_name!)"
              :key="column" :value="column"
            >
              {{ column }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button @click="visualize">
        Visualize
      </Button>
    </div>

    <!-- <div flex flex-col items-start gap-2>
      <BasicTextarea
        bg="neutral-900/80 hover:neutral-900" border="2 solid neutral-700/20 hover:primary-700/50"
        min-h-15 w-full rounded-lg border-none px-3 py-2 text-sm font-mono outline-none
        transition="colors duration-300 ease-in-out"
      />
      <Button self-end text-sm>
        Append
      </Button>
    </div> -->
  </div>
</template>

<style scoped>
.table {
  border-collapse: separate;
  border-spacing: 0;
}

.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 90%;
  width: 2px;
  background: rgba(255, 255, 255, 0.2);
  cursor: col-resize;
  user-select: none;
  touch-action: none;
  opacity: 0.2;
  z-index: 10;
  border-radius: 999px;
  transform: translateY(5%);
}

.resizer:hover {
  opacity: 1;
}

.resizer.isResizing {
  background: rgba(0, 0, 0, 0.2);
  opacity: 1;
}

/* Fix for Firefox */
@-moz-document url-prefix() {
  .resizer {
    height: 100%;
    right: 0;
  }
}

/* Style for the spacer column to allow it to expand */
:deep([data-column-id="spacer"]) {
  width: 100% !important;
  min-width: 10px;
}

/* Ensure table rows have consistent styling */
:deep(tr) {
  background-color: rgba(23, 23, 23, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
