<script setup lang="ts">
import type { DatasourceTable } from '@/libs/datasources'
import type { Datasource } from '@/stores'

import { computedAsync } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import DatasourceTablePicker from '@/components/datasource/DatasourceTablePicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import { useDatasource, useDatasourcesStore } from '@/stores'

const datasourcesStore = useDatasourcesStore()

const queryFromDatasource = ref<Datasource>()
const queryFromTable = ref<DatasourceTable>()

const { datasources } = storeToRefs(datasourcesStore)
const { findMany } = useDatasource(computed(() => queryFromDatasource.value?.id), datasources)

const page = ref(1)
const pageSize = ref(20)
const results = computedAsync(() => {
  return queryFromTable.value
    ? findMany(queryFromTable.value, [], pageSize.value, page.value)
    : []
})

function handleRowClick(_index: number) {
  // console.log(`Row clicked at index: ${index}`, table.getRowModel().rows[index].original)
  // emits('rowClick', index, table.getRowModel().rows[index].original)
}
</script>

<template>
  <div flex="~ col gap-3" h-full w-full py-1>
    <DatasourceTablePicker
      v-model:datasource="queryFromDatasource"
      v-model:table="queryFromTable"
    />

    <div flex="grow" border="~ neutral-700/50" w-full overflow-y-scroll rounded-lg>
      <DataTable
        v-if="results"
        :data="results"
        :total="results.length"
        :page="page"
        :page-size="pageSize"
        @page-previous="() => {}"
        @page-next="() => {}"
        @row-click="() => {}"
        @update-data="() => {}"
        @sorting-change="() => {}"
      />
    </div>

    <div flex flex-col items-start gap-2>
      <BasicTextarea
        bg="neutral-900/80 hover:neutral-900" border="2 solid neutral-700/20 hover:primary-700/50"
        min-h-15 w-full rounded-lg border-none px-3 py-2 text-sm font-mono outline-none
        transition="colors duration-300 ease-in-out"
      />
      <Button self-end text-sm>
        Append
      </Button>
    </div>
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
