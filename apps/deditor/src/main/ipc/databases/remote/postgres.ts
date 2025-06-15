import type { PostgresMethods } from '@deditor-app/shared'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { BrowserWindow } from 'electron'

import { nanoid } from '@deditor-app/shared'
import * as schema from '@deditor-app/shared-schemas'
import {
  postgresInformationSchemaColumns,
  postgresPgCatalogPgAm,
  postgresPgCatalogPgAttribute,
  postgresPgCatalogPgClass,
  postgresPgCatalogPgIndex,
  postgresPgCatalogPgNamespace,
  postgresPgCatalogPgType,
} from '@deditor-app/shared-schemas'
import { useLogg } from '@guiiai/logg'
import { and, eq, gt, not, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { defineIPCHandler } from '../../define-ipc-handler'

const databaseSessions = new Map<string, { drizzle: PostgresJsDatabase<typeof schema>, client: postgres.Sql }>()

/**
 *
 * Based on
 *
 * ```sql
 * SELECT
 *   replace(regexp_replace(regexp_replace(regexp_replace(pg_get_indexdef(indexrelid), ' WHERE .+|INCLUDE .+', ''), ' WITH .+', ''), '.*\((.*)\)', '\1'), ' ', '') AS column_name,
 * FROM
 *   pg_index
 * ```
 *
 * @param indexDefinition
 */
function columnsFromIndexDefinition(indexDefinition: string) {
  const trimRegexps = [
    { matchBy: / WHERE .+|INCLUDE .+/, to: '' },
    { matchBy: / WITH .+/, to: '' },
    // TODO: fix this regexp
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    { matchBy: /.*\((.*)\)/, to: '$1' },
  ]

  let parsedColumnsResult = indexDefinition
  for (const reg of trimRegexps) {
    parsedColumnsResult = parsedColumnsResult.replace(reg.matchBy, reg.to)
  }

  return parsedColumnsResult.trim().split(',')
}

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
         *  replace(regexp_replace(regexp_replace(regexp_replace(pg_get_indexdef(indexrelid), ' WHERE .+|INCLUDE .+', ''), ' WITH .+', ''), '.*\((.*)\)', '\1'), ' ', '') AS column_name,
         *  CASE
         *    WHEN position(' WHERE ' IN pg_get_indexdef(indexrelid)) > 0 THEN regexp_replace(pg_get_indexdef(indexrelid), '.+WHERE ', '')
         *    WHEN position(' WITH ' IN pg_get_indexdef(indexrelid)) > 0 THEN regexp_replace(pg_get_indexdef(indexrelid), '.+WITH ', '')
         *    ELSE ''
         *  END AS condition,
         *  CASE
         *    WHEN position(' INCLUDE ' IN pg_get_indexdef(indexrelid)) > 0 THEN regexp_replace(pg_get_indexdef(indexrelid), '.+INCLUDE ', '')
         *    WHEN position(' WITH ' IN pg_get_indexdef(indexrelid)) > 0 THEN regexp_replace(pg_get_indexdef(indexrelid), '.+WITH ', '')
         *    ELSE ''
         *  END AS include,
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

        const transformedResults = results.map((row) => {
          return {
            ...row,
            columns: columnsFromIndexDefinition(row.indexDefinition),
          }
        })

        return {
          databaseSessionId,
          tableName,
          schema,
          results: transformedResults,
        }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId, tableName, schema }).error('failed to query remote Postgres database to list indexes')
        throw err
      }
    })

  defineIPCHandler<PostgresMethods>(window, 'databaseRemotePostgres', 'listColumnsWithTypes')
    .handle(async (_, { databaseSessionId, tableName, schema }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const res = await dbSession.drizzle
          .select({
            columnName: postgresPgCatalogPgAttribute.attname,
            typeName: postgresPgCatalogPgType.typname,
            typeMod: postgresPgCatalogPgAttribute.atttypmod,
          })
          .from(postgresPgCatalogPgAttribute)
          .leftJoin(postgresPgCatalogPgClass, eq(postgresPgCatalogPgAttribute.attrelid, postgresPgCatalogPgClass.oid))
          .leftJoin(postgresPgCatalogPgNamespace, eq(postgresPgCatalogPgClass.relnamespace, postgresPgCatalogPgNamespace.oid))
          .leftJoin(postgresPgCatalogPgType, eq(postgresPgCatalogPgAttribute.atttypid, postgresPgCatalogPgType.oid))
          .where(
            and(
              eq(postgresPgCatalogPgNamespace.nspname, schema ?? 'public'),
              eq(postgresPgCatalogPgClass.relname, tableName),
              gt(postgresPgCatalogPgAttribute.attnum, 0),
              not(postgresPgCatalogPgAttribute.attisdropped),
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
        log.withError(err).withFields({ databaseSessionId, tableName, schema }).error('failed to query remote Postgres database to list columns with types')
        throw err
      }
    })
}
