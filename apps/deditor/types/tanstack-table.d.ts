import '@tanstack/vue-table'

declare module '@tanstack/vue-table' {
  interface ColumnMeta<TData, TValue> {
    /**
     * Whether the column is filterable
     */
    filterable?: boolean
  }
}
