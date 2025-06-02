import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Driver =
  | 'postgres'
  | 'mysql'
  | 'sqlite'
  | 'pglite'
  | 'duckdb-wasm'

export type Datasource =
  | DatasourceThroughConnectionString
  | DatasourceThroughConnectionParameters

export interface DatasourceBase {
  id: string
  driver: Driver
  name: string
}

export type DatasourceThroughConnectionString = DatasourceBase & { connectionString: string }
export type DatasourceThroughConnectionParameters = DatasourceBase & {
  host: string
  port: number
  user: string
  password: string
  database?: string
  sslMode?: string
  extraOptions?: Record<string, string | string[]>
}

export const useDatasourcesStore = defineStore('datasources', () => {
  const datasources = ref<Datasource[]>([])

  return {
    datasources,
  }
})
