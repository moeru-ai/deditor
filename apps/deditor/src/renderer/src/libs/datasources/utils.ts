import type { DatasourceTable } from '@/libs/datasources/types'

export function fullyQualifiedTableName(datasourceTable?: DatasourceTable): string {
  if (!datasourceTable) {
    return '<unknown>'
  }

  if (!datasourceTable.schema) {
    return datasourceTable.table
  }

  return `${datasourceTable.schema}.${datasourceTable.table}`
}
