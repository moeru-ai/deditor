<script setup lang="ts">
import type { CellContext, ColumnDef, ColumnFiltersState, ColumnResizeMode, ColumnSizingState, ExpandedState, SortingState, VisibilityState } from '@tanstack/vue-table'

import { BasicTextarea } from '@proj-airi/ui'
import { FlexRender, getCoreRowModel, getExpandedRowModel, getFilteredRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table'
import { computed, h, ref, toRaw } from 'vue'

import Button from '@/components/basic/Button.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { valueUpdater } from '@/libs/shadcn/utils'
import { useVisualizerStore } from '@/stores'

const visualizerStore = useVisualizerStore()

const data = computed(() => {
  return visualizerStore.data.map((text, i) => ({
    text,
    style: visualizerStore.styles[i],
  }))
})

const SELECT_COLUMN_WIDTH = 50

const columnSizing = ref<ColumnSizingState>({})
const columnResizeMode = ref<ColumnResizeMode>('onChange')

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const expanded = ref<ExpandedState>({})

const columns = computed<ColumnDef<Record<string, unknown>>[]>(() => {
  const fields = [
    { label: 'Style', key: 'style', initialWidth: 100 },
    { label: 'Text', key: 'text', initialWidth: 500 },
  ].map(({ label, key, initialWidth }) => {
    return {
      accessorKey: key,
      header: label,
      cell: (cellProps: CellContext<Record<string, unknown>, unknown>) => {
        const value = cellProps.row.getValue(key) as string | number | boolean
        if (Array.isArray(value)) {
          return h('span', {}, JSON.stringify(toRaw(value)))
        }

        return h('span', {}, value)
      },
      size: initialWidth,
      minSize: 60,
      maxSize: 800,
      enableResizing: true,
    } as ColumnDef<Record<string, unknown>>
  })

  return [
    {
      id: 'select',
      header: ({ table }) => h(Checkbox, {
        'modelValue': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
        'onUpdate:modelValue': value => table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all',
      }),
      cell: ({ row }) => h(Checkbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': value => row.toggleSelected(!!value),
        'ariaLabel': 'Select row',
      }),
      enableSorting: false,
      enableHiding: false,
      size: SELECT_COLUMN_WIDTH,
      minSize: SELECT_COLUMN_WIDTH,
      maxSize: SELECT_COLUMN_WIDTH,
      enableResizing: false,
    },
    ...fields,
    {
      id: 'spacer',
      header: '',
      cell: () => null,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 10,
      minSize: 10,
      maxSize: 2000,
    },
  ]
})

const table = useVueTable({
  data,
  get columns() {
    return columns.value || []
  },
  enableSorting: false,
  columnResizeMode: columnResizeMode.value,
  enableColumnResizing: true,
  // manualPagination: true,
  // rowCount: data.value.length,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  onColumnSizingChange: updaterOrValue => valueUpdater(updaterOrValue, columnSizing),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get expanded() { return expanded.value },
    get columnSizing() { return columnSizing.value },
    // get pagination() {
    //   return {
    //     pageIndex: page.value,
    //     pageSize: pageSize.value,
    //   }
    // },
  },
  // initialState: {
  //   pagination: {
  //     pageIndex: page.value,
  //     pageSize: pageSize.value,
  //   },
  // },
})

// Calculate column size variables once for better performance
const columnSizeVars = computed(() => {
  const headers = table.getFlatHeaders()
  const colSizes: Record<string, string> = {}

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]
    colSizes[`--header-${header.id}-size`] = `${header.getSize()}px`
    colSizes[`--col-${header.column.id}-size`] = `${header.column.getSize()}px`
  }

  return colSizes
})

function handleRowClick(_index: number) {
  // console.log(`Row clicked at index: ${index}`, table.getRowModel().rows[index].original)
  // emits('rowClick', index, table.getRowModel().rows[index].original)
}
</script>

<template>
  <div flex="~ col gap-3" h-full w-full py-1>
    <div flex="grow" border="~ neutral-700/50" w-full overflow-y-scroll rounded-lg>
      <Table :style="columnSizeVars" class="w-full table-fixed">
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="relative">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="{
                width: `var(--header-${header.id}-size)`,
                position: 'relative',
              }"
              :colspan="header.colSpan"
              :data-column-id="header.column.id"
              class="relative select-none bg-neutral-900/50"
            >
              <div class="flex items-center justify-between gap-2">
                <div v-if="!header.isPlaceholder" class="truncate">
                  <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                </div>

                <!-- Column resize handle -->
                <div
                  v-if="header.column.getCanResize()" class="resizer"
                  :class="{ isResizing: header.column.getIsResizing() }"
                  @dblclick="header.column.resetSize()"
                  @mousedown="header.getResizeHandler()?.($event)"
                  @touchstart="header.getResizeHandler()?.($event)"
                />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow
                :data-state="row.getIsSelected() && 'selected'"
                class="w-full bg-neutral-900/20"
                @click="handleRowClick(row.index)"
              >
                <TableCell
                  v-for="cell in row.getVisibleCells()" :key="cell.id"
                  :style="{ width: `var(--col-${cell.column.id}-size)` }"
                  :data-column-id="cell.column.id"
                  class="truncate"
                >
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                </TableCell>
              </TableRow>
              <TableRow v-if="row.getIsExpanded()">
                <TableCell :colspan="row.getAllCells().length">
                  {{ JSON.stringify(row.original) }}
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableRow v-else class="border-b border-neutral-700/50">
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
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
