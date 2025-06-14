import type { PostgresMethods } from '@deditor-app/shared'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import * as schema from '@deditor-app/shared-schemas'
import { postgresInformationSchemaColumns } from '@deditor-app/shared-schemas'
import { useLogg } from '@guiiai/logg'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, { drizzle: PostgresJsDatabase<typeof schema>, client: postgres.Sql }>()

export function registerPostgresJsDatabaseDialect(window: BrowserWindow) {
  const log = useLogg('postgres-database-dialect').useGlobalConfig()

  defineIPCHandler<PostgresMethods>(window, 'databaseRemotePostgres', 'connect')
    .handle(async (_, { dsn }) => {
      try {
        const pgClient = postgres(dsn)
        const pgDrizzle = drizzle(pgClient, { schema })
        const dbSessionId = nanoid()
        databaseSessions.set(dbSessionId, { drizzle: pgDrizzle, client: pgClient })

        await pgDrizzle.execute('SELECT 1')
        return { databaseSessionId: dbSessionId, dialect: 'postgres' }
      }
      catch (err) {
        log.withError(err).error('failed to connect to remote Postgres database')
        throw err
      }
    })

  defineIPCHandler<PostgresMethods>(window, 'databaseRemotePostgres', 'query')
    .handle(async (_, { databaseSessionId, statement, parameters }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.client.unsafe(statement, parameters)
        return { databaseSessionId, results: res }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId, statement }).error('failed to query remote Postgres database')
        throw err
      }
    })

  defineIPCHandler<PostgresMethods>(window, 'databaseRemotePostgres', 'listTables')
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
        log.withError(err).withFields({ databaseSessionId }).error('failed to query remote Postgres database to list tables')
        throw err
      }
    })

  defineIPCHandler<PostgresMethods>(window, 'databaseRemotePostgres', 'listColumns')
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
        log.withError(err).withFields({ databaseSessionId, tableName, schema }).error('failed to query remote Postgres database to list columns')
        throw err
      }
    })
}
