import { PgDialect, QueryBuilder as PgQueryBuilder } from 'drizzle-orm/pg-core'

import { useLocalPGLite } from '@/composables/ipc/databases/local/pglite-fs'
import { useRemoteMySQL } from '@/composables/ipc/databases/remote/mysql'
import { useRemotePostgres } from '@/composables/ipc/databases/remote/postgres'

export enum DatasourceDriverEnum {
  Postgres = 'postgres',
  Supabase = 'supabase',
  Neon = 'neon',
  CloudflareD2 = 'cloudflare-d2',
  PGLite = 'pglite',
  DuckDBWasm = 'duckdb-wasm',
  MySQL = 'mysql',
  SQLite = 'sqlite',
  Parquet = 'parquet',
  JSONL = 'jsonl',
}

export const DATASOURCE_DRIVER_NAMES = {
  [DatasourceDriverEnum.Postgres]: 'Postgres',
  [DatasourceDriverEnum.Supabase]: 'Supabase',
  [DatasourceDriverEnum.Neon]: 'Neon',
  [DatasourceDriverEnum.CloudflareD2]: 'Cloudflare D2',
  [DatasourceDriverEnum.PGLite]: 'PGLite',
  [DatasourceDriverEnum.DuckDBWasm]: 'DuckDB WASM',
  [DatasourceDriverEnum.MySQL]: 'MySQL',
  [DatasourceDriverEnum.SQLite]: 'SQLite',
  [DatasourceDriverEnum.Parquet]: 'Parquet',
  [DatasourceDriverEnum.JSONL]: 'JSONL',
} as const satisfies Record<DatasourceDriver, string>

export const DATASOURCE_DRIVER_ICONS = {
  [DatasourceDriverEnum.Postgres]: 'i-drizzle-orm-icons:postgresql',
  [DatasourceDriverEnum.Supabase]: 'i-drizzle-orm-icons:supabase',
  [DatasourceDriverEnum.Neon]: 'i-drizzle-orm-icons:neon-dark',
  [DatasourceDriverEnum.CloudflareD2]: 'i-drizzle-orm-icons:cloudflare',
  [DatasourceDriverEnum.PGLite]: 'i-drizzle-orm-icons:pglite',
  [DatasourceDriverEnum.DuckDBWasm]: 'i-deditor-icons:duckdb-dark',
  [DatasourceDriverEnum.MySQL]: 'i-drizzle-orm-icons:mysql-dark',
  [DatasourceDriverEnum.SQLite]: 'i-drizzle-orm-icons:sqlite',
  [DatasourceDriverEnum.Parquet]: 'i-simple-icons:apacheparquet',
  [DatasourceDriverEnum.JSONL]: 'i-deditor-icons:jsonl',
} as const satisfies Record<DatasourceDriver, string>

export interface DatasourceDriverMap {
  [DatasourceDriverEnum.Postgres]: ReturnType<typeof useRemotePostgres>
  [DatasourceDriverEnum.Supabase]: never
  [DatasourceDriverEnum.Neon]: never
  [DatasourceDriverEnum.PGLite]: ReturnType<typeof useLocalPGLite>
  [DatasourceDriverEnum.DuckDBWasm]: never
  [DatasourceDriverEnum.CloudflareD2]: never
  [DatasourceDriverEnum.MySQL]: ReturnType<typeof useRemoteMySQL>
  [DatasourceDriverEnum.SQLite]: never
  [DatasourceDriverEnum.Parquet]: never
  [DatasourceDriverEnum.JSONL]: never
}

export type DatasourceDriver = keyof DatasourceDriverMap

export interface DatasourceDriverClient<D extends DatasourceDriver> {
  driver: D
  session: DatasourceDriverMap[D]
}

export function isPostgresSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.Postgres> {
  return session.driver === DatasourceDriverEnum.Postgres
}

export function isMySQLSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.MySQL> {
  return session.driver === DatasourceDriverEnum.MySQL
}

export function isPGLiteSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.PGLite> {
  return session.driver === DatasourceDriverEnum.PGLite
}

export function isDuckDBWasmSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.DuckDBWasm> {
  return session.driver === DatasourceDriverEnum.DuckDBWasm
}

export function isCloudflareD2Session(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.CloudflareD2> {
  return session.driver === DatasourceDriverEnum.CloudflareD2
}

export function isSQLiteSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.SQLite> {
  return session.driver === DatasourceDriverEnum.SQLite
}

export function isSupabaseSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.Supabase> {
  return session.driver === DatasourceDriverEnum.Supabase
}

export function isNeonSession(session: DatasourceDriverClient<DatasourceDriver>): session is DatasourceDriverClient<DatasourceDriverEnum.Neon> {
  return session.driver === DatasourceDriverEnum.Neon
}

export const DATASOURCE_DRIVER_CLIENT = {
  [DatasourceDriverEnum.Postgres]: useRemotePostgres,
  [DatasourceDriverEnum.Supabase]: () => { throw new Error('Supabase is not supported yet') },
  [DatasourceDriverEnum.Neon]: () => { throw new Error('Neon is not supported yet') },
  [DatasourceDriverEnum.PGLite]: useLocalPGLite,
  [DatasourceDriverEnum.DuckDBWasm]: () => { throw new Error('DuckDBWasm is not supported yet') },
  [DatasourceDriverEnum.CloudflareD2]: () => { throw new Error('Cloudflare D2 is not supported yet') },
  [DatasourceDriverEnum.MySQL]: useRemoteMySQL,
  [DatasourceDriverEnum.SQLite]: () => { throw new Error('SQLite is not supported yet') },
  [DatasourceDriverEnum.Parquet]: () => { throw new Error('Parquet is not supported yet') },
  [DatasourceDriverEnum.JSONL]: () => { throw new Error('JSONL is not supported yet') },
} as const satisfies Record<DatasourceDriver, () => DatasourceDriverMap[DatasourceDriver]>

export const DATASOURCE_DRIVER_SQL_DIALECT = {
  [DatasourceDriverEnum.Postgres]: () => new PgDialect(),
  [DatasourceDriverEnum.Supabase]: () => { throw new Error('Supabase is not supported yet') },
  [DatasourceDriverEnum.Neon]: () => { throw new Error('Neon is not supported yet') },
  [DatasourceDriverEnum.PGLite]: () => new PgDialect(), // PGLite uses the same dialect as Postgres
  [DatasourceDriverEnum.DuckDBWasm]: () => new PgDialect(), // DuckDBWasm uses a similar dialect to Postgres
  [DatasourceDriverEnum.CloudflareD2]: () => { throw new Error('Cloudflare D2 is not supported yet') },
  [DatasourceDriverEnum.MySQL]: () => { throw new Error('MySQL is not supported yet') },
  [DatasourceDriverEnum.SQLite]: () => { throw new Error('SQLite is not supported yet') },
  [DatasourceDriverEnum.Parquet]: () => { throw new Error('Parquet is not supported yet') },
  [DatasourceDriverEnum.JSONL]: () => { throw new Error('JSONL is not supported yet') },
} as const satisfies Record<DatasourceDriver, () => PgDialect>

export const DATASOURCE_DRIVER_QUERY_BUILDER = {
  [DatasourceDriverEnum.Postgres]: () => new PgQueryBuilder(),
  [DatasourceDriverEnum.Supabase]: () => { throw new Error('Supabase is not supported yet') },
  [DatasourceDriverEnum.Neon]: () => { throw new Error('Neon is not supported yet') },
  [DatasourceDriverEnum.PGLite]: () => new PgQueryBuilder(), // PGLite uses the same query builder as Postgres
  [DatasourceDriverEnum.DuckDBWasm]: () => new PgQueryBuilder(), // DuckDBWasm uses a similar query builder to Postgres
  [DatasourceDriverEnum.CloudflareD2]: () => { throw new Error('Cloudflare D2 is not supported yet') },
  [DatasourceDriverEnum.MySQL]: () => { throw new Error('MySQL is not supported yet') },
  [DatasourceDriverEnum.SQLite]: () => { throw new Error('SQLite is not supported yet') },
  [DatasourceDriverEnum.Parquet]: () => { throw new Error('Parquet is not supported yet') },
  [DatasourceDriverEnum.JSONL]: () => { throw new Error('JSONL is not supported yet') },
} as const satisfies Record<DatasourceDriver, () => PgQueryBuilder>
