import type { DrizzleConfig, RelationalSchemaConfig, TablesRelationalConfig } from 'drizzle-orm'

import type { DebuggingClient } from './client'
import type { DebuggingQueryResultHKT } from './session'

import { createTableRelationsHelpers, DefaultLogger, entityKind, extractTablesRelationalConfig } from 'drizzle-orm'
import { PgDatabase, PgDialect } from 'drizzle-orm/pg-core'

import { connect } from './client'
import { DebuggingSession } from './session'

export class DebuggingDatabase<
  TSchema extends Record<string, unknown> = Record<string, never>,
> extends PgDatabase<DebuggingQueryResultHKT, TSchema> {
  static override readonly [entityKind]: string = 'DebuggingDatabase'
}

function construct<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TClient extends DebuggingClient = DebuggingClient,
>(
  client: DebuggingClient,
  config: DrizzleConfig<TSchema> = {},
): DebuggingDrizzleDatabase<TSchema, TClient> {
  const dialect = new PgDialect({ casing: config.casing })
  let logger
  if (config.logger === true) {
    logger = new DefaultLogger()
  }
  else if (config.logger !== false) {
    logger = config.logger
  }

  let schema: RelationalSchemaConfig<TablesRelationalConfig> | undefined
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers,
    )
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap,
    }
  }

  const session = new DebuggingSession(client, dialect, schema, { logger })
  const db = new DebuggingDatabase(dialect, session, schema as any) as DebuggingDatabase<TSchema>;
  (<any>db).$client = client

  return db as any
}

export interface DebuggingDrizzleDatabase<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TClient extends DebuggingClient = DebuggingClient,
> extends DebuggingDatabase<TSchema> {
  $client: TClient
}

export function drizzle<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TClient extends DebuggingClient = DebuggingClient,
>(): DebuggingDrizzleDatabase<TSchema, TClient> {
  return construct(connect())
}
