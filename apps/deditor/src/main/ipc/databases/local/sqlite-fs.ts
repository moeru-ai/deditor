import type { SQLiteMethods } from '@deditor-app/shared'
import type { Client } from '@libsql/client'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import * as schema from '@deditor-app/shared-schemas'
import { useLogg } from '@guiiai/logg'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, { drizzle: LibSQLDatabase<typeof schema>, client: Client }>()

export function registerSQLiteDatabaseDialect(window: BrowserWindow) {
  const log = useLogg('sqlite-database-dialect').useGlobalConfig()

  defineIPCHandler<SQLiteMethods>(window, 'databaseLocalSQLite', 'connect')
    .handle(async (_, { dsn }) => {
      try {
        const parsedDSN = new URL(dsn)

        const sqliteClient = createClient({
          url: `file://${parsedDSN.searchParams.get('dbFilePath') || parsedDSN.pathname}`,
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
}
