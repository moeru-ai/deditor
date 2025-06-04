import type {
  postgresInformationSchemaColumns,
  postgresInformationSchemaTables,
} from '@deditor-app/shared-schemas'

export interface PostgresMethods {
  connect: (params: { dsn: string }) => {
    databaseSessionId: string
    dialect: 'postgres'
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

export interface MySQL2Methods {
  connect: (params: { dsn: string }) => {
    databaseSessionId: string
    dialect: 'mysql2'
  }

  query: <T>(params: {
    databaseSessionId: string
    statement: string
    parameters?: any[]
  }) => {
    databaseSessionId: string
    results: T[]
  }
}
