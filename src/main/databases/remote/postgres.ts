import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { BrowserWindow } from 'electron'
import type { PostgresMethods } from '../../../shared/ipc/databases/remote'

import { drizzle } from 'drizzle-orm/postgres-js'

import { defineIPCHandler } from '../../electron/define-ipc-handler'
import { nanoid } from '../../utils/nanoid'

const databaseSessions = new Map<string, PostgresJsDatabase>()

export function registerPostgresJsDatabaseDialect(window: BrowserWindow) {
  defineIPCHandler<PostgresMethods>(window, 'connectRemoteDatabasePostgres')
    .handle(async (_, { dsn }) => {
      console.log(`Connecting to remote database with DSN: ${dsn}`)
      const dbSession = drizzle(dsn)
      const dbSessionId = nanoid()
      databaseSessions.set(dbSessionId, dbSession)

      // eslint-disable-next-line no-console
      dbSession.execute('SELECT 1').then(res => console.log(res))
      return { databaseSessionId: dbSessionId, dialect: 'postgres' }
    })

  defineIPCHandler<PostgresMethods>(window, 'queryRemoteDatabasePostgres')
    .handle(async (_, { databaseSessionId, statement }) => {
      console.log(`Executing query on remote database with session ID: ${databaseSessionId}`)
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      const dbSession = databaseSessions.get(databaseSessionId)!
      const res = await dbSession.execute(statement)
      return { databaseSessionId, results: res }
    })
}
