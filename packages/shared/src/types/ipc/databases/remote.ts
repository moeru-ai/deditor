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
      schemaName: string | null;
      objName: string;
      columnName: string;
      dataType: string;
      ordinalPosition: number;
      isRequired: boolean;
      description: string;
    }[]
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
