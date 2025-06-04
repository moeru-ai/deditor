import type { MySQL2Methods } from '@deditor-app/shared'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import { drizzle } from 'drizzle-orm/mysql2'

import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, MySql2Database>()

export function registerMySQL2DatabaseDialect(window: BrowserWindow) {
  defineIPCHandler<MySQL2Methods>(window, 'databaseRemoteMySQL', 'connect')
    .handle(async (_, { dsn }) => {
      const dbSession = drizzle(dsn)
      const dbSessionId = nanoid()
      databaseSessions.set(dbSessionId, dbSession)

      await dbSession.execute('SELECT 1')
      return { databaseSessionId: dbSessionId, dialect: 'mysql2' }
    })

  defineIPCHandler<MySQL2Methods>(window, 'databaseRemoteMySQL', 'query')
    .handle(async (_, { databaseSessionId, statement }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      const dbSession = databaseSessions.get(databaseSessionId)!
      const res = await dbSession.execute(statement)
      return { databaseSessionId, results: res }
    })
}
