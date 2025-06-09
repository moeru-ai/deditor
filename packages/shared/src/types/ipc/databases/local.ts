import type {
  postgresInformationSchemaColumns,
  postgresInformationSchemaTables,
} from '@deditor-app/shared-schemas'

export interface PGLiteMethods {
  connect: (params: { dsn: string }) => {
    databaseSessionId: string
    dialect: 'pglite'
  }

  query: <T>(params: {
    databaseSessionId: string
    statement: string
    parameters?: any[]
  }) => {
    databaseSessionId: string
    results: T[]
  }

  listTables: (params: {
    databaseSessionId: string
  }) => {
    databaseSessionId: string
    results: typeof postgresInformationSchemaTables.$inferSelect[]
  }

  listColumns: (params: {
    databaseSessionId: string
    tableName: string
    schema?: string
  }) => {
    databaseSessionId: string
    tableName: string
    schema: string
    results: typeof postgresInformationSchemaColumns.$inferSelect[]
  }
}
