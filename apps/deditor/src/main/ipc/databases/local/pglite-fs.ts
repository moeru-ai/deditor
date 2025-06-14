import type { PGLiteMethods } from '@deditor-app/shared'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import * as schema from '@deditor-app/shared-schemas'
import { postgresInformationSchemaColumns } from '@deditor-app/shared-schemas'
import { PGlite } from '@electric-sql/pglite'
import { useLogg } from '@guiiai/logg'
import { and, eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'

import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, { drizzle: PgliteDatabase<typeof schema>, client: PGlite }>()

export function registerPGLiteDatabaseDialect(window: BrowserWindow) {
  const log = useLogg('pglite-database-dialect').useGlobalConfig()

  defineIPCHandler<PGLiteMethods>(window, 'databaseLocalPGLite', 'connect')
    .handle(async (_, { dsn }) => {
      try {
        const parsedDSN = new URL(dsn)

        const pgliteClient = new PGlite(decodeURIComponent(String(parsedDSN.searchParams.get('dataDir'))))

        const pgDrizzle = drizzle(pgliteClient, { schema })
        const dbSessionId = nanoid()
        databaseSessions.set(dbSessionId, { drizzle: pgDrizzle, client: pgliteClient })

        await pgDrizzle.execute('SELECT 1')
        await pgDrizzle.execute(sql`CREATE SCHEMA IF NOT EXISTS "public"`)
        await pgDrizzle.execute(sql`SET search_path TO "public"`)
        await pgDrizzle.execute(sql`CREATE TABLE IF NOT EXISTS public."test_table" (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL DEFAULT ''
        )`)

        return { databaseSessionId: dbSessionId, dialect: 'pglite' }
      }
      catch (err) {
        log.withError(err).error('failed to connect to remote PGLite database')
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
        log.withError(err).withFields({ databaseSessionId, statement }).error('failed to query remote PGLite database')
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
        log.withError(err).withFields({ databaseSessionId }).error('failed to query remote PGLite database to list tables')
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
        log.withError(err).withError({ databaseSessionId, tableName, schema }).error('failed to query remote PGLite database to list columns')
        throw err
      }
    })
}
