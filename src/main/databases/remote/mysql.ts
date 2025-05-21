import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { BrowserWindow } from 'electron'

import { drizzle } from 'drizzle-orm/mysql2'
import { ipcMain } from 'electron'

import { nanoid } from '../../utils/nanoid'

const databaseSessions = new Map<string, MySql2Database>()

export function registerMySQL2DatabaseDialect(window: BrowserWindow) {
  ipcMain.on('request:connect-remote-database-mysql2', (_, databaseDsn: string) => {
    try {
      const dbSession = drizzle(databaseDsn)
      const dbSessionId = nanoid()
      databaseSessions.set(dbSessionId, dbSession)

      // eslint-disable-next-line no-console
      dbSession.execute('SELECT 1').then(res => console.log(res))
      window.webContents.send('response:connect-remote-database-mysql2', { databaseSessionId: dbSessionId, dialect: 'mysql2' })
    }
    catch (err) {
      window.webContents.send('response:error:connect-remote-database-mysql2', err)
    }
  })

  ipcMain.on('request:query-remote-database-mysql2', (_, { databaseSessionId, statement }: { databaseSessionId: string, statement: string, params: any[] }) => {
    if (!databaseSessions.has(databaseSessionId)) {
      window.webContents.send('response:error:query-remote-database-mysql2', new Error('Database session ID not found in session map, please connect to the database first.'))
      return
    }

    const dbSession = databaseSessions.get(databaseSessionId)!
    dbSession.execute(statement)
      .then((res) => {
        window.webContents.send('response:query-remote-database-mysql2', { databaseSessionId, results: res })
      })
      .catch((err) => {
        window.webContents.send('response:error:query-remote-database-mysql2', { databaseSessionId, error: err })
      })
  })
}
