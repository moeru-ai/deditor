import type { Assume, Logger, Query, RelationalSchemaConfig, TablesRelationalConfig } from 'drizzle-orm'
import type { PgDialect, PgQueryResultHKT, PgTransactionConfig, PreparedQueryConfig, SelectedFieldsOrdered } from 'drizzle-orm/pg-core'

import type { DebuggingClient, Row, RowList } from './client'

import { entityKind, fillPlaceholders, NoopLogger } from 'drizzle-orm'
import { NoopCache } from 'drizzle-orm/cache/core'
import { PgPreparedQuery, PgSession, PgTransaction } from 'drizzle-orm/pg-core'

export async function beginTransaction(client: DebuggingClient, txFn: (client: DebuggingClient) => Promise<any>): Promise<any> {
  await client.conn.send('BEGIN TRANSACTION')
  try {
    const result = await txFn(client)
    await client.conn.send('COMMIT')
    return result
  }
  catch (err) {
    await client.conn.send('ROLLBACK')
    throw err
  }
}

export async function withSavepoint(client: DebuggingClient, spName: string, txFn: (client: DebuggingClient) => Promise<any>): Promise<any> {
  await client.conn.send(`SAVEPOINT ${spName}`)
  try {
    const result = await txFn(client)
    await client.conn.send(`RELEASE SAVEPOINT ${spName}`)
    return result
  }
  catch (err) {
    await client.conn.send(`ROLLBACK TO SAVEPOINT ${spName}`)
    throw err
  }
}

export class DebuggingPreparedQuery<T extends PreparedQueryConfig> extends PgPreparedQuery<T> {
  static override readonly [entityKind]: string = 'DebuggingPreparedQuery'

  constructor(
    private client: DebuggingClient,
    private queryString: string,
    private params: unknown[],
    private logger: Logger,
    private fields: SelectedFieldsOrdered | undefined,
    private customResultMapper?: (rows: unknown[][]) => T['execute'],
  ) {
    super({ sql: queryString, params }, new NoopCache(), { type: 'select', tables: [] })
  }

  async execute(placeholderValues: Record<string, unknown> | undefined = {}): Promise<T['execute']> {
    const params = fillPlaceholders(this.params, placeholderValues)
    this.logger.logQuery(this.queryString, params)

    const { fields, queryString: query, client, customResultMapper } = this
    const c = await client

    if (!fields && !customResultMapper) {
      return c.query(query, params)
    }

    return c.query(query, params)
  }

  async all(placeholderValues: Record<string, unknown> | undefined = {}): Promise<T['all']> {
    const params = fillPlaceholders(this.params, placeholderValues)
    this.logger.logQuery(this.queryString, params)

    const c = await this.client
    return c.query(this.queryString, params)
  }
}

export interface DebuggingSessionOptions {
  logger?: Logger
}

export class DebuggingSession<
  TSQL extends DebuggingClient,
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig,
> extends PgSession<DebuggingQueryResultHKT, TFullSchema, TSchema> {
  static override readonly [entityKind]: string = 'DebuggingSession'

  logger: Logger

  constructor(
    public client: TSQL,
    dialect: PgDialect,
    private schema: RelationalSchemaConfig<TSchema> | undefined,
    readonly options: DebuggingSessionOptions = {},
  ) {
    super(dialect)
    this.logger = options.logger ?? new NoopLogger()
  }

  prepareQuery<T extends PreparedQueryConfig = PreparedQueryConfig>(
    query: Query,
    fields: SelectedFieldsOrdered | undefined,
    _name: string | undefined,
    _isResponseInArrayMode: boolean,
    customResultMapper?: (rows: unknown[][]) => T['execute'],
  ): PgPreparedQuery<T> {
    return new DebuggingPreparedQuery(
      this.client,
      query.sql,
      query.params,
      this.logger,
      fields,
      customResultMapper,
    )
  }

  async query(query: string, params: unknown[]): Promise<RowList<Row[]>> {
    this.logger.logQuery(query, params)
    const c = await this.client
    return c.query(query, params)
  }

  async queryObjects<T extends Row>(
    query: string,
    params: unknown[],
  ): Promise<RowList<T[]>> {
    this.logger.logQuery(query, params)
    const c = await this.client
    return c.query(query, params) as Promise<RowList<T[]>>
  }

  override transaction<T>(
    transaction: (tx: DebuggingTransaction<TFullSchema, TSchema>) => Promise<T>,
    config?: PgTransactionConfig,
  ): Promise<T> {
    return beginTransaction(this.client, async (client) => {
      const session = new DebuggingSession<DebuggingClient, TFullSchema, TSchema>(
        client,
        this.dialect,
        this.schema,
        this.options,
      )
      const tx = new DebuggingTransaction(this.dialect, session, this.schema)
      if (config) {
        await tx.setTransaction(config)
      }

      return transaction(tx)
    }) as Promise<T>
  }
}

export class DebuggingTransaction<
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig,
> extends PgTransaction<DebuggingQueryResultHKT, TFullSchema, TSchema> {
  static override readonly [entityKind]: string = 'DebuggingTransaction'
  dialect: PgDialect
  session: DebuggingSession<DebuggingClient, TFullSchema, TSchema>

  constructor(
    dialect: PgDialect,
    session: DebuggingSession<DebuggingClient, TFullSchema, TSchema>,
    schema: RelationalSchemaConfig<TSchema> | undefined,
    nestedIndex = 0,
  ) {
    super(dialect, session, schema, nestedIndex)
    this.dialect = dialect
    this.session = session
  }

  override async transaction<T>(
    transaction: (tx: DebuggingTransaction<TFullSchema, TSchema>) => Promise<T>,
  ): Promise<T> {
    return withSavepoint(this.session.client, '', async (client) => {
      const session = new DebuggingSession<DebuggingClient, TFullSchema, TSchema>(
        client,
        this.dialect,
        this.schema,
        this.session.options,
      )

      const tx = new DebuggingTransaction<TFullSchema, TSchema>(this.dialect, session, this.schema)
      return transaction(tx)
    }) as Promise<T>
  }
}

export interface DebuggingQueryResultHKT extends PgQueryResultHKT {
  type: RowList<Assume<this['row'], Row>[]>
}
