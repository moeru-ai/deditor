import type { SQLiteMethods } from '@deditor-app/shared'
import type { Client } from '@libsql/client'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import { useLogg } from '@guiiai/logg'
import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from '@deditor-app/shared-schemas'

import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, { drizzle: LibSQLDatabase<typeof schema>, client: Client }>()

// https://github.com/drizzle-team/drizzle-orm/blob/33f0374e29014677c29f4b1f1dd1ab8fb68ac516/drizzle-kit/src/serializer/sqliteSerializer.ts#L498C1-L508C2
function filterIgnoredTablesByField(fieldName: string) {
  // _cf_ is a prefix for internal Cloudflare D1 tables (e.g. _cf_KV, _cf_METADATA)
  // _litestream_ is a prefix for internal Litestream tables (e.g. _litestream_seq, _litestream_lock)
  // libsql_ is a prefix for internal libSQL tables (e.g. libsql_wasm_func_table)
  // sqlite_ is a prefix for internal SQLite tables (e.g. sqlite_sequence, sqlite_stat1)
  return `${fieldName} != '__drizzle_migrations'
      AND ${fieldName} NOT LIKE '\\_cf\\_%' ESCAPE '\\'
      AND ${fieldName} NOT LIKE '\\_litestream\\_%' ESCAPE '\\'
      AND ${fieldName} NOT LIKE 'libsql\\_%' ESCAPE '\\'
      AND ${fieldName} NOT LIKE 'sqlite\\_%' ESCAPE '\\'`
}

export function registerSQLiteDatabaseDialect(window: BrowserWindow) {
  const log = useLogg('sqlite-database-dialect').useGlobalConfig()

  defineIPCHandler<SQLiteMethods>(window, 'databaseLocalSQLite', 'connect')
    .handle(async (_, { dsn }) => {
      try {
        const parsedDSN = new URL(dsn)
        if (!parsedDSN.searchParams.get('dbFilePath')) {
          throw new Error('Missing "dbFilePath" parameter in DSN.')
        }

        const sqliteClient = createClient({
          url: `file://${parsedDSN.searchParams.get('dbFilePath')}`,
        })

        const sqliteDrizzle = drizzle(sqliteClient, { schema })
        const dbSessionId = nanoid()
        databaseSessions.set(dbSessionId, { drizzle: sqliteDrizzle, client: sqliteClient })

        return { databaseSessionId: dbSessionId, dialect: 'sqlite' }
      }
      catch (err) {
        log.withError(err).error('failed to connect to local SQLite database')
        throw err
      }
    })

  defineIPCHandler<SQLiteMethods>(window, 'databaseLocalSQLite', 'query')
    .handle(async (_, { databaseSessionId, statement, parameters }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.client.execute(statement, parameters)
        return { databaseSessionId, results: res.rows }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId, statement }).error('failed to query local SQLite database')
        throw err
      }
    })

  defineIPCHandler<SQLiteMethods>(window, 'databaseLocalSQLite', 'listTables')
    .handle(async (_, { databaseSessionId }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.drizzle.query.sqliteSqliteSchema.findMany()
        return { databaseSessionId, results: res }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId }).error('failed to query local SQLite database to list tables')
        throw err
      }
    })

  defineIPCHandler<SQLiteMethods>(window, 'databaseLocalSQLite', 'listColumns')
    .handle(async (_, { databaseSessionId, tableName }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.drizzle.run(sql`
          SELECT
            m.name as "tableName",
            p.name as "columnName",
            p.type as "columnType",
            p."notnull" as "notNull",
            p.dflt_value as "defaultValue",
            p.pk as pk,
            p.hidden as hidden,
            m.sql,
            m.type as type
          FROM sqlite_master AS m
          JOIN pragma_table_xinfo(m.name) AS p
          WHERE (m.type = 'table' OR m.type = 'view')
            AND ${filterIgnoredTablesByField('m.tbl_name')};
      `)
        return { databaseSessionId, results: res.rows }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId, tableName }).error('failed to query local SQLite database to list columns')
        throw err
      }
    })
}
