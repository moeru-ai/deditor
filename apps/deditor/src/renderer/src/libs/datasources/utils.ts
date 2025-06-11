import type { DatasourceTable } from '@/libs/datasources/types'

export function fullyQualifiedTableName(t?: DatasourceTable): string {
  if (!t) {
    return '<unknown>'
  }

  if (!t.schema) {
    return t.table
  }

  return `${t.schema}.${t.table}`
}

export function filterPgTables(t: DatasourceTable): boolean {
  return !t.schema || (t.schema !== 'information_schema' && t.schema !== 'pg_catalog')
}
