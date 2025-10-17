import type { PGLiteMethods } from '@deditor-app/shared'
import type { Results } from '@electric-sql/pglite'
import type { PeerContext } from '@unbird/eventa/adapters/websocket/h3'
import type { Hooks } from 'crossws'
import type { BrowserWindow } from 'electron'

import {
  postgresInformationSchemaColumns,
  postgresInformationSchemaTables,
  postgresPgCatalogPgAm,
  postgresPgCatalogPgAttribute,
  postgresPgCatalogPgClass,
  postgresPgCatalogPgIndex,
  postgresPgCatalogPgNamespace,
  postgresPgCatalogPgType,
} from '@deditor-app/shared-schemas'
import { useLogg } from '@guiiai/logg'
import { defineInvoke, defineInvokeEventa } from '@unbird/eventa'
import { createPeerContext } from '@unbird/eventa/adapters/websocket/h3'
import crossws from 'crossws/adapters/node'
import { and, eq, gt, ne, not, notExists, notLike, or, sql } from 'drizzle-orm'
import { alias, PgDialect, QueryBuilder } from 'drizzle-orm/pg-core'
import { createServer } from 'node:http'

import { defineIPCHandler } from '../../define-ipc-handler'

let websocketServerStarted = false

const databaseSessions = new Map<string, PeerContext>()
const databaseSessionsTokens = new Map<string, string>()
const tokensDatabaseSessions = new Map<string, string>()

const websocketConnConnected = new Map<string, (ctx: PeerContext) => void>()
const webSocketHandlersMessages = new Map<string, Hooks['message']>()
const webSocketHandlersOpens = new Map<string, Hooks['open']>()

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

const queryInvoke = defineInvokeEventa<Promise<{ result: Results<unknown> }>, { statement: string, parameters?: any[] }>('deditor:database:postgres:query')

function createServerIfNotStarted() {
  if (websocketServerStarted)
    return

  websocketServerStarted = true

  try {
    const ws = crossws({ hooks: {
      open: (peer) => {
        const url = new URL(peer.request.url)
        const token = url.searchParams.get('token')!
        if (!token || !websocketConnConnected.has(token)) {
          peer.close()
          return
        }

        const { context, hooks } = createPeerContext(peer)

        databaseSessions.set(peer.id, { peer, context })
        databaseSessionsTokens.set(peer.id, token)

        tokensDatabaseSessions.set(token, peer.id)
        webSocketHandlersMessages.set(token, hooks.message!)
        webSocketHandlersOpens.get(token)?.(peer)
        websocketConnConnected.get(token)?.({ peer, context })
      },
      close: (peer) => {
        if (databaseSessions.has(peer.id)) {
          databaseSessions.delete(peer.id)
          databaseSessionsTokens.delete(peer.id)
        }

        const token = databaseSessionsTokens.get(peer.id)
        if (!token)
          return

        tokensDatabaseSessions.delete(token)
        webSocketHandlersMessages.delete(token)
        webSocketHandlersOpens.delete(token)
        websocketConnConnected.delete(token)
      },
      message: (peer, message) => {
        const token = databaseSessionsTokens.get(peer.id)
        if (!token)
          return

        webSocketHandlersMessages.get(token)?.(peer, message)
      },
    } })

    const server = createServer()
    server.on('upgrade', (req, socket, head) => {
      if (req.headers.upgrade === 'websocket') {
        ws.handleUpgrade(req, socket, head)
      }
    })

    server.listen(29930)
  }
  catch (err) {
    websocketServerStarted = false
    throw err
  }
}

export function registerPGLiteWebSocketDatabaseDialect(window: BrowserWindow) {
  const log = useLogg('pglite-ws-database-dialect').useGlobalConfig()

  defineIPCHandler<PGLiteMethods>(window, 'databaseRemotePGLiteWebSocket', 'connect')
    .handle((_, { dsn }) => {
      return new Promise((resolve) => {
        try {
          const parsedDSN = new URL(dsn)
          if (!parsedDSN.searchParams.get('token')) {
            throw new Error('Missing "token" parameter in DSN.')
          }

          createServerIfNotStarted()

          const token = parsedDSN.searchParams.get('token')!
          if (tokensDatabaseSessions.has(token)) {
            const existingPeerId = tokensDatabaseSessions.get(token)!

            resolve({
              databaseSessionId: existingPeerId,
              dialect: 'pglite',
              results: [],
            })
          }

          if (!websocketConnConnected.has(token)) {
            websocketConnConnected.set(token, async ({ context, peer }) => {
              const query = defineInvoke(context, queryInvoke)
              const dialect = new PgDialect()

              await query({ statement: 'SELECT 1', parameters: [] })

              const { params: parameters, sql: statement } = await dialect.sqlToQuery(sql`CREATE SCHEMA IF NOT EXISTS "public"`)
              await query({ statement, parameters })

              if (!parsedDSN.searchParams.get('searchPath')) {
                const { params: parameters, sql: statement } = await dialect.sqlToQuery(sql`SET search_path TO "public"`)
                await query({ statement, parameters })
              }

              resolve({
                databaseSessionId: peer.id,
                dialect: 'pglite',
                results: [],
              })
            })
          }
        }
        catch (err) {
          log.withError(err).error('failed to connect to local PGLite database')
          throw err
        }
      })
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseRemotePGLiteWebSocket', 'query')
    .handle(async (_, { databaseSessionId, statement, parameters }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const query = defineInvoke(dbSession.context, queryInvoke)
        const res = await query({ statement, parameters })
        return { databaseSessionId, results: res.result.rows }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId, statement }).error('failed to query local PGLite database')
        throw err
      }
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseRemotePGLiteWebSocket', 'listTables')
    .handle(async (_, { databaseSessionId }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const queryBuilder = new QueryBuilder()
        const { sql, params } = new PgDialect().sqlToQuery(queryBuilder.select().from(postgresInformationSchemaTables).getSQL())
        const query = defineInvoke(dbSession.context, queryInvoke)
        const res = await query({ statement: sql, parameters: params })
        return { databaseSessionId, results: res.result.rows }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId }).error('failed to query local PGLite database to list tables')
        throw err
      }
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseRemotePGLiteWebSocket', 'listColumns')
    .handle(async (_, { databaseSessionId, tableName, schema }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const queryBuilder = new QueryBuilder()
        const { sql, params } = new PgDialect().sqlToQuery(
          queryBuilder
            .select().from(postgresInformationSchemaColumns).where(
              and(
                eq(postgresInformationSchemaColumns.table_name, tableName),
                eq(postgresInformationSchemaColumns.table_schema, schema ?? 'public'),
              ),
            ).getSQL(),
        )
        const query = defineInvoke(dbSession.context, queryInvoke)
        const res = await query({ statement: sql, parameters: params })
        return {
          databaseSessionId,
          tableName,
          schema,
          results: res.result.rows,
        }
      }
      catch (err) {
        log.withError(err).withError({ databaseSessionId, tableName, schema }).error('failed to query local PGLite database to list columns')
        throw err
      }
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseRemotePGLiteWebSocket', 'listIndexes')
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

        const queryBuilder = new QueryBuilder()
        const { sql: statement, params } = new PgDialect().sqlToQuery(
          queryBuilder
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
            .getSQL(),
        )

        const query = defineInvoke(dbSession.context, queryInvoke)
        const res = await query({ statement, parameters: params }) as {
          result: Results<{
            id: string | null
            indexName: string
            indexAlgorithm: string
            isUnique: boolean
            isPrimary: boolean
            indexDefinition: string
            comment: string
          }>
        }
        const transformedResults = res.result.rows.map((row) => {
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
        log.withError(err).withFields({ databaseSessionId, tableName, schema }).error('failed to query local PGLite database to list indexes')
        throw err
      }
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseRemotePGLiteWebSocket', 'listColumnsWithTypes')
    .handle(async (_, { databaseSessionId, tableName, schema }) => {
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const queryBuilder = new QueryBuilder()
        const { sql: statement, params: parameters } = new PgDialect().sqlToQuery(
          queryBuilder
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
            .getSQL(),
        )

        const query = defineInvoke(dbSession.context, queryInvoke)
        const res = await query({ statement, parameters }) as {
          result: Results<{
            columnName: string
            typeName: string | null
            typeMod: number
          }>
        }

        return {
          databaseSessionId,
          tableName,
          schema,
          results: res.result.rows,
        }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId, tableName, schema }).error('failed to query local PGLite database to list columns with types')
        throw err
      }
    })

  defineIPCHandler<PGLiteMethods>(window, 'databaseRemotePGLiteWebSocket', 'listUserDefinedTypes')
    .handle(async (_, { databaseSessionId }) => {
      /**
       * 2013 Approach to list user-defined types in PostgreSQL.
       * For pgvector, this method is still valid.
       * But I haven't touched any of the other UDT in scenarios.
       *
       * Thanks to
       *
       * postgresql - Display user-defined types and their details - Database Administrators Stack Exchange
       * @link{https://dba.stackexchange.com/a/35510}
       *
       * SELECT
       *   n.nspname AS schema,
       *   pg_catalog.format_type ( t.oid, NULL ) AS name,
       *   t.typname AS internal_name,
       *   CASE
       *     WHEN t.typrelid != 0
       *     THEN CAST ( 'tuple' AS pg_catalog.text )
       *     WHEN t.typlen < 0
       *     THEN CAST ( 'var' AS pg_catalog.text )
       *     ELSE CAST ( t.typlen AS pg_catalog.text )
       *   END AS size,
       *   pg_catalog.array_to_string (
       *     ARRAY(
       *       SELECT e.enumlabel
       *       FROM pg_catalog.pg_enum e
       *       WHERE e.enumtypid = t.oid
       *       ORDER BY e.oid
       *     ), E'\n'
       *   ) AS elements,
       *   -- https://www.postgresql.org/docs/9.5/functions-info.html
       *   pg_catalog.obj_description(t.oid, 'pg_type') AS description
       * FROM pg_catalog.pg_type t
       * LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
       * WHERE
       *   (
       *     t.typrelid = 0
       *     OR (
       *       SELECT c.relkind = 'c'
       *       FROM pg_catalog.pg_class c
       *       WHERE c.oid = t.typrelid
       *     )
       *   ) AND
       *   NOT EXISTS (
       *     SELECT 1
       *     FROM pg_catalog.pg_type el
       *     WHERE
       *       el.oid = t.typelem AND
       *       el.typarray = t.oid
       *   ) AND
       *   -- Ignores the built-in types
       *   n.nspname <> 'pg_catalog' AND
       *   -- Ignores the built-in information_schema comes along types
       *   n.nspname <> 'information_schema' AND
       *   pg_catalog.pg_type_is_visible ( t.oid )
       * ORDER BY 1, 2;
       */

      /**
       * Thanks to
       *
       * postgresql - Display user-defined types and their details - Database Administrators Stack Exchange
       * @link{https://dba.stackexchange.com/a/35510}
       *
       * WITH
       *   types AS (
       *     SELECT
       *       n.nspname,
       *       pg_catalog.format_type(t.oid, NULL) AS obj_name,
       *       CASE
       *         WHEN t.typrelid != 0 THEN CAST ( 'tuple' AS pg_catalog.text )
       *         WHEN t.typlen < 0 THEN CAST ( 'var' AS pg_catalog.text )
       *         ELSE CAST ( t.typlen AS pg_catalog.text )
       *       END AS obj_type,
       *       coalesce(pg_catalog.obj_description(t.oid, 'pg_type'), '') AS description
       *     FROM pg_catalog.pg_type t
       *     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
       *     WHERE (
       *       t.typrelid = 0 OR
       *       (
       *         SELECT c.relkind = 'c'
       *         FROM pg_catalog.pg_class c
       *         WHERE  c.oid = t.typrelid
       *       )
       *     ) AND
       *     NOT EXISTS (
       *       SELECT 1
       *       FROM pg_catalog.pg_type el
       *       WHERE
       *         el.oid = t.typelem AND
       *         el.typarray = t.oid
       *       ) AND
       *       n.nspname <> 'pg_catalog' AND
       *       n.nspname <> 'information_schema' AND
       *       n.nspname !~ '^pg_toast'
       *   ),
       *   cols AS (
       *       SELECT
       *         n.nspname::text AS schema_name,
       *         pg_catalog.format_type(t.oid, NULL) AS obj_name,
       *         a.attname::text AS column_name,
       *         pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
       *         a.attnotnull AS is_required,
       *         a.attnum AS ordinal_position,
       *         pg_catalog.col_description(a.attrelid, a.attnum) AS description
       *       FROM pg_catalog.pg_attribute a
       *       JOIN pg_catalog.pg_type t ON a.attrelid = t.typrelid
       *       JOIN pg_catalog.pg_namespace n ON ( n.oid = t.typnamespace )
       *       JOIN types ON ( types.nspname = n.nspname AND types.obj_name = pg_catalog.format_type(t.oid, NULL) )
       *       WHERE
       *         a.attnum > 0 AND
       *         NOT a.attisdropped
       *   )
       *
       * SELECT
       *   cols.schema_name,
       *   cols.obj_name,
       *   cols.column_name,
       *   cols.data_type,
       *   cols.ordinal_position,
       *   cols.is_required,
       *   coalesce(cols.description, '') AS description
       * FROM cols
       * ORDER BY cols.schema_name, cols.obj_name, cols.ordinal_position;
       */
      if (!databaseSessions.has(databaseSessionId)) {
        throw new Error('Database session ID not found in session map, please connect to the database first.')
      }

      try {
        const dbSession = databaseSessions.get(databaseSessionId)!
        const queryBuilder = new QueryBuilder()
        const typesSubQuery = queryBuilder
          .$with('types')
          .as(
            queryBuilder.select({
              nspname: postgresPgCatalogPgNamespace.nspname,
              objName: sql<string>`${sql.identifier('pg_catalog')}.${sql.identifier('format_type')}(${postgresPgCatalogPgType.oid}, NULL)`.as('obj_name'),
              objType: sql<string>`
              CASE
                WHEN ${postgresPgCatalogPgType.typrelid} != 0 THEN CAST('tuple' AS pg_catalog.text)
                WHEN ${postgresPgCatalogPgType.typlen} < 0 THEN CAST('var' AS pg_catalog.text)
                ELSE CAST(${postgresPgCatalogPgType.typlen} AS pg_catalog.text)
              END`.as('obj_type'),
              description: sql<string>`${sql.identifier('pg_catalog')}.${sql.identifier('obj_description')}(${postgresPgCatalogPgType.oid}, 'pg_type')`.as('description'),
            })
              .from(postgresPgCatalogPgType)
              .leftJoin(postgresPgCatalogPgNamespace, eq(postgresPgCatalogPgType.typnamespace, postgresPgCatalogPgNamespace.oid))
              .where(
                and(
                  or(
                    eq(postgresPgCatalogPgType.typrelid, 0),
                    queryBuilder
                      .select({ c: eq(postgresPgCatalogPgClass.relkind, 'c') })
                      .from(postgresPgCatalogPgClass)
                      .where(eq(postgresPgCatalogPgClass.oid, postgresPgCatalogPgType.typrelid)),
                  ),
                  notExists(
                    queryBuilder
                      .select({
                        1: sql`1`,
                      })
                      .from(postgresPgCatalogPgType)
                      .where(
                        and(
                          eq(postgresPgCatalogPgType.oid, postgresPgCatalogPgType.typelem),
                          eq(postgresPgCatalogPgType.typarray, postgresPgCatalogPgType.oid),
                        ),
                      ),
                  ),
                  ne(postgresPgCatalogPgNamespace.nspname, 'pg_catalog'),
                  ne(postgresPgCatalogPgNamespace.nspname, 'information_schema'),
                  notLike(postgresPgCatalogPgNamespace.nspname, 'pg_toast%'),
                ),
              ),
          )

        const colsSubQuery = queryBuilder
          .$with('cols')
          .as(
            queryBuilder.select({
              schemaName: postgresPgCatalogPgNamespace.nspname,
              objName: sql<string>`${sql.identifier('pg_catalog')}.${sql.identifier('format_type')}(${postgresPgCatalogPgType.oid}, NULL)`.as('obj_name'),
              columnName: postgresPgCatalogPgAttribute.attname,
              dataType: sql<string>`${sql.identifier('pg_catalog')}.${sql.identifier('format_type')}(${postgresPgCatalogPgAttribute.atttypid}, ${postgresPgCatalogPgAttribute.atttypmod})`.as('data_type'),
              isRequired: postgresPgCatalogPgAttribute.attnotnull,
              ordinalPosition: postgresPgCatalogPgAttribute.attnum,
              description: sql<string>`${sql.identifier('pg_catalog')}.${sql.identifier('col_description')}(${postgresPgCatalogPgAttribute.attrelid}, ${postgresPgCatalogPgAttribute.attnum})`.as('description'),
            })
              .from(postgresPgCatalogPgAttribute)
              .leftJoin(postgresPgCatalogPgType, eq(postgresPgCatalogPgAttribute.atttypid, postgresPgCatalogPgType.oid))
              .leftJoin(postgresPgCatalogPgNamespace, eq(postgresPgCatalogPgType.typnamespace, postgresPgCatalogPgNamespace.oid))
              .leftJoin(sql`types`, and(
                eq(typesSubQuery.nspname, postgresPgCatalogPgNamespace.nspname),
                eq(typesSubQuery.objName, sql<string>`${sql.identifier('pg_catalog')}.${sql.identifier('format_type')}(${postgresPgCatalogPgType.oid}, NULL)`),
              ))
              .where(
                and(
                  gt(postgresPgCatalogPgAttribute.attnum, 0),
                  eq(postgresPgCatalogPgAttribute.attisdropped, false),
                ),
              ),
          )

        const { sql: statement, params: parameters } = new PgDialect().sqlToQuery(
          queryBuilder
            .with(typesSubQuery, colsSubQuery)
            .select({
              schemaName: colsSubQuery.schemaName,
              objName: colsSubQuery.objName,
              columnName: colsSubQuery.columnName,
              dataType: colsSubQuery.dataType,
              ordinalPosition: colsSubQuery.ordinalPosition,
              isRequired: colsSubQuery.isRequired,
              description: sql<string>`coalesce(${colsSubQuery.description}, '')`.as('description'),
            })
            .from(colsSubQuery)
            .orderBy(colsSubQuery.schemaName, colsSubQuery.objName, colsSubQuery.ordinalPosition)
            .getSQL(),
        )

        const query = defineInvoke(dbSession.context, queryInvoke)
        const res = await query({ statement, parameters }) as {
          result: Results<{
            schemaName: string | null
            objName: string
            columnName: string
            dataType: string
            ordinalPosition: number
            isRequired: boolean
            description: string
          }>
        }

        return {
          databaseSessionId,
          results: res.result.rows,
        }
      }
      catch (err) {
        log.withError(err).withFields({ databaseSessionId }).error('failed to query local PGLite database to list user-defined types')
        throw err
      }
    })
}
