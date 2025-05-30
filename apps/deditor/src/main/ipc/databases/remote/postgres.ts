import type { PostgresMethods } from '@deditor-app/shared'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import { drizzle } from 'drizzle-orm/postgres-js'

import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, PostgresJsDatabase>()

export function registerPostgresJsDatabaseDialect(window: BrowserWindow) {
  defineIPCHandler<PostgresMethods>(window, 'connectRemoteDatabasePostgres')
    .handle(async (_, { dsn }) => {
      try {
        const dbSession = drizzle(dsn)
        const dbSessionId = nanoid()
        databaseSessions.set(dbSessionId, dbSession)

        await dbSession.execute('SELECT 1')
        return { databaseSessionId: dbSessionId, dialect: 'postgres' }
      }
      catch (err) {
        console.error('failed to connect to remote Postgres database:', err)
        throw err
      }
    })

  defineIPCHandler<PostgresMethods>(window, 'queryRemoteDatabasePostgres')
    .handle(async (_, { databaseSessionId, statement }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.execute(statement)
        return { databaseSessionId, results: res }
      }
      catch (err) {
        console.error('failed to query remote Postgres database:', err)
        throw err
      }
    })
}
