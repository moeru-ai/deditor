import type { SQL } from 'drizzle-orm'

import type { useRemoteMySQL } from '@/composables/ipc/databases/remote'

import type { DSNExtraOptions } from '../libs/dsn'

import { nanoid } from '@deditor-app/shared'
import { PgDialect } from 'drizzle-orm/pg-core'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { useVersionedAppDataStorage } from '../composables/electron/use-app-data'
import { useRemotePostgres } from '../composables/ipc/databases/remote'
import { defaultParamsFromDriver, toDSN } from '../libs/dsn'

export enum DatasourceDriverEnum {
  Postgres = 'postgres',
  MySQL = 'mysql',
  SQLite = 'sqlite',
  PGLite = 'pglite',
  DuckDBWasm = 'duckdb-wasm',
}

export interface DatasourceDriverMap {
  [DatasourceDriverEnum.Postgres]: ReturnType<typeof useRemotePostgres>
  [DatasourceDriverEnum.MySQL]: ReturnType<typeof useRemoteMySQL>
}

export type DatasourceDriver = keyof DatasourceDriverMap

export interface DatasourceDriverClient<D extends DatasourceDriver> {
  driver: D
  session: DatasourceDriverMap[D]
}

export type Datasource =
  | DatasourceThroughConnectionString
  | DatasourceThroughConnectionParameters

export interface DatasourceBase {
  id: string
  driver: DatasourceDriver
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
  const datasources = useVersionedAppDataStorage<Datasource[]>('ai.moeru.deditor/config.json', 'datasources', [], { defaultVersion: '0.0.1' })

  function createDatasource(driver: DatasourceDriver) {
    return { id: nanoid(), name: 'New Datasource', driver, connectionString: '', sslmode: '' } satisfies Datasource
  }

  return {
    datasources,
    createDatasource,
  }
})

function clientFromDriver(driver: DatasourceDriver) {
  if (driver === 'postgres') {
    return useRemotePostgres()
  }

  throw new Error(`Unsupported driver: ${driver}`)
}

function sqlDialectFromDriver(driver: DatasourceDriver) {
  if (driver === 'postgres') {
    return new PgDialect()
  }

  throw new Error(`Unsupported driver: ${driver}`)
}

export const useDatasourceSessionsStore = defineStore('datasource-sessions', () => {
  const sessions = ref<Map<string, Array<DatasourceDriverClient<DatasourceDriver>>>>(new Map())

  function isPostgresSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.Postgres> {
    return session.driver === DatasourceDriverEnum.Postgres
  }

  function isMySQLSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.MySQL> {
    return session.driver === DatasourceDriverEnum.MySQL
  }

  async function connect<D extends DatasourceDriver>(driver: D, dsn: string, options?: { sqawn?: boolean }): Promise<DatasourceDriverClient<D>> {
    if (!sessions.value.has(dsn)) {
      const client = clientFromDriver(driver)
      await client.connect(dsn)
      sessions.value.set(dsn, [...(sessions.value.get(dsn) || []), { driver, session: client }])
      return { driver, session: client } as DatasourceDriverClient<D>
    }

    const connectedSessions = sessions.value.get(dsn)!
    if ((connectedSessions.length >= 1 && options?.sqawn)) {
      const client = clientFromDriver(driver)
      await client.connect(dsn)
      sessions.value.set(dsn, [...sessions.value.get(dsn)!, { driver, session: client }])
      return { driver, session: client } as DatasourceDriverClient<D>
    }

    return { driver: connectedSessions[0].driver as D, session: connectedSessions[0].session } as DatasourceDriverClient<D>
  }

  async function connectByParameters<D extends DatasourceDriver>(driver: D, parameters: DatasourceThroughConnectionParameters) {
    return connect<D>(driver, toDSN(driver, parameters, defaultParamsFromDriver(driver)))
  }

  async function listTables<D extends DatasourceDriver>(driver: D, dsn: string) {
    const session = await connect(driver, dsn)
    if (isPostgresSession(session)) {
      return session.session.listTables()
    }
    else if (isMySQLSession(session)) {
      throw new Error('MySQL is not supported yet')
    }
    else {
      throw new Error(`Unsupported driver: ${driver}`)
    }
  }

  async function listTablesByParameters<D extends DatasourceDriver>(driver: D, parameters: DatasourceThroughConnectionParameters) {
    return listTables<D>(driver, toDSN(driver, parameters, defaultParamsFromDriver(driver)))
  }

  async function listColumns<D extends DatasourceDriver>(driver: D, dsn: string, schema: string, table: string) {
    const session = await connect(driver, dsn)
    if (isPostgresSession(session)) {
      return session.session.listColumns(schema, table)
    }
    else {
      throw new Error(`Unsupported driver: ${driver}`)
    }
  }

  async function listColumnsByParameters<D extends DatasourceDriver>(driver: D, parameters: DatasourceThroughConnectionParameters, schema: string, table: string) {
    return listColumns<D>(driver, toDSN(driver, parameters, defaultParamsFromDriver(driver)), schema, table)
  }

  async function execute<T, D extends DatasourceDriver = DatasourceDriver>(driver: D, dsn: string, query: string, parameters?: unknown[]): Promise<T[]> {
    const session = await connect(driver, dsn)
    if (isPostgresSession(session)) {
      return session.session.execute<T>(query, parameters)
    }
    else if (isMySQLSession(session)) {
      throw new Error('MySQL is not supported yet')
    }
    else {
      throw new Error(`Unsupported driver: ${driver}`)
    }
  }

  async function executeByParameters<T, D extends DatasourceDriver = DatasourceDriver>(driver: D, parameters: DatasourceThroughConnectionParameters, query: string, params?: unknown[]): Promise<T[]> {
    return execute<T, D>(driver, toDSN(driver, parameters, defaultParamsFromDriver(driver)), query, params)
  }

  async function executeSQL<T, S = any, D extends DatasourceDriver = DatasourceDriver>(driver: D, dsn: string, query: SQL<S>): Promise<T[]> {
    const db = sqlDialectFromDriver(driver)
    const { sql, params } = db.sqlToQuery(query)
    return execute<T, D>(driver, dsn, sql, params)
  }

  async function executeSQLByParameters<T, S = any, D extends DatasourceDriver = DatasourceDriver>(driver: D, parameters: DatasourceThroughConnectionParameters, query: SQL<S>): Promise<T[]> {
    return executeSQL<T, S, D>(driver, toDSN(driver, parameters, defaultParamsFromDriver(driver)), query)
  }

  return {
    connect,
    connectByParameters,
    listTables,
    listTablesByParameters,
    listColumns,
    listColumnsByParameters,
    execute,
    executeByParameters,
    executeSQL,
    executeSQLByParameters,
  }
})
