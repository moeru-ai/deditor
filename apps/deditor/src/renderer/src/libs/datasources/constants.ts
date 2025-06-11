import type { DatasourceDriver } from '@/stores'

import { DatasourceDriverEnum } from '@/libs/datasources/types'

export const DATASOURCE_DRIVER_NAMES = {
  [DatasourceDriverEnum.Postgres]: 'Postgres',
  [DatasourceDriverEnum.Supabase]: 'Supabase',
  [DatasourceDriverEnum.Neon]: 'Neon',
  [DatasourceDriverEnum.CloudflareD2]: 'Cloudflare D2',
  [DatasourceDriverEnum.PGLite]: 'PGLite',
  [DatasourceDriverEnum.DuckDBWasm]: 'DuckDB WASM',
  [DatasourceDriverEnum.MySQL]: 'MySQL',
  [DatasourceDriverEnum.SQLite]: 'SQLite',
} as const satisfies Record<DatasourceDriver, string>

export const DATASOURCE_DRIVER_ICONS = {
  [DatasourceDriverEnum.Postgres]: 'i-drizzle-orm-icons:postgresql',
  [DatasourceDriverEnum.Supabase]: 'i-drizzle-orm-icons:supabase',
  [DatasourceDriverEnum.Neon]: 'i-drizzle-orm-icons:neon-dark',
  [DatasourceDriverEnum.CloudflareD2]: 'i-drizzle-orm-icons:cloudflare',
  [DatasourceDriverEnum.PGLite]: 'i-drizzle-orm-icons:pglite translate-x--2px',
  [DatasourceDriverEnum.DuckDBWasm]: 'i-deditor-icons:duckdb-dark',
  [DatasourceDriverEnum.MySQL]: 'i-drizzle-orm-icons:mysql-dark',
  [DatasourceDriverEnum.SQLite]: 'i-drizzle-orm-icons:sqlite',
} as const satisfies Record<DatasourceDriver, string>
