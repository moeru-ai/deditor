import { defineStore } from 'pinia'
import { reactive } from 'vue'

export interface Datasource {
  id: string
  driver: 'postgres' | 'mysql' | 'sqlite' | 'pglite' | 'duckdb-wasm'
  name: string
  connectionString: string
}

export const useDatasourcesStore = defineStore('datasources', () => {
  const datasources = reactive<Datasource[]>([])

  return {
    datasources,
  }
})
