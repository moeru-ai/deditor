import type { PGLiteMethods } from '@deditor-app/shared'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import * as schema from '@deditor-app/shared-schemas'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'

import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, { drizzle: PgliteDatabase<typeof schema>, client: PGlite }>()

export function registerPGLiteDatabaseDialect(window: BrowserWindow) {
  defineIPCHandler<PGLiteMethods>(window, 'databaseLocalPGLite', 'connect')
    .handle(async (_, { dsn }) => {
      try {
        const parsedDSN = new URL(dsn)

        const pgliteClient = new PGlite(decodeURIComponent(String(parsedDSN.searchParams.get('dataDir'))))

        const pgDrizzle = drizzle(pgliteClient, { schema })
        const dbSessionId = nanoid()
        databaseSessions.set(dbSessionId, { drizzle: pgDrizzle, client: pgliteClient })

        await pgDrizzle.execute('SELECT 1')
        return { databaseSessionId: dbSessionId, dialect: 'pglite' }
      }
      catch (err) {
        console.error('failed to connect to remote Postgres database:', err)
        throw err
      }
    })
}
