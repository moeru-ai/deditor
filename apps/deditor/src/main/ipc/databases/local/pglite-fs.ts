import type { PGLiteMethods } from '@deditor-app/shared'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import * as schema from '@deditor-app/shared-schemas'
import { postgresInformationSchemaColumns } from '@deditor-app/shared-schemas'
import { PGlite } from '@electric-sql/pglite'
import { and, eq } from 'drizzle-orm'
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
        console.error('failed to connect to remote PGLite database:', err)
        throw err
      }
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseLocalPGLite', 'query')
    .handle(async (_, { databaseSessionId, statement, parameters }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.client.query(statement, parameters)
        return { databaseSessionId, results: res.rows }
      }
      catch (err) {
        console.error('failed to query remote PGLite database:', err)
        throw err
      }
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseLocalPGLite', 'listTables')
    .handle(async (_, { databaseSessionId }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.drizzle.query.postgresInformationSchemaTables.findMany()
        return { databaseSessionId, results: res }
      }
      catch (err) {
        console.error('failed to query remote PGLite database to list tables:', err)
        throw err
      }
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseLocalPGLite', 'listColumns')
    .handle(async (_, { databaseSessionId, tableName, schema }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.drizzle.select().from(postgresInformationSchemaColumns).where(
          and(
            eq(postgresInformationSchemaColumns.table_name, tableName),
            eq(postgresInformationSchemaColumns.table_schema, schema ?? 'public'),
          ),
        )
        return {
          databaseSessionId,
          tableName,
          schema,
          results: res,
        }
      }
      catch (err) {
        console.error('failed to query remote PGLite database to list columns:', err)
        throw err
      }
    })
}
