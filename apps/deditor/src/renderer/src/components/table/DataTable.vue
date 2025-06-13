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
import { useEventListener } from '@vueuse/core'
import { computed, h, nextTick, ref, toRaw } from 'vue'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  (e: 'updateData', rowIndex: number, columnId: string, value: unknown): void
  (e: 'sortingChange', sortedColumns: { id: string, desc: boolean }[]): void
}>()

const filterBy = ref<string>()

// Add column resizing state
const columnSizing = ref<ColumnSizingState>({})
const columnResizeMode = ref<ColumnResizeMode>('onChange')

// Create a ref to track editing state
const editingCell = ref<{ rowIndex: number, columnId: string } | null>(null)
const editValue = ref<string>('')
// Add focused cell tracking
const focusedCell = ref<{ rowIndex: number, columnId: string } | null>(null)

const columns = computed<ColumnDef<Record<string, unknown>>[]>(() => {
  if (!props.data || !props.data.length || !props.data[0])
    return []

  const fields: ColumnDef<Record<string, unknown>>[] = Object.keys(props.data[0]).map((key) => {
    return {
      accessorKey: key,
      header: key,
      enableSorting: true,
      cell: (cellProps: CellContext<Record<string, unknown>, unknown>) => {
        const value = cellProps.row.getValue(key) as string | number | boolean
        const rowIndex = cellProps.row.index

        // Check if this cell is being edited
        if (editingCell.value?.rowIndex === rowIndex && editingCell.value?.columnId === key) {
          return h('input', {
            value: editValue.value,
            class: 'editing-cell-input bg-neutral-900 w-full h-full border-2 border-primary-800 rounded-md px-1.5 py-1 outline-none flex',
            onInput: (e: Event) => {
              editValue.value = (e.target as HTMLInputElement).value
            },
            onBlur: () => finishEditing(),
            onKeyup: (e: KeyboardEvent) => {
              if (e.key === 'Enter')
                finishEditing()
              if (e.key === 'Escape') {
                clearCellStates()
              }
            },
            onClick: (e: Event) => {
              // Prevent click from bubbling to parent span
              e.stopPropagation()
            },
            autofocus: true,
          })
        }

        // Check if this cell is focused
        const isFocused = focusedCell.value?.rowIndex === rowIndex && focusedCell.value?.columnId === key
        const cellClass = [
          'cursor-text w-full border-2 px-1.5 py-1 outline-none flex min-h-32px',
          isFocused ? 'border-2 border-primary-800/50 rounded-md bg-neutral-900/50' : 'border-2 border-transparent',
        ].join(' ')

        // Regular cell display with double click to edit
        if (Array.isArray(value)) {
          return h('div', {
            onDblclick: () => startEditing(rowIndex, key, JSON.stringify(toRaw(value))),
            onClick: () => handleCellFocus(rowIndex, key),
            class: cellClass,
          }, JSON.stringify(toRaw(value)))
        }

        return h('div', {
          onDblclick: () => startEditing(rowIndex, key, value),
          onClick: () => handleCellFocus(rowIndex, key),
          class: cellClass,
        }, value)
      },
      size: 150,
      minSize: 60,
      maxSize: 800,
      enableResizing: true,
      meta: {
        filterable: true,
      },
    } as ColumnDef<Record<string, unknown>>
  })

  return [
    {
      id: 'select',
      header: ({ table }) => h(Checkbox, {
        'modelValue': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all',
        'class': 'ml-1 mt-0.5 inline-block',
      }),
      cell: ({ row }) => h(Checkbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row',
        'class': 'ml-2 inline-block',
      }),
      enableSorting: false,
      enableHiding: false,
      size: 40,
      minSize: 40,
      maxSize: 800,
      enableResizing: true,
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
  enableSorting: true,
  columnResizeMode: columnResizeMode.value,
  enableColumnResizing: true,
  manualPagination: true,
  manualSorting: true,
  rowCount: props.total,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: (updaterOrValue) => {
    const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
    sorting.value = newValue
    emits('sortingChange', newValue.map(sort => ({ id: sort.id, desc: sort.desc })))
  },
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

// Function to handle cell updates
function updateData(rowIndex: number, columnId: string, value: unknown) {
  emits('updateData', rowIndex, columnId, value)
}

// Function to handle edit mode
function startEditing(rowIndex: number, columnId: string, initialValue: unknown) {
  // If we're already editing a different cell, save its value first
  if (editingCell.value && (editingCell.value.rowIndex !== rowIndex || editingCell.value.columnId !== columnId)) {
    finishEditing()
  }

  editingCell.value = { rowIndex, columnId }
  editValue.value = String(initialValue)
  // Wait for the input to be rendered
  nextTick(() => {
    const input = document.querySelector('.editing-cell-input input') as HTMLInputElement
    if (input) {
      input.focus()
      input.select() // Select all text when entering edit mode
    }
  })
}

// Function to handle edit completion
function finishEditing() {
  if (editingCell.value) {
    const { rowIndex, columnId } = editingCell.value
    updateData(rowIndex, columnId, editValue.value)
    editingCell.value = null
  }
}

// Function to handle cell focus
function handleCellFocus(rowIndex: number, columnId: string) {
  focusedCell.value = { rowIndex, columnId }
  emits('rowClick', rowIndex, table.getRowModel().rows[rowIndex].original)
}

// Function to clear all cell states
function clearCellStates() {
  editingCell.value = null
  focusedCell.value = null
}

// Add global keyup handler
function handleGlobalKeyup(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    clearCellStates()
  }
}

useEventListener('keyup', handleGlobalKeyup)
</script>

<template>
  <div class="h-full flex flex-1 flex-col gap-2 overflow-y-scroll">
    <div class="flex items-center gap-2">
      <div grid="~ cols-[repeat(2,1fr)] gap-2" class="max-w-70%" flex-grow items-center>
        <!-- Filter by -->
        <Select v-model="filterBy">
          <SelectTrigger>
            <SelectValue placeholder="Filter by…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="c of table.getAllFlatColumns().filter((c) => c.id && c.columnDef.meta?.filterable)"
              :key="c.id" :value="c.id"
            >
              {{ c.id }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Filter -->
        <Input
          v-if="filterBy"
          text-sm
          class="max-w-sm"
          :placeholder="`Filter ${filterBy}...`"
          :model-value="table.getColumn(filterBy!)?.getFilterValue() as string"
          @update:model-value="table.getColumn(filterBy!)?.setFilterValue($event)"
        />
      </div>

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
            :key="column.id" class="cursor-pointer overflow-y-scroll text-xs font-mono"
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
              class="relative select-none bg-neutral-900/50 font-mono"
              :class="{ 'cursor-pointer': header.column.getCanSort() }"
              @click="(e) => header.column.getToggleSortingHandler()?.(e)"
            >
              <div class="flex items-center justify-between gap-2">
                <div v-if="!header.isPlaceholder" class="w-full flex items-center justify-between truncate">
                  <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                  <div v-if="header.column.getCanSort()" class="ml-2">
                    <div v-if="header.column.getIsSorted() === 'asc'" i-ph:arrow-up-bold text-xs />
                    <div v-else-if="header.column.getIsSorted() === 'desc'" i-ph:arrow-down-bold text-xs />
                    <div v-else />
                  </div>
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
</style>
