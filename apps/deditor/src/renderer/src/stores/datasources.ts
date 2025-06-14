import type { SQL } from 'drizzle-orm'
import type { Ref } from 'vue'

import type { ConnectionThroughParameters, DatasourceDriver, DatasourceDriverMap, Datasource as LibDatasource } from '../libs/datasources'

import { nanoid } from '@deditor-app/shared'
import { sql } from 'drizzle-orm'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { useVersionedAppDataStorage } from '../composables/electron/use-app-data'
import { defaultParamsFromDriver, toDSN } from '../libs/datasources'
import {
  DATASOURCE_DRIVER_CLIENT,
  DATASOURCE_DRIVER_QUERY_BUILDER,
  DATASOURCE_DRIVER_SQL_DIALECT,
  isCloudflareD2Session,
  isDuckDBWasmSession,
  isMySQLSession,
  isNeonSession,
  isPGLiteSession,
  isPostgresSession,
  isSQLiteSession,
  isSupabaseSession,
} from '../libs/datasources/driver'

export type Datasource = LibDatasource<keyof DatasourceDriverMap> & {
  id: string
  name: string
}

export interface DatasourceDriverClient<D extends DatasourceDriver> {
  driver: D
  session: DatasourceDriverMap[D]
}

export const useDatasourcesStore = defineStore('datasources', () => {
  const datasources = useVersionedAppDataStorage<Datasource[]>('ai.moeru.deditor/config.json', 'datasources', [], { defaultVersion: '0.0.1' })

  function createDatasource(driver: DatasourceDriver) {
    return { id: nanoid(), name: 'New Datasource', driver, connectionString: '', extraOptions: { sslmode: false } } satisfies Datasource
  }

  return {
    datasources,
    createDatasource,
  }
})

function clientFromDriver(driver: DatasourceDriver) {
  return DATASOURCE_DRIVER_CLIENT[driver]
}

export function sqlDialectFromDriver(driver: DatasourceDriver) {
  return DATASOURCE_DRIVER_SQL_DIALECT[driver]
}

export function queryBuilderFromDriver(driver: DatasourceDriver) {
  return DATASOURCE_DRIVER_QUERY_BUILDER[driver]
}

export const useDatasourceSessionsStore = defineStore('datasource-sessions', () => {
  const sessions = ref<Map<string, Array<DatasourceDriverClient<DatasourceDriver>>>>(new Map())

  async function connect<D extends DatasourceDriver>(driver: D, dsn: string, options?: { sqawn?: boolean }): Promise<DatasourceDriverClient<D>> {
    if (!sessions.value.has(dsn)) {
      const client = clientFromDriver(driver)()
      await client.connect(dsn)
      sessions.value.set(dsn, [...(sessions.value.get(dsn) || []), { driver, session: client }])
      return { driver, session: client } as DatasourceDriverClient<D>
    }

    const connectedSessions = sessions.value.get(dsn)!
    if ((connectedSessions.length >= 1 && options?.sqawn)) {
      const client = clientFromDriver(driver)()
      await client.connect(dsn)
      sessions.value.set(dsn, [...sessions.value.get(dsn)!, { driver, session: client }])
      return { driver, session: client } as DatasourceDriverClient<D>
    }

    return { driver: connectedSessions[0].driver as D, session: connectedSessions[0].session } as DatasourceDriverClient<D>
  }

  async function connectByParameters<D extends DatasourceDriver>(driver: D, parameters: ConnectionThroughParameters) {
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
    else if (isPGLiteSession(session)) {
      return session.session.listTables()
    }
    else if (isDuckDBWasmSession(session)) {
      throw new Error('DuckDBWasm is not supported yet')
    }
    else if (isCloudflareD2Session(session)) {
      throw new Error('Cloudflare D2 is not supported yet')
    }
    else if (isSQLiteSession(session)) {
      throw new Error('SQLite is not supported yet')
    }
    else if (isSupabaseSession(session)) {
      throw new Error('Supabase is not supported yet')
    }
    else if (isNeonSession(session)) {
      throw new Error('Neon is not supported yet')
    }
    else {
      throw new Error(`Unsupported driver: ${driver}`)
    }
  }

  async function listTablesByParameters<D extends DatasourceDriver>(driver: D, parameters: ConnectionThroughParameters) {
    return listTables<D>(driver, toDSN(driver, parameters, defaultParamsFromDriver(driver)))
  }

  async function listColumns<D extends DatasourceDriver>(driver: D, dsn: string, schema: string, table: string) {
    const session = await connect(driver, dsn)
    if (isPostgresSession(session)) {
      return session.session.listColumns(schema, table)
    }
    else if (isMySQLSession(session)) {
      throw new Error('MySQL is not supported yet')
    }
    else if (isPGLiteSession(session)) {
      return session.session.listColumns(schema, table)
    }
    else if (isDuckDBWasmSession(session)) {
      throw new Error('DuckDBWasm is not supported yet')
    }
    else if (isCloudflareD2Session(session)) {
      throw new Error('Cloudflare D2 is not supported yet')
    }
    else if (isSQLiteSession(session)) {
      throw new Error('SQLite is not supported yet')
    }
    else if (isSupabaseSession(session)) {
      throw new Error('Supabase is not supported yet')
    }
    else if (isNeonSession(session)) {
      throw new Error('Neon is not supported yet')
    }
    else {
      throw new Error(`Unsupported driver: ${driver}`)
    }
  }

  async function listColumnsByParameters<D extends DatasourceDriver>(driver: D, parameters: ConnectionThroughParameters, schema: string, table: string) {
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
    else if (isPGLiteSession(session)) {
      return session.session.execute<T>(query, parameters)
    }
    else if (isDuckDBWasmSession(session)) {
      throw new Error('DuckDBWasm is not supported yet')
    }
    else if (isCloudflareD2Session(session)) {
      throw new Error('Cloudflare D2 is not supported yet')
    }
    else if (isSQLiteSession(session)) {
      throw new Error('SQLite is not supported yet')
    }
    else if (isSupabaseSession(session)) {
      throw new Error('Supabase is not supported yet')
    }
    else if (isNeonSession(session)) {
      throw new Error('Neon is not supported yet')
    }
    else {
      throw new Error(`Unsupported driver: ${driver}`)
    }
  }

  async function executeByParameters<T, D extends DatasourceDriver = DatasourceDriver>(driver: D, parameters: ConnectionThroughParameters, query: string, params?: unknown[]): Promise<T[]> {
    return execute<T, D>(driver, toDSN(driver, parameters, defaultParamsFromDriver(driver)), query, params)
  }

  async function executeSQL<T, S = any, D extends DatasourceDriver = DatasourceDriver>(driver: D, dsn: string, query: SQL<S>): Promise<T[]> {
    const db = sqlDialectFromDriver(driver)()
    const { sql, params } = db.sqlToQuery(query)
    return execute<T, D>(driver, dsn, sql, params)
  }

  async function executeSQLByParameters<T, S = any, D extends DatasourceDriver = DatasourceDriver>(driver: D, parameters: ConnectionThroughParameters, query: SQL<S>): Promise<T[]> {
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

export function useDatasource(
  fromDatasourceId: Ref<string | undefined>,
  datasources: Ref<Datasource[]>,
) {
  const datasourceSessionsStore = useDatasourceSessionsStore()
  const datasource = ref<Datasource>()

  async function datasourceFromId(fromId?: string | null) {
    if (!fromId) {
      return
    }

    const _queryFromDatasource = datasources.value
    const queryFromDatasource = _queryFromDatasource.find(ds => ds.id === fromId)
    if (!queryFromDatasource) {
      return
    }

    return {
      driver: queryFromDatasource.driver,
      datasource: queryFromDatasource,
    }
  }

  async function query<D = Record<string, unknown>, T = any>(query: SQL<T>) {
    if (!datasource.value || !datasource.value.driver || !datasource.value) {
      return []
    }

    return await datasourceSessionsStore.executeSQLByParameters<D>(
      datasource.value?.driver,
      datasource.value as ConnectionThroughParameters,
      query,
    )
  }

  async function findMany<T = Record<string, unknown>>(
    table: { schema?: string | null, table: string },
    sortedColumns: { id: string, desc: boolean }[],
    pageSize: number,
    page: number,
  ) {
    const q = sql`SELECT * FROM `
    if (table.schema) {
      q.append(sql`${sql.identifier(table.schema)}.${sql.identifier(table.table!)}`)
    }
    else {
      q.append(sql`${sql.identifier(table.table!)}`)
    }

    if (sortedColumns != null) {
      const sorted = sortedColumns
      if (sorted.length > 0) {
        const orderByClauses = sorted.map((col) => {
          const direction = col.desc ? sql`DESC` : sql`ASC`
          return sql`${sql.identifier(col.id)} ${direction}`
        })

        q.append(sql` ORDER BY ${sql.join(orderByClauses, sql`, `)}`)
      }
    }

    if (pageSize != null && page != null) {
      const pageSizeValue = pageSize
      const pageValue = page
      q.append(sql` LIMIT ${pageSizeValue} OFFSET ${(pageValue - 1) * pageSizeValue}`)
    }

    return await query<T>(q)
  }

  async function count(
    table: { schema?: string | null, table: string },
    sortedColumns: { id: string, desc: boolean }[],
  ) {
    const q = sql`SELECT COUNT(*) FROM `
    if (table.schema) {
      q.append(sql`${sql.identifier(table.schema)}.${sql.identifier(table.table!)}`)
    }
    else {
      q.append(sql`${sql.identifier(table.table!)}`)
    }

    const groupByColumns: string[] = []

    if (sortedColumns != null) {
      const sorted = sortedColumns
      if (sorted.length > 0) {
        const orderByClauses = sorted.map((col) => {
          const direction = col.desc ? sql`DESC` : sql`ASC`
          return sql`${sql.identifier(col.id)} ${direction}`
        })

        q.append(sql` ORDER BY ${sql.join(orderByClauses, sql`, `)}`)
      }
      if (sorted.length > 0) {
        groupByColumns.push(...sorted.map(col => col.id))
      }
    }

    if (groupByColumns.length > 0) {
      q.append(sql` GROUP BY `)
      for (const col of groupByColumns) {
        q.append(sql`${sql.identifier(col)}`)
        if (col !== groupByColumns[groupByColumns.length - 1]) {
          q.append(sql`, `)
        }
      }
    }

    const result = await query<{ count: number }>(q)
    return result[0]?.count || 0
  }

  watch([fromDatasourceId, datasources], async () => {
    const ds = await datasourceFromId(fromDatasourceId.value)
    datasource.value = ds?.datasource
  }, {
    immediate: true,
  })

  return {
    datasource,
    query,
    findMany,
    count,
  }
}
