import type { DSNExtraOptions } from '../libs/dsn'

import { defineStore } from 'pinia'

import { useAppDataStorage } from '../composables/electron/use-app-data'

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
  sslmode: string
  extraOptions?: DSNExtraOptions
}

export const useDatasourcesStore = defineStore('datasources', () => {
  const datasources = useAppDataStorage<Datasource[]>('ai.moeru.deditor/config.json', 'datasources', [])

  return {
    datasources,
  }
})
