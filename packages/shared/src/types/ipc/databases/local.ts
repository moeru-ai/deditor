import type {
  postgresInformationSchemaColumns,
  postgresInformationSchemaTables,
  sqliteSqliteSchema,
} from '@deditor-app/shared-schemas'

export interface SQLiteMethods {
  connect: (params: { dsn: string }) => {
    databaseSessionId: string
    dialect: 'sqlite'
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
    results: typeof sqliteSqliteSchema.$inferSelect[]
  }

  listColumns: (params: {
    databaseSessionId: string
    tableName: string
  }) => {
    databaseSessionId: string
    tableName: string
    results: {
      tableName: string
      columnName: string
      columnType: string
      notNull: number
      defaultValue: string
      pk: number
      seq: number
      hidden: number
      sql: string
      type: 'view' | 'table'
    }[]
  }

  listIndexes: (params: {
    databaseSessionId: string
    tableName: string
  }) => {
    databaseSessionId: string
    tableName: string
    results: {
      indexName: string
      indexAlgorithm: string
      indexDefinition: string
      comment: string
      isPrimaryKey: boolean
      isUniqueConstraint: boolean
      columns: string[]
    }[]
  }

  listColumnsWithTypes: (params: {
    databaseSessionId: string
    tableName: string
  }) => {
    databaseSessionId: string
    tableName: string
    results: {
      columnName: string
      typeName: string
      typeMod: number
    }[]
  }
}

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

  listIndexes: (params: {
    databaseSessionId: string
    tableName: string
    schema?: string
  }) => {
    databaseSessionId: string
    tableName: string
    schema: string
    results: {
      indexName: string
      indexAlgorithm: string
      indexDefinition: string
      comment: string
      isPrimaryKey: boolean
      isUniqueConstraint: boolean
      columns: string[]
    }[]
  }

  listColumnsWithTypes: (params: {
    databaseSessionId: string
    tableName: string
    schema?: string
  }) => {
    databaseSessionId: string
    tableName: string
    schema: string
    results: {
      columnName: string
      typeName: string
      typeMod: number
    }[]
  }

  listUserDefinedTypes: (params: {
    databaseSessionId: string
  }) => {
    databaseSessionId: string
    results: {
      schemaName: string | null
      objName: string
      columnName: string
      dataType: string
      ordinalPosition: number
      isRequired: boolean
      description: string
    }[]
  }
}
