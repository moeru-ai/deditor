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
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { computed, h, ref, toRaw } from 'vue'

import { valueUpdater } from '../../libs/shadcn/utils'
import Button from '../basic/Button.vue'
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

const props = withDefaults(defineProps<{
  data: Record<string, unknown>[]
  total?: number
  page?: number
  pageSize?: number
}>(), {
  total: 0,
  page: 1,
  pageSize: 10,
})

const emits = defineEmits<{
  (e: 'pagePrevious'): void
  (e: 'pageNext'): void
  (e: 'rowClick', index: number, row: Record<string, unknown>): void
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
      cell: (cellProps: CellContext<Record<string, unknown>, unknown>) => {
        const value = cellProps.row.getValue(key) as string | number | boolean
        if (Array.isArray(value)) {
          return h('span', {}, JSON.stringify(toRaw(value)))
        }

        return h('span', {}, value)
      },
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
    // Add a spacer column that will expand to fill available space
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
  columnResizeMode: columnResizeMode.value,
  enableColumnResizing: true,
  manualPagination: true,
  rowCount: props.total,
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
    get pagination() {
      return {
        pageIndex: props.page,
        pageSize: props.pageSize,
      }
    },
  },
  initialState: {
    pagination: {
      pageIndex: props.page,
      pageSize: props.pageSize,
    },
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

function handleRowClick(index: number) {
  emits('rowClick', index, table.getRowModel().rows[index].original)
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-2 overflow-y-scroll">
    <div class="flex items-center gap-2">
      <!-- Filters -->
      <Input
        text-sm
        class="max-w-sm"
        placeholder="Filter questions..."
        :model-value="table.getColumn('question')?.getFilterValue() as string"
        @update:model-value="table.getColumn('question')?.setFilterValue($event)"
      />

      <!-- Columns -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button class="ml-auto" flex items-center text-sm>
            Columns
            <div
              i-ph:caret-down
              class="ml-2 h-4 w-4"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="bg-neutral-900">
          <DropdownMenuCheckboxItem
            v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
            :key="column.id" class="capitalize"
            :model-value="column.getIsVisible()"
            @update:model-value="(value) => column.toggleVisibility(!!value)"
          >
            {{ column.id }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Table -->
    <div class="w-full flex-1 overflow-y-scroll border border-neutral-700/50 rounded-lg">
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

    <!-- Pagination -->
    <div class="flex items-center justify-end gap-2">
      <div class="flex-1 text-sm text-muted-foreground">
        Selected {{ table.getFilteredSelectedRowModel().rows.length }}/{{ table.getFilteredRowModel().rows.length }}
      </div>
      <div class="flex items-center gap-2">
        <Button text-sm @click="emits('pagePrevious')">
          <div i-ph:caret-left />
        </Button>
        <Button text-sm @click="emits('pageNext')">
          <div i-ph:caret-right />
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
