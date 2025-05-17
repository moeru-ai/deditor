<script setup lang="ts">
import type {
  CellContext,
  ColumnDef,
  ColumnFiltersState,
  ColumnResizeMode,
  ColumnSizingState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'

import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { computed, h, ref } from 'vue'

import { valueUpdater } from '../../lib/utils'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'

const props = defineProps<{
  data: Record<string, unknown>[]
}>()

// Define default column sizes
const DEFAULT_COLUMN_WIDTH = 150
const SELECT_COLUMN_WIDTH = 50

// Add column resizing state
const columnSizing = ref<ColumnSizingState>({})
const columnResizeMode = ref<ColumnResizeMode>('onChange')

const columns = computed<ColumnDef<Record<string, unknown>>[]>(() => {
  if (!props.data || !props.data.length || !props.data[0])
    return []

  const fields = Object.keys(props.data[0]).map((key) => {
    return {
      accessorKey: key,
      header: key,
      cell: (cellProps: CellContext<Record<string, unknown>, unknown>) => h('span', {}, cellProps.row.getValue(key)),
      size: DEFAULT_COLUMN_WIDTH,
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
  ]
})

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const expanded = ref<ExpandedState>({})

const table = useVueTable({
  get data() {
    return props.data || []
  },
  get columns() {
    return columns.value || []
  },
  enableSorting: false,
  defaultColumn: {
    minSize: 60,
    maxSize: 800,
  },
  columnResizeMode: columnResizeMode.value,
  enableColumnResizing: true,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
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
  },
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
</script>

<template>
  <div class="w-full">
    <div class="flex items-center gap-2 py-4">
      <Input
        class="max-w-sm"
        placeholder="Filter questions..."
        :model-value="table.getColumn('question')?.getFilterValue() as string"
        @update:model-value=" table.getColumn('question')?.setFilterValue($event)"
      />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="ml-auto">
            Columns <div i-ph:caret-down class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
            :key="column.id"
            class="capitalize"
            :model-value="column.getIsVisible()"
            @update:model-value="(value) => column.toggleVisibility(!!value)"
          >
            {{ column.id }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div
      class="relative border rounded-md"
      style="height: calc(100% - 210px); overflow: auto;"
    >
      <!-- Apply CSS variables to the table element -->
      <Table
        :style="{ width: `${table.getCenterTotalSize()}px`, ...columnSizeVars }"
        class="relative w-full table-fixed"
      >
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
              class="relative select-none"
            >
              <div class="flex items-center justify-between gap-2">
                <div v-if="!header.isPlaceholder" class="truncate">
                  <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                </div>

                <!-- Column resize handle -->
                <div
                  v-if="header.column.getCanResize()"
                  class="resizer"
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
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :style="{ width: `var(--col-${cell.column.id}-size)` }"
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

          <TableRow v-else>
            <TableCell
              :colspan="columns.length"
              class="h-24 text-center"
            >
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-end py-4 space-x-2">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }} of
        {{ table.getFilteredRowModel().rows.length }} row(s) selected.
      </div>
      <div class="space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Next
        </Button>
      </div>
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
  height: 100%;
  width: 5px;
  background: rgba(0, 0, 0, 0.1);
  cursor: col-resize;
  user-select: none;
  touch-action: none;
  opacity: 0;
  z-index: 10;
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
</style>
