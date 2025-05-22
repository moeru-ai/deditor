import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { BrowserWindow } from 'electron'
import type { MySQL2Methods } from '../../../shared/ipc/databases/remote'

import { drizzle } from 'drizzle-orm/mysql2'

import { defineIPCHandler } from '../../electron/define-ipc-handler'
import { nanoid } from '../../utils/nanoid'

const databaseSessions = new Map<string, MySql2Database>()

export function registerPostgresJsDatabaseDialect(window: BrowserWindow) {
  defineIPCHandler<MySQL2Methods>(window, 'connectRemoteDatabaseMySQL2')
    .handle(async ({ dsn }) => {
      const dbSession = drizzle(dsn)
      const dbSessionId = nanoid()
      databaseSessions.set(dbSessionId, dbSession)

      // eslint-disable-next-line no-console
      dbSession.execute('SELECT 1').then(res => console.log(res))
      return { databaseSessionId: dbSessionId, dialect: 'mysql2' }
    })

  defineIPCHandler<MySQL2Methods>(window, 'queryRemoteDatabaseMySQL2')
    .handle(async ({ databaseSessionId, statement }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      const dbSession = databaseSessions.get(databaseSessionId)!
      const res = await dbSession.execute(statement)
      return { databaseSessionId, results: res }
    })
}
