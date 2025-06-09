export enum DatasourceDriverEnum {
  Postgres = 'postgres',
  MySQL = 'mysql',
  SQLite = 'sqlite',
  PGLite = 'pglite',
  DuckDBWasm = 'duckdb-wasm',
}

export type Datasource<D = DatasourceDriverEnum> =
  | ConnectionThroughConnectionString<D>
  | ConnectionThroughParameters<D>

export interface DatasourceBase<D = DatasourceDriverEnum> {
  driver: D
}

export type ConnectionThroughConnectionString<D = DatasourceDriverEnum> = DatasourceBase<D> & { connectionString: string }
export type ConnectionThroughParameters<D = DatasourceDriverEnum> = DatasourceBase<D> & {
  host: string
  port: number
  user?: string
  password?: string
  database?: string
  extraOptions?: DSNExtraOptions
}

export interface DSNExtraOptions extends Record<string, string | string[] | number | boolean | undefined> {
  sslmode?: boolean | 'require' | 'allow' | 'prefer' | 'verify-full'
}

export interface DSNDefaultParams {
  params?: ConnectionThroughParameters
  applyParamsURLSearchParams?: (search: URLSearchParams) => void
  applyURL?: (url: URL) => void
}
