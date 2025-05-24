import type { PostgresMethods } from '@deditor-app/shared'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { BrowserWindow } from 'electron'

import { drizzle } from 'drizzle-orm/postgres-js'

import { nanoid } from '../../../utils/nanoid'
import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, PostgresJsDatabase>()

export function registerPostgresJsDatabaseDialect(window: BrowserWindow) {
  defineIPCHandler<PostgresMethods>(window, 'connectRemoteDatabasePostgres')
    .handle(async (_, { dsn }) => {
      const dbSession = drizzle(dsn)
      const dbSessionId = nanoid()
      databaseSessions.set(dbSessionId, dbSession)

      // eslint-disable-next-line no-console
      dbSession.execute('SELECT 1').then(res => console.log(res))
      return { databaseSessionId: dbSessionId, dialect: 'postgres' }
    })

  defineIPCHandler<PostgresMethods>(window, 'queryRemoteDatabasePostgres')
    .handle(async (_, { databaseSessionId, statement }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      const dbSession = databaseSessions.get(databaseSessionId)!
      const res = await dbSession.execute(statement)
      return { databaseSessionId, results: res }
    })
}
