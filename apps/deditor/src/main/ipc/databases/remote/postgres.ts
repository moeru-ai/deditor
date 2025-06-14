import type { PostgresMethods } from '@deditor-app/shared'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import * as schema from '@deditor-app/shared-schemas'
import {
  postgresInformationSchemaColumns,
  postgresPgCatalogPgAm,
  postgresPgCatalogPgClass,
  postgresPgCatalogPgIndex,
  postgresPgCatalogPgNamespace,
} from '@deditor-app/shared-schemas'
import { useLogg } from '@guiiai/logg'
import { and, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
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

  defineIPCHandler<PostgresMethods>(window, 'databaseRemotePostgres', 'listIndexes')
    .handle(async (_, { databaseSessionId, tableName, schema }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!

        /**
         * Thanks to TablePlus
         *
         * SELECT
         *  ix.relname AS index_name,
         *  upper(am.amname) AS index_algorithm,
         *  indisunique AS is_unique,
         *  indisprimary AS is_primary,
         *  pg_get_indexdef(indexrelid) AS index_definition,
         *  pg_catalog.obj_description (i.indexrelid, 'pg_class') AS comment
         * FROM pg_index i
         *  JOIN pg_class t ON t.oid = i.indrelid
         *  JOIN pg_class ix ON ix.oid = i.indexrelid
         *  JOIN pg_namespace n ON t.relnamespace = n.oid
         *  JOIN pg_am AS am ON ix.relam = am.oid
         * WHERE
         *  t.relname = 'chat_messages'
         *  AND n.nspname = 'public';
         */

        // Join aliases
        const pgClassOnIndRelId = alias(postgresPgCatalogPgClass, 'pg_class_on_ind_rel_id')
        const pgClassOnIndexRelId = alias(postgresPgCatalogPgClass, 'pg_class_on_index_rel_id')
        const pgAmOnOid = alias(postgresPgCatalogPgAm, 'pg_am_on_oid')

        const results = await dbSession.drizzle
          .select({
            id: postgresPgCatalogPgIndex.indexrelid,
            indexName: sql<string>`${sql.identifier('pg_class_on_index_rel_id')}.${sql.identifier('relname')}`.as('index_name'),
            indexAlgorithm: sql<string>`upper(${sql.identifier('pg_am_on_oid')}.${sql.identifier('amname')})`.as('index_algorithm'),
            isUnique: sql<boolean>`${postgresPgCatalogPgIndex.indisunique}`.as('is_unique'),
            isPrimary: sql<boolean>`${postgresPgCatalogPgIndex.indisprimary}`.as('is_primary'),
            indexDefinition: sql<string>`pg_get_indexdef(indexrelid)`.as('index_definition'),
            comment: sql<string>`${sql.identifier('pg_catalog')}.${sql.identifier('obj_description')} (${sql.identifier('pg_index')}.${sql.identifier('indexrelid')}, ${'pg_class'})`.as('comment'),
            // TODO: condition & include parse
          })
          .from(postgresPgCatalogPgIndex)
          .leftJoin(pgClassOnIndRelId, eq(pgClassOnIndRelId.oid, postgresPgCatalogPgIndex.indrelid))
          .leftJoin(pgClassOnIndexRelId, eq(pgClassOnIndexRelId.oid, postgresPgCatalogPgIndex.indexrelid))
          .leftJoin(postgresPgCatalogPgNamespace, eq(postgresPgCatalogPgNamespace.oid, pgClassOnIndRelId.relnamespace))
          .leftJoin(pgAmOnOid, eq(pgClassOnIndexRelId.relam, pgAmOnOid.oid))
          .where(
            and(
              eq(pgClassOnIndRelId.relname, tableName),
              eq(postgresPgCatalogPgNamespace.nspname, schema ?? 'public'),
            ),
          )

        return {
          databaseSessionId,
          tableName,
          schema,
          results,
        }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId, tableName, schema }).error('failed to query remote Postgres database to list indexes')
        throw err
      }
    })
}
