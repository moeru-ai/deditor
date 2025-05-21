import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { BrowserWindow } from 'electron'

import { drizzle } from 'drizzle-orm/postgres-js'
import { ipcMain } from 'electron'

import { nanoid } from '../../utils/nanoid'

const databaseSessions = new Map<string, PostgresJsDatabase>()

export function registerPostgresJsDatabaseDialect(window: BrowserWindow) {
  ipcMain.on('request:connect-remote-database', (_, databaseDsn: string) => {
    try {
      const dbSession = drizzle(databaseDsn)
      const dbSessionId = nanoid()
      databaseSessions.set(dbSessionId, dbSession)

      // eslint-disable-next-line no-console
      dbSession.execute('SELECT 1').then(res => console.log(res))
      window.webContents.send('response:connect-remote-database', { databaseSessionId: dbSessionId, dialect: 'postgres' })
    }
    catch (err) {
      window.webContents.send('response:error:connect-remote-database', err)
    }
  })

  ipcMain.on('request:query-remote-database', (_, { databaseSessionId, statement }: { databaseSessionId: string, statement: string, params: any[] }) => {
    if (!databaseSessions.has(databaseSessionId)) {
      window.webContents.send('response:error:query-remote-database', new Error('Database session ID not found in session map, please connect to the database first.'))
      return
    }

    const dbSession = databaseSessions.get(databaseSessionId)!
    dbSession.execute(statement)
      .then((res) => {
        window.webContents.send('response:query-remote-database', { databaseSessionId, results: res })
      })
      .catch((err) => {
        window.webContents.send('response:error:query-remote-database', { databaseSessionId, error: err })
      })
  })
}
